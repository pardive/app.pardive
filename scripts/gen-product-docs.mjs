// Product Docs generator with AI + local fallback + batching
// Output: docs/product-docs/**
// Run: npm run docs:product

import fs from "fs";
import path from "path";
import { globby } from "globby";
import OpenAI from "openai";

const ROOT = process.cwd();
const CFG_PATH = path.join(ROOT, "docs/.product-docs-config.json");
const CFG = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
const OUT = path.join(ROOT, CFG.outDir);

// ---------- Light mode (cap requests/tokens) ----------
if (process.env.PRODUCT_DOCS_LIGHT === "1") {
  CFG.limits = CFG.limits || {};
  CFG.limits.maxPages = Math.min(CFG.limits.maxPages || 80, 5);
  CFG.limits.maxFrontendSamples = Math.min(CFG.limits.maxFrontendSamples || 40, 8);
  CFG.limits.maxBackendSamples  = Math.min(CFG.limits.maxBackendSamples  || 40, 6);
  CFG.limits.maxDataSamples     = Math.min(CFG.limits.maxDataSamples     || 30, 4);
  console.log("⚙️  Running in LIGHT mode caps.");
}

// ---------- OpenAI client ----------
let openai = null;
let aiAvailable = !!process.env.OPENAI_API_KEY;
if (aiAvailable) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch {
    aiAvailable = false;
  }
}

// ---------- utils ----------
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readFileLimited(file, limit = 60000) {
  try {
    let buf = fs.readFileSync(file);
    if (buf.length > limit) buf = buf.subarray(0, limit);
    return buf.toString("utf8");
  } catch { return ""; }
}
const nowISO = () => new Date().toISOString();

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ask(prompt, { maxRetries = 3 } = {}) {
  if (!aiAvailable) return null;
  let attempt = 0;
  const baseDelay = Number(process.env.PRODUCT_DOCS_DELAY_MS || 24000);

  while (attempt <= maxRetries) {
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are a senior technical writer. Use very simple English, no jargon or code dumps. If unknown, write 'Not detected'." },
          { role: "user", content: prompt }
        ]
      });
      return res.choices?.[0]?.message?.content || null;
    } catch (err) {
      const isRate = err?.status === 429 || err?.code === "rate_limit_exceeded";
      if (isRate && attempt < maxRetries) {
        attempt++;
        const wait = Math.round(baseDelay * Math.pow(1.6, attempt - 1) + Math.random() * 1000);
        console.warn(`⏳ Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${wait}ms...`);
        await sleep(wait);
        continue;
      }
      console.warn("⚠️  AI unavailable, switching to local fallback. Reason:", err?.message || err);
      return null;
    }
  }
  return null;
}

// ---------- local fallback summarizers ----------
function detectRouteFromFile(f) {
  const p = f.replace(/\\/g, "/");
  if (p.includes("/src/app/")) {
    let seg = p.split("/src/app/")[1].replace(/\/page\.(t|j)sx?$/, "");
    if (seg.endsWith("/index")) seg = seg.slice(0, -6);
    seg = seg.replace(/\/\(.*?\)\//g, "/");
    seg = seg.replace(/\[[^\]]+\]/g, ":param");
    return "/" + seg.replace(/^\/+/, "");
  }
  if (p.includes("/src/pages/")) {
    let seg = p.split("/src/pages/")[1].replace(/\.(t|j)sx?$/, "");
    if (seg.endsWith("/index")) seg = seg.slice(0, -6);
    seg = seg.replace(/\[[^\]]+\]/g, ":param");
    if (!seg.startsWith("/")) seg = "/" + seg;
    return seg;
  }
  return "/unknown";
}

// ✅ Fixed regex usage here
function quickStats(code) {
  const s = (code || "").toLowerCase();
  const safeCount = (needle) => {
    try {
      return (s.match(new RegExp(needle, "g")) || []).length;
    } catch {
      return 0;
    }
  };
  return {
    forms: safeCount("<form"),
    inputs: safeCount("<input"),
    buttons: safeCount("<button"),
    links: safeCount("<a ") + safeCount("<link") + safeCount("next/link"),
    apiCalls: safeCount("fetch\\(") + safeCount("axios\\.") + safeCount("supabase\\."),
    stateHooks: safeCount("usestate\\(") + safeCount("usereducer\\("),
  };
}

function localPageMarkdown(route, file, code) {
  const stats = quickStats(code);
  const guessPurpose =
    stats.forms > 0 ? "This page lets users fill a form."
    : stats.apiCalls > 0 ? "This page shows or updates data from the server."
    : "This page shows information to the user.";

  return `# ${route} Page (Auto-generated)

_Last updated: ${nowISO()}_

**What it does (approx):** ${guessPurpose}

**What users likely see:**
- Buttons: ~${stats.buttons}
- Inputs: ~${stats.inputs}
- Links: ~${stats.links}
- Forms: ~${stats.forms}

**Data flow (rough idea):**
- API calls detected: ~${stats.apiCalls}
- If there is a form, it probably sends data to the backend.

**How to test quickly:**
- Open **${route}**.
- Click visible buttons and ensure they respond.
- If a form exists, try submitting with valid and invalid data.
- Check if any list or table loads.
- Refresh page to ensure it still works.

_File: \`${file}\` (summary generated without AI due to rate limits)_`;
}

function localOverviewMarkdown(pages, frontCount, backCount, dataCount) {
  return `# ${CFG.projectName} — Product Docs (Auto-generated)

_Last updated: ${nowISO()}_

## TL;DR
- ${CFG.projectName} is a web app with a Next.js frontend and APIs on the server.
- Users can visit pages like: ${pages.slice(0, 5).join(", ")}${pages.length > 5 ? ", ..." : ""}.
- Docs generated in **fallback mode** (AI unavailable).

## What it is
A web application providing pages for users with backend + database support.

## How the system flows
1. User opens a page.
2. Page shows UI (forms, buttons).
3. User actions trigger API calls.
4. Server reads/writes the database.

## Counts
- Frontend files: ${frontCount}
- Backend files: ${backCount}
- Data files: ${dataCount}
`;
}

function localCodeMarkdown(title, items) {
  const lines = items.slice(0, 10).map(({ file, code }) => {
    const s = quickStats(code);
    return `- \`${file}\` — forms:${s.forms}, inputs:${s.inputs}, buttons:${s.buttons}, apiCalls:${s.apiCalls}`;
  }).join("\n");
  return `# ${title}

_Last updated: ${nowISO()}_

Generated without AI (rate limit). Rough counts:

${lines || "- No files"} `;
}

// ---------- collect files ----------
const limits = Object.assign({
  maxFilesTotal: 300, maxBytesPerFile: 60000,
  maxPages: 80, maxFrontendSamples: 40, maxBackendSamples: 40, maxDataSamples: 30
}, CFG.limits || {});

const allFiles = (await globby(CFG.include, { ignore: CFG.exclude, gitignore: true }))
  .slice(0, limits.maxFilesTotal);

const pageFiles = (await globby(CFG.pageGlobs || [], { ignore: CFG.exclude, gitignore: true }))
  .slice(0, limits.maxPages);

const frontend = [], backend = [], data = [];
for (const f of allFiles) {
  const code = readFileLimited(path.join(ROOT, f), limits.maxBytesPerFile);
  if (!code) continue;
  const low = f.toLowerCase();
  if (low.includes("src/app") || low.includes("components") || low.includes("src/pages")) {
    if (frontend.length < limits.maxFrontendSamples) frontend.push({ file: f, code });
  } else if (low.includes("controller") || low.includes("service") || low.includes("modules") || low.includes("apps/")) {
    if (backend.length < limits.maxBackendSamples) backend.push({ file: f, code });
  } else if (low.endsWith(".sql") || low.includes("migration") || low.includes("supabase")) {
    if (data.length < limits.maxDataSamples) data.push({ file: f, code });
  }
}

// ---------- OVERVIEW ----------
ensureDir(OUT);

let overviewMd = await ask("Write a simple product docs overview for the project.") 
if (!overviewMd) {
  const routes = pageFiles.map(detectRouteFromFile);
  overviewMd = localOverviewMarkdown(routes, frontend.length, backend.length, data.length);
}
fs.writeFileSync(path.join(OUT, "index.md"), overviewMd);

// ---------- PAGES (BATCH MODE) ----------
const PAGES_DIR = path.join(OUT, "pages");
ensureDir(PAGES_DIR);

const pageTOC = [];
const BATCH_SIZE = 5;

for (let i = 0; i < pageFiles.length; i += BATCH_SIZE) {
  const batchFiles = pageFiles.slice(i, i + BATCH_SIZE);
  const batchData = batchFiles.map(f => {
    const code = readFileLimited(path.join(ROOT, f), limits.maxBytesPerFile);
    const route = detectRouteFromFile(f);
    return { route, file: f, code };
  });

  const batchPrompt = `
Summarize these Next.js pages for a non-technical reader.
Return one Markdown section per page (start with "# [ROUTE] Page").

PAGES:
${batchData.map(p => `ROUTE: ${p.route}\nFILE: ${p.file}\nCODE:\n${p.code}`).join("\n\n---\n\n")}
`;

  let batchMd = await ask(batchPrompt);
  if (!batchMd) {
    batchMd = batchData.map(p => localPageMarkdown(p.route, p.file, p.code)).join("\n\n---\n\n");
  }

  // Split by "# " headers
  const summaries = batchMd.split(/^# /m).filter(Boolean).map(s => "# " + s.trim());

  summaries.forEach((md, idx) => {
    const { route } = batchData[idx];
    pageTOC.push(route);
    const destDir = path.join(PAGES_DIR, route === "/" ? "_root" : route);
    ensureDir(destDir);
    fs.writeFileSync(path.join(destDir, "index.md"), md);
  });
}

fs.writeFileSync(
  path.join(PAGES_DIR, "index.md"),
  `# Pages — Table of Contents (Auto-generated)\n\n${pageTOC.sort().map(r => `- ${r}`).join("\n")}\n`
);

// ---------- CODE (frontend/backend/data in 3 requests) ----------
const CODE_DIR = path.join(OUT, "code");
ensureDir(CODE_DIR);

const frontendMd = (await ask("Summarize frontend files:\n" + frontend.map(f => f.file).join("\n"))) 
  || localCodeMarkdown("Frontend", frontend);
fs.writeFileSync(path.join(CODE_DIR, "frontend.md"), frontendMd);

const backendMd = (await ask("Summarize backend files:\n" + backend.map(f => f.file).join("\n"))) 
  || localCodeMarkdown("Backend", backend);
fs.writeFileSync(path.join(CODE_DIR, "backend.md"), backendMd);

const dataMd = (await ask("Summarize data/sql files:\n" + data.map(f => f.file).join("\n"))) 
  || localCodeMarkdown("Data Model", data);
fs.writeFileSync(path.join(CODE_DIR, "data-model.md"), dataMd);

console.log(`✅ Product Docs written to ${OUT}`);
