// End-to-end Product Docs via GPT-5 Batch
// Modes:
//   • Full baseline:   set env FORCE_FULL=1
//   • Smart window:    default; only pages changed since LAST RUN or within N hours
//
// Env knobs (recommended):
//   OPENAI_API_KEY=<your key>
//   PRODUCT_DOCS_MODEL=gpt-5-chat-latest
//   PRODUCT_DOCS_FALLBACK_MODEL=gpt-5-mini
//   DOCS_CHANGED_WINDOW_HOURS=24
//   PRODUCT_DOCS_MAX_ITEMS=200
//   FORCE_FULL=1                         // for first run only
//   MAX_BATCH_WAIT_MS=2700000            // 45 minutes

import fs from "fs";
import path from "path";
import { globby } from "globby";
import { execSync } from "child_process";
import OpenAI from "openai";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs/product-docs");
const META_DIR = path.join(ROOT, "docs");
const LAST_RUN_PATH = path.join(META_DIR, ".last_run.json");

const MODEL_PRIMARY = process.env.PRODUCT_DOCS_MODEL || "gpt-5-chat-latest";
const MODEL_FALLBACK = process.env.PRODUCT_DOCS_FALLBACK_MODEL || "gpt-5-mini";

const MAX_ITEMS = Number(process.env.PRODUCT_DOCS_MAX_ITEMS || 200);
const WINDOW_HOURS = Number(process.env.DOCS_CHANGED_WINDOW_HOURS || 24);
const FORCE_FULL = process.env.FORCE_FULL === "1";

const MAX_WAIT_MS = Number(process.env.MAX_BATCH_WAIT_MS || 45 * 60 * 1000);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function streamToString(stream) { const chunks=[]; for await (const c of stream) chunks.push(c); return Buffer.concat(chunks).toString("utf8"); }
function unique(arr){return [...new Set(arr.filter(Boolean))];}
const routeFrom = (f) => {
  const unix = f.replace(/\\/g, "/");
  if (unix.includes("/src/app/")) return "/" + unix.split("/src/app/")[1].replace(/\/page\.(t|j)sx?$/, "");
  if (unix.includes("/src/pages/")) { let seg = unix.split("/src/pages/")[1].replace(/\.(t|j)sx?$/, ""); if (!seg.startsWith("/")) seg = "/" + seg; return seg; }
  return "/unknown";
};
function gitChangedSince(iso) {
  try {
    const out = execSync(`git log --since="${iso}" --name-only --pretty=format:`, { stdio: ["ignore", "pipe", "pipe"] })
      .toString("utf8").split("\n").map(s => s.trim()).filter(Boolean);
    return unique(out);
  } catch { return []; }
}
function gitChangedInHours(h) {
  try {
    const out = execSync(`git diff --name-only --diff-filter=AM --since='${h} hours ago'`, { stdio: ["ignore", "pipe", "pipe"] })
      .toString("utf8").split("\n").map(s => s.trim()).filter(Boolean);
    return unique(out);
  } catch { return []; }
}

// ---------- select target files ----------
async function selectTargets() {
  const allPages = await globby(
    ["src/app/**/page.{tsx,ts,jsx,js}", "src/pages/**/*.{tsx,ts,jsx,js}"],
    { gitignore: true }
  );

  if (FORCE_FULL) return allPages.slice(0, MAX_ITEMS);

  let changed = [];
  if (fs.existsSync(LAST_RUN_PATH)) {
    const last = JSON.parse(fs.readFileSync(LAST_RUN_PATH, "utf8"));
    if (last?.completed_at) changed = gitChangedSince(last.completed_at);
  }
  if (changed.length === 0) changed = gitChangedInHours(WINDOW_HOURS);

  const set = new Set(changed);
  const targets = allPages.filter(f => set.has(f));

  if (targets.length === 0) {
    console.log(`✅ No page changes in last ${WINDOW_HOURS}h (and since last run). Nothing to do.`);
    process.exit(0);
  }
  if (targets.length > MAX_ITEMS) {
    console.log(`⚠️ Capping items: ${targets.length} → ${MAX_ITEMS} (PRODUCT_DOCS_MAX_ITEMS)`);
  }
  return targets.slice(0, MAX_ITEMS);
}

function buildJsonlFor(files, model) {
  const reqs = files.map((f) => {
    const code = fs.readFileSync(f, "utf8").slice(0, 4000); // cap per item
    const route = routeFrom(f);
    return {
      custom_id: route || "/",
      method: "POST",
      url: "/v1/chat/completions",
      body: {
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are a senior technical writer. Use very simple English. No jargon or code dumps." },
          { role: "user", content:
`Summarize this Next.js page for a help-doc audience.
ROUTE: ${route}
FILE: ${f}
Include: purpose, what users see, inputs/submit behavior, data flow, and a short 'How to test' checklist.

CODE:
${code}`
          }
        ]
      }
    };
  });
  const pathOut = "batch-input.jsonl";
  fs.writeFileSync(pathOut, reqs.map(r => JSON.stringify(r)).join("\n"));
  console.log(`🧰 Built batch input with ${reqs.length} items (model: ${model})`);
  return pathOut;
}

async function submitBatch(jsonlPath) {
  const uploaded = await client.files.create({ file: fs.createReadStream(jsonlPath), purpose: "batch" });
  console.log("📤 Uploaded input file:", uploaded.id);
  const batch = await client.batches.create({ input_file_id: uploaded.id, endpoint: "/v1/chat/completions", completion_window: "24h" });
  console.log("🚀 Submitted batch:", batch.id);
  return batch.id;
}

async function waitForBatch(batchId) {
  let status = "validating";
  let lastProgress = "";
  const start = Date.now();

  while (!["completed", "expired", "failed", "canceled"].includes(status)) {
    if (Date.now() - start > MAX_WAIT_MS) throw new Error(`Timeout: batch still '${status}' after ${Math.round(MAX_WAIT_MS/60000)}m`);
    console.log(`⏳ Batch status: ${status} — waiting 30s...`);
    await sleep(30000);
    const b = await client.batches.retrieve(batchId);
    status = b.status;
    const prog = `${b.request_counts?.completed || 0}/${b.request_counts?.total || "?"}`;
    if (prog !== lastProgress) { console.log(`   progress: ${prog}`); lastProgress = prog; }
  }
  console.log("✅ Final status:", status);
  return status;
}

async function printBatchError(batchId) {
  try {
    const info = await client.batches.retrieve(batchId);
    if (info.error_file_id) {
      const errStream = await client.files.content(info.error_file_id);
      const errText = await streamToString(errStream.body);
      console.error("🧯 Batch error details (first 5k chars):\n", errText.slice(0, 5000));
      return errText;
    } else {
      console.error("No error_file_id available for this batch.");
      return "";
    }
  } catch (e) {
    console.error("Failed to fetch batch error details:", e?.message || e);
    return "";
  }
}

async function downloadResults(batchId) {
  const fresh = await client.batches.retrieve(batchId);
  const outStream = await client.files.content(fresh.output_file_id);
  return streamToString(outStream.body);
}

function writeDocsFromJsonl(jsonl) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const lines = jsonl.split("\n").map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const obj = JSON.parse(line);
    const route = obj.custom_id || "/unknown";
    const content = obj.response?.body?.choices?.[0]?.message?.content || "⚠️ No content generated";
    const dir = path.join(OUT_DIR, route === "/" ? "_root" : route);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "index.md"),
      `# ${route} Page\n\n_Last updated: ${new Date().toISOString()}_\n\n${content}\n`
    );
  }
  console.log(`📚 Wrote docs to ${OUT_DIR}`);
}

function recordLastRun(count) {
  fs.mkdirSync(META_DIR, { recursive: true });
  fs.writeFileSync(LAST_RUN_PATH, JSON.stringify({ completed_at: new Date().toISOString(), items: count }, null, 2));
  console.log(`🧭 Updated ${LAST_RUN_PATH}`);
}

// ---------- main ----------
(async () => {
  const targets = await selectTargets();
  console.log(`🗂️  Pages selected: ${targets.length} ${FORCE_FULL ? "(full baseline)" : "(smart window)"}`);

  // First attempt with primary model
  let jsonlPath = buildJsonlFor(targets, MODEL_PRIMARY);
  let batchId = await submitBatch(jsonlPath);
  let status = await waitForBatch(batchId);

  if (status !== "completed") {
    const details = await printBatchError(batchId);

    // Heuristic: if model not supported / unknown or similar, retry once with fallback
    if (/model.*not.*supported|unsupported.*model|unknown model|not allowed for batch/i.test(details)) {
      console.warn(`⚠️ Model '${MODEL_PRIMARY}' may be blocked for batch. Retrying once with '${MODEL_FALLBACK}'...`);
      jsonlPath = buildJsonlFor(targets, MODEL_FALLBACK);
      batchId = await submitBatch(jsonlPath);
      status = await waitForBatch(batchId);
      if (status !== "completed") {
        await printBatchError(batchId);
        throw new Error(`Batch failed again using fallback model '${MODEL_FALLBACK}'.`);
      }
    } else {
      throw new Error(`Batch ended with status: ${status}`);
    }
  }

  // Download → write docs → record last run
  const jsonl = await downloadResults(batchId);
  fs.writeFileSync("batch-output.jsonl", jsonl);
  console.log("📥 Saved batch-output.jsonl");

  writeDocsFromJsonl(jsonl);
  recordLastRun(targets.length);
})().catch((e) => {
  console.error("❌ End-to-end batch failed:", e?.message || e);
  process.exit(1);
});
