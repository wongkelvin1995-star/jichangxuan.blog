// performance 审计员临时脚本（只读）：用本机 Chrome + 已缓存的 puppeteer-core 访问 http://localhost:3100，
// 不修改任何项目文件，只把结果写到 reports/performance-browser-probe-*.json。
// 用法：
//   node reports/performance-browser-probe.mjs coldwarm   冷/热两次加载的首次布局耗时对比（trace）
//   node reports/performance-browser-probe.mjs pages      sitemap 全部 URL 的 <img>、DOM、横向溢出、按钮对比度、外部资源检查
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const PPTR = "C:/Users/USERR/AppData/Local/npm-cache/_npx/ba16b138af87a83e/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const mod = await import(pathToFileURL(PPTR).href);
const puppeteer = mod.default ?? mod;
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3100";
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36";
const mode = process.argv[2] || "pages";

async function launch() {
  return puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
}
async function mobilePage(browser, width = 412, height = 823) {
  const page = await browser.newPage();
  await page.setUserAgent(MOBILE_UA);
  await page.setViewport({ width, height, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  return page;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function layoutStats(traceBuf) {
  const raw = JSON.parse(new TextDecoder("utf-8").decode(traceBuf));
  const evs = raw.traceEvents || raw;
  const per = {};
  for (const e of evs) {
    if (e.ph !== "X" || typeof e.dur !== "number") continue;
    if (e.name !== "Layout" && e.name !== "UpdateLayoutTree" && e.name !== "RunTask") continue;
    const k = `${e.pid}:${e.tid}`;
    per[k] ||= { layoutMs: 0, maxLayoutMs: 0, maxLayoutObjects: 0, styleMs: 0, longTaskMs: 0, longTasks: 0 };
    const p = per[k];
    if (e.name === "Layout") {
      p.layoutMs += e.dur / 1000;
      if (e.dur / 1000 > p.maxLayoutMs) {
        p.maxLayoutMs = e.dur / 1000;
        p.maxLayoutObjects = e.args?.beginData?.dirtyObjects;
      }
    } else if (e.name === "UpdateLayoutTree") p.styleMs += e.dur / 1000;
    else if (e.dur >= 50000) {
      p.longTaskMs += e.dur / 1000;
      p.longTasks++;
    }
  }
  const best = Object.values(per).sort((a, b) => b.layoutMs - a.layoutMs)[0];
  const r = (n) => Math.round(n * 10) / 10;
  return best && { layoutMs: r(best.layoutMs), maxLayoutMs: r(best.maxLayoutMs), maxLayoutObjects: best.maxLayoutObjects, styleMs: r(best.styleMs), longTasks: best.longTasks, longTaskMs: r(best.longTaskMs) };
}

async function tracedLoad(page, url) {
  await page.tracing.start({ categories: ["devtools.timeline", "disabled-by-default-devtools.timeline"] });
  await page.goto(url, { waitUntil: "load" });
  await sleep(1500);
  const buf = await page.tracing.stop();
  return layoutStats(buf);
}

if (mode === "coldwarm") {
  const out = [];
  const plan = [
    ["A", ["/brands/muguang-jiasu/", "/brands/muguang-jiasu/", "/", "/"]],
    ["B", ["/", "/", "/guides/clash-verge-rev-guide/", "/compare/"]],
  ];
  for (const [label, urls] of plan) {
    const browser = await launch();
    const page = await mobilePage(browser);
    let i = 0;
    for (const u of urls) {
      const s = await tracedLoad(page, BASE + u);
      const row = { browser: label, seq: ++i, url: u, ...s };
      out.push(row);
      console.log(JSON.stringify(row));
    }
    await browser.close();
  }
  fs.writeFileSync(path.join(here, "performance-browser-probe-coldwarm.json"), JSON.stringify(out, null, 1));
} else if (mode === "cls") {
  // 桌面视口下 /compare/ 的布局偏移时间点与 /plans.json 加载完成时间对照
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1350, height: 940, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    window.__ls = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        window.__ls.push({ t: Math.round(e.startTime), value: Math.round(e.value * 10000) / 10000, hadRecentInput: e.hadRecentInput, sources: (e.sources || []).map((s) => (s.node && s.node.nodeName) + " " + (s.node && s.node.textContent ? s.node.textContent.trim().slice(0, 30) : "")) });
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(BASE + "/compare/", { waitUntil: "load" });
  await sleep(3000);
  const r = await page.evaluate(() => ({
    shifts: window.__ls,
    plansJson: performance.getEntriesByType("resource").filter((e) => e.name.includes("/plans.json")).map((e) => ({ start: Math.round(e.startTime), end: Math.round(e.responseEnd) })),
    fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1),
    rows: document.querySelectorAll("table.plan-table tbody tr").length,
  }));
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
} else if (mode === "inp") {
  // 交互延迟实验（实验室近似 INP）：4 倍 CPU 降速 + 移动端视口，用 Event Timing API 记录可信键盘/点击事件的耗时
  const out = [];
  const browser = await launch();
  const page = await mobilePage(browser);
  const cdp = await page.createCDPSession();
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const observe = () =>
    page.evaluate(() => {
      window.__ev = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries())
          if (e.interactionId) window.__ev.push({ name: e.name, dur: e.duration, inputDelay: e.processingStart - e.startTime, processing: e.processingEnd - e.processingStart, presentation: e.startTime + e.duration - e.processingEnd });
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    });
  const rows = () => page.$$eval("table.plan-table tbody tr", (r) => r.length);
  const take = async (label) => {
    const ev = await page.evaluate(() => window.__ev.splice(0));
    const worst = ev.sort((a, b) => b.dur - a.dur)[0] || null;
    const row = { step: label, events: ev.length, worst };
    out.push(row);
    console.log(JSON.stringify(row));
  };

  await page.goto(BASE + "/compare/", { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelectorAll("table.plan-table tbody tr").length > 100, { timeout: 30000 });
  await observe();
  console.log("compare rows after load:", await rows());
  await page.focus("form select");
  await page.keyboard.press("ArrowDown");
  await sleep(2000);
  console.log("compare rows after ArrowDown (单品牌):", await rows());
  await take("compare: 品牌筛选 全部→单品牌 (keydown)");
  await page.keyboard.press("ArrowUp");
  await sleep(2000);
  console.log("compare rows after ArrowUp (全部):", await rows());
  await take("compare: 品牌筛选 单品牌→全部 (keydown)");

  await page.goto(BASE + "/", { waitUntil: "load" });
  await sleep(1500);
  await observe();
  const tabs = await page.$$(".tab-btn");
  console.log("home tab buttons:", tabs.length);
  if (tabs.length > 1) {
    await tabs[1].click();
    await sleep(1500);
    await take("home: 最新文章分类标签切换 (click)");
  }
  await page.focus("form select");
  await page.keyboard.press("ArrowDown");
  await sleep(1500);
  await take("home: 套餐表品牌筛选 (keydown)");
  await browser.close();
  fs.writeFileSync(path.join(here, "performance-browser-probe-inp.json"), JSON.stringify(out, null, 1));
} else if (mode === "pages") {
  const sm = await (await fetch(BASE + "/sitemap.xml")).text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https:\/\/jichangxuan\.blog/, BASE));
  const browser = await launch();
  const page = await mobilePage(browser);
  const results = [];
  for (const url of urls) {
    const resp = await page.goto(url, { waitUntil: "load" });
    await sleep(700);
    const data = await page.evaluate(() => {
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth;
      const imgs = [...document.images].map((img) => {
        const r = img.getBoundingClientRect();
        return {
          src: (img.currentSrc || img.src).replace(location.origin, ""),
          alt: img.getAttribute("alt"),
          width: img.getAttribute("width"),
          height: img.getAttribute("height"),
          loading: img.getAttribute("loading"),
          fetchpriority: img.getAttribute("fetchpriority"),
          ariaHidden: img.getAttribute("aria-hidden"),
          absTop: Math.round(r.top + window.scrollY),
          aboveFold: r.top + window.scrollY < vh,
          rendered: [Math.round(r.width), Math.round(r.height)],
          natural: [img.naturalWidth, img.naturalHeight],
        };
      });
      const lum = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b] = m[1].split(",").map((x) => parseFloat(x) / 255);
        const f = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const btns = [...document.querySelectorAll(".prose-article a.btn")].map((a) => {
        const cs = getComputedStyle(a);
        const L1 = lum(cs.color);
        const L2 = lum(cs.backgroundColor);
        const ratio = L1 != null && L2 != null ? (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) : null;
        return { text: a.textContent.trim(), cls: a.className, color: cs.color, bg: cs.backgroundColor, ratio: ratio && Math.round(ratio * 100) / 100 };
      });
      const origin = location.origin;
      const external = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((n) => !n.startsWith(origin) && !n.startsWith("data:"));
      const extTags = [
        ...[...document.querySelectorAll("script[src]")].map((s) => s.src),
        ...[...document.querySelectorAll("link[href]")].filter((l) => /stylesheet|preconnect|preload|dns-prefetch|modulepreload/.test(l.rel)).map((l) => l.href),
      ].filter((u) => !u.startsWith(origin));
      const fonts = [...document.fonts].map((f) => `${f.family}:${f.status}`);
      const overflow412 = document.documentElement.scrollWidth - vw;
      const offenders = [];
      if (overflow412 > 0) {
        for (const el of document.body.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.right <= vw + 1) continue;
          let p = el.parentElement,
            clipped = false;
          while (p && p !== document.body) {
            const ox = getComputedStyle(p).overflowX;
            if (ox !== "visible") {
              clipped = true;
              break;
            }
            p = p.parentElement;
          }
          if (!clipped) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")} right=${Math.round(r.right)}`);
          if (offenders.length >= 3) break;
        }
      }
      return {
        domElements: document.getElementsByTagName("*").length,
        scrollHeight: document.documentElement.scrollHeight,
        vw,
        overflow412,
        offenders,
        imgs,
        btns,
        external,
        extTags,
        fonts,
        viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? null,
      };
    });
    await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await sleep(250);
    const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
    const row = { url: url.replace(BASE, ""), status: resp?.status(), overflow360, ...data };
    results.push(row);
    console.log(
      `${row.status} ${row.url} dom=${row.domElements} h=${row.scrollHeight} imgs=${row.imgs.length} ovf412=${row.overflow412} ovf360=${row.overflow360} btnInProse=${row.btns.length}${row.btns.length ? " ratio=" + row.btns.map((b) => b.ratio).join("/") : ""} ext=${row.external.length + row.extTags.length} fonts=${row.fonts.length}`
    );
  }
  await browser.close();
  fs.writeFileSync(path.join(here, "performance-browser-probe-pages.json"), JSON.stringify(results, null, 1));
}
