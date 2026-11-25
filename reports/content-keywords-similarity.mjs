// content-keywords 审计用临时脚本：只读抓取本地页面，计算正文（main，去 script/style/nav）汉字 6-gram 相似度。
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { parse } = require("node-html-parser");
const BASE = process.argv[2] || "http://localhost:3100";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const brands = JSON.parse(fs.readFileSync(path.join(root, "data", "brands.json"), "utf8"));

async function mainText(p, { normalizeBrand } = {}) {
  const html = await (await fetch(BASE + p)).text();
  const doc = parse(html);
  const main = doc.querySelector("main");
  main.querySelectorAll("script,style,noscript,svg,nav").forEach((n) => n.remove());
  let t = main.text.replace(/\s+/g, "");
  if (normalizeBrand) {
    const b = brands.find((x) => x.id === normalizeBrand);
    const vs = [b.name, b.nameEn, ...(b.aliases || []), b.coupon?.code].filter(Boolean).sort((a, c) => c.length - a.length);
    for (const v of vs) t = t.split(v.replace(/\s+/g, "")).join("Ｂ");
    t = t.replace(/[0-9.]+/g, "Ｎ");
  }
  return t;
}
const N = 6;
function shingles(t) {
  const s = new Set();
  const chars = [...t];
  for (let i = 0; i + N <= chars.length; i++) s.add(chars.slice(i, i + N).join(""));
  return s;
}
function stats(a, b) {
  const A = shingles(a);
  const B = shingles(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return { jaccard: +(inter / (A.size + B.size - inter)).toFixed(3), aInB: +(inter / A.size).toFixed(3), bInA: +(inter / B.size).toFixed(3) };
}

const pairs = [
  ["/recommend/", "/brands/"],
  ["/", "/recommend/"],
  ["/", "/brands/"],
  ["/lingdongyun/", "/lingdongyun/lingdongyun-introduction/"],
  ["/lingdongyun/", "/lingdongyun/lingdongyun-plans-and-policies/"],
  ["/lingdongyun/", "/compare/lingdongyun-plans-compared/"],
  ["/lingdongyun/", "/reviews/lingdongyun-review-2026/"],
  ["/lingdongyun/lingdongyun-introduction/", "/reviews/lingdongyun-review-2026/"],
  ["/lingdongyun/lingdongyun-plans-and-policies/", "/compare/lingdongyun-plans-compared/"],
  ["/compare/", "/compare/how-to-read-airport-plans/"],
];
for (const [a, b] of pairs) {
  const s = stats(await mainText(a), await mainText(b));
  console.log(`${a}  vs  ${b}\t${JSON.stringify(s)}`);
}

const six = ["muguang-jiasu", "weifeng-wangluo", "feimaoyun", "flyv", "langwang", "yinxingren"];
const texts = {};
for (const id of six) texts[id] = await mainText(`/brands/${id}/`, { normalizeBrand: id });
console.log("--- six brand pages, brand names/codes/numbers normalized ---");
const js = [];
for (let i = 0; i < six.length; i++)
  for (let j = i + 1; j < six.length; j++) {
    const s = stats(texts[six[i]], texts[six[j]]);
    js.push(s.jaccard);
    console.log(`${six[i]} vs ${six[j]}\t${JSON.stringify(s)}`);
  }
console.log(`jaccard min=${Math.min(...js)} max=${Math.max(...js)} avg=${(js.reduce((a, b) => a + b, 0) / js.length).toFixed(3)}`);
