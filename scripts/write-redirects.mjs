// 构建前执行：把 data/redirects.json 写成 Cloudflare Pages / Netlify 风格的 public/_redirects，
// 使静态导出（无法使用 next.config 的 redirects）也能保持同一套 301 规则。
import fs from "node:fs";
import path from "node:path";

const rules = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "redirects.json"), "utf8"));
const lines = ["# 由 scripts/write-redirects.mjs 根据 data/redirects.json 生成，请勿手改", ""];
for (const r of rules) {
  const sources = r.from.endsWith("/") || r.from.includes(".") ? [r.from] : [r.from, `${r.from}/`];
  for (const s of sources) lines.push(`${s}  ${r.to}  301`);
}
const out = path.join(process.cwd(), "public", "_redirects");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${lines.join("\n")}\n`, "utf8");
console.log(`[redirects] 已生成 public/_redirects（${rules.length} 条规则）`);
