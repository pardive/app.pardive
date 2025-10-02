// Parse batch-output.jsonl into docs/product-docs/ files

import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "docs/product-docs");
fs.mkdirSync(OUT, { recursive: true });

const lines = fs.readFileSync("batch-output.jsonl", "utf8").trim().split("\n");

lines.forEach((line) => {
  const obj = JSON.parse(line);
  const route = obj.custom_id || "unknown";
  const content =
    obj.response?.body?.choices?.[0]?.message?.content ||
    "⚠️ No content generated";

  const dir = path.join(OUT, route === "/" ? "_root" : route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.md"), `# ${route} Page\n\n${content}\n`);
});

console.log("✅ Parsed docs written to", OUT);
