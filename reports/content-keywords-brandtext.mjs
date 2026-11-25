// content-keywords 审计用临时脚本：只读抓取本地七个品牌页，按区块统计汉字数，并检测跨页面模板化句子。
// 输出 reports/content-keywords-brandtext.json（只写 reports/）。
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { parse } = require("node-html-parser");

const BASE = process.argv[2] || "http://localhost:3100";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "content-keywords-brandtext.json");
const brands = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "brands.json"), "utf8"));

const hanRe = /[㐀-鿿豈-﫿]/g;
const han = (s) => (s.match(hanRe) || []).length;
const norm = (s) => s.replace(/\s+/g, " ").trim();

const TARGETS = [
  { id: "lingdongyun", path: "/lingdongyun/" },
  { id: "muguang-jiasu", path: "/brands/muguang-jiasu/" },
  { id: "weifeng-wangluo", path: "/brands/weifeng-wangluo/" },
  { id: "feimaoyun", path: "/brands/feimaoyun/" },
  { id: "flyv", path: "/brands/flyv/" },
  { id: "langwang", path: "/brands/langwang/" },
  { id: "yinxingren", path: "/brands/yinxingren/" },
];

function textOf(node) {
  if (!node) return "";
  const clone = parse(node.toString());
  clone.querySelectorAll("script,style,noscript,svg").forEach((n) => n.remove());
  return norm(clone.text);
}

function stripTables(node) {
  const clone = parse(node.toString());
  clone.querySelectorAll("script,style,noscript,svg,table,dl,nav").forEach((n) => n.remove());
  return clone;
}

const result = [];
const sentenceIndex = new Map(); // normalized sentence -> Set(brandId)

for (const t of TARGETS) {
  const brand = brands.find((b) => b.id === t.id);
  const res = await fetch(BASE + t.path);
  const html = await res.text();
  const root = parse(html, { comment: false });
  const main = root.querySelector("main");
  const mainText = textOf(main);
  const header = main.querySelector("header");
  const sections = main.querySelectorAll("section").filter((s) => s.getAttribute("id") && !s.getAttribute("id").startsWith("brand-"));
  const sec = {};
  for (const s of sections) {
    const id = s.getAttribute("id");
    sec[id] = { hanAll: han(textOf(s)), hanNoTablesDl: han(norm(stripTables(s).text)) };
  }
  // header parts
  const headerClone = stripTables(header);
  const headerText = norm(headerClone.text);
  // tables & dl in main
  const tableHan = main.querySelectorAll("table").reduce((n, el) => n + han(textOf(el)), 0);
  const dlHan = main.querySelectorAll("dl").reduce((n, el) => n + han(textOf(el)), 0);
  const navHan = main.querySelectorAll("nav").reduce((n, el) => n + han(textOf(el)), 0);

  // 原创编辑正文（按数据源字段计）：tagline + summary（各计一次）
  const tagline = brand.tagline ?? "";
  const summary = brand.summary ?? "";
  const audiences = brand.audiences.join("");
  const occurrences = (needle) => (needle ? html.split(needle).length - 1 : 0);

  // 句子切分 + 品牌名归一，用于模板检测
  const nameVariants = [brand.name, brand.nameEn, ...(brand.aliases || []), brand.coupon?.code].filter(Boolean).sort((a, b) => b.length - a.length);
  const mainNoTables = norm(stripTables(main).text);
  let normalized = mainNoTables;
  for (const v of nameVariants) normalized = normalized.split(v).join("〔品牌〕");
  normalized = normalized.replace(/\d{4}-\d{2}-\d{2}|\d{4} 年 \d{1,2} 月 \d{1,2} 日/g, "〔日期〕").replace(/\d+/g, "〔数〕");
  const sentences = normalized
    .split(/[。；！？\n]/)
    .map((s) => s.trim())
    .filter((s) => han(s) >= 8);
  const uniq = [...new Set(sentences)];
  for (const s of uniq) {
    if (!sentenceIndex.has(s)) sentenceIndex.set(s, new Set());
    sentenceIndex.get(s).add(t.id);
  }

  result.push({
    id: t.id,
    path: t.path,
    status: res.status,
    mainHan: han(mainText),
    headerHanNoNav: han(headerText),
    tableHan,
    dlHan,
    navHan,
    sections: sec,
    taglineHan: han(tagline),
    summaryHan: han(summary),
    audiencesHan: han(audiences),
    summaryOccurrencesInHtml: occurrences(summary.slice(0, 30)),
    sentenceCount: uniq.length,
    _sentences: uniq,
  });
}

// 模板句：出现在 ≥2 个 /brands/ 页（排除 lingdongyun 专题）
const brandIds = TARGETS.filter((t) => t.id !== "lingdongyun").map((t) => t.id);
const templateSentences = [...sentenceIndex.entries()]
  .filter(([, set]) => [...set].filter((id) => brandIds.includes(id)).length >= 2)
  .map(([s, set]) => ({ s, pages: [...set] }))
  .sort((a, b) => b.pages.length - a.pages.length);

for (const r of result) {
  const tmplHan = r._sentences
    .filter((s) => templateSentences.some((t) => t.s === s && t.pages.filter((p) => brandIds.includes(p)).length >= 2))
    .reduce((n, s) => n + han(s), 0);
  const uniqueHan = r._sentences
    .filter((s) => !templateSentences.some((t) => t.s === s))
    .reduce((n, s) => n + han(s), 0);
  r.templateSentenceHan = tmplHan;
  r.pageUniqueSentenceHan = uniqueHan;
  r.pageUniqueSentences = r._sentences.filter((s) => !templateSentences.some((t) => t.s === s));
  delete r._sentences;
}

fs.writeFileSync(OUT, JSON.stringify({ result, templateSentences }, null, 2), "utf8");
for (const r of result) {
  console.log(
    `${r.path}\tstatus=${r.status}\tmainHan=${r.mainHan}\ttable=${r.tableHan}\tdl=${r.dlHan}\tnav=${r.navHan}\ttagline=${r.taglineHan}\tsummary=${r.summaryHan}(x${r.summaryOccurrencesInHtml})\taudiences=${r.audiencesHan}\ttemplateHan=${r.templateSentenceHan}\tuniqueSentHan=${r.pageUniqueSentenceHan}`,
  );
  console.log("   sections:", JSON.stringify(r.sections));
}
console.log(`template sentences shared by >=2 brand pages: ${templateSentences.length}`);
for (const t of templateSentences.slice(0, 60)) console.log(`[${t.pages.length}] ${t.s.slice(0, 120)}`);
