#!/usr/bin/env node
/**
 * onpage-meta 审计辅助脚本（只读）：比较 /brands/<slug>/ 页面 <main> 内的文字块，
 * 把品牌名 / 英文名 / 别名 / 优惠码 / 数字替换成占位符后，统计每页“模板文字”（≥3 个品牌页共有）与“品牌独有文字”的汉字数。
 *   node reports/onpage-meta-brand-text.mjs [http://localhost:3100]
 * 只写 reports/onpage-meta-brand-text.json。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "node-html-parser";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.argv.slice(2).find((a) => /^https?:\/\//.test(a)) ?? "http://localhost:3100").replace(/\/+$/, "");
const brands = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "brands.json"), "utf8")).filter((b) => b.published && !b.hubPath);
const KEY = ["muguang-jiasu", "weifeng-wangluo", "feimaoyun", "flyv", "langwang", "yinxingren"];
const BLOCK = new Set(["p", "li", "td", "th", "dt", "dd", "h1", "h2", "h3", "h4", "h5", "h6", "caption", "blockquote", "figcaption", "summary", "a", "span", "div", "code", "strong"]);
const han = (s) => [...s].filter((c) => /\p{Script=Han}/u.test(c)).length;

function units(main) {
  // 删除页面目录 nav 与“相关阅读”（文章卡片），它们不是品牌页正文
  for (const n of main.querySelectorAll('nav[aria-label="页面目录"], section#related, script, style, svg')) n.remove();
  const map = new Map();
  const walk = (n, owner) => {
    if (n.nodeType === 3) {
      const t = n.text;
      if (t.trim()) map.set(owner, (map.get(owner) ?? "") + t);
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    const isLeafBlock = ["p", "li", "td", "th", "dt", "dd", "h1", "h2", "h3", "h4", "h5", "h6", "caption", "blockquote", "figcaption"].includes(tag);
    const nextOwner = isLeafBlock ? n : owner;
    for (const c of n.childNodes) walk(c, nextOwner);
  };
  walk(main, main);
  return [...map.values()].map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
}

function mask(s, b) {
  let x = s;
  const toks = [b.name, b.nameEn, ...(b.aliases ?? []), b.coupon?.code].filter(Boolean).sort((a, c) => c.length - a.length);
  for (const t of toks) x = x.split(t).join("〈B〉");
  return x.replace(/[0-9]+(\.[0-9]+)?/g, "#").replace(/\s+/g, "");
}

const pages = [];
for (const b of brands) {
  const res = await fetch(`${BASE}/brands/${b.slug}/`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" } });
  const html = await res.text();
  const root = parse(html, { comment: false });
  const main = root.querySelector("main");
  const u = units(main);
  pages.push({ slug: b.slug, name: b.name, status: res.status, units: u.map((t) => ({ t, m: mask(t, b) })) });
}

const freq = new Map();
for (const p of pages) for (const m of new Set(p.units.map((u) => u.m))) freq.set(m, (freq.get(m) ?? 0) + 1);

const rows = pages.map((p) => {
  let total = 0, tmpl = 0, uniq = 0;
  const tmplSamples = [];
  const seen = new Set();
  const dupWithinPage = [];
  for (const u of p.units) {
    if (seen.has(u.t)) {
      if (han(u.t) >= 15) dupWithinPage.push(u.t.slice(0, 40));
      continue; // 同一页重复出现的段落只计一次
    }
    seen.add(u.t);
    const h = han(u.t);
    total += h;
    if ((freq.get(u.m) ?? 0) >= 3) {
      tmpl += h;
      if (h >= 15 && tmplSamples.length < 6) tmplSamples.push(u.t.slice(0, 60));
    } else uniq += h;
  }
  return { slug: p.slug, key: KEY.includes(p.slug), status: p.status, mainHanExclNavRelated: total, templateHan: tmpl, brandSpecificHan: uniq, templateShare: Number((tmpl / Math.max(total, 1)).toFixed(2)), dupWithinPage, tmplSamples };
});

fs.writeFileSync(path.join(ROOT, "reports", "onpage-meta-brand-text.json"), JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), rows }, null, 2));
for (const r of rows) console.log([r.key ? "KEY" : "   ", r.slug.padEnd(16), "total", r.mainHanExclNavRelated, "template", r.templateHan, "specific", r.brandSpecificHan, "share", r.templateShare, "dupInPage", JSON.stringify(r.dupWithinPage)].join(" "));
console.log("template samples (first key page):");
for (const s of rows.find((r) => r.key).tmplSamples) console.log("  - " + s);
