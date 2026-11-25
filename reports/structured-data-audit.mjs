#!/usr/bin/env node
/**
 * 只读 JSON-LD 审计（标签 structured-data）。
 *   node reports/structured-data-audit.mjs [http://localhost:3100]
 * 只发 GET 请求到本地服务器，只写 reports/structured-data-audit.json。
 */
import fs from "node:fs";
import path from "node:path";

import { parse } from "node-html-parser";

const BASE = (process.argv[2] || "http://localhost:3100").replace(/\/+$/, "");
const SITE = "https://jichangxuan.blog";
const OUT = path.resolve(process.cwd(), "reports", "structured-data-audit.json");
const UA = "structured-data-audit/1.0 (local read-only)";

async function get(p, { binary = false } = {}) {
  const url = /^https?:/.test(p) ? p : BASE + p;
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": UA } });
    const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
    return {
      status: res.status,
      body,
      ct: res.headers.get("content-type") ?? "",
      location: res.headers.get("location"),
      xrobots: res.headers.get("x-robots-tag"),
    };
  } catch (e) {
    return { status: 0, body: binary ? Buffer.alloc(0) : "", ct: "", error: String(e) };
  }
}

const norm = (s) =>
  String(s ?? "")
    .normalize("NFKC")
    .replace(/[\s​ ]+/g, "");

function extractLd(html) {
  const blocks = [];
  const headEnd = html.indexOf("</head>");
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (!/type\s*=\s*["']?application\/ld\+json/i.test(m[1])) continue;
    const raw = m[2];
    let data = null;
    let error = null;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      error = String(e.message);
    }
    blocks.push({ raw, data, error, inHead: headEnd > -1 && m.index < headEnd });
  }
  return blocks;
}

/** 把块拆成顶层节点（支持数组与 @graph） */
function topNodes(block) {
  if (!block.data) return [];
  const list = Array.isArray(block.data) ? block.data : [block.data];
  const out = [];
  for (const d of list) {
    if (d && Array.isArray(d["@graph"])) for (const g of d["@graph"]) out.push({ node: g, context: d["@context"] });
    else out.push({ node: d, context: d?.["@context"] });
  }
  return out;
}

function walk(node, trail, visit) {
  if (Array.isArray(node)) node.forEach((v, i) => walk(v, [...trail, i], visit));
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      visit(k, v, [...trail, k], node);
      walk(v, [...trail, k], visit);
    }
  }
}

const typesOf = (n) => (Array.isArray(n?.["@type"]) ? n["@type"] : n?.["@type"] ? [n["@type"]] : []);

const FORBIDDEN_KEYS = /^(aggregateRating|reviewRating|ratingValue|bestRating|worstRating|ratingCount|reviewCount|review|reviews|offers|price|priceCurrency|lowPrice|highPrice|priceSpecification|priceValidUntil|itemReviewed)$/i;
const FORBIDDEN_TYPES = /^(Review|AggregateRating|Rating|Offer|AggregateOffer|Product|UserReview|CriticReview|EmployerAggregateRating)$/;
const URL_KEYS = new Set(["url", "@id", "item", "urlTemplate", "image", "logo", "sameAs", "contentUrl", "thumbnailUrl", "target"]);

function pngSize(buf) {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function visibleParts(root) {
  const body = root.querySelector("body");
  if (!body) return { text: "", hiddenText: "" };
  const clone = parse(body.outerHTML);
  for (const el of clone.querySelectorAll("script, style, noscript, template")) el.remove();
  const hidden = clone.querySelectorAll("[hidden]");
  const hiddenText = hidden.map((e) => e.text).join(" ");
  for (const el of hidden) el.remove();
  return { text: clone.text, hiddenText };
}

function visibleBreadcrumb(root) {
  const navs = root.querySelectorAll('nav[aria-label="面包屑"]');
  if (!navs.length) return { count: 0, items: null };
  const items = navs[0].querySelectorAll("li").map((li) => {
    const a = li.querySelector("a");
    const cur = li.querySelector("[aria-current]");
    return { name: (a ?? cur ?? li).text.trim(), href: a?.getAttribute("href") ?? null, current: !!cur && !a };
  });
  return { count: navs.length, items };
}

function visibleDates(root) {
  const header = root.querySelector("article header") ?? root.querySelector("main header") ?? root;
  const out = { published: null, updated: null, times: [] };
  for (const t of header.querySelectorAll("time")) {
    const ctx = (t.parentNode?.text ?? "").replace(/\s+/g, " ").trim();
    const dt = t.getAttribute("datetime");
    out.times.push({ datetime: dt, text: t.text.trim(), ctx: ctx.slice(0, 40) });
    if (/发布/.test(ctx) && !out.published) out.published = dt;
    if (/更新/.test(ctx) && !out.updated) out.updated = dt;
  }
  return out;
}

function classify(p) {
  if (p === "/") return "home";
  if (p === "/lingdongyun/") return "brand-hub";
  if (p === "/brands/") return "brand-index";
  if (/^\/brands\/[^/]+\/$/.test(p)) return "brand";
  if (/^\/(recommend|reviews|compare|speedtest|guides)\/$/.test(p)) return "category";
  if (/^\/(recommend|reviews|compare|speedtest|guides|lingdongyun)\/page\/\d+\/$/.test(p)) return "category-page";
  if (p === "/articles/") return "articles-index";
  if (/^\/articles\/page\/\d+\/$/.test(p)) return "articles-page";
  if (/^\/(recommend|reviews|compare|speedtest|guides|lingdongyun)\/[a-z0-9-]+\/$/.test(p)) return "article";
  if (p.startsWith("/search/")) return "search";
  if (p.startsWith("/tags/")) return "tags";
  return "static";
}

async function main() {
  const robots = await get("/robots.txt");
  const sm = await get("/sitemap.xml");
  const sitemap = [...sm.body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    loc: /<loc>(.*?)<\/loc>/.exec(m[1])?.[1]?.trim(),
    lastmod: /<lastmod>(.*?)<\/lastmod>/.exec(m[1])?.[1]?.trim(),
  }));
  const sitemapPaths = sitemap.map((u) => new URL(u.loc).pathname);

  const required = [
    "/",
    "/lingdongyun/",
    "/brands/",
    "/recommend/",
    "/reviews/",
    "/compare/",
    "/speedtest/",
    "/guides/",
    "/articles/",
    "/about/",
    "/methodology/",
    "/disclosure/",
    "/contact/",
    "/privacy/",
    "/search/",
    "/tags/",
  ];
  const pagesToCheck = [...new Set([...required, ...sitemapPaths])];

  const imageCache = new Map();
  async function checkImage(absUrl) {
    if (imageCache.has(absUrl)) return imageCache.get(absUrl);
    let local = absUrl;
    if (absUrl.startsWith(SITE)) local = BASE + absUrl.slice(SITE.length);
    const r = await get(local, { binary: true });
    const info = { url: absUrl, local, status: r.status, ct: r.ct, bytes: r.body.length, size: pngSize(r.body) };
    imageCache.set(absUrl, info);
    return info;
  }

  // 关于页锚点
  const aboutRes = await get("/about/");
  const aboutRoot = parse(aboutRes.body);
  const aboutIds = aboutRoot.querySelectorAll("[id]").map((e) => e.getAttribute("id"));

  const pages = [];
  for (const p of pagesToCheck) {
    const res = await get(p);
    const page = { path: p, kind: classify(p), status: res.status, inSitemap: sitemapPaths.includes(p), issues: [], notes: [] };
    pages.push(page);
    if (res.status !== 200) {
      page.issues.push(`HTTP ${res.status}${res.location ? ` → ${res.location}` : ""}`);
      continue;
    }
    const html = res.body;
    const root = parse(html);
    page.title = root.querySelector("title")?.text.trim();
    page.h1 = root.querySelectorAll("h1").map((h) => h.text.replace(/\s+/g, " ").trim());
    page.canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
    page.robotsMeta = root.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null;
    page.metaDescription = root.querySelector('meta[name="description"]')?.getAttribute("content") ?? null;
    page.ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null;
    page.ogSiteName = root.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ?? null;
    page.htmlLang = root.querySelector("html")?.getAttribute("lang") ?? null;

    const { text, hiddenText } = visibleParts(root);
    const vis = norm(text);
    const hid = norm(hiddenText);
    page.visibleChars = vis.length;

    // 微数据 / RDFa
    page.microdata = {
      itemscope: (html.match(/\sitemscope[\s>=]/g) ?? []).length,
      itemprop: (html.match(/\sitemprop=/g) ?? []).length,
      typeof: (html.match(/\stypeof=/g) ?? []).length,
    };

    // 可见文本中的评分/评论字样（留上下文人工判断）
    const ratingHits = [];
    for (const re of [/评分/g, /星级/g, /好评/g, /差评/g, /用户评价/g, /用户评论/g, /网友评价/g, /★|☆/g, /\d(?:\.\d)?\s*\/\s*(?:5|10)(?!\d)/g, /ratingValue|aggregateRating/gi]) {
      for (const m of text.matchAll(re)) {
        const i = m.index ?? 0;
        ratingHits.push(text.slice(Math.max(0, i - 18), i + 22).replace(/\s+/g, " "));
      }
    }
    page.visibleRatingWordContexts = [...new Set(ratingHits)].slice(0, 12);

    const blocks = extractLd(html);
    page.ldBlockCount = blocks.length;
    page.ldInHead = blocks.filter((b) => b.inHead).length;
    page.types = [];
    page.ld = [];
    const nodes = [];
    for (const b of blocks) {
      if (b.error) {
        page.issues.push(`JSON-LD 无法解析：${b.error}`);
        continue;
      }
      if (/localhost|127\.0\.0\.1|http:\/\//.test(b.raw)) page.issues.push(`JSON-LD 含本地或 http 地址：${b.raw.match(/(localhost[^"]*|127\.0\.0\.1[^"]*|http:\/\/[^"]*)/)?.[0]}`);
      for (const { node, context } of topNodes(b)) {
        nodes.push(node);
        page.ld.push(node);
        const t = typesOf(node);
        page.types.push(t.join("+") || "(无 @type)");
        if (!context) page.issues.push(`JSON-LD 节点缺少 @context（${t.join("+")}）`);
        else if (!/^https?:\/\/schema\.org\/?$/.test(String(context))) page.issues.push(`@context 非 schema.org：${context}`);
        if (!t.length) page.issues.push("JSON-LD 节点缺少 @type");
      }
    }

    // 逐节点：URL、禁止项、图片
    const imageUrls = [];
    const declaredDims = [];
    for (const n of nodes) {
      walk(n, [typesOf(n).join("+")], (k, v, trail, parent) => {
        if (FORBIDDEN_KEYS.test(k)) page.issues.push(`禁止属性 ${trail.join(".")}`);
        if (k === "@type") for (const t of Array.isArray(v) ? v : [v]) if (FORBIDDEN_TYPES.test(t)) page.issues.push(`禁止类型 ${t} @ ${trail.join(".")}`);
        if (typeof v === "string" && (URL_KEYS.has(k) || /^https?:\/\//.test(v))) {
          if (/^https?:\/\//.test(v) && !(v === `${SITE}/` || v.startsWith(`${SITE}/`) || v.startsWith("https://schema.org"))) page.issues.push(`非规范域名 URL ${trail.join(".")} = ${v}`);
          if (!/^https?:\/\//.test(v) && k !== "@id" && k !== "item" && k !== "@type") page.issues.push(`相对 URL ${trail.join(".")} = ${v}`);
          if (k === "@id" && !/^https:\/\/jichangxuan\.blog\//.test(v)) page.issues.push(`@id 非绝对规范地址 ${trail.join(".")} = ${v}`);
          if (k === "item" && !/^https:\/\/jichangxuan\.blog\//.test(v)) page.issues.push(`BreadcrumbList item 非绝对规范地址 = ${v}`);
        }
        if (k === "image") {
          const arr = Array.isArray(v) ? v : [v];
          for (const x of arr) {
            if (typeof x === "string") imageUrls.push({ url: x, where: trail.join(".") });
            else if (x?.url) {
              imageUrls.push({ url: x.url, where: trail.join(".") });
              if (x.width || x.height) declaredDims.push({ url: x.url, width: x.width, height: x.height, where: trail.join(".") });
            }
          }
        }
        if (k === "logo") {
          if (typeof v === "string") imageUrls.push({ url: v, where: trail.join(".") });
          else if (v?.url) {
            imageUrls.push({ url: v.url, where: trail.join(".") });
            declaredDims.push({ url: v.url, width: v.width, height: v.height, where: trail.join(".") });
          }
        }
      });
    }
    page.images = [];
    for (const im of imageUrls) {
      const info = await checkImage(im.url);
      page.images.push({ ...info, where: im.where });
      if (info.status !== 200) page.issues.push(`图片 ${im.url}（${im.where}）本地返回 ${info.status}`);
      else if (!/^image\//.test(info.ct)) page.issues.push(`图片 ${im.url} content-type=${info.ct}`);
    }
    for (const d of declaredDims) {
      const info = imageCache.get(d.url);
      if (info?.size && (Number(d.width) !== info.size.width || Number(d.height) !== info.size.height)) {
        page.issues.push(`${d.where} 声明尺寸 ${d.width}x${d.height} 与实际 ${info.size.width}x${info.size.height} 不符`);
      }
    }

    const byType = (t) => nodes.filter((n) => typesOf(n).includes(t));
    // 全站类型
    for (const t of ["Organization", "WebSite"]) {
      const c = nodes.filter((n) => typesOf(n).includes(t) && n["@id"] && String(n["@id"]).endsWith(t === "Organization" ? "/#organization" : "/#website")).length;
      if (c !== 1) page.issues.push(`${t}（站点实体）出现 ${c} 次`);
    }
    const org = nodes.find((n) => n["@id"] === `${SITE}/#organization`);
    const site = nodes.find((n) => n["@id"] === `${SITE}/#website`);
    page.siteEntity = { orgName: org?.name, orgAlt: org?.alternateName, siteName: site?.name, siteAlt: site?.alternateName, searchTarget: site?.potentialAction?.target?.urlTemplate ?? site?.potentialAction?.target };

    // @id 引用是否可解析
    const ids = new Set(nodes.map((n) => n["@id"]).filter(Boolean));
    for (const n of nodes) {
      walk(n, [typesOf(n).join("+")], (k, v, trail) => {
        if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 1 && v["@id"]) {
          if (!ids.has(v["@id"])) page.issues.push(`@id 引用 ${v["@id"]}（${trail.join(".")}）在本页没有对应节点`);
        }
      });
    }

    // BreadcrumbList
    const bcs = byType("BreadcrumbList");
    const vbc = visibleBreadcrumb(root);
    page.visibleBreadcrumb = vbc.items;
    if (bcs.length > 1) page.issues.push(`BreadcrumbList 出现 ${bcs.length} 次`);
    if (bcs.length) {
      const items = (bcs[0].itemListElement ?? []).slice().sort((a, b) => a.position - b.position);
      page.ldBreadcrumb = items.map((i) => ({ position: i.position, name: i.name, item: i.item }));
      items.forEach((it, i) => {
        if (it.position !== i + 1) page.issues.push(`BreadcrumbList position 不连续：${it.position}`);
        if (it["@type"] !== "ListItem") page.issues.push(`BreadcrumbList 第 ${i + 1} 项 @type=${it["@type"]}`);
      });
      if (!vbc.items) page.issues.push("有 BreadcrumbList 但页面没有可见面包屑");
      else {
        if (vbc.items.length !== items.length) page.issues.push(`面包屑层级数不一致：JSON-LD ${items.length} / 可见 ${vbc.items.length}`);
        items.forEach((it, i) => {
          const v = vbc.items[i];
          if (!v) return;
          if (norm(v.name) !== norm(it.name)) page.issues.push(`面包屑第 ${i + 1} 项名称不一致：JSON-LD「${it.name}」/ 可见「${v.name}」`);
          const ldPath = String(it.item).startsWith(SITE) ? String(it.item).slice(SITE.length) : it.item;
          if (v.href && v.href !== ldPath) page.issues.push(`面包屑第 ${i + 1} 项链接不一致：JSON-LD ${ldPath} / 可见 ${v.href}`);
          if (!v.href && i !== items.length - 1) page.issues.push(`面包屑第 ${i + 1} 项不可点击`);
          if (!v.href && i === items.length - 1 && ldPath !== p) page.issues.push(`面包屑末项 JSON-LD 指向 ${ldPath}，与当前页 ${p} 不一致`);
        });
      }
    } else if (page.kind !== "home") {
      page.issues.push("缺少 BreadcrumbList");
    }
    if (vbc.count > 1) page.notes.push(`可见面包屑 nav 出现 ${vbc.count} 次`);

    // FAQPage
    const faqs = byType("FAQPage");
    if (faqs.length > 1) page.issues.push(`FAQPage 出现 ${faqs.length} 次`);
    page.faq = [];
    for (const f of faqs) {
      for (const q of f.mainEntity ?? []) {
        const qn = norm(q.name);
        const an = norm(q.acceptedAnswer?.text);
        const qVisible = vis.includes(qn);
        const aVisible = vis.includes(an);
        const qHidden = !qVisible && hid.includes(qn);
        const rec = { q: q.name, qVisible, aVisible, qHidden };
        if (!qVisible || !aVisible) {
          // 尝试找最长匹配前缀，帮助定位差异
          let k = 0;
          while (k < an.length && vis.includes(an.slice(0, k + 8))) k += 8;
          rec.answerVisiblePrefixChars = k;
          let j = 0;
          while (j < qn.length && vis.includes(qn.slice(0, j + 2))) j += 2;
          rec.questionVisiblePrefixChars = j;
        }
        page.faq.push(rec);
        if (!qVisible) page.issues.push(`FAQPage 问题在可见文本中找不到：「${q.name}」${qHidden ? "（只在 hidden 元素中）" : ""}`);
        else if (!aVisible) page.issues.push(`FAQPage 答案与可见文本不一致：「${q.name}」`);
        if (q["@type"] !== "Question" || q.acceptedAnswer?.["@type"] !== "Answer") page.issues.push(`FAQPage 结构类型异常：${q["@type"]}/${q.acceptedAnswer?.["@type"]}`);
      }
    }

    // 文章类
    const arts = nodes.filter((n) => typesOf(n).some((t) => /Article|BlogPosting|Posting/.test(t)));
    if (arts.length > 1) page.issues.push(`文章类节点出现 ${arts.length} 次`);
    if (arts.length) {
      const a = arts[0];
      const vd = visibleDates(root);
      const pub = String(a.datePublished ?? "").slice(0, 10);
      const mod = String(a.dateModified ?? "").slice(0, 10);
      page.article = {
        type: typesOf(a).join("+"),
        headline: a.headline,
        datePublished: a.datePublished,
        dateModified: a.dateModified,
        visibleDates: vd,
        author: a.author,
        publisher: a.publisher,
        image: a.image,
        wordCount: a.wordCount,
        sponsor: a.sponsor ?? null,
        articleSection: a.articleSection,
      };
      if (!typesOf(a).includes("BlogPosting")) page.notes.push(`文章节点类型为 ${typesOf(a).join("+")}，不是指令要求的 BlogPosting`);
      if (!vd.published) page.issues.push("页面上没有可见的发布日期 <time>");
      else if (vd.published !== pub) page.issues.push(`datePublished ${pub} 与可见发布日期 ${vd.published} 不一致`);
      if (vd.updated && vd.updated !== mod) page.issues.push(`dateModified ${mod} 与可见更新日期 ${vd.updated} 不一致`);
      if (!vd.updated && mod !== pub) page.issues.push(`dateModified ${mod} ≠ datePublished ${pub}，但页面没有显示更新日期`);
      if (page.h1.length && norm(a.headline) !== norm(page.h1[0])) page.issues.push(`headline 与 H1 不一致：「${a.headline}」/「${page.h1[0]}」`);
      if (page.metaDescription && norm(a.description) !== norm(page.metaDescription)) page.issues.push("description 与 meta description 不一致");
      if (a.url !== page.canonical) page.issues.push(`url ${a.url} 与 canonical ${page.canonical} 不一致`);
      if (a.mainEntityOfPage?.["@id"] !== page.canonical) page.issues.push(`mainEntityOfPage ${a.mainEntityOfPage?.["@id"]} 与 canonical 不一致`);
      const imgs = Array.isArray(a.image) ? a.image : [a.image];
      if (page.ogImage && !imgs.includes(page.ogImage)) page.notes.push(`Article.image（${imgs.join(",")}）与 og:image（${page.ogImage}）不同`);
      const wc = /约\s*\d+\s*分钟\s*·\s*(\d+)\s*字/.exec(text)?.[1];
      if (wc && Number(wc) !== a.wordCount) page.issues.push(`wordCount ${a.wordCount} 与可见字数 ${wc} 不一致`);
      const authorUrl = a.author?.url;
      if (authorUrl) {
        const u = new URL(authorUrl);
        if (u.pathname === "/about/" && u.hash) {
          const id = decodeURIComponent(u.hash.slice(1));
          page.article.authorAnchorExists = aboutIds.includes(id);
          if (!aboutIds.includes(id)) page.issues.push(`author.url 锚点 #${id} 在 /about/ 上不存在`);
        }
      }
      const authorLink = root.querySelector('a[rel="author"]')?.getAttribute("href");
      page.article.visibleAuthorLink = authorLink ?? null;
      if (authorLink && authorUrl && `${SITE}${authorLink}` !== authorUrl) page.issues.push(`可见作者链接 ${authorLink} 与 author.url ${authorUrl} 不一致`);
    }

    // 集合 / 列表
    const coll = byType("CollectionPage");
    const il = byType("ItemList");
    page.collection = coll.map((c) => ({ name: c.name, url: c.url, hasPartCount: c.hasPart?.length ?? 0, firstItems: (c.hasPart ?? []).slice(0, 7).map((h) => `${h.name} ${h.url}`) }));
    page.itemList = il.map((x) => ({ name: x.name, count: x.itemListElement?.length }));
    if (coll.length && coll[0].url !== page.canonical) page.issues.push(`CollectionPage.url ${coll[0].url} 与 canonical ${page.canonical} 不一致`);
    if ((page.kind === "home" || page.kind === "brand-index") && !il.length) page.notes.push("没有 ItemList");
  }

  // 搜索页 / SearchAction
  const searchQ = await get("/search/?q=%E7%81%B5%E5%8A%A8%E4%BA%91");
  const searchRoot = parse(searchQ.body);
  const searchAction = {
    status: searchQ.status,
    robotsMeta: searchRoot.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null,
    canonical: searchRoot.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    robotsTxtDisallowSearch: /Disallow:\s*\/search\//.test(robots.body),
    robotsTxt: robots.body,
    resultsInSsrHtml: /lingdongyun-introduction|灵动云品牌介绍/.test(searchRoot.querySelector("main")?.text ?? ""),
  };

  const summary = {};
  for (const pg of pages) {
    const key = pg.kind;
    summary[key] ??= { pages: 0, typeSets: {} };
    summary[key].pages++;
    const set = [...pg.types ?? []].sort().join(", ");
    summary[key].typeSets[set] = (summary[key].typeSets[set] ?? 0) + 1;
  }

  const out = {
    base: BASE,
    site: SITE,
    at: new Date().toISOString(),
    sitemapCount: sitemap.length,
    sitemap,
    aboutIds,
    images: [...imageCache.values()],
    searchAction,
    summary,
    pages,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");

  // 控制台摘要
  console.log(`抓取 ${pages.length} 页（sitemap ${sitemap.length} 个 URL）`);
  for (const [k, v] of Object.entries(summary)) {
    console.log(`\n[${k}] ${v.pages} 页`);
    for (const [set, c] of Object.entries(v.typeSets)) console.log(`   ${c} × ${set}`);
  }
  console.log("\n图片：");
  for (const im of imageCache.values()) console.log(`   ${im.status} ${im.ct} ${im.size ? `${im.size.width}x${im.size.height}` : ""} ${im.url}`);
  console.log("\n关于页 id：", aboutIds.join(", "));
  console.log("\nSearchAction：", JSON.stringify({ ...searchAction, robotsTxt: undefined }));
  console.log("\n问题：");
  for (const pg of pages) {
    if (pg.issues.length) console.log(`- ${pg.path} [${pg.kind}]\n    ${[...new Set(pg.issues)].join("\n    ")}`);
  }
  console.log("\n备注：");
  for (const pg of pages) {
    if (pg.notes.length) console.log(`- ${pg.path}: ${[...new Set(pg.notes)].join("；")}`);
  }
  console.log(`\n报告：${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
