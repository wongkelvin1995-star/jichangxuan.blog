// trust-commercial 审计用的只读分析脚本：读取 reports/trust-commercial-*.html（从 http://localhost:3100 抓取的页面），
// 输出 reports/trust-commercial-analysis.json。不修改任何项目文件。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const brands = JSON.parse(fs.readFileSync(path.join(root, "data", "brands.json"), "utf8"));
const affHosts = new Map();
for (const b of brands) {
  if (b.affiliateUrl) affHosts.set(new URL(b.affiliateUrl).host, b.id);
}
const offHosts = new Map();
for (const b of brands) {
  if (b.officialUrl) offHosts.set(new URL(b.officialUrl).host, b.id);
}

const files = fs
  .readdirSync(here)
  .filter((f) => f.startsWith("trust-commercial-") && f.endsWith(".html"))
  .sort();

const CONFLICT_RE = /不排名|不打分|不是评分排名|不代表评分高低|评分排名|不显示评分与排名|不用评分和排名|不编造评分|不做评分|排名|排行|评分/g;
const CLAIM_RE = /好评|用户评价|用户反馈|口碑|收录|保证|承诺|最快|最稳|首选|推荐指数|★|满分|秒开|不掉线|零掉线|100%|永久|不降速|晚高峰稳定|丝滑|流畅|极速|顶级|性价比之王|无限速|不限速|原生 ?IP|全解锁|稳定/g;
const PRICE_LABEL_RE = /原稿参考价|已核对|核对日期|资料日期|待核实|未在品牌后台|资料已核对/;

function ctx(text, idx, len, span = 50) {
  const s = Math.max(0, idx - span);
  const e = Math.min(text.length, idx + len + span);
  return text.slice(s, e).replace(/\s+/g, " ").trim();
}

function textOf(el) {
  return (el.structuredText ?? el.text ?? "").replace(/\s+/g, " ").trim();
}

function nearestHeading(el) {
  // 向上找最近的祖先，并在其中找第一个 h1-h4
  let cur = el;
  for (let i = 0; i < 10 && cur; i++) {
    const h = cur.querySelector?.("h1, h2, h3, h4");
    if (h && cur.tagName !== "BODY") return `${h.tagName.toLowerCase()}: ${textOf(h).slice(0, 60)}`;
    cur = cur.parentNode;
  }
  return null;
}

const out = {};
for (const f of files) {
  const html = fs.readFileSync(path.join(here, f), "utf8");
  const doc = parse(html, { comment: false });
  doc.querySelectorAll("script, style, template").forEach((e) => e.remove());
  const head = {
    lang: doc.querySelector("html")?.getAttribute("lang") ?? null,
    title: doc.querySelector("title")?.text ?? null,
    description: doc.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
    ogDescription: doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? null,
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    robots: doc.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null,
  };
  const body = doc.querySelector("body");
  const text = body ? body.structuredText : "";
  const h1s = (body?.querySelectorAll("h1") ?? []).map(textOf);

  // 1. 冲突措辞
  const conflicts = [];
  for (const src of [
    ["title", head.title ?? ""],
    ["meta-description", head.description ?? ""],
    ["body", text],
  ]) {
    const [where, t] = src;
    for (const m of t.matchAll(CONFLICT_RE)) {
      conflicts.push({ where, match: m[0], context: ctx(t, m.index, m[0].length) });
    }
  }

  // 2. 外链与 rel
  const links = [];
  for (const a of body?.querySelectorAll("a[href]") ?? []) {
    const href = a.getAttribute("href");
    if (!/^https?:\/\//i.test(href)) continue;
    let host;
    try {
      host = new URL(href).host;
    } catch {
      host = "invalid";
    }
    if (host === "localhost:3100" || host === "jichangxuan.blog") continue;
    const rel = a.getAttribute("rel") ?? "";
    const affBrand = affHosts.get(host) ?? null;
    // 披露邻近度：向上找祖先，看何时文本里首次出现“推广”
    let level = null;
    let snippet = null;
    let cur = a.parentNode;
    for (let i = 1; i <= 8 && cur; i++) {
      const t = textOf(cur);
      const linkText = textOf(a);
      const tWithoutLink = t.replace(linkText, "");
      const idx = tWithoutLink.search(/推广|披露|广告|sponsored/);
      if (idx >= 0) {
        level = i;
        snippet = ctx(tWithoutLink, idx, 2, 60);
        break;
      }
      cur = cur.parentNode;
    }
    links.push({
      href,
      host,
      affBrand,
      officialBrand: offHosts.get(host) ?? null,
      rel,
      sponsored: /\bsponsored\b/.test(rel),
      target: a.getAttribute("target") ?? null,
      text: textOf(a),
      heading: nearestHeading(a),
      disclosureLevel: level,
      disclosureSnippet: snippet,
    });
  }

  // 3. 价格标注
  const prices = [];
  const priceNodes = [];
  (function walk(node) {
    for (const c of node.childNodes ?? []) {
      if (c.nodeType === 3) {
        if (/¥\s?\d/.test(c.rawText)) priceNodes.push(c);
      } else walk(c);
    }
  })(body ?? doc);
  for (const n of priceNodes) {
    let cur = n.parentNode;
    let found = null;
    for (let i = 1; i <= 6 && cur; i++) {
      const t = textOf(cur);
      const m = t.match(PRICE_LABEL_RE);
      if (m) {
        found = { level: i, label: m[0] };
        break;
      }
      cur = cur.parentNode;
    }
    prices.push({ text: n.rawText.replace(/\s+/g, " ").trim().slice(0, 80), parentTag: n.parentNode?.tagName, label: found });
  }

  // 4. 宣传 / 推测性措辞
  const claims = [];
  for (const m of text.matchAll(CLAIM_RE)) {
    claims.push({ match: m[0], context: ctx(text, m.index, m[0].length, 40) });
  }

  // 5. 作者
  const authorLinks = (body?.querySelectorAll('a[rel~="author"]') ?? []).map((a) => ({ href: a.getAttribute("href"), text: textOf(a) }));
  const authorAnchor = !!body?.querySelector("#author");

  out[f.replace(/^trust-commercial-/, "").replace(/\.html$/, "")] = {
    head,
    h1s,
    textLength: text.length,
    conflicts,
    links,
    prices,
    claims,
    authorLinks,
    authorAnchor,
  };
}

fs.writeFileSync(path.join(here, "trust-commercial-analysis.json"), JSON.stringify(out, null, 2), "utf8");

// 简要输出
for (const [k, v] of Object.entries(out)) {
  const aff = v.links.filter((l) => l.affBrand);
  const nonSponsoredAff = aff.filter((l) => !l.sponsored);
  const ext = v.links.filter((l) => !l.affBrand);
  const unlabeledPrices = v.prices.filter((p) => !p.label);
  console.log(
    `${k}: conflicts=${v.conflicts.length} affLinks=${aff.length} affNoSponsored=${nonSponsoredAff.length} otherExt=${ext.length} prices=${v.prices.length} unlabeledPrices=${unlabeledPrices.length} claims=${v.claims.length} authorLinks=${JSON.stringify(v.authorLinks)} #author=${v.authorAnchor}`,
  );
}
