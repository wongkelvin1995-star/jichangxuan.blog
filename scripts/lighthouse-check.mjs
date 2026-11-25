#!/usr/bin/env node
/**
 * Lighthouse 批量测试（实验室数据，只作参考；上线后以 PageSpeed Insights / CrUX 实测为准）。
 *
 * 用法：
 *   node scripts/lighthouse-check.mjs http://localhost:3100 [--runs 3] [--out reports/lighthouse-2026-11-24] [--pages /,/compare/]
 *
 * 前置：本机装有 Chrome（自动读取 CHROME_PATH，或使用 Windows 默认安装路径）；Lighthouse 通过 npx 运行（lighthouse@13.6.0）。
 * 每个页面分别跑移动端（默认模拟节流）与桌面端（--preset=desktop），各 N 次，取中位数写入 summary.json 与 summary.md。
 * 测试期间不要运行其他重负载任务，否则 CPU 指标（TBT）会偏高。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : def;
};
const BASE = (args.find((a) => /^https?:\/\//.test(a)) ?? "http://localhost:3000").replace(/\/+$/, "");
const RUNS = Number(opt("--runs", "3"));
const OUT = opt("--out", `reports/lighthouse-${new Date().toISOString().slice(0, 10)}`);
const PAGES = (opt("--pages", "/,/lingdongyun/,/brands/muguang-jiasu/,/compare/,/recommend/,/guides/clash-verge-rev-guide/") ?? "").split(",").filter(Boolean);
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

fs.mkdirSync(OUT, { recursive: true });

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};
const slug = (p) => (p === "/" ? "home" : p.replace(/^\/|\/$/g, "").replace(/\//g, "-"));

const rows = [];
for (const page of PAGES) {
  for (const form of ["mobile", "desktop"]) {
    const runs = [];
    for (let i = 1; i <= RUNS; i++) {
      const file = path.join(OUT, `${slug(page)}-${form}-${i}.json`);
      const cliArgs = [
        "-y",
        "lighthouse@13.6.0",
        `${BASE}${page}`,
        "--quiet",
        "--output=json",
        `--output-path=${file}`,
        "--only-categories=performance,accessibility,best-practices,seo",
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
        ...(form === "desktop" ? ["--preset=desktop"] : []),
      ];
      try {
        execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", cliArgs, {
          stdio: "ignore",
          env: { ...process.env, CHROME_PATH: CHROME },
          shell: process.platform === "win32",
          timeout: 180000,
        });
        const lhr = JSON.parse(fs.readFileSync(file, "utf8"));
        if (lhr.runtimeError) throw new Error(lhr.runtimeError.message);
        const a = lhr.audits;
        runs.push({
          performance: Math.round(lhr.categories.performance.score * 100),
          accessibility: Math.round(lhr.categories.accessibility.score * 100),
          bestPractices: Math.round(lhr.categories["best-practices"].score * 100),
          seo: Math.round(lhr.categories.seo.score * 100),
          fcpMs: Math.round(a["first-contentful-paint"].numericValue),
          lcpMs: Math.round(a["largest-contentful-paint"].numericValue),
          tbtMs: Math.round(a["total-blocking-time"].numericValue),
          cls: Number(a["cumulative-layout-shift"].numericValue.toFixed(3)),
          siMs: Math.round(a["speed-index"].numericValue),
        });
        console.log(`[lighthouse] ${page} ${form} #${i}: 性能 ${runs.at(-1).performance}，LCP ${runs.at(-1).lcpMs} ms，TBT ${runs.at(-1).tbtMs} ms，CLS ${runs.at(-1).cls}`);
      } catch (e) {
        console.error(`[lighthouse] ${page} ${form} #${i} 失败：${e.message}`);
      }
    }
    if (!runs.length) continue;
    const pick = (k) => median(runs.map((r) => r[k]));
    rows.push({
      page,
      form,
      runs: runs.length,
      performance: pick("performance"),
      performanceRange: `${Math.min(...runs.map((r) => r.performance))}–${Math.max(...runs.map((r) => r.performance))}`,
      accessibility: pick("accessibility"),
      bestPractices: pick("bestPractices"),
      seo: pick("seo"),
      fcpMs: pick("fcpMs"),
      lcpMs: pick("lcpMs"),
      tbtMs: pick("tbtMs"),
      cls: pick("cls"),
      siMs: pick("siMs"),
    });
  }
}

fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ base: BASE, runsPerPage: RUNS, at: new Date().toISOString(), rows }, null, 2), "utf8");
const md = [
  `# Lighthouse 汇总（${BASE}，每项 ${RUNS} 次取中位数）`,
  "",
  "| 页面 | 设备 | 性能（范围） | 无障碍 | 最佳实践 | SEO | FCP | LCP | TBT | CLS |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map(
    (r) =>
      `| ${r.page} | ${r.form === "mobile" ? "移动" : "桌面"} | ${r.performance}（${r.performanceRange}） | ${r.accessibility} | ${r.bestPractices} | ${r.seo} | ${r.fcpMs} ms | ${r.lcpMs} ms | ${r.tbtMs} ms | ${r.cls} |`,
  ),
  "",
  "实验室数据：本机 localhost，没有 CDN 与真实网络延迟；上线后以 PageSpeed Insights 与 CrUX 实测为准。",
].join("\n");
fs.writeFileSync(path.join(OUT, "summary.md"), md, "utf8");
console.log(`\n${md}\n\n报告目录：${OUT}`);
