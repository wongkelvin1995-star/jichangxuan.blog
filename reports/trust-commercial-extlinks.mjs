// trust-commercial 审计：抓取 http://localhost:3100 的 sitemap 全部 URL（另加 /tags/、/search/），
// 检查所有站外链接的 rel；只读，结果写到 reports/trust-commercial-extlinks.json。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const BASE = "http://localhost:3100";
const brands = JSON.parse(fs.readFileSync(path.join(root, "data", "brands.json"), "utf8"));
const affHosts = new Map(brands.filter((b) => b.affiliateUrl).map((b) => [new URL(b.affiliateUrl).host, b.id]));

const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
const paths = [...sm.matchAll(/<loc>https:\/\/jichangxuan\.blog([^<]*)<\/loc>/g)].map((m) => m[1]);
paths.push("/tags/", "/search/");

const result = { pages: 0, external: [], problems: [], ctaWithoutNearbyDisclosure: [] };
for (const p of paths) {
  const res = await fetch(`${BASE}${p}`, { redirect: "manual" });
  const html = await res.text();
  result.pages++;
  const doc = parse(html, { comment: false });
  doc.querySelectorAll("script, style, template").forEach((e) => e.remove());
  for (const a of doc.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!/^https?:\/\//i.test(href)) continue;
    const host = new URL(href).host;
    if (host === "localhost:3100" || host === "jichangxuan.blog") continue;
    const rel = a.getAttribute("rel") ?? "";
    const entry = { page: p, status: res.status, href, rel, text: a.text.trim(), affBrand: affHosts.get(host) ?? null };
    result.external.push(entry);
    if (entry.affBrand && !/\bsponsored\b/.test(rel)) result.problems.push({ ...entry, problem: "affiliate link without rel=sponsored" });
    if (!entry.affBrand && !/\bnofollow\b|\bsponsored\b/.test(rel)) result.problems.push({ ...entry, problem: "external link without nofollow/sponsored" });
    // 推广按钮附近（3 层祖先内）是否有“推广”字样
    if (entry.affBrand) {
      let cur = a.parentNode;
      let ok = false;
      for (let i = 0; i < 3 && cur; i++) {
        const t = cur.text.replace(a.text, "");
        if (/推广/.test(t)) {
          ok = true;
          break;
        }
        cur = cur.parentNode;
      }
      if (!ok) result.ctaWithoutNearbyDisclosure.push({ page: p, text: entry.text, href });
    }
  }
}
fs.writeFileSync(path.join(here, "trust-commercial-extlinks.json"), JSON.stringify(result, null, 2), "utf8");
const byBrand = {};
for (const e of result.external) byBrand[e.affBrand ?? e.href] = (byBrand[e.affBrand ?? e.href] ?? 0) + 1;
console.log(`pages=${result.pages} externalLinks=${result.external.length} problems=${result.problems.length} ctaWithoutDisclosureWithin3Levels=${result.ctaWithoutNearbyDisclosure.length}`);
console.log("rel values:", [...new Set(result.external.map((e) => e.rel))]);
console.log("link texts:", [...new Set(result.external.map((e) => e.text))]);
console.log("per brand:", JSON.stringify(byBrand));
for (const c of result.ctaWithoutNearbyDisclosure) console.log("no-nearby-disclosure:", c.page, c.text);
for (const pr of result.problems) console.log("problem:", pr.page, pr.href, pr.rel, pr.problem);
