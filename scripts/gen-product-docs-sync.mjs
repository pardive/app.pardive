// Sequential (non-batch) generator using Responses API with polite rate limiting.
// Uses the same "full baseline" vs "smart window" selection as batch script.

import fs from "fs";
import path from "path";
import { globby } from "globby";
import { execSync } from "child_process";
import OpenAI from "openai";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs/product-docs");
const META_DIR = path.join(ROOT, "docs");
const LAST_RUN_PATH = path.join(META_DIR, ".last_run.json");

const MODEL = process.env.PRODUCT_DOCS_MODEL || "gpt-5-mini";          // default
const FALLBACK = process.env.PRODUCT_DOCS_FALLBACK_MODEL || "gpt-4o-mini";

const MAX_ITEMS = Number(process.env.PRODUCT_DOCS_MAX_ITEMS || 200);
const WINDOW_HOURS = Number(process.env.DOCS_CHANGED_WINDOW_HOURS || 24);
const FORCE_FULL = process.env.FORCE_FULL === "1";
const SLEEP_MS = Number(process.env.SYNC_SLEEP_MS || 2000);            // 2s between calls
const MAX_RETRIES = Number(process.env.SYNC_MAX_RETRIES || 5);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function unique(a){return [...new Set(a.filter(Boolean))];}
function routeFrom(f){
  const u = f.replace(/\\/g, "/");
  if (u.includes("/src/app/")) return "/" + u.split("/src/app/")[1].replace(/\/page\.(t|j)sx?$/, "");
  if (u.includes("/src/pages/")) { let s = u.split("/src/pages/")[1].replace(/\.(t|j)sx?$/, ""); if (!s.startsWith("/")) s = "/" + s; return s; }
  return "/unknown";
}
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
function promptFor(route, file, code){
  return [
    "You are a senior technical writer.",
    "Write simple, non-technical product docs for this Next.js page.",
    "Use clear paragraphs + short bullet points.",
    "",
    `ROUTE: ${route}`,
    `FILE: ${file}`,
    "",
    "Include:",
    "- Purpose",
    "- What the user sees (UI)",
    "- Inputs & submit behavior",
    "- Data flow (client/server/APIs/storage)",
    "- 'How to test' checklist",
    "",
    "CODE:",
    code
  ].join("\n");
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

async function generateOne({ file, model }) {
  const route = routeFrom(file);
  const code = fs.readFileSync(file, "utf8").slice(0, 3000);
  let lastErr = null;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await client.responses.create({
        model,
        input: promptFor(route, file, code),
        temperature: 0.2,
        max_output_tokens: 800
      });
      // Responses API content path:
      const content = res.output?.[0]?.content?.[0]?.text
        || res.choices?.[0]?.message?.content
        || "";
      return { route, text: content || "⚠️ No content generated" };
    } catch (e) {
      lastErr = e;
      const msg = e?.message || String(e);
      // backoff on rate limit; switch model on validation-ish errors
      if (/rate limit|tpm|rpm/i.test(msg)) {
        const wait = Math.min(15000, (i + 1) * 2000);
        console.warn(`⏳ Rate limited (${i + 1}/${MAX_RETRIES}) — waiting ${wait}ms...`);
        await sleep(wait);
      } else if (/billing_hard_limit|insufficient_quota/i.test(msg)) {
        throw e; // billing problem—surface immediately
      } else if (/unsupported model|not allowed|unknown model|invalid/.test(msg) && model !== FALLBACK) {
        console.warn(`⚠️ Model '${model}' rejected. Switching to fallback '${FALLBACK}'.`);
        model = FALLBACK;
      } else {
        const wait = Math.min(8000, (i + 1) * 1500);
        console.warn(`⚠️ Error: ${msg} — retrying in ${wait}ms`);
        await sleep(wait);
      }
    }
  }
  throw lastErr || new Error("Failed after retries");
}

function writeDoc({ route, text }) {
  const dir = path.join(OUT_DIR, route === "/" ? "_root" : route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "index.md"),
    `# ${route} Page\n\n_Last updated: ${new Date().toISOString()}_\n\n${text}\n`
  );
}

// ---------- main ----------
(async () => {
  const targets = await selectTargets();
  console.log(`🧵 Sync mode: generating ${targets.length} pages (model: ${MODEL})`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0, fail = 0;
  for (const file of targets) {
    try {
      const { route, text } = await generateOne({ file, model: MODEL });
      writeDoc({ route, text });
      ok++;
      await sleep(SLEEP_MS);
    } catch (e) {
      console.error(`❌ Failed for ${file}:`, e?.message || e);
      fail++;
    }
  }

  // write last run metadata
  fs.mkdirSync(META_DIR, { recursive: true });
  fs.writeFileSync(LAST_RUN_PATH, JSON.stringify({ completed_at: new Date().toISOString(), items: targets.length }, null, 2));

  console.log(`✅ Done. Success: ${ok}, Failed: ${fail}. Output → ${OUT_DIR}`);
  if (ok === 0) process.exit(1);
})();
