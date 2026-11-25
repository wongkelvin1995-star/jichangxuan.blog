// performance 审计员临时脚本：只读分析 Lighthouse --save-assets 产生的 trace，统计主线程上的样式/布局事件与强制同步布局。
// 用法：node reports/performance-trace-analyze.mjs <trace.json>
import fs from "node:fs";

const file = process.argv[2];
const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const events = Array.isArray(raw) ? raw : raw.traceEvents;

// 找到被测页面的渲染进程主线程（CrRendererMain，且有 navigationStart / 页面 URL 的那个）
const threadNames = events.filter((e) => e.ph === "M" && e.name === "thread_name");
const mains = threadNames.filter((e) => e.args?.name === "CrRendererMain").map((e) => `${e.pid}:${e.tid}`);
const navStart = events.find((e) => e.name === "navigationStart" && e.args?.data?.isLoadingMainFrame && /^http/.test(e.args?.data?.documentLoaderURL || ""));
const mainKey = navStart ? `${navStart.pid}:${navStart.tid}` : mains[0];
const t0 = navStart ? navStart.ts : 0;
console.log("main thread:", mainKey, "candidates:", mains.join(","), "navStart url:", navStart?.args?.data?.documentLoaderURL);

const onMain = events.filter((e) => `${e.pid}:${e.tid}` === mainKey && e.ph === "X" && typeof e.dur === "number");
const sum = (arr) => arr.reduce((a, e) => a + e.dur, 0) / 1000;
const byName = {};
for (const e of onMain) {
  byName[e.name] ||= { count: 0, ms: 0, max: 0 };
  byName[e.name].count++;
  byName[e.name].ms += e.dur / 1000;
  byName[e.name].max = Math.max(byName[e.name].max, e.dur / 1000);
}
const top = Object.entries(byName)
  .sort((a, b) => b[1].ms - a[1].ms)
  .slice(0, 22)
  .map(([n, v]) => `${n}: count=${v.count} total=${v.ms.toFixed(1)}ms max=${v.max.toFixed(1)}ms`);
console.log("\n[主线程事件按总耗时排序（未乘 CPU 降速系数，即本机实测）]");
console.log(top.join("\n"));

const tasks = onMain.filter((e) => e.name === "RunTask").sort((a, b) => b.dur - a.dur).slice(0, 6);
console.log("\n[最长的 6 个 RunTask（本机实测）]");
for (const t of tasks) {
  const inside = onMain.filter((e) => e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e !== t);
  const agg = {};
  for (const e of inside) {
    if (["Layout", "UpdateLayoutTree", "ParseHTML", "EvaluateScript", "FunctionCall", "v8.compile", "Paint", "PrePaint", "Layerize", "TimerFire", "EventDispatch", "v8.run", "RunMicrotasks", "ParseAuthorStyleSheet", "HitTest", "IntersectionObserverController::computeIntersections", "ScheduleStyleRecalculation", "UpdateLayer", "Commit"].includes(e.name)) {
      agg[e.name] = (agg[e.name] || 0) + e.dur / 1000;
    }
  }
  console.log(
    `start=${((t.ts - t0) / 1000).toFixed(0)}ms dur=${(t.dur / 1000).toFixed(1)}ms :: ` +
      Object.entries(agg)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}=${v.toFixed(1)}`)
        .join(", ")
  );
}

console.log("\n[最长的 Layout 事件]");
for (const e of onMain.filter((x) => x.name === "Layout").sort((a, b) => b.dur - a.dur).slice(0, 6)) {
  const d = e.args?.beginData || {};
  const st = d.stackTrace?.[0];
  console.log(
    `t=${((e.ts - t0) / 1000).toFixed(0)}ms dur=${(e.dur / 1000).toFixed(1)}ms dirtyObjects=${d.dirtyObjects} totalObjects=${d.totalObjects} partial=${d.partialLayout}` +
      (st ? ` forcedBy=${st.functionName || "(anon)"} @ ${st.url}:${st.lineNumber}:${st.columnNumber}` : "")
  );
}

console.log("\n[最长的 UpdateLayoutTree（样式重算）事件]");
for (const e of onMain.filter((x) => x.name === "UpdateLayoutTree").sort((a, b) => b.dur - a.dur).slice(0, 6)) {
  const ec = e.args?.elementCount ?? e.args?.data?.elementCount;
  const st = e.args?.beginData?.stackTrace?.[0];
  console.log(`t=${((e.ts - t0) / 1000).toFixed(0)}ms dur=${(e.dur / 1000).toFixed(1)}ms elementCount=${ec}` + (st ? ` forcedBy=${st.functionName || "(anon)"} @ ${st.url}:${st.lineNumber}:${st.columnNumber}` : ""));
}

// 强制同步布局：Layout / UpdateLayoutTree 带 JS 调用栈
const forced = onMain.filter((e) => (e.name === "Layout" || e.name === "UpdateLayoutTree") && e.args?.beginData?.stackTrace?.length);
console.log(`\n[带 JS 调用栈的强制样式/布局] 共 ${forced.length} 次，合计 ${sum(forced).toFixed(1)}ms`);
const fAgg = {};
for (const e of forced) {
  const st = e.args.beginData.stackTrace[0];
  const k = `${e.name} <- ${st.functionName || "(anon)"} @ ${st.url.replace(/^http:\/\/localhost:3100/, "")}:${st.lineNumber}:${st.columnNumber}`;
  fAgg[k] = (fAgg[k] || 0) + e.dur / 1000;
}
for (const [k, v] of Object.entries(fAgg).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`${v.toFixed(1)}ms  ${k}`);

// 字体回退 / 文本整形相关事件（CJK 文本布局成本的线索）
const fontEv = events.filter((e) => `${e.pid}:${e.tid}` === mainKey && /font|Font|Shap/.test(e.name) && typeof e.dur === "number");
const fAgg2 = {};
for (const e of fontEv) fAgg2[e.name] = (fAgg2[e.name] || 0) + e.dur / 1000;
console.log("\n[字体/整形相关事件]", JSON.stringify(Object.fromEntries(Object.entries(fAgg2).map(([k, v]) => [k, Math.round(v * 10) / 10]))));
