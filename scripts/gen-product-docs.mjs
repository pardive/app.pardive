// Auto-generates Product Docs in simple English, split into multiple files.
// Output: docs/product-docs/*
// Run: npm run docs:product  (requires OPENAI_API_KEY)

import fs from "fs";
import path from "path";
import { globby } from "globby";
import OpenAI from "openai";

const ROOT = process.cwd();
const CFG_PATH = path.join(ROOT, "docs/.product-docs-config.json");
const CFG = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
const OUT = path.join(ROOT, CFG.outDir);

// OpenAI v5 client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readFileLimited(file, limit = 60000) {
  try {
    let buf = fs.readFileSync(file);
    if (buf.length > limit) buf = buf.subarray(0, limit);
    return buf.toString("utf8");
  } catch { return ""; }
}
const chunk = (arr) => arr.map(x => `// ${x.file}\n${x.code}`).join("\n\n");

async function ask(prompt) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: "You are a senior technical writer. Explain codebases in very simple English for non-technical readers. No jargon, no code dumps." },
      { role: "user", content: prompt }
    ]
  });
  return res.choices?.[0]?.message?.content || "Generation failed.";
}

// --------- Collect files ---------
const allFiles = (await globby(CFG.include, { ignore: CFG.exclude, gitignore: true }))
  .slice(0, CFG.limits.maxFilesTotal);
const pageFiles = (await globby(CFG.pageGlobs || [], { ignore: CFG.exclude, gitignore: true }))
  .slice(0, CFG.limits.maxPages);

const frontend = [], backend = [], data = [];
for (const f of allFiles) {
  const code = readFileLimited(path.join(ROOT, f), CFG.limits.maxBytesPerFile);
  if (!code) continue;
  if (f.includes("src/app") || f.includes("components") || f.includes("src/pages")) {
    frontend.push({ file: f, code });
  } else if (f.includes("controller") || f.includes("service") || f.includes("modules") || f.includes("apps/")) {
    backend.push({ file: f, code });
  } else if (f.endsWith(".sql") || f.includes("migration") || f.includes("supabase")) {
    data.push({ file: f, code });
  }
}

// --------- Overview ---------
ensureDir(OUT);
const overviewPrompt = `
Project: ${CFG.projectName}

Frontend hints: ${CFG.frontendHints?.join(", ")}
Backend hints: ${CFG.backendHints?.join(", ")}
Data hints: ${CFG.dataHints?.join(", ")}

=== FRONTEND SAMPLE ===
${chunk(frontend.slice(0, CFG.limits.maxFrontendSamples))}
=== BACKEND SAMPLE ===
${chunk(backend.slice(0, CFG.limits.maxBackendSamples))}
=== DATA SAMPLE ===
${chunk(data.slice(0, CFG.limits.maxDataSamples))}

Write a Markdown doc with:
1) TL;DR (bullets)
2) What ${CFG.projectName} is
3) Main Features
4) How the system works (user → frontend → backend → database)
5) Security basics
6) How to run locally
7) How we deploy (Vercel, Railway, Supabase)
8) Recent changes (plain English, if unclear: "Not detected")
`;
const overview = await ask(overviewPrompt);
fs.writeFileSync(path.join(OUT, "index.md"),
  `# ${CFG.projectName} — Product Docs (Auto-generated)\n\n_Last updated: ${new Date().toISOString()}_\n\n${overview}\n`);

// --------- Pages ---------
const PAGES_DIR = path.join(OUT, "pages");
ensureDir(PAGES_DIR);

function routeFromFile(f) {
  const p = f.replace(/\\/g, "/");
  if (p.includes("/src/app/")) {
    let seg = p.split("/src/app/")[1].replace(/\/page\.(t|j)sx?$/, "");
    if (seg.endsWith("/index")) seg = seg.slice(0, -6);
    return "/" + seg;
  }
  if (p.includes("/src/pages/")) {
    let seg = p.split("/src/pages/")[1].replace(/\.(t|j)sx?$/, "");
    if (seg.endsWith("/index")) seg = seg.slice(0, -6);
    if (!seg.startsWith("/")) seg = "/" + seg;
    return seg;
  }
  return "/unknown";
}

const pageTOC = [];
for (const f of pageFiles) {
  const code = readFileLimited(path.join(ROOT, f), CFG.limits.maxBytesPerFile);
  if (!code) continue;
  const route = routeFromFile(f);
  pageTOC.push(route);

  const pagePrompt = `
Summarize this Next.js page for a non-technical reader.

ROUTE: ${route}
FILE: ${f}

CODE SAMPLE:
${code}

Write Markdown:
- Title: "${route}" Page
- Purpose in plain English
- Key elements a user sees
- Inputs/forms and what happens on submit
- Where data flows
- Simple "How to test this page" checklist
`;
  const md = await ask(pagePrompt);
  const destDir = path.join(PAGES_DIR, route === "/" ? "_root" : route);
  ensureDir(destDir);
  fs.writeFileSync(path.join(destDir, "index.md"),
    `# ${route} Page (Auto-generated)\n\n_Last updated: ${new Date().toISOString()}_\n\n${md}\n`);
}

fs.writeFileSync(path.join(PAGES_DIR, "index.md"),
  `# Pages — Table of Contents\n\n${pageTOC.map(r => `- [${r}](.${r}/index.md)`).join("\n")}\n`);

// --------- Code docs ---------
const CODE_DIR = path.join(OUT, "code");
ensureDir(CODE_DIR);

async function summarizeSet(title, arr, hint) {
  const prompt = `
Summarize these files for non-technical readers.
Focus: what they do, why they exist, how they connect.

HINT: ${hint}

FILES:
${chunk(arr)}

Write Markdown:
- H1: ${title}
- Intro paragraph
- Bulleted responsibilities
- Where used
- Gotchas
- How to test
`;
  return ask(prompt);
}

const frontendMd = await summarizeSet("Frontend (UI & Components)", frontend, CFG.frontendHints.join(", "));
fs.writeFileSync(path.join(CODE_DIR, "frontend.md"), frontendMd);

const backendMd = await summarizeSet("Backend (APIs & Logic)", backend, CFG.backendHints.join(", "));
fs.writeFileSync(path.join(CODE_DIR, "backend.md"), backendMd);

const dataMd = await summarizeSet("Data Model (Supabase/Postgres)", data, CFG.dataHints.join(", "));
fs.writeFileSync(path.join(CODE_DIR, "data-model.md"), dataMd);

console.log(`✅ Product Docs generated in ${OUT}`);
