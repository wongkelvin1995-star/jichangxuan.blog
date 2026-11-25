// performance 审计员临时脚本：只读解析 reports/lighthouse/*.json，不修改任何项目文件。
// 用法：
//   node reports/performance-lh-extract.mjs summary
//   node reports/performance-lh-extract.mjs audits [文件名过滤]
//   node reports/performance-lh-extract.mjs details <文件名> <auditId> [最多条目数]
//   node reports/performance-lh-extract.mjs network <文件名>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "lighthouse");
const mode = process.argv[2] || "summary";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
const r1 = (n) => (typeof n === "number" ? Math.round(n * 1000) / 1000 : n);

if (mode === "summary" || mode === "repeat") {
  const list =
    mode === "repeat"
      ? fs.readdirSync(here).filter((f) => /^performance-repeat-.*\.json$/.test(f) && !/-0\.(trace|devtoolslog)\.json$/.test(f)).sort()
      : files;
  for (const f of list) {
    const lhr = mode === "repeat" ? JSON.parse(fs.readFileSync(path.join(here, f), "utf8")) : load(f);
    const a = lhr.audits;
    const cat = (id) => (lhr.categories[id]?.score == null ? null : Math.round(lhr.categories[id].score * 100));
    const num = (id) => r1(a[id]?.numericValue);
    console.log(
      JSON.stringify({
        file: f,
        requestedUrl: lhr.requestedUrl,
        finalDisplayedUrl: lhr.finalDisplayedUrl,
        mainDocumentUrl: lhr.mainDocumentUrl,
        lighthouseVersion: lhr.lighthouseVersion,
        fetchTime: lhr.fetchTime,
        userAgent: lhr.environment?.networkUserAgent,
        benchmarkIndex: lhr.environment?.benchmarkIndex,
        formFactor: lhr.configSettings.formFactor,
        screen: lhr.configSettings.screenEmulation,
        throttlingMethod: lhr.configSettings.throttlingMethod,
        throttling: lhr.configSettings.throttling,
        runtimeError: lhr.runtimeError ?? null,
        runWarnings: lhr.runWarnings,
        scores: { performance: cat("performance"), accessibility: cat("accessibility"), bestPractices: cat("best-practices"), seo: cat("seo") },
        metrics: {
          fcpMs: num("first-contentful-paint"),
          lcpMs: num("largest-contentful-paint"),
          tbtMs: num("total-blocking-time"),
          cls: num("cumulative-layout-shift"),
          speedIndexMs: num("speed-index"),
        },
        displayValues: {
          fcp: a["first-contentful-paint"]?.displayValue,
          lcp: a["largest-contentful-paint"]?.displayValue,
          tbt: a["total-blocking-time"]?.displayValue,
          cls: a["cumulative-layout-shift"]?.displayValue,
          si: a["speed-index"]?.displayValue,
        },
      })
    );
  }
} else if (mode === "audits") {
  const filter = process.argv[3];
  for (const f of files.filter((x) => !filter || x.includes(filter))) {
    const lhr = load(f);
    const catOf = {};
    for (const [cid, c] of Object.entries(lhr.categories)) for (const ref of c.auditRefs) (catOf[ref.id] ||= []).push(cid + (ref.weight ? `(w${ref.weight})` : ""));
    console.log(`\n===== ${f} =====`);
    for (const [id, au] of Object.entries(lhr.audits)) {
      if (!catOf[id]) continue;
      const mode2 = au.scoreDisplayMode;
      if (mode2 === "notApplicable" || mode2 === "manual") continue;
      const ms = au.metricSavings ? Object.fromEntries(Object.entries(au.metricSavings).filter(([, v]) => v)) : null;
      const hasSavings = ms && Object.keys(ms).length > 0;
      const failing = au.score !== null && au.score < 1;
      if (!failing && !hasSavings) continue;
      const items = au.details?.items;
      console.log(
        [
          id,
          `score=${au.score}`,
          `mode=${mode2}`,
          au.displayValue ? `display=${JSON.stringify(au.displayValue)}` : "",
          hasSavings ? `savings=${JSON.stringify(ms)}` : "",
          au.details?.overallSavingsMs ? `overallMs=${r1(au.details.overallSavingsMs)}` : "",
          au.details?.overallSavingsBytes ? `overallBytes=${au.details.overallSavingsBytes}` : "",
          Array.isArray(items) ? `items=${items.length}` : "",
          `cat=${catOf[id].join("|")}`,
        ]
          .filter(Boolean)
          .join("  ")
      );
    }
  }
} else if (mode === "details") {
  const f = process.argv[3];
  const id = process.argv[4];
  const max = Number(process.argv[5] || 15);
  const au = load(f).audits[id];
  if (!au) {
    console.log("no such audit");
    process.exit(0);
  }
  const { details, ...rest } = au;
  console.log(JSON.stringify(rest, null, 1));
  if (details) {
    const clip = (v, depth = 0) => {
      if (Array.isArray(v)) return v.slice(0, max).map((x) => clip(x, depth + 1));
      if (v && typeof v === "object") {
        const o = {};
        for (const [k, val] of Object.entries(v)) {
          if (k === "data" && typeof val === "string" && val.length > 200) o[k] = val.slice(0, 60) + "...";
          else o[k] = depth > 6 ? "[deep]" : clip(val, depth + 1);
        }
        return o;
      }
      if (typeof v === "string" && v.length > 400) return v.slice(0, 400) + "...";
      return v;
    };
    console.log(JSON.stringify(clip(details), null, 1));
  }
} else if (mode === "network") {
  const f = process.argv[3];
  const items = load(f).audits["network-requests"]?.details?.items || [];
  let total = 0;
  const byType = {};
  for (const it of items) {
    total += it.transferSize || 0;
    const t = it.resourceType || "?";
    byType[t] ||= { count: 0, transfer: 0, resource: 0 };
    byType[t].count++;
    byType[t].transfer += it.transferSize || 0;
    byType[t].resource += it.resourceSize || 0;
  }
  console.log(JSON.stringify({ requests: items.length, totalTransfer: total, byType }, null, 1));
  for (const it of items) {
    console.log(
      [it.resourceType, it.statusCode, it.transferSize, it.resourceSize, it.priority, it.protocol, it.mimeType, it.url.length > 140 ? it.url.slice(0, 140) + "..." : it.url].join("  ")
    );
  }
}
