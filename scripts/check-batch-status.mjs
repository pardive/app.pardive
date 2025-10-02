// Check status of a submitted batch job and download results

import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const id = process.argv[2];
if (!id) throw new Error("Usage: npm run docs:batch-status <batch_id>");

const batch = await client.batches.retrieve(id);
console.log("Status:", batch.status);

if (batch.status === "completed") {
  const output = await client.files.content(batch.output_file_id);
  const text = await streamToString(output.body);
  fs.writeFileSync("batch-output.jsonl", text);
  console.log("✅ Results saved to batch-output.jsonl");
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
