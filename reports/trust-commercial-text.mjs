// trust-commercial 审计：把抓取的页面转成可读的纯文本（只读；输出到 reports/trust-commercial-text-<name>.txt）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const here = path.dirname(fileURLToPath(import.meta.url));
const names = process.argv.slice(2);
for (const name of names) {
  const html = fs.readFileSync(path.join(here, `trust-commercial-${name}.html`), "utf8");
  const doc = parse(html, { comment: false });
  doc.querySelectorAll("script, style, template").forEach((e) => e.remove());
  const main = doc.querySelector("main") ?? doc.querySelector("body");
  // 标出标题层级与链接，便于阅读
  for (const h of main.querySelectorAll("h1, h2, h3, h4")) {
    h.insertAdjacentHTML("afterbegin", `[${h.tagName}] `);
  }
  for (const a of main.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    const rel = a.getAttribute("rel");
    a.insertAdjacentHTML("beforeend", ` <${href}${rel ? ` rel=${rel}` : ""}>`);
  }
  const text = main.structuredText.replace(/\n{3,}/g, "\n\n");
  fs.writeFileSync(path.join(here, `trust-commercial-text-${name}.txt`), text, "utf8");
  console.log(`${name}: ${text.length} chars`);
}
