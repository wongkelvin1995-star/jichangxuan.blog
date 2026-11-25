// content-keywords 审计用临时脚本：比较文章正文（<article> 内 .prose 或 article，去 nav/aside/script）汉字 6-gram 相似度（只读）。
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parse } = require("node-html-parser");
const BASE = "http://localhost:3100";

async function bodyText(p) {
  const html = await (await fetch(BASE + p)).text();
  const doc = parse(html);
  const art = doc.querySelector("article") ?? doc.querySelector("main");
  art.querySelectorAll("script,style,noscript,svg,nav,aside,header,footer").forEach((n) => n.remove());
  return art.text.replace(/\s+/g, "");
}
const N = 6;
const sh = (t) => {
  const s = new Set();
  const c = [...t];
  for (let i = 0; i + N <= c.length; i++) s.add(c.slice(i, i + N).join(""));
  return s;
};
function stats(a, b) {
  const A = sh(a), B = sh(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return { jaccard: +(inter / (A.size + B.size - inter)).toFixed(3), aInB: +(inter / A.size).toFixed(3), bInA: +(inter / B.size).toFixed(3), aLen: [...a].length, bLen: [...b].length };
}
const pairs = [
  ["/guides/windows-client-setup/", "/guides/clash-verge-rev-guide/"],
  ["/guides/tun-vs-system-proxy/", "/guides/clash-verge-rev-guide/"],
  ["/guides/dns-and-connection-troubleshooting/", "/guides/tun-vs-system-proxy/"],
  ["/guides/android-client-setup/", "/guides/ios-client-setup/"],
  ["/lingdongyun/lingdongyun-client-guide/", "/guides/windows-client-setup/"],
  ["/lingdongyun/lingdongyun-introduction/", "/lingdongyun/lingdongyun-plans-and-policies/"],
  ["/lingdongyun/lingdongyun-plans-and-policies/", "/compare/lingdongyun-plans-compared/"],
  ["/lingdongyun/lingdongyun-introduction/", "/reviews/lingdongyun-review-2026/"],
  ["/recommend/how-to-choose-an-airport-2026/", "/compare/how-to-read-airport-plans/"],
  ["/speedtest/node-regions-explained/", "/speedtest/lingdongyun-2026-11-01-node-unlock-check/"],
];
for (const [a, b] of pairs) console.log(`${a} vs ${b}\t${JSON.stringify(stats(await bodyText(a), await bodyText(b)))}`);
