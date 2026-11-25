// content-keywords 审计用临时脚本：统计 content/*.mdx 正文汉字数（不含 frontmatter、表格行、代码块、组件标签）与 H2/H3 数（只读）。
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "content");
const han = (s) => (s.match(/[㐀-鿿豈-﫿]/g) || []).length;

for (const cat of fs.readdirSync(root)) {
  for (const f of fs.readdirSync(path.join(root, cat))) {
    if (!f.endsWith(".mdx")) continue;
    const raw = fs.readFileSync(path.join(root, cat, f), "utf8");
    const { data, content } = matter(raw);
    const noCode = content.replace(/```[\s\S]*?```/g, "");
    const lines = noCode.split("\n");
    const tableLines = lines.filter((l) => /^\s*\|/.test(l));
    const proseLines = lines.filter((l) => !/^\s*\|/.test(l) && !/^\s*</.test(l));
    const h2 = lines.filter((l) => /^##\s/.test(l)).length;
    const h3 = lines.filter((l) => /^###\s/.test(l)).length;
    const links = (content.match(/\]\((\/[^)]+)\)/g) || []).map((m) => m.slice(2, -1));
    const faqHan = (data.faq || []).reduce((n, x) => n + han(x.q + x.a), 0);
    console.log(
      [
        `${cat}/${data.slug}`,
        `draft=${data.draft}`,
        `bodyHan=${han(noCode)}`,
        `proseHan=${han(proseLines.join("\n"))}`,
        `tableHan=${han(tableLines.join("\n"))}`,
        `faqHan=${faqHan}`,
        `h2=${h2}`,
        `h3=${h3}`,
        `inBodyLinks=${links.length}`,
        `links=${[...new Set(links)].join(",")}`,
      ].join("\t"),
    );
  }
}
