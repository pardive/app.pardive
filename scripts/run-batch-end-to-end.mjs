// End-to-end Product Docs via GPT-5 Batch: submit → wait → parse → write
import fs from "fs";
import path from "path";
import { globby } from "globby";
import OpenAI from "openai";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs/product-docs");
const MODEL = process.env.PRODUCT_DOCS_MODEL || "gpt-5-chat-latest";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function streamToString(stream) { const chunks=[]; for await (const c of stream) chunks.push(c); return Buffer.concat(chunks).toString("utf8"); }
const routeFrom = (f) => {
  const unix = f.replace(/\\/g, "/");
  if (unix.includes("/src/app/")) return "/" + unix.split("/src/app/")[1].replace(/\/page\.(t|j)sx?$/, "");
  if (unix.includes("/src/pages/")) { let seg = unix.split("/src/pages/")[1].replace(/\.(t|j)sx?$/, ""); if (!seg.startsWith("/")) seg = "/" + seg; return seg; }
  return "/unknown";
};

// 1) Build JSONL of page requests
const pageFiles = await globby(["src/app/**/page.{tsx,ts,jsx,js}", "src/pages/**/*.{tsx,ts,jsx,js}"], { gitignore: true });
const requests = pageFiles.map((f) => {
  const code = fs.readFileSync(f, "utf8").slice(0, 4000); // cap to control tokens
  const route = routeFrom(f);
  return {
    custom_id: route || "/",
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: MODEL,
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
const inputPath = "batch-input.jsonl";
fs.writeFileSync(inputPath, requests.map(r => JSON.stringify(r)).join("\n"));
console.log(`🧰 Built batch input with ${requests.length} items`);

// 2) Submit batch
const batch = await client.batches.create({
  input_file: fs.createReadStream(inputPath),
  endpoint: "/v1/chat/completions",
  completion_window: "24h"
});
console.log("📤 Submitted batch:", batch.id);

// 3) Poll until done
let status = batch.status;
let lastProgress = "";
while (!["completed", "expired", "failed", "canceled"].includes(status)) {
  console.log(`⏳ Batch status: ${status} — waiting 30s...`);
  await sleep(30000);
  const b = await client.batches.retrieve(batch.id);
  status = b.status;
  const prog = `${b.request_counts?.completed || 0}/${b.request_counts?.total || "?"}`;
  if (prog !== lastProgress) { console.log(`   progress: ${prog}`); lastProgress = prog; }
}
console.log("✅ Final status:", status);
if (status !== "completed") throw new Error(`Batch ended with status: ${status}`);

// 4) Download output
const fresh = await client.batches.retrieve(batch.id);
const outStream = await client.files.content(fresh.output_file_id);
const jsonl = await streamToString(outStream.body);
fs.writeFileSync("batch-output.jsonl", jsonl);
console.log("📥 Saved batch-output.jsonl");

// 5) Parse → docs/product-docs
fs.mkdirSync(OUT_DIR, { recursive: true });
const lines = jsonl.split("\n").map(l => l.trim()).filter(Boolean);
for (const line of lines) {
  const obj = JSON.parse(line);
  const route = obj.custom_id || "/unknown";
  const content = obj.response?.body?.choices?.[0]?.message?.content || "⚠️ No content generated";
  const dir = path.join(OUT_DIR, route === "/" ? "_root" : route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.md"), `# ${route} Page\n\n_Last updated: ${new Date().toISOString()}_\n\n${content}\n`);
}
console.log(`📚 Wrote docs to ${OUT_DIR}`);
