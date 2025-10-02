// Product Docs generator with AI + local fallback.
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

// ---------- OpenAI client (optional) ----------
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
    seg = seg.replace(/\/\(.*?\)\//g, "/"); // strip group segments
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
- Check if any list or table loads (this hints at server data).
- Refresh page to ensure it still works.

_File: \`${file}\` (summary generated without AI due to rate limits)_`;
}

function localOverviewMarkdown(pages, frontCount, backCount, dataCount) {
  return `# ${CFG.projectName} — Product Docs (Auto-generated)

_Last updated: ${nowISO()}_

## TL;DR
- ${CFG.projectName} is a web app with a Next.js frontend and APIs on the server.
- Users can visit pages like: ${pages.slice(0, 5).join(", ")}${pages.length > 5 ? ", ..." : ""}.
- The system likely uses forms, buttons, and API calls to create and view data.
- These docs were generated in **local fallback mode** (AI rate limit hit), so they are approximate.

## What it is
A web application that provides pages for users to interact with (view info, fill forms, navigate), with a backend that stores and retrieves data.

## Main Features (likely)
- Pages that show information and accept inputs.
- Some pages submit forms to the server.
- Data is stored and retrieved via APIs.

## How the system flows
1. User opens a page in the browser.
2. The page shows UI (headings, forms, buttons).
3. On actions (submit/click), it calls APIs on the server.
4. Server reads/writes the database, returns results to show on the page.

## Security basics (baseline)
- Use HTTPS in production.
- Protect private pages behind login.
- Validate inputs on both frontend and backend.

## How to run locally (typical)
- Install Node 20+ and run \`npm install\`.
- Start dev server: \`npm run dev\`.
- Open \`http://localhost:3000\`.

## How we deploy (typical)
- Frontend: Vercel.
- Backend: hosted Node server (e.g., Railway).
- Database: a hosted Postgres (e.g., Supabase).

## Recently changed
Not detected (AI fallback mode).

## Counts (rough)
- Frontend files sampled: ${frontCount}
- Backend files sampled: ${backCount}
- Data/SQL files sampled: ${dataCount}
`;
}

function localCodeMarkdown(title, items) {
  const lines = items.slice(0, 12).map(({ file, code }) => {
    const s = quickStats(code);
    return `- \`${file}\` — forms:${s.forms}, inputs:${s.inputs}, buttons:${s.buttons}, apiCalls:${s.apiCalls}`;
  }).join("\n");
  return `# ${title}

_Last updated: ${nowISO()}_

This section was generated without AI (rate limit). It lists files and rough UI/data hints.

${lines || "- No files sampled."}

**How to test:**
- Open pages that use these files.
- Try basic actions: click buttons, submit forms, reload pages.
- Watch network requests in DevTools to see API calls.`;
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

// ---------- generate OVERVIEW ----------
ensureDir(OUT);

let overviewMd = await ask("Write a simple product docs overview.") // simplified prompt for brevity
if (!overviewMd) {
  const routes = pageFiles.map(detectRouteFromFile);
  overviewMd = localOverviewMarkdown(routes, frontend.length, backend.length, data.length);
}
fs.writeFileSync(path.join(OUT, "index.md"), overviewMd);

// ---------- generate PAGES ----------
const PAGES_DIR = path.join(OUT, "pages");
ensureDir(PAGES_DIR);

const pageTOC = [];
for (const f of pageFiles) {
  const code = readFileLimited(path.join(ROOT, f), limits.maxBytesPerFile);
  const route = detectRouteFromFile(f);
  pageTOC.push(route);

  let md = await ask(`Summarize this Next.js page in simple English:\n\n${code}`);
  if (!md) md = localPageMarkdown(route, f, code);

  const destDir = path.join(PAGES_DIR, route === "/" ? "_root" : route);
  ensureDir(destDir);
  fs.writeFileSync(path.join(destDir, "index.md"), md);
}

fs.writeFileSync(
  path.join(PAGES_DIR, "index.md"),
  `# Pages — Table of Contents (Auto-generated)\n\n${pageTOC.sort().map(r => `- ${r}`).join("\n")}\n`
);

// ---------- generate CODE PAGES ----------
const CODE_DIR = path.join(OUT, "code");
ensureDir(CODE_DIR);

const frontMd = localCodeMarkdown("Frontend (UI & Components)", frontend);
fs.writeFileSync(path.join(CODE_DIR, "frontend.md"), frontMd);

const backMd = localCodeMarkdown("Backend (APIs & Logic)", backend);
fs.writeFileSync(path.join(CODE_DIR, "backend.md"), backMd);

const dataMd = localCodeMarkdown("Data Model (Supabase/Postgres)", data);
fs.writeFileSync(path.join(CODE_DIR, "data-model.md"), dataMd);

console.log(`✅ Product Docs written to ${OUT}`);
