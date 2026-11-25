#!/usr/bin/env node
/**
 * internal-links 审计抓取脚本（只读，不修改项目文件）。
 *
 * 从首页出发广度优先抓取全部站内 HTML 页面：只跟随站内 <a href>（忽略 /_next/），
 * 记录每条链接的来源页、目标、锚文本、rel、target、所在区域；然后做内链分析。
 *
 * 用法：node reports/internal-links-crawl.mjs [http://localhost:3100]
 * 输出（只写 reports/ 下以 internal-links 开头的文件）：
 *   reports/internal-links-crawl.json     原始抓取数据（页面 + 每条链接）
 *   reports/internal-links-analysis.json  分析结果
 *   reports/internal-links-summary.txt    文字摘要
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "..");
const require = createRequire(path.join(PROJECT, "package.json"));
const { parse } = require("node-html-parser");

const BASE = (process.argv[2] || "http://localhost:3100").replace(/\/+$/, "");
const BASE_URL = new URL(BASE + "/");
const SELF_HOSTS = new Set([BASE_URL.host.toLowerCase(), "jichangxuan.blog", "www.jichangxuan.blog"]);
const OUT_RAW = path.join(HERE, "internal-links-crawl.json");
const OUT_ANALYSIS = path.join(HERE, "internal-links-analysis.json");
const OUT_SUMMARY = path.join(HERE, "internal-links-summary.txt");
const UA = "internal-links-audit/1.0 (local read-only crawler)";
const CONCURRENCY = 4;
const CATEGORY_IDS = ["recommend", "reviews", "compare", "speedtest", "guides", "lingdongyun"];

const BRANDS = JSON.parse(fs.readFileSync(path.join(PROJECT, "data", "brands.json"), "utf8"));

/** 站主指令中的七家品牌与对应页面 */
const DIRECTIVE_BRANDS = [
  { rank: 1, id: "lingdongyun", label: "灵动云", path: "/lingdongyun/" },
  { rank: 2, id: "muguang-jiasu", label: "暮光加速", path: "/brands/muguang-jiasu/" },
  { rank: 3, id: "weifeng-wangluo", label: "微风网络 Breezenet", path: "/brands/weifeng-wangluo/" },
  { rank: 4, id: "feimaoyun", label: "飞猫云", path: "/brands/feimaoyun/" },
  { rank: 5, id: "flyv", label: "FLYV 飞V", path: "/brands/flyv/" },
  { rank: 6, id: "langwang", label: "浪网 WaveNet", path: "/brands/langwang/" },
  { rank: 7, id: "yinxingren", label: "隐形人", path: "/brands/yinxingren/" },
];

const collapse = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const hostOf = (u) => {
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return null;
  }
};

// 品牌主机映射（affiliateUrl / officialUrl）
const hostToBrands = new Map();
for (const b of BRANDS) {
  for (const u of [b.affiliateUrl, b.officialUrl]) {
    const h = u && hostOf(u);
    if (!h) continue;
    if (!hostToBrands.has(h)) hostToBrands.set(h, new Set());
    hostToBrands.get(h).add(b.id);
  }
}
const brandById = new Map(BRANDS.map((b) => [b.id, b]));
const brandBySlug = new Map(BRANDS.map((b) => [b.slug, b]));
const brandByName = new Map(BRANDS.map((b) => [b.name, b]));
const brandPathOf = (b) => b.hubPath ?? `/brands/${b.slug}/`;

const isBrandPagePath = (p) => p === "/lingdongyun/" || /^\/brands\/[^/]+\/$/.test(p);
const brandIdForPage = (p) => {
  if (p === "/lingdongyun/") return "lingdongyun";
  const m = /^\/brands\/([^/]+)\/$/.exec(p);
  return m ? (brandBySlug.get(m[1])?.id ?? null) : null;
};
const ARTICLE_RE = new RegExp(`^/(${CATEGORY_IDS.join("|")})/(?!page/)([^/]+)/$`);
const isArticlePath = (p) => ARTICLE_RE.test(p);
const categoryOfArticle = (p) => ARTICLE_RE.exec(p)?.[1] ?? null;

function classifyHref(raw, pageUrl) {
  if (raw === null || raw === undefined) return { kind: "missing" };
  const h = raw.trim();
  if (h === "") return { kind: "empty" };
  if (h === "#") return { kind: "hash-only" };
  if (/^javascript:/i.test(h)) return { kind: "javascript" };
  if (/^mailto:/i.test(h)) return { kind: "mailto" };
  if (/^tel:/i.test(h)) return { kind: "tel" };
  if (h.startsWith("#")) {
    let frag = h.slice(1);
    try {
      frag = decodeURIComponent(frag);
    } catch {
      /* keep raw */
    }
    return { kind: "fragment", fragment: frag };
  }
  let u;
  try {
    u = new URL(h, pageUrl);
  } catch {
    return { kind: "invalid" };
  }
  if (!/^https?:$/.test(u.protocol)) return { kind: "other-scheme", url: u.href };
  if (SELF_HOSTS.has(u.host.toLowerCase())) {
    let frag = u.hash ? u.hash.slice(1) : "";
    try {
      frag = decodeURIComponent(frag);
    } catch {
      /* keep raw */
    }
    return {
      kind: "internal",
      key: u.pathname + u.search,
      pathname: u.pathname,
      search: u.search,
      fragment: frag,
      absoluteHref: /^[a-z]+:\/\//i.test(h),
      hrefHost: u.host.toLowerCase(),
    };
  }
  return { kind: "external", url: u.href, host: u.host.toLowerCase() };
}

function contextOf(a, idText) {
  let inMain = false;
  let inFooter = false;
  let inHeader = false;
  const navs = [];
  const sections = [];
  let inCard = false;
  let inProse = false;
  let brandSlugCtx = null;
  let inlineBrandName = null;
  let featureBrand = null;
  let inTable = false;
  for (let p = a.parentNode; p && p.tagName; p = p.parentNode) {
    const tag = p.tagName.toLowerCase();
    const cls = p.getAttribute("class") || "";
    const id = p.getAttribute("id") || "";
    const ariaLabel = p.getAttribute("aria-label");
    const labelledBy = p.getAttribute("aria-labelledby");
    if (tag === "main") inMain = true;
    if (tag === "footer") inFooter = true;
    if (tag === "header") inHeader = true;
    if (tag === "table") inTable = true;
    if (tag === "nav") navs.push(ariaLabel || (labelledBy && idText.get(labelledBy)) || "(nav)");
    if (tag === "section" || tag === "aside") {
      sections.push((labelledBy && idText.get(labelledBy)) || ariaLabel || (id ? `#${id}` : tag));
    }
    if (tag === "article" && /\bcard\b/.test(cls)) inCard = true;
    if (/\bprose-article\b/.test(cls)) inProse = true;
    if (!brandSlugCtx) {
      const m1 = /^brand-card-(.+)$/.exec(labelledBy || "");
      const m2 = /^brand-([a-z0-9-]+)$/.exec(id);
      if (m1) brandSlugCtx = m1[1];
      else if (tag === "section" && m2 && brandBySlug.has(m2[1])) brandSlugCtx = m2[1];
    }
    if (!inlineBrandName && ariaLabel && ariaLabel.startsWith("相关品牌推荐：")) inlineBrandName = ariaLabel.slice("相关品牌推荐：".length);
    if (!featureBrand && labelledBy === "brand-feature-title") featureBrand = idText.get("brand-feature-title") || "brand-feature";
  }
  const zone = inMain ? "main" : inFooter ? "site-footer" : inHeader ? "site-header" : "other";
  let area;
  if (zone !== "main") area = zone;
  else if (navs.includes("面包屑")) area = "breadcrumb";
  else if (inProse) area = "prose";
  else if (inlineBrandName) area = "inline-brand-card";
  else if (navs.includes("上一篇 / 下一篇")) area = "prev-next";
  else if (sections.includes("相关阅读")) area = "related";
  else if (navs.includes("分页")) area = "pagination";
  else if (inCard) area = "card";
  else if (navs.some((n) => /目录/.test(n))) area = "toc";
  else area = "main-other";
  return { zone, area, navs, sections, inCard, inProse, inTable, brandSlugCtx, inlineBrandName, featureBrand };
}

function analyzeHtml(html, pageUrl, key) {
  const root = parse(html, { comment: false, blockTextElements: { script: true, noscript: true, style: true } });
  const idCounts = new Map();
  const idText = new Map();
  for (const el of root.querySelectorAll("[id]")) {
    const id = el.getAttribute("id");
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
    if (!idText.has(id)) idText.set(id, collapse(el.text));
  }
  const title = collapse(root.querySelector("title")?.text);
  const h1s = root.querySelectorAll("h1").map((h) => collapse(h.text));
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
  const robotsMeta = root.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null;
  const lang = root.querySelector("html")?.getAttribute("lang") ?? null;

  const links = root.querySelectorAll("a").map((a, index) => {
    const hasHref = a.hasAttribute("href");
    const hrefRaw = hasHref ? a.getAttribute("href") : null;
    const c = classifyHref(hrefRaw, pageUrl);
    const text = collapse(a.text);
    const imgs = a.querySelectorAll("img");
    const imgAlts = imgs.map((i) => (i.hasAttribute("alt") ? i.getAttribute("alt") : null));
    const ariaLabel = a.getAttribute("aria-label") ?? null;
    const titleAttr = a.getAttribute("title") ?? null;
    const name = collapse(ariaLabel) || text || collapse(imgAlts.filter(Boolean).join(" ")) || collapse(titleAttr);
    const ctx = contextOf(a, idText);
    return {
      source: key,
      index,
      hrefRaw,
      ...c,
      text,
      name,
      hasImg: imgs.length > 0,
      imgAlts,
      ariaLabel,
      ariaHidden: a.getAttribute("aria-hidden") ?? null,
      tabindex: a.getAttribute("tabindex") ?? null,
      rel: a.getAttribute("rel") ?? null,
      target: a.getAttribute("target") ?? null,
      className: a.getAttribute("class") ?? "",
      ...ctx,
    };
  });

  const breadcrumbs = root
    .querySelectorAll("nav")
    .filter((n) => n.getAttribute("aria-label") === "面包屑")
    .map((nav) => {
      const lis = nav.querySelectorAll("li");
      return lis.map((li, idx) => {
        const a = li.querySelector("a");
        return {
          idx,
          text: collapse(li.text),
          isLink: !!a,
          href: a ? (a.getAttribute("href") ?? null) : null,
          ariaCurrent: !!li.querySelector('[aria-current="page"]'),
          isLast: idx === lis.length - 1,
        };
      });
    });

  return {
    title,
    h1s,
    canonical,
    robotsMeta,
    lang,
    ids: [...idCounts.keys()],
    duplicateIds: Object.fromEntries([...idCounts].filter(([, v]) => v > 1)),
    links,
    breadcrumbs,
  };
}

async function fetchAndParse(key) {
  const url = BASE + key;
  const pathOnly = key.split("?")[0];
  const looksAsset = /\.[a-z0-9]{2,5}$/i.test(pathOnly) && !/\.html?$/i.test(pathOnly);
  const headers = { "user-agent": UA, accept: "text/html,application/xhtml+xml,*/*;q=0.8" };
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(url, { method: looksAsset ? "HEAD" : "GET", redirect: "manual", headers });
    if (looksAsset && (res.status === 405 || res.status === 501)) res = await fetch(url, { redirect: "manual", headers });
  } catch (e) {
    return { key, error: String(e?.message || e) };
  }
  const rec = {
    key,
    status: res.status,
    contentType: res.headers.get("content-type") || "",
    location: res.headers.get("location"),
    xRobotsTag: res.headers.get("x-robots-tag"),
    ms: Date.now() - t0,
  };
  if (rec.status >= 300 && rec.status < 400 && rec.location) {
    const c = classifyHref(rec.location, url);
    rec.redirectTo = c.kind === "internal" ? c.key : (c.url ?? rec.location);
    rec.redirectInternal = c.kind === "internal";
  }
  if (!looksAsset && res.status === 200 && rec.contentType.includes("text/html")) {
    const html = await res.text();
    rec.htmlBytes = Buffer.byteLength(html);
    Object.assign(rec, analyzeHtml(html, url, key));
  } else {
    try {
      await res.arrayBuffer();
    } catch {
      /* ignore */
    }
  }
  return rec;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

const follow = (l) => l.kind === "internal" && !l.pathname.startsWith("/_next/");

// ---------------- 抓取 ----------------
const pages = new Map();
const depth = new Map([["/", 0]]);
const discoveredFrom = new Map([["/", null]]);
let level = ["/"];
let d = 0;
while (level.length) {
  const next = [];
  let batch = level;
  while (batch.length) {
    const results = await mapLimit(batch, CONCURRENCY, fetchAndParse);
    const sameLevel = [];
    for (const r of results) {
      pages.set(r.key, r);
      if (r.redirectTo && r.redirectInternal && !depth.has(r.redirectTo)) {
        depth.set(r.redirectTo, depth.get(r.key));
        discoveredFrom.set(r.redirectTo, `redirect:${r.key}`);
        sameLevel.push(r.redirectTo);
      }
      for (const l of r.links ?? []) {
        if (!follow(l) || depth.has(l.key)) continue;
        depth.set(l.key, d + 1);
        discoveredFrom.set(l.key, r.key);
        next.push(l.key);
      }
    }
    batch = sameLevel;
  }
  level = next;
  d++;
}

// ---------------- sitemap ----------------
const smRes = await fetch(`${BASE}/sitemap.xml`, { headers: { "user-agent": UA } });
const smXml = await smRes.text();
const sitemapLocs = [...smXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
const sitemapEntries = sitemapLocs.map((loc) => {
  const u = new URL(loc);
  return { loc, key: u.pathname + u.search, host: u.host };
});
const sitemapOnly = [];
for (const e of sitemapEntries) {
  if (!pages.has(e.key)) {
    const r = await fetchAndParse(e.key);
    r.discoveredVia = "sitemap-only";
    pages.set(e.key, r);
    sitemapOnly.push(e.key);
  }
}

// ---------------- 分析 ----------------
const crawled = [...pages.values()];
const reachable = (k) => depth.has(k);
const htmlPages = crawled.filter((p) => p.status === 200 && p.links && reachable(p.key));
const allLinks = htmlPages.flatMap((p) => p.links);
const finalKey = (k) => {
  let cur = k;
  for (let i = 0; i < 10; i++) {
    const p = pages.get(cur);
    if (p && p.redirectTo && p.redirectInternal) cur = p.redirectTo;
    else break;
  }
  return cur;
};
const pageByKey = (k) => pages.get(k);
const robotsTxt = await (await fetch(`${BASE}/robots.txt`, { headers: { "user-agent": UA } })).text();
const disallow = [...robotsTxt.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]);
const robotsBlocked = (k) => disallow.some((p) => k.startsWith(p));
const isNoindex = (p) => /noindex/i.test(p?.robotsMeta || "") || /noindex/i.test(p?.xRobotsTag || "");

// 链接统计
const internalLinks = allLinks.filter((l) => l.kind === "internal");
const externalLinks = allLinks.filter((l) => l.kind === "external");
const kindsCount = {};
for (const l of allLinks) kindsCount[l.kind] = (kindsCount[l.kind] || 0) + 1;

// 入链
const inl = new Map();
const ensure = (k) => {
  if (!inl.has(k)) inl.set(k, { sources: new Set(), instances: 0, mainSources: new Set(), mainInstances: 0, byArea: {}, anchors: {}, fromIndexable: new Set() });
  return inl.get(k);
};
const selfLinks = [];
for (const l of internalLinks) {
  if (l.pathname.startsWith("/_next/")) continue;
  const tk = finalKey(l.key);
  if (tk === l.source) {
    selfLinks.push(l);
    continue;
  }
  const e = ensure(tk);
  e.sources.add(l.source);
  e.instances++;
  e.byArea[l.area] = (e.byArea[l.area] || 0) + 1;
  if (l.zone === "main") {
    e.mainSources.add(l.source);
    e.mainInstances++;
  }
  const sp = pageByKey(l.source);
  if (!isNoindex(sp) && !robotsBlocked(l.source)) e.fromIndexable.add(l.source);
  const nm = l.name || "(空)";
  e.anchors[nm] = (e.anchors[nm] || 0) + 1;
}

// 仅正文（main 区域）链接图的 BFS 深度
function bfsDepth(filter) {
  const adj = new Map();
  for (const l of internalLinks) {
    if (!follow(l) || !filter(l)) continue;
    const tk = finalKey(l.key);
    if (!adj.has(l.source)) adj.set(l.source, new Set());
    adj.get(l.source).add(tk);
  }
  const dist = new Map([["/", 0]]);
  let q = ["/"];
  while (q.length) {
    const nq = [];
    for (const s of q) for (const t of adj.get(s) ?? []) if (!dist.has(t)) {
      dist.set(t, dist.get(s) + 1);
      nq.push(t);
    }
    q = nq;
  }
  return dist;
}
const mainDepth = bfsDepth((l) => l.zone === "main");
const indexableDepth = bfsDepth((l) => !robotsBlocked(l.source) && !isNoindex(pageByKey(l.source)));

const sitemapKeys = new Set(sitemapEntries.map((e) => e.key));
const sitemapReport = sitemapEntries.map((e) => {
  const p = pageByKey(e.key);
  const i = inl.get(e.key);
  const variantSources = new Set();
  for (const l of internalLinks) if (l.pathname === e.key && l.key !== e.key && l.source !== e.key) variantSources.add(l.source);
  return {
    loc: e.loc,
    key: e.key,
    status: p?.status ?? null,
    depth: depth.has(e.key) ? depth.get(e.key) : null,
    depthMainOnly: mainDepth.has(e.key) ? mainDepth.get(e.key) : null,
    depthFromIndexableOnly: indexableDepth.has(e.key) ? indexableDepth.get(e.key) : null,
    inlinkPages: i ? i.sources.size : 0,
    inlinkInstances: i ? i.instances : 0,
    mainInlinkPages: i ? i.mainSources.size : 0,
    mainInlinkInstances: i ? i.mainInstances : 0,
    inlinkPagesIndexable: i ? i.fromIndexable.size : 0,
    queryVariantInlinkPages: variantSources.size,
    byArea: i?.byArea ?? {},
    topAnchors: Object.entries(i?.anchors ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 8),
    discoveredFrom: discoveredFrom.get(e.key) ?? null,
    sitemapOnly: sitemapOnly.includes(e.key),
  };
});

const orphans = sitemapReport.filter((r) => r.inlinkPages === 0);
const mainOrphans = sitemapReport.filter((r) => r.mainInlinkPages === 0 && r.key !== "/");
const deep = sitemapReport.filter((r) => r.depth === null || r.depth >= 4);
const deepMain = sitemapReport.filter((r) => r.key !== "/" && (r.depthMainOnly === null || r.depthMainOnly >= 4));

// 抓到但不在 sitemap 的 URL
const notInSitemap = crawled
  .filter((p) => reachable(p.key) && !sitemapKeys.has(p.key))
  .map((p) => ({
    key: p.key,
    status: p.status,
    contentType: p.contentType.split(";")[0],
    robotsMeta: p.robotsMeta ?? null,
    canonical: p.canonical ?? null,
    robotsTxtBlocked: robotsBlocked(p.key),
    redirectTo: p.redirectTo ?? null,
    depth: depth.get(p.key),
    inlinkPages: inl.get(p.key)?.sources.size ?? 0,
    inlinkInstances: inl.get(p.key)?.instances ?? 0,
  }));

// 非 200 / 重定向的站内链接目标
const brokenOrRedirectTargets = [];
const targetKeys = new Set(internalLinks.filter(follow).map((l) => l.key));
for (const k of targetKeys) {
  const p = pageByKey(k);
  if (!p || p.status !== 200) {
    const srcs = [...new Set(internalLinks.filter((l) => l.key === k).map((l) => l.source))];
    brokenOrRedirectTargets.push({ key: k, status: p?.status ?? null, redirectTo: p?.redirectTo ?? null, sourcePages: srcs.length, sampleSources: srcs.slice(0, 5) });
  }
}

// 首页 → 七家品牌
const home = pageByKey("/");
const homeLinks = home?.links ?? [];
const homeBrand = DIRECTIVE_BRANDS.map((b) => {
  const ls = homeLinks.filter((l) => l.kind === "internal" && finalKey(l.key) === b.path);
  const exists = pageByKey(b.path);
  return {
    ...b,
    targetStatus: exists?.status ?? null,
    linkCount: ls.length,
    firstLinkIndex: ls.length ? ls[0].index : null,
    links: ls.map((l) => ({ index: l.index, anchor: l.name, area: l.area, sections: l.sections, hrefRaw: l.hrefRaw })),
  };
});
// 首页上所有品牌页链接的出现顺序
const homeBrandOrder = [];
for (const l of homeLinks) {
  if (l.kind !== "internal") continue;
  const k = finalKey(l.key);
  if (!isBrandPagePath(k)) continue;
  if (!homeBrandOrder.find((x) => x.path === k)) homeBrandOrder.push({ path: k, brand: brandIdForPage(k), firstIndex: l.index, anchor: l.name, section: l.sections[0] ?? null });
}

// 品牌页 → 套餐比较
const brandPageKeys = crawled.filter((p) => p.status === 200 && p.links && isBrandPagePath(p.key)).map((p) => p.key);
const brandToCompare = brandPageKeys.map((k) => {
  const ls = pageByKey(k).links.filter((l) => l.kind === "internal" && l.pathname.startsWith("/compare/"));
  return {
    page: k,
    brand: brandIdForPage(k),
    inDirective: DIRECTIVE_BRANDS.some((b) => b.path === k),
    compareArticleLinks: ls.filter((l) => isArticlePath(l.pathname)).map((l) => ({ target: l.key, anchor: l.name, area: l.area })),
    compareRootLinks: ls.filter((l) => l.pathname === "/compare/").map((l) => ({ target: l.key, anchor: l.name, area: l.area })),
  };
});

// 教程 / 比较文章出链
const brandPageOf = (k) => (isBrandPagePath(k) ? k : null);
function articleOutlinks(prefix) {
  return htmlPages
    .filter((p) => p.key.startsWith(prefix) && isArticlePath(p.key))
    .map((p) => {
      const ls = p.links.filter((l) => l.kind === "internal" && l.zone === "main");
      const toBrand = ls.filter((l) => brandPageOf(finalKey(l.key)));
      const toLdyArticles = ls.filter((l) => isArticlePath(l.pathname) && l.pathname.startsWith("/lingdongyun/"));
      const toGuides = ls.filter((l) => isArticlePath(l.pathname) && l.pathname.startsWith("/guides/") && l.pathname !== p.key);
      const toCompare = ls.filter((l) => isArticlePath(l.pathname) && l.pathname.startsWith("/compare/") && l.pathname !== p.key);
      const fmt = (arr) => arr.map((l) => ({ target: l.key, anchor: l.name, area: l.area }));
      return {
        page: p.key,
        h1: p.h1s?.[0] ?? null,
        brandPageLinks: fmt(toBrand),
        brandPageLinksInProse: toBrand.filter((l) => l.area === "prose").length,
        distinctBrandPagesLinked: [...new Set(toBrand.map((l) => finalKey(l.key)))],
        lingdongyunArticleLinks: fmt(toLdyArticles),
        guideLinks: fmt(toGuides),
        guideLinksInProse: toGuides.filter((l) => l.area === "prose").length,
        distinctGuidesLinked: [...new Set(toGuides.map((l) => l.pathname))],
        compareArticleLinks: fmt(toCompare),
        externalLinks: p.links.filter((l) => l.kind === "external").map((l) => ({ url: l.url, anchor: l.name, rel: l.rel, area: l.area })),
      };
    });
}
const guidesOut = articleOutlinks("/guides/");
const compareOut = articleOutlinks("/compare/");

// 每篇文章是否可从首页或栏目页直接到达
const articleReach = htmlPages
  .filter((p) => isArticlePath(p.key))
  .map((p) => {
    const cat = categoryOfArticle(p.key);
    const srcs = [...(inl.get(p.key)?.sources ?? [])];
    return {
      page: p.key,
      fromHome: srcs.includes("/"),
      fromCategoryRoot: srcs.includes(`/${cat}/`),
      fromCategoryPaged: srcs.filter((s) => s.startsWith(`/${cat}/page/`)),
      fromArticlesIndex: srcs.filter((s) => s === "/articles/" || s.startsWith("/articles/page/")),
      homeLinkAreas: (home?.links ?? []).filter((l) => l.kind === "internal" && l.key === p.key).map((l) => `${l.area}${l.sections[0] ? `@${l.sections[0]}` : ""}`),
    };
  });

// 面包屑
const breadcrumbReport = htmlPages.map((p) => {
  const bcs = p.breadcrumbs ?? [];
  const problems = [];
  if (p.key !== "/" && bcs.length === 0) problems.push("无可见面包屑");
  if (bcs.length > 1) problems.push(`面包屑出现 ${bcs.length} 次`);
  for (const bc of bcs) {
    for (const it of bc) {
      if (!it.isLast && !it.isLink) problems.push(`第 ${it.idx + 1} 级“${it.text}”不是链接`);
      if (it.isLast && it.isLink) problems.push(`最后一级“${it.text}”是链接`);
      if (it.isLast && !it.ariaCurrent) problems.push(`最后一级“${it.text}”缺少 aria-current`);
      if (it.isLink) {
        const c = classifyHref(it.href, BASE + p.key);
        if (c.kind !== "internal") problems.push(`第 ${it.idx + 1} 级 href 异常：${it.href}`);
        else {
          const t = pageByKey(c.key);
          if (!t || t.status !== 200) problems.push(`第 ${it.idx + 1} 级目标 ${c.key} 状态 ${t?.status ?? "未抓取"}`);
        }
      }
    }
  }
  return { page: p.key, trail: bcs[0]?.map((it) => (it.isLink ? `${it.text}→${it.href}` : `[${it.text}]`)).join(" › ") ?? null, problems };
});

// 文章卡片 / 相关阅读锚文本
const h1Of = (k) => pageByKey(finalKey(k))?.h1s?.[0] ?? null;
const anchorVsTitle = internalLinks
  .filter((l) => isArticlePath(l.pathname))
  .map((l) => {
    const h1 = h1Of(l.key);
    const nm = l.name;
    let match;
    if (!nm) match = "empty";
    else if (h1 && nm === h1) match = "exact-h1";
    else if (h1 && nm.includes(h1)) match = "contains-h1";
    else match = "different";
    return { source: l.source, target: l.key, area: l.area, inCard: l.inCard, anchor: nm, text: l.text, h1, match, ariaHidden: l.ariaHidden, tabindex: l.tabindex, hasImg: l.hasImg, imgAlts: l.imgAlts };
  });
const tally = (arr, keyFn) => arr.reduce((acc, x) => ((acc[keyFn(x)] = (acc[keyFn(x)] || 0) + 1), acc), {});
const relatedCardStats = {
  relatedSection: tally(anchorVsTitle.filter((x) => x.area === "related"), (x) => x.match),
  cards: tally(anchorVsTitle.filter((x) => x.inCard), (x) => x.match),
  all: tally(anchorVsTitle, (x) => `${x.area}:${x.match}`),
  emptyImageLinks: anchorVsTitle.filter((x) => x.match === "empty").length,
  emptyImageLinksAriaHidden: anchorVsTitle.filter((x) => x.match === "empty" && x.ariaHidden === "true").length,
  differentSamples: [...new Map(anchorVsTitle.filter((x) => x.match === "different").map((x) => [`${x.anchor}|${x.target}`, x])).values()].map((x) => ({
    anchor: x.anchor,
    target: x.target,
    h1: x.h1,
    area: x.area,
    sources: anchorVsTitle.filter((y) => y.match === "different" && y.anchor === x.anchor && y.target === x.target).map((y) => y.source),
  })),
};

// 泛化锚文本
const GENERIC_EXACT = /^(查看|进入|了解|了解更多|点击|点击这里|点此|这里|此处|更多|详情|查看详情|查看更多|阅读全文|阅读更多|继续阅读|立即查看|去看看|read more|learn more|click here|more|here)$/i;
const GENERIC_PREFIX = /^(查看|进入|了解|点击|阅读|前往|返回|去)/;
const genericExact = [];
const genericPrefix = [];
for (const l of allLinks) {
  if (!["internal", "external", "fragment"].includes(l.kind)) continue;
  const nm = l.name;
  const rec = { source: l.source, target: l.kind === "external" ? l.url : l.kind === "fragment" ? `#${l.fragment}` : l.key, anchor: nm, area: l.area, section: l.sections[0] ?? null };
  if (GENERIC_EXACT.test(nm)) genericExact.push(rec);
  else if (GENERIC_PREFIX.test(nm)) genericPrefix.push(rec);
}
const groupAnchors = (arr) => {
  const m = new Map();
  for (const r of arr) {
    if (!m.has(r.anchor)) m.set(r.anchor, { anchor: r.anchor, count: 0, targets: new Set(), sourcePages: new Set(), areas: new Set() });
    const g = m.get(r.anchor);
    g.count++;
    g.targets.add(r.target);
    g.sourcePages.add(r.source);
    g.areas.add(`${r.area}${r.section ? `@${r.section}` : ""}`);
  }
  return [...m.values()]
    .map((g) => ({ anchor: g.anchor, count: g.count, distinctTargets: g.targets.size, targets: [...g.targets].slice(0, 25), sourcePages: g.sourcePages.size, areas: [...g.areas] }))
    .sort((a, b) => b.count - a.count);
};
// 同一锚文本指向多个不同目标（站内 + 站外）
const anchorTargets = new Map();
for (const l of allLinks) {
  if (!["internal", "external"].includes(l.kind) || !l.name) continue;
  const t = l.kind === "internal" ? finalKey(l.key) : l.url;
  if (!anchorTargets.has(l.name)) anchorTargets.set(l.name, { targets: new Set(), count: 0, sources: new Set() });
  const e = anchorTargets.get(l.name);
  e.targets.add(t);
  e.count++;
  e.sources.add(l.source);
}
const ambiguousAnchors = [...anchorTargets]
  .filter(([, v]) => v.targets.size > 1)
  .map(([anchor, v]) => ({ anchor, distinctTargets: v.targets.size, count: v.count, sourcePages: v.sources.size, targets: [...v.targets].slice(0, 20) }))
  .sort((a, b) => b.distinctTargets - a.distinctTargets || b.count - a.count);

// 异常 href
const badHref = allLinks.filter((l) => ["hash-only", "javascript", "empty", "missing", "invalid", "other-scheme"].includes(l.kind)).map((l) => ({ source: l.source, kind: l.kind, hrefRaw: l.hrefRaw, anchor: l.name, area: l.area, className: l.className }));
// 片段链接校验
const fragmentIssues = [];
let fragmentLinks = 0;
for (const l of allLinks) {
  if (l.kind === "fragment") {
    fragmentLinks++;
    const p = pageByKey(l.source);
    const cnt = p.ids.includes(l.fragment) ? (p.duplicateIds[l.fragment] ?? 1) : 0;
    if (cnt !== 1) fragmentIssues.push({ source: l.source, href: l.hrefRaw, anchor: l.name, area: l.area, idCount: cnt });
  } else if (l.kind === "internal" && l.fragment) {
    fragmentLinks++;
    const p = pageByKey(finalKey(l.key));
    const cnt = p?.ids?.includes(l.fragment) ? (p.duplicateIds[l.fragment] ?? 1) : 0;
    if (cnt !== 1) fragmentIssues.push({ source: l.source, href: l.hrefRaw, anchor: l.name, area: l.area, idCount: cnt, targetPage: finalKey(l.key) });
  }
}
const fragmentIssueGroups = groupAnchors(fragmentIssues.map((f) => ({ source: f.source, target: `${f.href} (id×${f.idCount})`, anchor: f.anchor, area: f.area, section: null })));

// 指向首页的链接
const homeLinkPerPage = htmlPages.map((p) => {
  const ls = p.links.filter((l) => l.kind === "internal" && l.key === "/");
  return { page: p.key, count: ls.length, areas: tally(ls, (l) => `${l.area}:${l.name}`) };
});
const homeCounts = homeLinkPerPage.map((x) => x.count);

// 站内绝对地址 / 不规范地址
const absoluteInternal = internalLinks.filter((l) => l.absoluteHref).map((l) => ({ source: l.source, href: l.hrefRaw, anchor: l.name, area: l.area }));
const nonCanonicalInternal = internalLinks
  .filter((l) => follow(l))
  .filter((l) => {
    const p = pageByKey(l.key);
    return (p && p.status >= 300 && p.status < 400) || (!l.pathname.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(l.pathname));
  })
  .map((l) => ({ source: l.source, href: l.hrefRaw, status: pageByKey(l.key)?.status ?? null, anchor: l.name }));
const queryLinks = groupAnchors(
  internalLinks.filter((l) => l.search).map((l) => ({ source: l.source, target: l.key, anchor: l.name, area: l.area, section: l.sections[0] ?? null })),
);
const linksToNoindex = groupAnchors(
  internalLinks
    .filter((l) => {
      const p = pageByKey(finalKey(l.key));
      return p && (isNoindex(p) || robotsBlocked(finalKey(l.key)));
    })
    .map((l) => ({ source: l.source, target: finalKey(l.key), anchor: l.name, area: l.area, section: null })),
);

// 外链
const extByUrl = new Map();
for (const l of externalLinks) {
  if (!extByUrl.has(l.url)) extByUrl.set(l.url, { url: l.url, host: l.host, brandsForHost: [...(hostToBrands.get(l.host) ?? [])], rels: new Set(), targets: new Set(), anchors: new Set(), sourcePages: new Set(), instances: 0, areas: new Set() });
  const e = extByUrl.get(l.url);
  e.rels.add(l.rel ?? "(无 rel)");
  e.targets.add(l.target ?? "(无 target)");
  e.anchors.add(l.name);
  e.sourcePages.add(l.source);
  e.areas.add(l.area);
  e.instances++;
}
const externalList = [...extByUrl.values()]
  .map((e) => {
    const rels = [...e.rels];
    const isAffiliate = e.brandsForHost.length > 0;
    return {
      url: e.url,
      host: e.host,
      brandsForHost: e.brandsForHost,
      isBrandHost: isAffiliate,
      rels,
      relAllHaveSponsored: rels.every((r) => /\bsponsored\b/.test(r)),
      relAllHaveNofollow: rels.every((r) => /\bnofollow\b/.test(r)),
      targets: [...e.targets],
      anchors: [...e.anchors],
      sourcePages: e.sourcePages.size,
      sampleSources: [...e.sourcePages].slice(0, 6),
      instances: e.instances,
      areas: [...e.areas],
    };
  })
  .sort((a, b) => b.instances - a.instances);
const sponsoredMissing = externalList.filter((e) => e.isBrandHost && !e.relAllHaveSponsored);
const externalNoRel = externalList.filter((e) => e.rels.includes("(无 rel)"));

// 品牌页按钮 / 外链核对
function expectedHostFor(brandId) {
  const b = brandById.get(brandId);
  return b ? hostOf(b.affiliateUrl ?? b.officialUrl ?? "") : null;
}
const brandPageCta = brandPageKeys.map((k) => {
  const brandId = brandIdForPage(k);
  const exp = expectedHostFor(brandId);
  const ext = pageByKey(k).links.filter((l) => l.kind === "external");
  const items = ext.map((l) => {
    const owners = [...(hostToBrands.get(l.host) ?? [])];
    const isButton = /\bbtn\b/.test(l.className) || /注册|购买|官网/.test(l.name);
    return {
      anchor: l.name,
      host: l.host,
      url: l.url,
      rel: l.rel,
      target: l.target,
      area: l.area,
      isButton,
      hostOwners: owners,
      matchesPageBrand: l.host === exp,
      pointsToOtherBrand: owners.length > 0 && !owners.includes(brandId),
    };
  });
  // 站内“详情”链接是否指向别家品牌页
  const internalBrandLinks = pageByKey(k)
    .links.filter((l) => l.kind === "internal" && isBrandPagePath(finalKey(l.key)) && finalKey(l.key) !== k)
    .map((l) => ({ anchor: l.name, target: finalKey(l.key), area: l.area }));
  return {
    page: k,
    brand: brandId,
    inDirective: DIRECTIVE_BRANDS.some((b) => b.path === k),
    expectedHost: exp,
    externalLinks: items.length,
    buttons: items.filter((i) => i.isButton),
    mismatches: items.filter((i) => !i.matchesPageBrand),
    otherBrandLinks: items.filter((i) => i.pointsToOtherBrand),
    sponsoredMissing: items.filter((i) => i.hostOwners.length && !/\bsponsored\b/.test(i.rel ?? "")),
    internalLinksToOtherBrandPages: internalBrandLinks,
  };
});

// 卡片 / 专区 / 行内推荐中的品牌上下文核对（全站）
const brandContextIssues = [];
for (const l of allLinks) {
  let ctxBrand = null;
  if (l.brandSlugCtx) ctxBrand = brandBySlug.get(l.brandSlugCtx)?.id ?? null;
  else if (l.inlineBrandName) ctxBrand = brandByName.get(l.inlineBrandName)?.id ?? null;
  else if (l.featureBrand) ctxBrand = BRANDS.find((b) => l.featureBrand.startsWith(b.name))?.id ?? null;
  if (!ctxBrand) continue;
  if (l.kind === "external") {
    const owners = [...(hostToBrands.get(l.host) ?? [])];
    if (owners.length && !owners.includes(ctxBrand)) brandContextIssues.push({ source: l.source, ctxBrand, anchor: l.name, url: l.url, owners });
    if (!owners.length) brandContextIssues.push({ source: l.source, ctxBrand, anchor: l.name, url: l.url, owners: ["(未知主机)"] });
  } else if (l.kind === "internal") {
    const t = finalKey(l.key);
    if (isBrandPagePath(t) && brandIdForPage(t) !== ctxBrand) brandContextIssues.push({ source: l.source, ctxBrand, anchor: l.name, target: t, owners: [brandIdForPage(t)] });
  }
}
const brandContextLinksChecked = allLinks.filter((l) => l.brandSlugCtx || l.inlineBrandName || l.featureBrand).length;

// 页面级统计
const perPage = htmlPages.map((p) => ({
  page: p.key,
  links: p.links.length,
  internal: p.links.filter((l) => l.kind === "internal").length,
  internalUniqueTargets: new Set(p.links.filter((l) => l.kind === "internal").map((l) => finalKey(l.key))).size,
  external: p.links.filter((l) => l.kind === "external").length,
  fragment: p.links.filter((l) => l.kind === "fragment").length,
  mainInternal: p.links.filter((l) => l.kind === "internal" && l.zone === "main").length,
  depth: depth.get(p.key),
  robotsMeta: p.robotsMeta ?? null,
}));

const stats = {
  base: BASE,
  crawledAt: new Date().toISOString(),
  urlsFetched: crawled.length,
  urlsReachableFromHome: crawled.filter((p) => reachable(p.key)).length,
  htmlPages200Reachable: htmlPages.length,
  nonHtmlTargets: crawled.filter((p) => reachable(p.key) && !(p.contentType || "").includes("text/html")).map((p) => ({ key: p.key, status: p.status, contentType: p.contentType.split(";")[0] })),
  statusCounts: tally(crawled.filter((p) => reachable(p.key)), (p) => String(p.status ?? p.error)),
  maxDepth: Math.max(...[...depth.values()]),
  totalAnchorElements: allLinks.length,
  linkKinds: kindsCount,
  internalLinks: internalLinks.length,
  internalLinksMainZone: internalLinks.filter((l) => l.zone === "main").length,
  internalLinksSiteHeader: internalLinks.filter((l) => l.zone === "site-header").length,
  internalLinksSiteFooter: internalLinks.filter((l) => l.zone === "site-footer").length,
  uniqueInternalTargets: new Set(internalLinks.map((l) => l.key)).size,
  externalLinks: externalLinks.length,
  uniqueExternalUrls: extByUrl.size,
  uniqueExternalHosts: new Set(externalLinks.map((l) => l.host)).size,
  sitemapUrls: sitemapEntries.length,
  sitemapHostSet: [...new Set(sitemapEntries.map((e) => e.host))],
  sitemapOnlyUrls: sitemapOnly,
  orphanCount: orphans.length,
  mainZoneOrphanCount: mainOrphans.length,
  depthGte4Count: deep.length,
  depthGte4MainOnlyCount: deepMain.length,
  depthDistribution: tally(sitemapReport, (r) => String(r.depth)),
  depthMainOnlyDistribution: tally(sitemapReport, (r) => String(r.depthMainOnly)),
  selfLinks: selfLinks.length,
  homeLinksPerPage: { min: Math.min(...homeCounts), max: Math.max(...homeCounts), avg: +(homeCounts.reduce((a, b) => a + b, 0) / homeCounts.length).toFixed(2) },
  badHrefCount: badHref.length,
  fragmentLinks,
  fragmentIssues: fragmentIssues.length,
  genericExactCount: genericExact.length,
  genericPrefixCount: genericPrefix.length,
  brandContextLinksChecked,
  brandContextIssues: brandContextIssues.length,
  avgLinksPerPage: +(allLinks.length / htmlPages.length).toFixed(1),
};

const analysis = {
  stats,
  sitemapReport,
  orphans: orphans.map((r) => r.key),
  mainZoneOrphans: mainOrphans.map((r) => ({ key: r.key, inlinkPages: r.inlinkPages, byArea: r.byArea })),
  depthGte4: deep.map((r) => ({ key: r.key, depth: r.depth })),
  depthGte4MainOnly: deepMain.map((r) => ({ key: r.key, depthMainOnly: r.depthMainOnly, depth: r.depth })),
  notInSitemap,
  brokenOrRedirectTargets,
  homeBrand,
  homeBrandOrder,
  brandToCompare,
  guidesOut,
  compareOut,
  articleReach,
  breadcrumbReport,
  relatedCardStats,
  genericExact: groupAnchors(genericExact),
  genericPrefix: groupAnchors(genericPrefix),
  ambiguousAnchors,
  badHref,
  fragmentIssueGroups,
  homeLinkPerPage,
  absoluteInternal,
  nonCanonicalInternal,
  queryLinks,
  linksToNoindex,
  externalList,
  sponsoredMissing,
  externalNoRel,
  brandPageCta,
  brandContextIssues,
  perPage,
  robots: { disallow },
};

fs.writeFileSync(
  OUT_RAW,
  JSON.stringify(
    {
      base: BASE,
      pages: crawled.map(({ links, ids, ...rest }) => ({ ...rest, linkCount: links?.length ?? 0, depth: depth.get(rest.key) ?? null })),
      links: allLinks,
    },
    null,
    1,
  ),
);
fs.writeFileSync(OUT_ANALYSIS, JSON.stringify(analysis, null, 1));

// ---------------- 文字摘要 ----------------
const L = [];
const line = (s = "") => L.push(s);
line(`# internal-links 抓取摘要  ${stats.crawledAt}  base=${BASE}`);
line(JSON.stringify(stats, null, 1));
line("\n## sitemap URL：深度 / 入链（页数，实例；main 区页数）");
for (const r of sitemapReport)
  line(
    `${r.key.padEnd(58)} st=${r.status} d=${r.depth} dMain=${r.depthMainOnly} in=${r.inlinkPages}/${r.inlinkInstances} main=${r.mainInlinkPages}/${r.mainInlinkInstances} idx=${r.inlinkPagesIndexable} qVar=${r.queryVariantInlinkPages} areas=${JSON.stringify(r.byArea)}`,
  );
line("\n## 孤立页（sitemap 外无入链）"), line(JSON.stringify(analysis.orphans));
line("## 仅 main 区无入链"), line(JSON.stringify(analysis.mainZoneOrphans));
line("## 深度>=4"), line(JSON.stringify(analysis.depthGte4));
line("## 仅正文链接深度>=4"), line(JSON.stringify(analysis.depthGte4MainOnly));
line("\n## 抓到但不在 sitemap"), notInSitemap.forEach((x) => line(JSON.stringify(x)));
line("\n## 非 200 的站内链接目标"), brokenOrRedirectTargets.forEach((x) => line(JSON.stringify(x)));
line("\n## 首页 → 七家品牌"), homeBrand.forEach((x) => line(JSON.stringify(x)));
line("## 首页品牌页链接出现顺序"), homeBrandOrder.forEach((x) => line(JSON.stringify(x)));
line("\n## 品牌页 → /compare/"), brandToCompare.forEach((x) => line(JSON.stringify(x)));
line("\n## 教程出链"), guidesOut.forEach((x) => line(JSON.stringify(x)));
line("\n## 比较文章出链"), compareOut.forEach((x) => line(JSON.stringify(x)));
line("\n## 文章可达性（首页 / 栏目页）"), articleReach.forEach((x) => line(JSON.stringify(x)));
line("\n## 面包屑"), breadcrumbReport.forEach((x) => line(JSON.stringify(x)));
line("\n## 卡片与相关阅读锚文本"), line(JSON.stringify(relatedCardStats, null, 1));
line("\n## 泛化锚文本（精确匹配）"), analysis.genericExact.forEach((x) => line(JSON.stringify(x)));
line("## 泛化前缀锚文本（查看/进入/了解/点击/阅读/前往/返回/去）"), analysis.genericPrefix.forEach((x) => line(JSON.stringify(x)));
line("## 同一锚文本指向多个目标"), ambiguousAnchors.forEach((x) => line(JSON.stringify(x)));
line("\n## 异常 href"), badHref.forEach((x) => line(JSON.stringify(x)));
line("## 片段链接问题"), fragmentIssueGroups.forEach((x) => line(JSON.stringify(x)));
line("\n## 每页指向首页的链接"), homeLinkPerPage.forEach((x) => line(JSON.stringify(x)));
line("\n## 站内绝对地址"), line(JSON.stringify(absoluteInternal.slice(0, 20)));
line("## 不规范站内地址（3xx 或缺结尾斜杠）"), line(JSON.stringify(nonCanonicalInternal.slice(0, 40)));
line("## 带查询参数的站内链接"), queryLinks.forEach((x) => line(JSON.stringify(x)));
line("## 指向 noindex / robots 屏蔽页的链接"), linksToNoindex.forEach((x) => line(JSON.stringify(x)));
line("\n## 外链"), externalList.forEach((x) => line(JSON.stringify(x)));
line("## 推广外链缺 sponsored"), line(JSON.stringify(sponsoredMissing));
line("## 外链无 rel"), line(JSON.stringify(externalNoRel));
line("\n## 品牌页按钮核对"), brandPageCta.forEach((x) => line(JSON.stringify(x)));
line("## 品牌上下文不一致"), line(JSON.stringify(brandContextIssues));
line("\n## 每页链接数"), perPage.forEach((x) => line(JSON.stringify(x)));
fs.writeFileSync(OUT_SUMMARY, L.join("\n"));

console.log(JSON.stringify(stats, null, 1));
console.log(`\n写入：\n  ${OUT_RAW}\n  ${OUT_ANALYSIS}\n  ${OUT_SUMMARY}`);
