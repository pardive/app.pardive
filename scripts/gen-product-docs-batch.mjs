// Batch request generator for Product Docs using GPT-5
// Creates a JSONL file of requests and submits a batch job to OpenAI

import fs from "fs";
import path from "path";
import { globby } from "globby";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs/product-docs-batch");
fs.mkdirSync(OUT, { recursive: true });

const MODEL = process.env.PRODUCT_DOCS_MODEL || "gpt-5"; // ✅ GPT-5 by default

// collect Next.js page files
const files = await globby(["src/app/**/page.tsx", "src/pages/**/*.{tsx,ts,js,jsx}"], {
  gitignore: true,
});
const requests = [];

files.forEach((f) => {
  const code = fs.readFileSync(f, "utf8").slice(0, 4000); // truncate per page
  const route = f.replace(/^.*src\/app\//, "/").replace(/\/page\.tsx$/, "");
  requests.push({
    custom_id: route || "/",
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a senior technical writer. Summarize code into simple English product docs.",
        },
        {
          role: "user",
          content: `ROUTE: ${route}\nFILE: ${f}\nCODE:\n${code}`,
        },
      ],
    },
  });
});

// write JSONL input
const jsonl = requests.map((r) => JSON.stringify(r)).join("\n");
const inputFile = "batch-input.jsonl";
fs.writeFileSync(inputFile, jsonl);

// submit batch
const batch = await client.batches.create({
  input_file: fs.createReadStream(inputFile),
  endpoint: "/v1/chat/completions",
  completion_window: "24h", // job will complete within 24h
});

console.log("📤 Batch submitted:", batch.id);
console.log("Check status later with:");
console.log("  npm run docs:batch-status", batch.id);
