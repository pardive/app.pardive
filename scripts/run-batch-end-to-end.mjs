// End-to-end Product Docs via Batch + Responses API
// Modes:
//   • Full baseline:   FORCE_FULL=1
//   • Smart window:    default; only changed files
//
// Env:
//   OPENAI_API_KEY=...
//   PRODUCT_DOCS_MODEL=gpt-5-chat-latest
//   PRODUCT_DOCS_FALLBACK_MODEL=gpt-5-mini
//   DOCS_CHANGED_WINDOW_HOURS=24
//   PRODUCT_DOCS_MAX_ITEMS=200
//   FORCE_FULL=1                  // only for first run
//   MAX_BATCH_WAIT_MS=2700000     // 45 minutes

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
function unique(a){return [...new Set(a.filter(Boolean))];}
const routeFrom = (f) => {
  const u = f.replace(/\\/g, "/");
  if (u.includes("/src/app/")) return "/" + u.split("/src/app/")[1].replace(/\/page\.(t|j)sx?$/, "");
  if (u.includes("/src/pages/")) { let s = u.split("/src/pages/")[1].replace(/\.(t|j)sx?$/, ""); if (!s.startsWith("/")) s = "/" + s; return s; }
  return "/unknown";
};
function gitChangedSince(iso){
  try{
    return unique(execSync(`git log --since="${iso}" --name-only --pretty=format:`).toString("utf8").split("\n").map(s=>s.trim()));
  }catch{return []}
}
function gitChangedInHours(h){
  try{
    return unique(execSync(`git diff --name-only --diff-filter=AM --since='${h} hours ago'`).toString("utf8").split("\n").map(s=>s.trim()));
  }catch{return []}
}

// ---------- select targets ----------
async function selectTargets(){
  const all = await globby(
    ["src/app/**/page.{tsx,ts,jsx,js}", "src/pages/**/*.{tsx,ts,jsx,js}"],
    { gitignore: true }
  );
  if (FORCE_FULL) return all.slice(0, MAX_ITEMS);

  let changed = [];
  if (fs.existsSync(LAST_RUN_PATH)) {
    const last = JSON.parse(fs.readFileSync(LAST_RUN_PATH, "utf8"));
    if (last?.completed_at) changed = gitChangedSince(last.completed_at);
  }
  if (changed.length === 0) changed = gitChangedInHours(WINDOW_HOURS);

  const set = new Set(changed);
  const targets = all.filter(f => set.has(f));
  if (targets.length === 0) {
    console.log(`✅ No page changes in last ${WINDOW_HOURS}h (and since last run). Nothing to do.`);
    process.exit(0);
  }
  if (targets.length > MAX_ITEMS) console.log(`⚠️ Capping: ${targets.length} → ${MAX_ITEMS}`);
  return targets.slice(0, MAX_ITEMS);
}

// Build a single text prompt for Responses API
function promptFor(route, file, code){
  return [
    "You are a senior technical writer.",
    "Write simple, non-technical product docs for this Next.js page.",
    "Format as clear paragraphs and short bullet points.",
    "",
    `ROUTE: ${route}`,
    `FILE: ${file}`,
    "",
    "Include:",
    "- Purpose of the page (what a user can do)",
    "- What the user sees (main UI elements)",
    "- Inputs & submit behavior",
    "- Data flow (client ↔ server, APIs, storage)",
    "- Short 'How to test' checklist",
    "",
    "CODE:",
    code
  ].join("\n");
}

function buildJsonlFor(files, model){
  const reqs = files.map((f) => {
    const code = fs.readFileSync(f, "utf8").slice(0, 3000); // trim per item
    const route = routeFrom(f);
    return {
      custom_id: route || "/",
      method: "POST",
      url: "/v1/responses",                     // ✅ Responses API for Batch
      body: {
        model,
        input: promptFor(route, f, code),       // ✅ single text input
        max_output_tokens: 800                  // keep outputs compact
      }
    };
  });
  const p = "batch-input.jsonl";
  fs.writeFileSync(p, reqs.map(r => JSON.stringify(r)).join("\n"));
  console.log(`🧰 Built batch input with ${reqs.length} items (model: ${model})`);
  return p;
}

async function submitBatch(jsonlPath){
  const uploaded = await client.files.create({ file: fs.createReadStream(jsonlPath), purpose: "batch" });
  console.log("📤 Uploaded input file:", uploaded.id);
  const batch = await client.batches.create({
    input_file_id: uploaded.id,
    endpoint: "/v1/responses",                 // ✅ match the url used in lines
    completion_window: "24h"
  });
  console.log("🚀 Submitted batch:", batch.id);
  return batch.id;
}

async function waitForBatch(batchId){
  let status = "validating";
  let last = "";
  const start = Date.now();
  while(!["completed","expired","failed","canceled"].includes(status)){
    if (Date.now() - start > MAX_WAIT_MS) throw new Error(`Timeout: batch still '${status}'`);
    console.log(`⏳ Batch status: ${status} — waiting 30s...`);
    await sleep(30000);
    const b = await client.batches.retrieve(batchId);
    status = b.status;
    const prog = `${b.request_counts?.completed || 0}/${b.request_counts?.total || "?"}`;
    if (prog !== last) { console.log(`   progress: ${prog}`); last = prog; }
  }
  console.log("✅ Final status:", status);
  return status;
}

async function printBatchError(batchId){
  try{
    const info = await client.batches.retrieve(batchId);
    if (info.error_file_id){
      const s = await client.files.content(info.error_file_id);
      const t = await streamToString(s.body);
      console.error("🧯 Batch error (file):\n", t.slice(0,5000));
      return t;
    }
    if (info.errors?.length){
      console.error("🧯 Batch error (inline):\n", JSON.stringify(info.errors, null, 2).slice(0,5000));
      return JSON.stringify(info.errors);
    }
  }catch(e){
    console.error("Failed to fetch batch error details:", e?.message || e);
  }
  console.error("No error details available.");
  return "";
}

async function downloadResults(batchId){
  const fresh = await client.batches.retrieve(batchId);
  const out = await client.files.content(fresh.output_file_id);
  return streamToString(out.body);
}

function writeDocsFromJsonl(jsonl){
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const lines = jsonl.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const obj = JSON.parse(line);
    // Responses API puts text at response.body.output[0].content[0].text
    const content =
      obj.response?.body?.output?.[0]?.content?.[0]?.text ||
      obj.response?.body?.choices?.[0]?.message?.content || // fallback if provider maps to chat
      "⚠️ No content generated";
    const route = obj.custom_id || "/unknown";
    const dir = path.join(OUT_DIR, route === "/" ? "_root" : route);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "index.md"),
      `# ${route} Page\n\n_Last updated: ${new Date().toISOString()}_\n\n${content}\n`
    );
  }
  console.log(`📚 Wrote docs to ${OUT_DIR}`);
}

function recordLastRun(count){
  fs.mkdirSync(META_DIR, { recursive: true });
  fs.writeFileSync(LAST_RUN_PATH, JSON.stringify({ completed_at: new Date().toISOString(), items: count }, null, 2));
  console.log(`🧭 Updated ${LAST_RUN_PATH}`);
}

// ---------- main ----------
(async () => {
  const targets = await selectTargets();
  console.log(`🗂️  Pages selected: ${targets.length} ${FORCE_FULL ? "(full baseline)" : "(smart window)"}`);

  // 1st attempt with primary model via /v1/responses
  let jsonlPath = buildJsonlFor(targets, MODEL_PRIMARY);
  let batchId = await submitBatch(jsonlPath);
  let status = await waitForBatch(batchId);

  if (status !== "completed") {
    const details = await printBatchError(batchId);
    // Always retry once with fallback if validation failed
    console.warn(`⚠️ Retrying once with fallback model '${MODEL_FALLBACK}'...`);
    jsonlPath = buildJsonlFor(targets, MODEL_FALLBACK);
    batchId = await submitBatch(jsonlPath);
    status = await waitForBatch(batchId);
    if (status !== "completed") {
      await printBatchError(batchId);
      throw new Error(`Batch failed again using fallback model '${MODEL_FALLBACK}'.`);
    }
  }

  // Download → write docs → record last run
  const jsonl = await downloadResults(batchId);
  fs.writeFileSync("batch-output.jsonl", jsonl);
  console.log("📥 Saved batch-output.jsonl");

  writeDocsFromJsonl(jsonl);
  recordLastRun(targets.length);
})().catch((e)=>{
  console.error("❌ End-to-end batch failed:", e?.message || e);
  process.exit(1);
});
