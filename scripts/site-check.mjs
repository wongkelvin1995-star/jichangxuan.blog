#!/usr/bin/env node
/**
 * 全站检查（需先 `npm run build && npm start`，或对静态导出启动静态服务器）：
 *   node scripts/site-check.mjs http://localhost:3000 [--out reports/site-check.json] [--expect-preview]
 *
 * 检查项：robots.txt、sitemap.xml（全部 200、规范 URL、lastmod）、RSS、搜索索引、404 状态码、
 * 草稿不可访问、IndexNow 密钥文件、每页：lang / 唯一 title / 唯一 description / 单一 H1 / canonical 自引用 /
 * OG 标签 / robots 指令 / JSON-LD 可解析 / 图片 alt / 站内链接全部 200 且带结尾斜杠 / 推广外链 rel=sponsored /
 * 文章正文完整输出（服务端 HTML 字数）/ 禁止出现评分类字样。
 * 2026-11-16 起另检查：首页 Title / Description / H1 / H2 结构与推荐榜顺序逐字符合站主指定；ItemList 顺序；
 * 文章与品牌页 BlogPosting（标题 = H1，日期 = 页面可见日期）；FAQPage 问答在页面上可见；BreadcrumbList 与可见面包屑一致；
 * JSON-LD 不含评分 / 评论 / 价格键；推荐品牌编辑正文 ≥ 1200 汉字；品牌页推广按钮只指向本品牌；旧站名与“不排名”表述。
 * 结果：控制台 ✓ ✗ ⚠ 摘要 + JSON 报告；有 ✗ 时以非 0 退出。
 */
import fs from "node:fs";
import path from "node:path";

import { parse } from "node-html-parser";

import { loadEnv, siteUrl } from "./env.mjs";

loadEnv();

const args = process.argv.slice(2);
const BASE = (args.find((a) => /^https?:\/\//.test(a)) ?? "http://localhost:3000").replace(/\/+$/, "");
const OUT = args.includes("--out") ? args[args.indexOf("--out") + 1] : "reports/site-check.json";
const EXPECT_PREVIEW = args.includes("--expect-preview");
const SITE = siteUrl();
/** 推广链接主机名取自 data/brands.json：这些外链必须带 rel=sponsored */
const SPONSORED_HOSTS = (() => {
  try {
    const brands = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "brands.json"), "utf8"));
    return brands.filter((b) => b.affiliateUrl).map((b) => new URL(b.affiliateUrl).host);
  } catch {
    return ["lingdongaff.com"];
  }
})();
const FORBIDDEN = [/ratingValue/i, /aggregateRating/i, /评分[：:]\s*\d/, /好评率/, /\d+(\.\d+)?\s*分\s*\/\s*10/];
/** JSON-LD 中不允许出现的键（不得声明评分、评论或未核实的价格） */
const FORBIDDEN_LD_KEYS = ["aggregateRating", "review", "reviewRating", "ratingValue", "offers", "price", "priceCurrency"];

/* 站长指定的首页 SEO 信息与推荐榜顺序（逐字核对）：2026-11-16 指定，2026-11-25 推荐榜调整为 12 家 */
const HOME_EXPECT = {
  title: "2026机场推荐排行榜｜灵动云、暮光加速等12家机场套餐对比 - 机场优选",
  h1: "2026 机场推荐排行榜｜精选机场与套餐对比",
  description:
    "机场优选提供2026机场推荐与套餐对比指南，重点介绍灵动云、暮光加速、微风网络、飞猫云、大佬云、FLYV、浪网、隐形人、梯子云等12家机场，涵盖套餐价格、节点线路、AI工具与流媒体使用场景、客户端兼容及新手教程。",
  h2: [
    "2026 年热门机场推荐概览",
    "灵动云机场介绍、套餐与使用体验",
    "2026 热门机场推荐排行榜",
    "十二家热门机场套餐价格比较",
    "不同网络使用需求如何选择机场",
    "机场客户端与订阅使用教程",
    "机场购买与使用常见问题",
    "最新机场测评与原创文章",
    "关于机场优选及内容更新说明",
  ],
  rankingH3: [
    "第一名 灵动云",
    "第二名 暮光加速",
    "第三名 微风网络",
    "第四名 飞猫云",
    "第五名 大佬云",
    "第六名 FLYV 飞V",
    "第七名 浪网 WaveNet",
    "第八名 隐形人",
    "第九名 梯子云",
    "第十名 无忧链接",
    "第十一名 Firefly",
    "第十二名 全球云",
  ],
  rankingPaths: [
    "/lingdongyun/",
    "/brands/muguang-jiasu/",
    "/brands/weifeng-wangluo/",
    "/brands/feimaoyun/",
    "/brands/dalaoyun/",
    "/brands/flyv/",
    "/brands/langwang/",
    "/brands/yinxingren/",
    "/brands/tiziyun/",
    "/brands/wuyou/",
    "/brands/firefly/",
    "/brands/quanqiuyun/",
  ],
};
/** 品牌页编辑正文的最少汉字数（站主指令：约 1200–2000 汉字） */
const MIN_EDITORIAL_CJK = 1200;
const BRANDS_DATA = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "brands.json"), "utf8"));
  } catch {
    return [];
  }
})();
const cjk = (s) => (s.match(/[㐀-鿿]/g) ?? []).length;
const squash = (s) => String(s ?? "").replace(/\s+/g, "");
/** 显示宽度：全角 / 汉字记 2，其余记 1 */
const displayWidth = (s) => [...s].reduce((n, ch) => n + (/[⺀-鿿＀-￯　-〿]/.test(ch) ? 2 : 1), 0);

/** 递归收集 JSON-LD 节点（含 @graph、mainEntity 等嵌套对象） */
function walkLd(node, visit, key = "") {
  if (Array.isArray(node)) return node.forEach((n) => walkLd(n, visit, key));
  if (!node || typeof node !== "object") return;
  visit(node, key);
  for (const [k, v] of Object.entries(node)) walkLd(v, visit, k);
}

const results = [];
const pass = (group, name, detail = "") => results.push({ level: "pass", group, name, detail });
const fail = (group, name, detail = "") => results.push({ level: "fail", group, name, detail });
const warn = (group, name, detail = "") => results.push({ level: "warn", group, name, detail });

const UA = "jichangxuan-site-check/1.0";

async function get(url, opts = {}) {
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": UA }, ...opts });
    const text = await res.text();
    return { status: res.status, text, headers: res.headers, location: res.headers.get("location") };
  } catch (e) {
    return { status: 0, text: "", headers: new Map(), error: String(e) };
  }
}

function isFileLike(p) {
  return /\.(xml|json|txt|png|jpg|jpeg|webp|svg|ico|css|js|woff2?)$/i.test(p.split("?")[0]);
}

function normalizeInternal(href, fromPath) {
  if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return null;
  let u;
  try {
    u = new URL(href, `${BASE}${fromPath}`);
  } catch {
    return null;
  }
  const base = new URL(BASE);
  const site = new URL(SITE);
  if (u.host !== base.host && u.host !== site.host) return { external: u.href };
  return { internal: u.pathname + u.search, hash: u.hash };
}

async function main() {
  const started = Date.now();
  console.log(`站点检查：${BASE}（规范域名 ${SITE}）\n`);

  // ---- robots.txt ----
  const robots = await get(`${BASE}/robots.txt`);
  if (robots.status !== 200) fail("robots", "robots.txt 返回 200", `HTTP ${robots.status}`);
  else {
    pass("robots", "robots.txt 返回 200");
    if (EXPECT_PREVIEW) {
      // 预览环境允许抓取（爬虫要能读到每页的 noindex），并且不声明 sitemap（见 app/robots.ts）
      if (/^Disallow:\s*\/\s*$/m.test(robots.text)) fail("robots", "预览环境不应 Disallow: /（否则爬虫读不到 noindex）", robots.text.slice(0, 200));
      else pass("robots", "预览环境允许抓取");
      if (/^Sitemap:/im.test(robots.text)) fail("robots", "预览环境不应声明 sitemap", robots.text.slice(0, 200));
      else pass("robots", "预览环境未声明 sitemap");
    } else {
      if (/Sitemap:\s*\S+sitemap\.xml/.test(robots.text)) pass("robots", "声明 sitemap");
      else fail("robots", "robots.txt 应声明 Sitemap", robots.text.slice(0, 200));
      if (/^Disallow:\s*\/\s*$/m.test(robots.text)) fail("robots", "正式站不应 Disallow: /", robots.text.slice(0, 200));
      else pass("robots", "正式站允许抓取");
    }
  }

  // ---- sitemap ----
  const sitemap = await get(`${BASE}/sitemap.xml`);
  const sitemapUrls = [];
  if (sitemap.status !== 200) fail("sitemap", "sitemap.xml 返回 200", `HTTP ${sitemap.status}`);
  else {
    pass("sitemap", "sitemap.xml 返回 200");
    for (const m of sitemap.text.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const loc = /<loc>(.*?)<\/loc>/.exec(m[1])?.[1]?.trim();
      const lastmod = /<lastmod>(.*?)<\/lastmod>/.exec(m[1])?.[1]?.trim();
      if (loc) sitemapUrls.push({ loc, lastmod });
    }
    if (!sitemapUrls.length) fail("sitemap", "sitemap 含 URL", "0 个");
    else pass("sitemap", `sitemap 含 ${sitemapUrls.length} 个 URL`);
    const badPrefix = sitemapUrls.filter((u) => !u.loc.startsWith(`${SITE}/`));
    if (badPrefix.length) fail("sitemap", "sitemap URL 以规范域名开头", badPrefix.map((u) => u.loc).join(", "));
    else pass("sitemap", "sitemap URL 全部以规范域名开头");
    const noSlash = sitemapUrls.filter((u) => !u.loc.endsWith("/") && !isFileLike(u.loc));
    if (noSlash.length) fail("sitemap", "sitemap URL 带结尾斜杠", noSlash.map((u) => u.loc).join(", "));
    else pass("sitemap", "sitemap URL 全部带结尾斜杠");
    const badDate = sitemapUrls.filter((u) => !u.lastmod || !/^\d{4}-\d{2}-\d{2}/.test(u.lastmod));
    if (badDate.length) fail("sitemap", "lastmod 格式", badDate.map((u) => u.loc).join(", "));
    else pass("sitemap", "lastmod 均为日期格式");
    const dup = new Set();
    const dups = sitemapUrls.filter((u) => (dup.has(u.loc) ? true : (dup.add(u.loc), false)));
    if (dups.length) fail("sitemap", "sitemap 无重复 URL", dups.map((u) => u.loc).join(", "));
    else pass("sitemap", "sitemap 无重复 URL");
  }
  const sitemapPaths = new Set(sitemapUrls.map((u) => new URL(u.loc).pathname));

  // ---- rss / search index ----
  const rss = await get(`${BASE}/rss.xml`);
  if (rss.status === 200 && /<rss/.test(rss.text) && /<item>/.test(rss.text)) pass("feeds", "rss.xml 可用且含条目");
  else fail("feeds", "rss.xml 可用", `HTTP ${rss.status}`);
  const idx = await get(`${BASE}/search-index.json`);
  try {
    const arr = JSON.parse(idx.text);
    if (idx.status === 200 && Array.isArray(arr) && arr.length) pass("feeds", `search-index.json 含 ${arr.length} 条`);
    else fail("feeds", "search-index.json 可用", `HTTP ${idx.status}`);
  } catch {
    fail("feeds", "search-index.json 可解析", `HTTP ${idx.status}`);
  }

  // ---- 404 ----
  const nf = await get(`${BASE}/this-page-does-not-exist-${Date.now()}/`);
  if (nf.status === 404) pass("http", "不存在的路径返回 404");
  else fail("http", "不存在的路径应返回 404", `HTTP ${nf.status}`);
  if (/404/.test(nf.text) && /返回首页/.test(nf.text)) pass("http", "自定义 404 页面已渲染");
  else warn("http", "自定义 404 页面内容", "未检测到自定义文案");

  // ---- drafts ----
  const contentDir = path.join(process.cwd(), "content");
  const draftPaths = [];
  if (fs.existsSync(contentDir)) {
    for (const cat of fs.readdirSync(contentDir)) {
      const dir = path.join(contentDir, cat);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir)) {
        if (!/\.mdx?$/.test(f)) continue;
        const raw = fs.readFileSync(path.join(dir, f), "utf8");
        if (/^draft:\s*true/m.test(raw)) draftPaths.push(`/${cat}/${f.replace(/\.mdx?$/, "")}/`);
      }
    }
  }
  for (const p of draftPaths) {
    const r = await get(`${BASE}${p}`);
    if (r.status === 404) pass("drafts", `草稿不可公开访问 ${p}`);
    else fail("drafts", `草稿应返回 404：${p}`, `HTTP ${r.status}`);
  }

  // ---- IndexNow key ----
  const key = process.env.INDEXNOW_KEY;
  if (key) {
    const k = await get(`${BASE}/${key}.txt`);
    if (k.status === 200 && k.text.trim() === key) pass("indexnow", "密钥文件可访问且内容正确");
    else fail("indexnow", "密钥文件可访问", `HTTP ${k.status}`);
  } else {
    warn("indexnow", "未设置 INDEXNOW_KEY", "上线前设置后，构建会生成 /<key>.txt；线上提交待部署后执行");
  }

  // ---- redirects (仅 Node 模式有效) ----
  const redirectsFile = path.join(process.cwd(), "data", "redirects.json");
  if (fs.existsSync(redirectsFile)) {
    const rules = JSON.parse(fs.readFileSync(redirectsFile, "utf8"));
    let ok = 0;
    let twoHop = 0;
    for (const r of rules) {
      // Node 模式下 trailingSlash 规范化（308）先于自定义 redirects 执行，无斜杠的旧地址会经过两跳；
      // 这里允许最多一次 308 规范化，再核对最终 301 目标。静态导出模式由 public/_redirects 负责。
      let res = await get(`${BASE}${r.from}`);
      let target = res.location ? new URL(res.location, BASE).pathname : null;
      if (res.status === 308 && target && target !== r.to) {
        twoHop++;
        res = await get(`${BASE}${target}`);
        target = res.location ? new URL(res.location, BASE).pathname : null;
      }
      if ((res.status === 301 || res.status === 308) && target === r.to) ok++;
      else warn("redirects", `${r.from} → ${r.to}`, `HTTP ${res.status} → ${res.location ?? "无 Location"}（静态导出模式由 _redirects 负责）`);
    }
    if (ok) pass("redirects", `${ok}/${rules.length} 条 301 规则在 Node 模式下到达目标${twoHop ? `（其中 ${twoHop} 条无斜杠旧地址先经 308 规范化，共两跳）` : ""}`);
  }

  // ---- crawl ----
  const queue = ["/", ...[...sitemapPaths]];
  const seen = new Set();
  const pages = [];
  const linkStatus = new Map();
  const externalLinks = new Map();
  const titles = new Map();
  const descs = new Map();

  async function checkLink(p) {
    if (linkStatus.has(p)) return linkStatus.get(p);
    const r = await get(`${BASE}${p}`);
    linkStatus.set(p, r.status);
    return r.status;
  }

  while (queue.length) {
    const p = queue.shift();
    if (seen.has(p)) continue;
    seen.add(p);
    const res = await get(`${BASE}${p}`);
    linkStatus.set(p, res.status);
    if (res.status !== 200) {
      fail("pages", `页面返回 200：${p}`, `HTTP ${res.status}`);
      continue;
    }
    if (!/text\/html/.test(res.headers.get("content-type") ?? "")) continue;
    const root = parse(res.text);
    const page = { path: p, issues: [] };
    const issue = (m) => page.issues.push(m);

    const lang = root.querySelector("html")?.getAttribute("lang");
    if (lang !== "zh-CN") issue(`html lang=${lang ?? "缺失"}`);

    const title = root.querySelector("title")?.text.trim() ?? "";
    if (!title) issue("缺少 <title>");
    else {
      if (title.length > 70) issue(`title 过长（${title.length} 字符）`);
      if (titles.has(title)) issue(`title 与 ${titles.get(title)} 重复`);
      titles.set(title, p);
    }
    page.title = title;

    const desc = root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
    if (!desc) issue("缺少 meta description");
    else {
      if (desc.length < 50 || desc.length > 200) issue(`description 长度 ${desc.length}（建议 50–200）`);
      if (descs.has(desc)) issue(`description 与 ${descs.get(desc)} 重复`);
      descs.set(desc, p);
    }

    const h1s = root.querySelectorAll("h1");
    if (h1s.length !== 1) issue(`H1 数量 ${h1s.length}`);
    page.h1 = h1s[0]?.text.trim();

    const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href");
    const expectedCanonical = `${SITE}${p.split("?")[0]}`;
    if (!canonical) issue("缺少 canonical");
    else if (canonical !== expectedCanonical) issue(`canonical 不自引用：${canonical}（应为 ${expectedCanonical}）`);
    const canonicals = root.querySelectorAll('link[rel="canonical"]');
    if (canonicals.length > 1) issue(`canonical 出现 ${canonicals.length} 次`);

    const og = (prop) => root.querySelector(`meta[property="${prop}"]`)?.getAttribute("content");
    for (const prop of ["og:title", "og:description", "og:url", "og:image"]) if (!og(prop)) issue(`缺少 ${prop}`);
    if (og("og:url") && og("og:url") !== expectedCanonical) issue(`og:url（${og("og:url")}）与 canonical 不一致`);

    const robotsMeta = root.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "";
    const noindex = /noindex/i.test(robotsMeta);
    const shouldNoindex = p.startsWith("/search/") || p.startsWith("/tags/");
    if (EXPECT_PREVIEW) {
      if (!noindex) issue("预览环境应 noindex");
    } else if (sitemapPaths.has(p) && noindex) issue("sitemap 页面出现 noindex");
    else if (shouldNoindex && !noindex) issue("搜索/标签页应 noindex");
    else if (!sitemapPaths.has(p) && !noindex && !shouldNoindex) issue("可索引页面不在 sitemap 中");
    page.noindex = noindex;

    const mainText = root.querySelector("main")?.text ?? "";
    for (const f of FORBIDDEN) if (f.test(mainText)) issue(`正文出现禁止字样 ${f}`);
    if (/\d+\s*家中|并列第|中位数/.test(mainText)) issue("正文出现横向排名表述");

    const ldBlocks = root.querySelectorAll('script[type="application/ld+json"]');
    const ldTypes = [];
    const ldNodes = [];
    for (const s of ldBlocks) {
      try {
        const data = JSON.parse(s.text);
        const list = Array.isArray(data) ? data : [data];
        for (const d of list) {
          if (!d["@type"]) issue("JSON-LD 缺少 @type");
          ldTypes.push(d["@type"]);
          ldNodes.push(d);
        }
      } catch {
        issue("JSON-LD 无法解析");
      }
    }
    page.jsonLd = ldTypes;
    // 顶层类型只允许站主指令列出的六种
    const ALLOWED_LD = new Set(["WebSite", "Organization", "BreadcrumbList", "BlogPosting", "ItemList", "FAQPage"]);
    for (const t of ldTypes) if (!ALLOWED_LD.has(t)) issue(`JSON-LD 顶层类型 ${t} 不在允许范围内`);

    // 可见文本（去掉 script / style 后的 body 文本），用于核对结构化数据是否与正文一致
    const vis = parse(res.text);
    vis.querySelectorAll("script, style, template, noscript").forEach((n) => n.remove());
    const visible = squash(vis.querySelector("body")?.text ?? "");
    const timeValues = new Set(root.querySelectorAll("time").map((t) => (t.getAttribute("datetime") ?? "").slice(0, 10)));

    // 禁止的 JSON-LD 键；FAQPage 必须与可见问答一致；BlogPosting 的标题与日期必须与页面一致
    walkLd(ldNodes, (node) => {
      for (const k of FORBIDDEN_LD_KEYS) if (k in node) issue(`JSON-LD 出现禁止的键 ${k}`);
      const t = node["@type"];
      if (t === "Question") {
        if (!visible.includes(squash(node.name))) issue(`FAQPage 问题在页面上不可见：${String(node.name).slice(0, 30)}`);
        const ans = node.acceptedAnswer?.text;
        if (ans && !visible.includes(squash(ans))) issue(`FAQPage 答案在页面上不可见：${String(node.name).slice(0, 30)}`);
      }
      if (t === "BlogPosting") {
        const h1 = squash(root.querySelector("h1")?.text);
        if (squash(node.headline) !== h1) issue(`BlogPosting.headline 与 H1 不一致：${node.headline}`);
        for (const k of ["datePublished", "dateModified"]) {
          const d = String(node[k] ?? "").slice(0, 10);
          if (!d) issue(`BlogPosting 缺少 ${k}`);
          else if (!timeValues.has(d)) issue(`BlogPosting.${k}（${d}）没有对应的页面可见日期`);
        }
      }
      if (t === "BreadcrumbList") {
        const crumbs = root.querySelectorAll("nav[aria-label='面包屑'] li").map((li) => squash(li.text));
        const names = (node.itemListElement ?? []).map((i) => squash(i.name));
        if (crumbs.length && JSON.stringify(crumbs) !== JSON.stringify(names)) issue(`BreadcrumbList 与可见面包屑不一致：${names.join(" > ")} / ${crumbs.join(" > ")}`);
      }
    });

    // 旧站名、与推荐榜矛盾的“不排名”说法
    if (/机场选(?![择购])/.test(visible)) issue("页面仍出现旧站名“机场选”");
    if (/不打分、不排名|不显示评分与排名|不展示排名/.test(visible)) issue("页面仍有与首页推荐榜矛盾的“不排名”表述");

    // Title 显示宽度（全角 2，半角 1）超过 70 时提示可能被截断
    if (title && displayWidth(title) > 70) page.warnings = [...(page.warnings ?? []), `title 显示宽度 ${displayWidth(title)}，搜索结果可能截断`];

    const isArticle = /^\/(recommend|reviews|compare|speedtest|guides|lingdongyun)\/[a-z0-9-]+\/$/.test(p) && !/\/page\/\d+\/$/.test(p);
    const brandMatch = /^\/brands\/([a-z0-9-]+)\/$/.exec(p);
    if (brandMatch || p === "/lingdongyun/") {
      const slug = brandMatch ? brandMatch[1] : "lingdongyun";
      const brand = BRANDS_DATA.find((b) => b.slug === slug);
      const planRows = root.querySelectorAll("#plans table tbody tr").length;
      page.planRows = planRows;
      if (!planRows) issue("品牌页没有套餐表");
      if (!/原稿参考价|资料已核对|价格已核对/.test(mainText)) issue("品牌页缺少资料状态标注");
      if (!ldTypes.includes("BlogPosting")) issue("品牌页缺少 BlogPosting JSON-LD");
      if (!root.querySelectorAll("time").length) issue("品牌页没有可见的发布 / 更新日期");
      // 购买按钮必须指向本品牌的推广地址
      const ownHost = brand?.affiliateUrl ? new URL(brand.affiliateUrl).host : null;
      for (const a of root.querySelectorAll("a[rel~='sponsored']")) {
        const host = (() => {
          try {
            return new URL(a.getAttribute("href")).host;
          } catch {
            return "";
          }
        })();
        if (ownHost && host !== ownHost) issue(`品牌页的推广按钮指向了其他品牌：${host}`);
      }
      // 首页推荐榜上的品牌都必须有编辑正文
      if (HOME_EXPECT.rankingPaths.includes(p)) {
        const editorial = root.querySelector("article[aria-label$='编辑正文'] .prose-article");
        const chars = cjk(editorial?.text ?? "");
        page.editorialCjk = chars;
        if (chars < MIN_EDITORIAL_CJK) issue(`品牌编辑正文只有 ${chars} 个汉字（要求 ≥ ${MIN_EDITORIAL_CJK}）`);
        if (!ldTypes.includes("FAQPage")) issue("推荐品牌页缺少可见常见问题与 FAQPage");
      }
    }
    if (isArticle) {
      if (!ldTypes.includes("BlogPosting")) issue("文章页缺少 BlogPosting JSON-LD");
      if (!ldTypes.includes("BreadcrumbList")) issue("文章页缺少 BreadcrumbList JSON-LD");
      const bodyText = root.querySelector(".prose-article")?.text.replace(/\s+/g, "") ?? "";
      page.bodyChars = bodyText.length;
      if (bodyText.length < 600) issue(`文章正文 HTML 字数过少（${bodyText.length}）`);
      if (!root.querySelector("nav[aria-label='面包屑']")) issue("文章页缺少面包屑");
    }
    if (p === "/brands/" && !JSON.stringify(ldNodes).includes('"ItemList"')) issue("/brands/ 缺少 ItemList JSON-LD");

    // 首页：站主指定的 Title / Description / H1 / H2 结构 / 推荐榜顺序 / ItemList
    if (p === "/") {
      if (title !== HOME_EXPECT.title) issue(`首页 title 与指定不一致：${title}`);
      if (desc !== HOME_EXPECT.description) issue("首页 description 与指定不一致");
      if (squash(page.h1) !== squash(HOME_EXPECT.h1)) issue(`首页 H1 与指定不一致：${page.h1}`);
      const h2s = root.querySelectorAll("main h2").map((h) => h.text.trim());
      let cursor = -1;
      for (const want of HOME_EXPECT.h2) {
        const at = h2s.findIndex((h, i) => i > cursor && squash(h) === squash(want));
        if (at === -1) issue(`首页缺少（或顺序不对）H2：${want}`);
        else cursor = at;
      }
      const ranking = root.querySelector("#ranking");
      const h3s = ranking ? ranking.querySelectorAll("h3").map((h) => h.text.trim()) : [];
      if (JSON.stringify(h3s.map(squash)) !== JSON.stringify(HOME_EXPECT.rankingH3.map(squash))) issue(`首页推荐榜 H3 顺序不符：${h3s.join(" / ")}`);
      const h3Links = ranking ? ranking.querySelectorAll("h3 a").map((a) => a.getAttribute("href")) : [];
      if (JSON.stringify(h3Links) !== JSON.stringify(HOME_EXPECT.rankingPaths)) issue(`首页推荐榜链接不符：${h3Links.join(" ")}`);
      if (!ranking || !/编辑推荐顺序/.test(ranking.text) || !/推广合作/.test(ranking.text)) issue("首页推荐榜缺少“编辑推荐、含推广合作”披露");
      const itemList = ldNodes.find((n) => n["@type"] === "ItemList");
      if (!itemList) issue("首页缺少 ItemList JSON-LD");
      else {
        const urls = (itemList.itemListElement ?? []).map((i) => new URL(i.url).pathname);
        if (JSON.stringify(urls) !== JSON.stringify(HOME_EXPECT.rankingPaths)) issue(`首页 ItemList 顺序与推荐榜不一致：${urls.join(" ")}`);
      }
      page.homeH2 = h2s;
    }
    if (!ldTypes.includes("Organization")) issue("缺少 Organization JSON-LD");
    if (p !== "/" && !p.startsWith("/search/") && !ldTypes.includes("BreadcrumbList")) issue("缺少 BreadcrumbList JSON-LD");

    const imgs = root.querySelectorAll("img");
    const noAlt = imgs.filter((i) => i.getAttribute("alt") === undefined || i.getAttribute("alt") === null);
    if (noAlt.length) issue(`${noAlt.length} 张图片缺少 alt`);
    const noDims = imgs.filter((i) => !i.getAttribute("width") || !i.getAttribute("height"));
    if (noDims.length) issue(`${noDims.length} 张图片缺少 width/height（可能引起布局偏移）`);

    const anchors = root.querySelectorAll("a[href]");
    page.links = 0;
    for (const a of anchors) {
      const href = a.getAttribute("href");
      const n = normalizeInternal(href, p);
      if (!n) continue;
      if (n.external) {
        const u = new URL(n.external);
        const rel = (a.getAttribute("rel") ?? "").toLowerCase();
        const sponsored = SPONSORED_HOSTS.some((h) => u.host === h || u.host.endsWith(`.${h}`));
        const info = externalLinks.get(n.external) ?? { pages: new Set(), rel, sponsored };
        info.pages.add(p);
        externalLinks.set(n.external, info);
        if (sponsored && !rel.includes("sponsored")) issue(`推广外链缺少 rel=sponsored：${n.external}`);
        if (!rel.includes("noopener")) issue(`外链缺少 rel=noopener：${n.external}`);
        continue;
      }
      page.links++;
      const target = n.internal;
      const clean = target.split("?")[0];
      if (!clean.endsWith("/") && !isFileLike(clean)) issue(`站内链接缺少结尾斜杠：${target}`);
      if (clean.startsWith("/search/")) continue;
      if (!seen.has(clean) && !queue.includes(clean) && !isFileLike(clean) && !clean.startsWith("/_next/")) queue.push(clean);
      if (isFileLike(clean) || clean.startsWith("/_next/")) {
        const st = await checkLink(clean);
        if (st !== 200) issue(`资源链接 ${clean} 返回 ${st}`);
      }
    }
    page.bytes = Buffer.byteLength(res.text, "utf8");
    page.scripts = root.querySelectorAll("script[src]").length;
    pages.push(page);
  }

  // 站内链接 200 检查（抓取时已访问所有内部页面；这里汇总死链）
  for (const page of pages) {
    const dead = [];
    const root = parse((await get(`${BASE}${page.path}`)).text);
    for (const a of root.querySelectorAll("a[href]")) {
      const n = normalizeInternal(a.getAttribute("href"), page.path);
      if (!n || n.external) continue;
      const clean = n.internal.split("?")[0];
      if (clean.startsWith("/search/")) continue;
      const st = linkStatus.get(clean) ?? (await checkLink(clean));
      if (st !== 200) dead.push(`${clean}（${st}）`);
    }
    if (dead.length) page.issues.push(`死链：${[...new Set(dead)].join(", ")}`);
  }

  const pageFails = pages.filter((p) => p.issues.length);
  if (pageFails.length) {
    for (const p of pageFails) fail("pages", p.path, p.issues.join("；"));
  }
  const pageWarns = pages.filter((p) => p.warnings?.length && !p.noindex);
  for (const p of pageWarns) warn("seo", p.path, p.warnings.join("；"));
  const home = pages.find((p) => p.path === "/");
  if (home && !home.issues.length)
    pass("home", `首页 Title / Description / H1 / ${HOME_EXPECT.h2.length} 个 H2 / 推荐榜 ${HOME_EXPECT.rankingH3.length} 个 H3 与 ItemList 顺序与指定一致`);
  const editorialPages = pages.filter((p) => p.editorialCjk !== undefined);
  if (editorialPages.length) pass("brands", `推荐品牌编辑正文汉字数：${editorialPages.map((p) => `${p.path} ${p.editorialCjk}`).join("，")}`);
  pass("pages", `已抓取 ${pages.length} 个 HTML 页面，${pages.length - pageFails.length} 个无问题`);
  const missingInSitemap = pages.filter((p) => !p.noindex && !sitemapPaths.has(p.path));
  if (missingInSitemap.length) warn("sitemap", "可索引页面不在 sitemap", missingInSitemap.map((p) => p.path).join(", "));
  const sitemapNotCrawled = [...sitemapPaths].filter((p) => !seen.has(p));
  if (sitemapNotCrawled.length) fail("sitemap", "sitemap 页面未能访问", sitemapNotCrawled.join(", "));
  else pass("sitemap", "sitemap 中所有页面均返回 200");

  const ext = [...externalLinks.entries()].map(([url, i]) => ({ url, rel: i.rel, sponsored: i.sponsored, pages: i.pages.size }));
  pass("links", `外链 ${ext.length} 个（推广外链 ${ext.filter((e) => e.sponsored).length} 个）`);

  const maxBytes = Math.max(...pages.map((p) => p.bytes));
  const avgBytes = Math.round(pages.reduce((s, p) => s + p.bytes, 0) / pages.length);
  pass("perf", `HTML 体积：平均 ${Math.round(avgBytes / 1024)} KB，最大 ${Math.round(maxBytes / 1024)} KB；脚本标签最多 ${Math.max(...pages.map((p) => p.scripts))} 个`);

  // ---- 输出 ----
  const fails = results.filter((r) => r.level === "fail");
  const warns = results.filter((r) => r.level === "warn");
  const passes = results.filter((r) => r.level === "pass");
  for (const r of results) {
    const mark = r.level === "pass" ? "✓" : r.level === "fail" ? "✗" : "⚠";
    console.log(`${mark} [${r.group}] ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n通过 ${passes.length}，警告 ${warns.length}，失败 ${fails.length}，耗时 ${Math.round((Date.now() - started) / 1000)}s`);

  fs.mkdirSync(path.dirname(path.join(process.cwd(), OUT)), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), OUT),
    JSON.stringify({ base: BASE, site: SITE, at: new Date().toISOString(), summary: { pass: passes.length, warn: warns.length, fail: fails.length }, results, pages, externalLinks: ext }, null, 2),
    "utf8",
  );
  console.log(`报告：${OUT}`);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
