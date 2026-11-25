#!/usr/bin/env node
/**
 * onpage-meta 审计脚本（只读）：抓取本地生产服务器上的 sitemap 全部 URL + /search/ + /tags/ + 3 个标签页，
 * 提取 title / meta description / H1-H6 顺序 / canonical / og:* / html lang / meta robots，并做统计分析。
 *   node reports/onpage-meta-extract.mjs [http://localhost:3100]
 * 只写 reports/onpage-meta-pages.json 与 reports/onpage-meta-summary.json。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "node-html-parser";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.argv.slice(2).find((a) => /^https?:\/\//.test(a)) ?? "http://localhost:3100").replace(/\/+$/, "");
const SITE = "https://jichangxuan.blog";
const OUT_PAGES = path.join(ROOT, "reports", "onpage-meta-pages.json");
const OUT_SUMMARY = path.join(ROOT, "reports", "onpage-meta-summary.json");
const UA_BING = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const UA_BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const EXTRA_PATHS = ["/search/", "/tags/", "/tags/灵动云/", "/tags/套餐/", "/tags/Clash Verge Rev/"];

// ---------- helpers ----------
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const cps = (s) => [...(s ?? "")];
const WIDE_RE = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦\u{20000}-\u{3FFFD}]/u;
function lenStats(s) {
  const arr = cps(s);
  const han = arr.filter((c) => /\p{Script=Han}/u.test(c)).length;
  const wide = arr.filter((c) => WIDE_RE.test(c)).length;
  return { len: arr.length, han, wide, displayWidth: wide * 2 + (arr.length - wide) };
}
function bigrams(s) {
  const t = cps((s ?? "").replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase());
  const m = new Map();
  for (let i = 0; i < t.length - 1; i++) {
    const g = t[i] + t[i + 1];
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}
function dice(a, b) {
  const A = bigrams(a), B = bigrams(b);
  let inter = 0, sa = 0, sb = 0;
  for (const v of A.values()) sa += v;
  for (const v of B.values()) sb += v;
  for (const [g, v] of A) if (B.has(g)) inter += Math.min(v, B.get(g));
  return sa + sb ? (2 * inter) / (sa + sb) : 0;
}
function containment(a, b) {
  const A = bigrams(a), B = bigrams(b);
  let inter = 0, sa = 0;
  for (const [g, v] of A) {
    sa += v;
    if (B.has(g)) inter += Math.min(v, B.get(g));
  }
  return sa ? inter / sa : 0;
}
function charDiff(a, b) {
  const A = cps(a), B = cps(b);
  const n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let cur = null;
  const push = (type, ch) => {
    if (cur && cur.type === type) cur.s += ch;
    else {
      cur = { type, s: ch };
      out.push(cur);
    }
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      push("=", A[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) push("-", A[i++]);
    else push("+", B[j++]);
  }
  while (i < n) push("-", A[i++]);
  while (j < m) push("+", B[j++]);
  return {
    identical: a === b,
    commonChars: dp[0][0],
    currentLen: n,
    requiredLen: m,
    rendered: out.map((s) => (s.type === "=" ? s.s : s.type === "-" ? `[-${s.s}-]` : `{+${s.s}+}`)).join(""),
  };
}

async function get(url, ua) {
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml" } });
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: Object.fromEntries(res.headers), text: buf.toString("utf8") };
  } catch (e) {
    return { status: 0, headers: {}, text: "", error: String(e) };
  }
}

function ancestors(el) {
  const list = [];
  let p = el.parentNode;
  while (p && p.tagName) {
    list.push(p);
    p = p.parentNode;
  }
  return list;
}

/** sep === "" 时等价于 textContent（不裁剪单个文本节点，只在最后折叠空白）；sep = " " 时在文本节点之间补空格 */
function textOf(el, sep = "") {
  const parts = [];
  const walk = (n) => {
    if (n.nodeType === 3) {
      const t = n.text;
      if (t) parts.push(t);
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = (n.tagName || "").toLowerCase();
    if (["script", "style", "noscript", "template", "svg"].includes(tag)) return;
    for (const c of n.childNodes) walk(c);
  };
  walk(el);
  return sep === null ? parts : parts.join(sep);
}

/** 标题内的子元素（如 <span>英文名</span>）与前面文字之间没有任何空白：textContent 会把两段粘在一起 */
function gluedSpans(el) {
  const out = [];
  const kids = el.childNodes;
  for (let i = 1; i < kids.length; i++) {
    const cur = kids[i];
    if (cur.nodeType !== 1 || ["svg", "script", "style"].includes(cur.tagName.toLowerCase())) continue;
    // 找前一个有文字的兄弟
    let j = i - 1;
    let prevText = "";
    while (j >= 0) {
      const k = kids[j];
      if (k.nodeType === 3 || (k.nodeType === 1 && !["svg", "script", "style"].includes(k.tagName.toLowerCase()))) {
        prevText = textOf(k, "");
        if (prevText.length) break;
      }
      j--;
    }
    const curText = textOf(cur, "");
    if (prevText && curText && !/\s$/.test(prevText) && !/^\s/.test(curText)) out.push(`${prevText.slice(-6)}‖${curText.slice(0, 12)}`);
  }
  return out;
}

function hiddenFlags(el) {
  const flags = [];
  for (const a of [el, ...ancestors(el)]) {
    const cls = ` ${a.getAttribute?.("class") ?? ""} `;
    if (a.hasAttribute?.("hidden")) flags.push(`${a.tagName.toLowerCase()}[hidden]`);
    if (a.getAttribute?.("aria-hidden") === "true") flags.push(`${a.tagName.toLowerCase()}[aria-hidden]`);
    if (/ sr-only /.test(cls)) flags.push(`${a.tagName.toLowerCase()}.sr-only`);
    if (/ hidden /.test(cls)) flags.push(`${a.tagName.toLowerCase()}.hidden(${norm(cls).split(" ").filter((c) => /hidden|block|flex|grid/.test(c)).join(" ")})`);
    if (a.tagName?.toLowerCase() === "details") flags.push("in-details");
  }
  return flags;
}

function headingContext(el) {
  const anc = ancestors(el).map((a) => a.tagName.toLowerCase());
  const region = anc.includes("footer") && !anc.includes("main") ? "site-footer" : anc.includes("main") ? "main" : anc.includes("header") ? "site-header" : "other";
  const landmarks = [];
  for (const a of ancestors(el)) {
    const t = a.tagName.toLowerCase();
    if (["nav", "aside", "footer", "header", "article", "section", "details"].includes(t)) {
      landmarks.push(t + (a.getAttribute("aria-label") ? `[${a.getAttribute("aria-label")}]` : a.getAttribute("id") ? `#${a.getAttribute("id")}` : ""));
    }
    if (t === "main") break;
  }
  return { region, landmarks: landmarks.reverse() };
}

function walkElements(root, fn) {
  const stack = [root];
  // depth-first, document order
  const visit = (n) => {
    if (n.nodeType !== 1) return;
    fn(n);
    for (const c of n.childNodes) visit(c);
  };
  visit(root);
}

function extract(html, reqPath, headers) {
  const root = parse(html, { comment: false, blockTextElements: { script: true, noscript: true, style: true, pre: true } });
  const htmlEl = root.querySelector("html");
  const head = root.querySelector("head");
  const allTitles = root.querySelectorAll("title").filter((t) => !ancestors(t).some((a) => a.tagName.toLowerCase() === "svg"));
  const titleInHead = allTitles.filter((t) => ancestors(t).some((a) => a.tagName.toLowerCase() === "head"));
  const metaAll = (sel) => root.querySelectorAll(sel).map((m) => ({ content: m.getAttribute("content"), inHead: ancestors(m).some((a) => a.tagName.toLowerCase() === "head") }));
  const desc = metaAll('meta[name="description"]');
  const robots = metaAll('meta[name="robots"]');
  const bingbot = metaAll('meta[name="bingbot"]');
  const googlebot = metaAll('meta[name="googlebot"]');
  const canon = root.querySelectorAll('link[rel="canonical"]').map((l) => l.getAttribute("href"));
  const og = {};
  for (const m of root.querySelectorAll("meta[property]")) {
    const p = m.getAttribute("property");
    if (/^og:/.test(p)) (og[p] ??= []).push(m.getAttribute("content"));
  }
  const tw = {};
  for (const m of root.querySelectorAll("meta[name]")) {
    const p = m.getAttribute("name");
    if (/^twitter:/.test(p)) (tw[p] ??= []).push(m.getAttribute("content"));
  }
  const appName = root.querySelector('meta[name="application-name"]')?.getAttribute("content") ?? null;

  const headings = [];
  walkElements(root, (n) => {
    const t = n.tagName?.toLowerCase();
    if (/^h[1-6]$/.test(t)) {
      const ctx = headingContext(n);
      headings.push({
        level: Number(t[1]),
        text: norm(textOf(n, "")),
        textSpaced: norm(textOf(n, " ")),
        id: n.getAttribute("id") ?? null,
        region: ctx.region,
        landmarks: ctx.landmarks.join(" > "),
        onlyLink: n.querySelectorAll("a").length > 0 && norm(n.querySelectorAll("a").map((a) => textOf(a, "")).join("")) === norm(textOf(n, "")),
        glued: gluedSpans(n.querySelector("a") && norm(textOf(n.querySelector("a"), "")) && n.childNodes.length === 1 ? n.querySelector("a") : n),
        hidden: hiddenFlags(n),
      });
    }
  });

  // H1 下方第一个 <p>（首页副标题）
  let h1Next = null;
  const h1El = root.querySelector("h1");
  if (h1El) {
    let s = h1El.nextElementSibling;
    while (s && s.tagName.toLowerCase() !== "p") s = s.nextElementSibling;
    h1Next = s ? norm(textOf(s, "")) : null;
  }

  // 面包屑
  const bc = root.querySelector('nav[aria-label="面包屑"]');
  const breadcrumb = bc
    ? bc.querySelectorAll("li").map((li) => {
        const a = li.querySelector("a");
        return { text: norm(textOf(li, "")), href: a ? a.getAttribute("href") : null };
      })
    : null;

  // main 正文汉字数（排除 script/style/svg）
  const main = root.querySelector("main");
  const mainText = main ? textOf(main, "") : "";
  const mainHan = cps(mainText).filter((c) => /\p{Script=Han}/u.test(c)).length;
  const times = main ? main.querySelectorAll("time").map((t) => ({ datetime: t.getAttribute("datetime"), text: norm(t.text) })) : [];

  // JSON-LD 类型（仅记录类型，结构化数据不在本审计范围）
  const ldTypes = [];
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const j = JSON.parse(s.rawText || s.text);
      for (const x of Array.isArray(j) ? j : [j]) ldTypes.push(x?.["@type"]);
    } catch {
      ldTypes.push("PARSE_ERROR");
    }
  }

  const titleText = allTitles[0] ? norm(allTitles[0].text) : null;
  return {
    lang: htmlEl?.getAttribute("lang") ?? null,
    titleCount: allTitles.length,
    titleInHeadCount: titleInHead.length,
    title: titleText,
    titleAll: allTitles.map((t) => norm(t.text)),
    titleOffset: { titleIdx: html.indexOf("<title"), headCloseIdx: html.indexOf("</head>") },
    description: desc[0]?.content ?? null,
    descriptionCount: desc.length,
    descriptionInHead: desc.every((d) => d.inHead),
    canonical: canon,
    robots: robots.map((r) => r.content),
    bingbot: bingbot.map((r) => r.content),
    googlebot: googlebot.map((r) => r.content),
    xRobotsTag: headers["x-robots-tag"] ?? null,
    og,
    twitter: tw,
    applicationName: appName,
    headings,
    h1Next,
    breadcrumb,
    mainHan,
    times,
    ldTypes,
  };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

// ---------- main ----------
const sm = await get(`${BASE}/sitemap.xml`, UA_BING);
const sitemapEntries = [...sm.text.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: /<loc>(.*?)<\/loc>/.exec(m[1])?.[1]?.trim(),
  lastmod: /<lastmod>(.*?)<\/lastmod>/.exec(m[1])?.[1]?.trim(),
}));
const targets = [
  ...sitemapEntries.map((e) => ({ path: decodeURI(new URL(e.loc).pathname), inSitemap: true, lastmod: e.lastmod })),
  ...EXTRA_PATHS.map((p) => ({ path: p, inSitemap: false })),
];

const pages = await pool(targets, 4, async (t) => {
  const url = BASE + encodeURI(t.path);
  const bing = await get(url, UA_BING);
  const browser = await get(url, UA_BROWSER);
  const data = bing.status === 200 ? extract(bing.text, t.path, bing.headers) : null;
  const dataBrowser = browser.status === 200 ? extract(browser.text, t.path, browser.headers) : null;
  return {
    path: t.path,
    url,
    inSitemap: t.inSitemap,
    lastmod: t.lastmod ?? null,
    status: bing.status,
    statusBrowser: browser.status,
    location: bing.headers.location ?? null,
    bytes: bing.text.length,
    ...data,
    browserView: dataBrowser
      ? {
          title: dataBrowser.title,
          titleInHeadCount: dataBrowser.titleInHeadCount,
          titleCount: dataBrowser.titleCount,
          titleOffset: dataBrowser.titleOffset,
          description: dataBrowser.description,
          descriptionInHead: dataBrowser.descriptionInHead,
          sameHeadings: JSON.stringify(dataBrowser.headings.map((h) => [h.level, h.text])) === JSON.stringify((data?.headings ?? []).map((h) => [h.level, h.text])),
        }
      : null,
  };
});

fs.writeFileSync(OUT_PAGES, JSON.stringify({ base: BASE, fetchedAt: new Date().toISOString(), sitemapCount: sitemapEntries.length, pages }, null, 2));

// ---------- analysis ----------
const brandsJson = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "brands.json"), "utf8"));
const SUFFIX_RE = /｜机场选$/;
const core = (t) => (t ?? "").replace(SUFFIX_RE, "").replace(/ - 机场优选$/, "");

const ok = pages.filter((p) => p.status === 200);
const indexable = ok.filter((p) => !(p.robots ?? []).some((r) => /noindex/i.test(r)));

// Title
const titleRows = ok.map((p) => ({ path: p.path, title: p.title, ...lenStats(p.title), suffix: SUFFIX_RE.test(p.title ?? "") ? "｜机场选" : / - 机场优选$/.test(p.title ?? "") ? " - 机场优选" : "(无后缀)", noindex: !indexable.includes(p) }));
const overlongTitles = titleRows.filter((r) => r.han > 32 || r.len > 60 || r.displayWidth > 64);
const titleDupMap = new Map();
for (const r of titleRows) titleDupMap.set(r.title, [...(titleDupMap.get(r.title) ?? []), r.path]);
const dupTitles = [...titleDupMap].filter(([, v]) => v.length > 1).map(([t, v]) => ({ title: t, paths: v }));
const KW = ["机场", "套餐", "推荐", "灵动云", "节点", "教程", "客户端", "优惠码", "测评", "比较", "价格"];
const stuffing = titleRows
  .map((r) => {
    const c = core(r.title);
    const counts = Object.fromEntries(KW.map((k) => [k, (c.match(new RegExp(k, "g")) ?? []).length]).filter(([, v]) => v >= 2));
    const listItems = c.split(/[、，,／/]/).length;
    return { path: r.path, title: r.title, repeated: counts, listSeparators: listItems - 1 };
  })
  .filter((x) => Object.keys(x.repeated).length || x.listSeparators >= 3);

// Description
const descRows = ok.map((p) => ({
  path: p.path,
  description: p.description,
  ...lenStats(p.description),
  count: p.descriptionCount,
  simToTitle: Number(dice(core(p.title), p.description ?? "").toFixed(2)),
  titleInDesc: Number(containment(core(p.title), p.description ?? "").toFixed(2)),
  noindex: !indexable.includes(p),
  hasOldName: /机场选/.test(p.description ?? ""),
}));
const descDupMap = new Map();
for (const r of descRows) descDupMap.set(r.description, [...(descDupMap.get(r.description) ?? []), r.path]);
const dupDescs = [...descDupMap].filter(([, v]) => v.length > 1).map(([d, v]) => ({ description: d, paths: v }));
const shortDescs = descRows.filter((r) => r.len < 50);
const longDescs = descRows.filter((r) => r.len > 160);
const missingDescs = descRows.filter((r) => !r.description);
const descLikeTitle = descRows.filter((r) => r.simToTitle >= 0.6 || (r.titleInDesc >= 0.9 && r.len < 2 * lenStats(core(ok.find((p) => p.path === r.path).title)).len));

// near-duplicate descriptions (template)
const nearDup = [];
for (let i = 0; i < descRows.length; i++)
  for (let j = i + 1; j < descRows.length; j++) {
    const s = dice(descRows[i].description ?? "", descRows[j].description ?? "");
    if (s >= 0.7 && descRows[i].description !== descRows[j].description) nearDup.push({ a: descRows[i].path, b: descRows[j].path, sim: Number(s.toFixed(2)) });
  }

// H1
const h1Rows = ok.map((p) => {
  const h1s = p.headings.filter((h) => h.level === 1);
  return {
    path: p.path,
    count: h1s.length,
    h1: h1s.map((h) => h.text),
    h1Spaced: h1s.map((h) => h.textSpaced),
    title: p.title,
    simToTitle: h1s.length ? Number(dice(h1s[0].text, core(p.title)).toFixed(2)) : 0,
    h1InTitle: h1s.length ? Number(containment(h1s[0].text, core(p.title)).toFixed(2)) : 0,
  };
});
const h1NotOne = h1Rows.filter((r) => r.count !== 1);
const h1Mismatch = h1Rows.filter((r) => r.count >= 1 && r.simToTitle < 0.35 && r.h1InTitle < 0.6);
const gluedHeadings = ok.flatMap((p) => p.headings.filter((h) => h.glued.length && h.region === "main").map((h) => ({ path: p.path, level: h.level, text: h.text, glued: h.glued })));
const h1Concat = gluedHeadings.filter((g) => g.level === 1);

// 改名后标题长度预测（后缀 ｜机场选 → " - 机场优选" 或 "｜机场优选"）
const projected = titleRows
  .filter((r) => r.suffix === "｜机场选")
  .map((r) => {
    const a = r.title.replace(SUFFIX_RE, " - 机场优选");
    const b = r.title.replace(SUFFIX_RE, "｜机场优选");
    return { path: r.path, now: r.displayWidth, dash: lenStats(a).displayWidth, bar: lenStats(b).displayWidth };
  });
const projectedOver = { dash: projected.filter((x) => x.dash > 64).length, bar: projected.filter((x) => x.bar > 64).length, now: titleRows.filter((r) => r.displayWidth > 64).length };

// Heading hierarchy
const hierarchy = ok.map((p) => {
  const hs = p.headings;
  const issues = [];
  const firstH1 = hs.findIndex((h) => h.level === 1);
  if (firstH1 > 0) issues.push({ type: "heading-before-h1", detail: hs.slice(0, firstH1).map((h) => `H${h.level} ${h.text}`) });
  let seenH2 = false;
  let prev = 0;
  for (let i = 0; i < hs.length; i++) {
    const h = hs[i];
    if (h.level === 2) seenH2 = true;
    if (i > firstH1 && h.level === 3 && !seenH2) issues.push({ type: "h3-before-any-h2", detail: `H3 ${h.text}` });
    if (prev && h.level > prev + 1) issues.push({ type: "skip", detail: `H${prev} → H${h.level} ${h.text}`, region: h.region, landmarks: h.landmarks });
    if (!h.text) issues.push({ type: "empty-heading", detail: `H${h.level}`, region: h.region });
    if (h.hidden.length) issues.push({ type: "hidden-heading", detail: `H${h.level} ${h.text} :: ${h.hidden.join(",")}` });
    prev = h.level;
  }
  const h2Texts = hs.filter((h) => h.level === 2).map((h) => h.text);
  const dupH2 = [...new Set(h2Texts.filter((t, i) => h2Texts.indexOf(t) !== i))];
  if (dupH2.length) issues.push({ type: "duplicate-h2", detail: dupH2 });
  const h3Texts = hs.filter((h) => h.level === 3).map((h) => h.text);
  const dupH3 = [...new Set(h3Texts.filter((t, i) => h3Texts.indexOf(t) !== i))];
  if (dupH3.length) issues.push({ type: "duplicate-h3", detail: dupH3 });
  const footerHeadings = hs.filter((h) => h.region === "site-footer").map((h) => `H${h.level} ${h.text}`);
  const counts = [1, 2, 3, 4, 5, 6].map((l) => hs.filter((h) => h.level === l).length);
  return { path: p.path, counts, issues, footerHeadings };
});

// Homepage vs directive
const home = ok.find((p) => p.path === "/");
const REQ = {
  title: "2026机场推荐排行榜｜灵动云、暮光加速等7家机场套餐对比 - 机场优选",
  h1: "2026 机场推荐排行榜｜精选机场与套餐对比",
  description: "机场优选提供2026机场推荐与套餐对比指南，重点介绍灵动云、暮光加速、微风网络、飞猫云、FLYV、浪网及隐形人，涵盖套餐价格、节点线路、AI工具与流媒体使用场景、客户端兼容及新手教程。",
  canonical: "https://jichangxuan.blog/",
  lang: "zh-CN",
  h2: [
    "2026 年热门机场推荐概览",
    "灵动云机场介绍、套餐与使用体验",
    "2026 热门机场推荐排行榜",
    "七家热门机场套餐价格比较",
    "不同网络使用需求如何选择机场",
    "机场客户端与订阅使用教程",
    "机场购买与使用常见问题",
    "最新机场测评与原创文章",
    "关于机场优选及内容更新说明",
  ],
  rankH3: ["第一名 灵动云", "第二名 暮光加速", "第三名 微风网络 Breezenet", "第四名 飞猫云", "第五名 FLYV 飞V", "第六名 浪网 WaveNet", "第七名 隐形人"],
};
const squash = (s) => (s ?? "").replace(/\s+/g, "");
let homeCheck = null;
if (home) {
  const h2s = home.headings.filter((h) => h.level === 2 && h.region === "main").map((h) => h.text);
  const h3s = home.headings.filter((h) => h.level === 3 && h.region === "main").map((h) => h.text);
  const match = (req, list) => {
    const exact = list.find((x) => squash(x) === squash(req));
    if (exact) return { req, status: "exact", actual: exact };
    let best = null, bs = 0;
    for (const x of list) {
      const s = dice(req, x);
      if (s > bs) (bs = s), (best = x);
    }
    return { req, status: bs >= 0.5 ? "similar" : "missing", closest: best, sim: Number(bs.toFixed(2)) };
  };
  homeCheck = {
    title: { current: home.title, required: REQ.title, currentStats: lenStats(home.title), requiredStats: lenStats(REQ.title), diff: charDiff(home.title, REQ.title) },
    h1: { current: home.headings.filter((h) => h.level === 1).map((h) => h.text), required: REQ.h1, diff: charDiff(home.headings.find((h) => h.level === 1)?.text ?? "", REQ.h1) },
    subtitle: { current: home.h1Next },
    description: { current: home.description, required: REQ.description, currentStats: lenStats(home.description), requiredStats: lenStats(REQ.description), diff: charDiff(home.description ?? "", REQ.description) },
    canonical: { current: home.canonical, ok: home.canonical.length === 1 && home.canonical[0] === REQ.canonical },
    lang: { current: home.lang, ok: home.lang === REQ.lang },
    ogTitle: home.og["og:title"],
    ogSiteName: home.og["og:site_name"],
    ogUrl: home.og["og:url"],
    applicationName: home.applicationName,
    h2Actual: h2s,
    h3Actual: h3s,
    h2Required: REQ.h2.map((r) => match(r, h2s)),
    rankH3Required: REQ.rankH3.map((r) => match(r, h3s)),
  };
}

// Brand pages
const brandPaths = ok.filter((p) => p.path === "/lingdongyun/" || /^\/brands\/[^/]+\/$/.test(p.path));
const KEY = ["lingdongyun", "muguang-jiasu", "weifeng-wangluo", "feimaoyun", "flyv", "langwang", "yinxingren"];
const brandRows = brandPaths.map((p) => {
  const slug = p.path === "/lingdongyun/" ? "lingdongyun" : p.path.split("/")[2];
  const b = brandsJson.find((x) => x.slug === slug);
  const t = p.title ?? "";
  const h1 = p.headings.filter((h) => h.level === 1);
  const intents = {
    "怎么样/评测": /怎么样|测评|评测|好不好|靠谱/.test(t),
    "套餐/价格": /套餐|价格/.test(t),
    "使用指南/教程": /指南|教程|使用/.test(t),
    "机场": /机场/.test(t),
  };
  const h1Intents = { 机场: /机场/.test(h1[0]?.text ?? ""), "怎么样/套餐/指南": /怎么样|套餐|指南|教程|测评|评测/.test(h1[0]?.text ?? "") };
  return {
    slug,
    key: KEY.includes(slug),
    name: b?.name,
    nameEn: b?.nameEn,
    path: p.path,
    title: t,
    titleStats: lenStats(t),
    titleIntents: intents,
    description: p.description,
    descStats: lenStats(p.description),
    h1: h1.map((h) => h.text),
    h1Spaced: h1.map((h) => h.textSpaced),
    h1Intents,
    h2: p.headings.filter((h) => h.level === 2 && h.region === "main").map((h) => h.text),
    h3: p.headings.filter((h) => h.level === 3 && h.region === "main").map((h) => h.text),
    h4: p.headings.filter((h) => h.level === 4 && h.region === "main").map((h) => h.text),
    breadcrumb: p.breadcrumb,
    breadcrumbClickable: !!p.breadcrumb && p.breadcrumb.slice(0, -1).every((x) => x.href && x.href !== "#"),
    mainHan: p.mainHan,
    times: p.times,
    sectionsByHeading: (() => {
      const hs = p.headings.filter((h) => h.region === "main" && h.level >= 2 && h.level <= 3).map((h) => h.text);
      const has = (re) => hs.filter((x) => re.test(x));
      return {
        "原创简介(介绍/简介)": has(/简介|介绍|是什么|概述|概览/),
        "套餐表(套餐/价格)": has(/套餐|价格/),
        "使用需求分析(需求/适合/人群/场景)": has(/需求|适合|人群|场景/),
        "主要优势与限制(优势/优点/限制/不足/缺点)": has(/优势|优点|限制|不足|缺点|局限/),
        "FAQ(常见问题/FAQ)": has(/常见问题|FAQ|问答/i),
        "资料来源说明(来源/资料)": has(/来源|资料状态|资料档案|核验|核实/),
      };
    })(),
  };
});
// template similarity after masking brand-specific tokens
const mask = (s, b) => {
  let x = s ?? "";
  for (const n of [b?.name, b?.nameEn, ...(b?.aliases ?? [])].filter(Boolean).sort((a, c) => c.length - a.length)) x = x.split(n).join("〈B〉");
  return x.replace(/[0-9]+(\.[0-9]+)?/g, "#");
};
const brandTemplate = [];
for (const r of brandRows.filter((x) => x.slug !== "lingdongyun")) {
  const b = brandsJson.find((x) => x.slug === r.slug);
  brandTemplate.push({ slug: r.slug, maskedTitle: mask(r.title, b), maskedDesc: mask(r.description, b), maskedH2: r.h2.map((h) => mask(h, b)).join(" / ") });
}
const uniq = (arr) => [...new Set(arr)];
const brandTemplateSummary = {
  pages: brandTemplate.length,
  distinctMaskedTitles: uniq(brandTemplate.map((x) => x.maskedTitle)),
  distinctMaskedH2Sets: uniq(brandTemplate.map((x) => x.maskedH2)),
  descPairwiseMinSimilarity: (() => {
    let min = 1, max = 0;
    for (let i = 0; i < brandTemplate.length; i++)
      for (let j = i + 1; j < brandTemplate.length; j++) {
        const s = dice(brandTemplate[i].maskedDesc, brandTemplate[j].maskedDesc);
        min = Math.min(min, s);
        max = Math.max(max, s);
      }
    return { min: Number(min.toFixed(2)), max: Number(max.toFixed(2)) };
  })(),
  sampleMaskedDesc: brandTemplate.slice(0, 3).map((x) => x.maskedDesc),
};

// Site name usage in metadata
const nameUsage = ok.map((p) => ({
  path: p.path,
  titleOld: /机场选/.test(p.title ?? ""),
  titleNew: /机场优选/.test(p.title ?? ""),
  descOld: /机场选/.test(p.description ?? ""),
  ogSiteName: (p.og?.["og:site_name"] ?? []).join("|"),
  ogImageAltOld: (p.og?.["og:image:alt"] ?? []).some((a) => /机场选/.test(a)),
  appName: p.applicationName,
}));

// canonical / og / lang / robots consistency
const consistency = ok.map((p) => {
  const expect = SITE + encodeURI(p.path);
  const canon = p.canonical ?? [];
  return {
    path: p.path,
    lang: p.lang,
    canonicalCount: canon.length,
    canonicalSelf: canon.length === 1 && (canon[0] === expect || decodeURI(canon[0]) === SITE + p.path),
    canonical: canon[0] ?? null,
    ogUrl: (p.og?.["og:url"] ?? [])[0] ?? null,
    ogUrlEqCanonical: ((p.og?.["og:url"] ?? [])[0] ?? null) === (canon[0] ?? null),
    ogTitle: (p.og?.["og:title"] ?? [])[0] ?? null,
    ogTitleEqTitleCore: ((p.og?.["og:title"] ?? [])[0] ?? null) === core(p.title),
    ogDescEqDesc: ((p.og?.["og:description"] ?? [])[0] ?? null) === p.description,
    robots: (p.robots ?? []).join(" | "),
    xRobotsTag: p.xRobotsTag,
    inSitemap: p.inSitemap,
    titleInHead: p.titleInHeadCount,
    titleCount: p.titleCount,
    browserTitleInHead: p.browserView?.titleInHeadCount ?? null,
    browserSameHeadings: p.browserView?.sameHeadings ?? null,
  };
});

const summary = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  totals: {
    fetched: pages.length,
    sitemapUrls: sitemapEntries.length,
    status200: ok.length,
    non200: pages.filter((p) => p.status !== 200).map((p) => ({ path: p.path, status: p.status, location: p.location })),
    indexable: indexable.length,
    noindex: ok.length - indexable.length,
  },
  titles: {
    rows: titleRows,
    overlong: overlongTitles,
    literalOver: titleRows.filter((r) => r.han > 32 || r.len > 60),
    wideOver32: titleRows.filter((r) => r.wide > 32),
    displayOver64: titleRows.filter((r) => r.displayWidth > 64),
    atLimit64: titleRows.filter((r) => r.displayWidth === 64),
    projectedAfterRename: projected,
    projectedOver,
    duplicates: dupTitles,
    stuffingCandidates: stuffing,
    suffixCounts: titleRows.reduce((a, r) => ((a[r.suffix] = (a[r.suffix] ?? 0) + 1), a), {}),
  },
  gluedHeadings,
  descriptions: { rows: descRows, duplicates: dupDescs, nearDuplicates: nearDup, short: shortDescs, long: longDescs, missing: missingDescs, likeTitle: descLikeTitle },
  h1: { rows: h1Rows, notExactlyOne: h1NotOne, lowTitleSimilarity: h1Mismatch, concatenatedText: h1Concat },
  hierarchy: hierarchy.filter((h) => h.issues.length),
  hierarchyAll: hierarchy,
  home: homeCheck,
  brands: { rows: brandRows, template: brandTemplateSummary },
  siteName: nameUsage,
  consistency,
};
fs.writeFileSync(OUT_SUMMARY, JSON.stringify(summary, null, 2));

// ---------- console ----------
console.log(`fetched ${pages.length} pages (sitemap ${sitemapEntries.length}); 200: ${ok.length}; indexable: ${indexable.length}`);
console.log(`non-200: ${JSON.stringify(summary.totals.non200)}`);
console.log(`titles overlong: ${overlongTitles.length}; duplicate titles: ${dupTitles.length}; suffix: ${JSON.stringify(summary.titles.suffixCounts)}`);
console.log(`desc short<50: ${shortDescs.length}; long>160: ${longDescs.length}; missing: ${missingDescs.length}; dup: ${dupDescs.length}; nearDup pairs: ${nearDup.length}; likeTitle: ${descLikeTitle.length}`);
console.log(`H1 != 1: ${h1NotOne.length}; H1 low similarity to title: ${h1Mismatch.length}; H1 glued span: ${h1Concat.length}; all glued headings in main: ${gluedHeadings.length}`);
console.log(`title literal(han>32||len>60): ${summary.titles.literalOver.length}; wide>32: ${summary.titles.wideOver32.length}; displayWidth>64: ${summary.titles.displayOver64.length}; at 64: ${summary.titles.atLimit64.length}; projected >64 after rename: ${JSON.stringify(projectedOver)}`);
console.log(`pages with hierarchy issues: ${summary.hierarchy.length}`);
console.log(`written: ${path.relative(ROOT, OUT_PAGES)}, ${path.relative(ROOT, OUT_SUMMARY)}`);
