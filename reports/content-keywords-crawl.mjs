// content-keywords 审计用临时脚本：只读抓取本地 http://localhost:3100 的 sitemap 页面，提取 Title/Description/H1-H3/正文字数。
// 输出到 reports/content-keywords-pages.json（只写 reports/）。
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { parse } = require("node-html-parser");

const BASE = process.argv[2] || "http://localhost:3100";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "content-keywords-pages.json");

const hanRe = /[㐀-鿿豈-﫿]/g;
const hanCount = (s) => (s.match(hanRe) || []).length;

async function get(url) {
  const res = await fetch(url, { redirect: "manual" });
  const text = await res.text();
  return { status: res.status, location: res.headers.get("location"), text };
}

const sm = await get(`${BASE}/sitemap.xml`);
const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const lastmods = [...sm.text.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);

const pages = [];
for (let i = 0; i < locs.length; i++) {
  const loc = locs[i];
  const p = loc.replace(/^https:\/\/jichangxuan\.blog/, "");
  const r = await get(`${BASE}${p}`);
  const root = parse(r.text, { comment: false });
  const title = root.querySelector("title")?.text.trim() ?? null;
  const desc = root.querySelector('meta[name="description"]')?.getAttribute("content") ?? null;
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
  const robots = root.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null;
  const lang = root.querySelector("html")?.getAttribute("lang") ?? null;
  const h1 = root.querySelectorAll("h1").map((e) => e.text.replace(/\s+/g, " ").trim());
  const h2 = root.querySelectorAll("h2").map((e) => e.text.replace(/\s+/g, " ").trim());
  const h3 = root.querySelectorAll("h3").map((e) => e.text.replace(/\s+/g, " ").trim());
  const main = root.querySelector("main") ?? root.querySelector("body");
  // 去掉 script/style
  main?.querySelectorAll("script,style,noscript").forEach((n) => n.remove());
  const mainText = (main?.text ?? "").replace(/\s+/g, " ").trim();
  const ldTypes = [];
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const j = JSON.parse(s.text);
      const arr = Array.isArray(j) ? j : [j];
      for (const o of arr) ldTypes.push(o["@type"]);
    } catch {
      ldTypes.push("PARSE_ERROR");
    }
  }
  pages.push({
    loc,
    path: p,
    lastmod: lastmods[i],
    status: r.status,
    location: r.location,
    lang,
    title,
    titleLen: title ? [...title].length : 0,
    description: desc,
    descLen: desc ? [...desc].length : 0,
    canonical,
    robots,
    h1,
    h2,
    h3,
    mainHan: hanCount(mainText),
    ldTypes,
  });
}
fs.writeFileSync(OUT, JSON.stringify(pages, null, 2), "utf8");
console.log(`wrote ${pages.length} pages to ${OUT}`);
for (const pg of pages) {
  console.log(`${pg.status}\t${pg.path}\t[${pg.titleLen}] ${pg.title}\tH1=${JSON.stringify(pg.h1)}\tmainHan=${pg.mainHan}`);
}
