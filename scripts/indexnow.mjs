#!/usr/bin/env node
/**
 * IndexNow 提交脚本（手动执行，不随构建或页面访问触发）。
 *
 * 用法：
 *   node scripts/indexnow.mjs --dry-run              # 只列出将提交的 URL，不发送、不写记录
 *   node scripts/indexnow.mjs                        # 提交 sitemap 中 lastmod 变化或新增的 URL，并通知已从 sitemap 移除且已返回 404/410/301 的 URL
 *   node scripts/indexnow.mjs --all                  # 提交 sitemap 全部 URL（首次上线或更换密钥时）
 *   node scripts/indexnow.mjs --urls /a/,/b/         # 提交指定路径（必须是 sitemap 里的规范 URL）
 *   node scripts/indexnow.mjs --removed /old/        # 通知已删除或迁移的页面（脚本先确认它返回 404/410/301/308）
 *   node scripts/indexnow.mjs --sitemap out/sitemap.xml   # 从本地文件读取 sitemap（默认读取线上 /sitemap.xml）
 *
 * 前置条件：
 *   - .env.local 或环境变量中有 INDEXNOW_KEY；
 *   - 线上已能访问 https://<域名>/<key>.txt 且内容等于密钥，否则脚本拒绝提交（避免在未部署时假装已提交）。
 *
 * 记录：
 *   - .indexnow/state.json：每个 URL 最后一次成功提交时的 sitemap lastmod（不重复提交没变化的页面）。
 *   - .indexnow/log.jsonl：每次运行的结果，包括成功、HTTP 失败、网络错误、密钥验证失败、sitemap 读取失败与 Retry-After。
 */
import fs from "node:fs";
import path from "node:path";

import { loadEnv, siteUrl } from "./env.mjs";

loadEnv();

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
};

const DRY = flag("--dry-run");
const ALL = flag("--all");
const SITE = siteUrl();
const HOST = new URL(SITE).host;
const KEY = process.env.INDEXNOW_KEY;
const ENDPOINT = "https://api.indexnow.org/IndexNow";
const STATE_DIR = path.join(process.cwd(), ".indexnow");
const STATE_FILE = path.join(STATE_DIR, "state.json");
const LOG_FILE = path.join(STATE_DIR, "log.jsonl");
const UA = { "User-Agent": "jichangxuan-indexnow/1.1" };
// 运行模式在任何网络请求之前确定，失败日志里的 mode 才准确
let MODE = flag("--urls") ? "urls" : flag("--removed") ? "removed" : ALL ? "all" : "changed";

// 需要参数的选项缺少参数时直接报错，避免静默退回默认模式而误提交
for (const name of ["--urls", "--removed", "--sitemap"]) {
  if (!flag(name)) continue;
  const value = opt(name);
  if (!value || value.startsWith("--")) {
    console.error(`[indexnow] ${name} 需要参数，例如 ${name === "--sitemap" ? "--sitemap out/sitemap.xml" : `${name} /guides/clash-verge-rev-guide/`}`);
    process.exit(1);
  }
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { submitted: {} };
  }
}

function writeState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

/** 干运行不写日志；其余情况（包括失败）都写一行 JSON */
function appendLog(entry) {
  if (DRY) return;
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, `${JSON.stringify({ at: new Date().toISOString(), mode: MODE, ...entry })}\n`, "utf8");
}

function fail(stage, message, extra = {}, code = 1) {
  console.error(`[indexnow] ${message}`);
  appendLog({ stage, ok: false, error: message, ...extra });
  process.exit(code);
}

async function loadSitemap() {
  const src = opt("--sitemap");
  let xml;
  if (src && fs.existsSync(src)) {
    xml = fs.readFileSync(src, "utf8");
  } else {
    const url = src ?? `${SITE}/sitemap.xml`;
    let res;
    try {
      res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
    } catch (e) {
      fail("sitemap", `无法读取 sitemap（${url}）：${String(e)}`);
    }
    if (!res.ok) fail("sitemap", `无法读取 sitemap（${url}）：HTTP ${res.status}`, { status: res.status });
    xml = await res.text();
  }
  const entries = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>(.*?)<\/loc>/.exec(m[1])?.[1]?.trim();
    const lastmod = /<lastmod>(.*?)<\/lastmod>/.exec(m[1])?.[1]?.trim() ?? null;
    if (loc) entries.push({ loc, lastmod });
  }
  return entries;
}

function toAbsolute(p) {
  return /^https?:\/\//.test(p) ? p : `${SITE}${p.startsWith("/") ? p : `/${p}`}`;
}

/** 确认 URL 已不再是 200：404/410 视为删除，301/308 视为迁移（返回新地址） */
async function checkGone(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual", headers: UA, signal: AbortSignal.timeout(20000) });
    if (res.status === 404 || res.status === 410) return { gone: true, status: res.status };
    if (res.status === 301 || res.status === 308) {
      const location = res.headers.get("location");
      return { gone: true, status: res.status, movedTo: location ? new URL(location, url).toString() : null };
    }
    return { gone: false, status: res.status };
  } catch (e) {
    return { gone: false, status: 0, error: String(e) };
  }
}

async function verifyKeyFile() {
  const url = `${SITE}/${KEY}.txt`;
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
    const body = (await res.text()).trim();
    return { ok: res.ok && body === KEY, status: res.status, url };
  } catch (e) {
    return { ok: false, status: 0, url, error: String(e) };
  }
}

async function main() {
  if (!KEY) {
    console.error("[indexnow] 未设置 INDEXNOW_KEY。请在 .env.local 中设置后再运行；可先用 --dry-run 查看将提交的 URL。");
    if (!DRY) process.exit(1);
  }

  const state = readState();
  let targets = [];

  if (opt("--urls")) {
    MODE = "urls";
    const entries = await loadSitemap();
    const byLoc = new Map(entries.map((e) => [e.loc, e]));
    const requested = opt("--urls")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(toAbsolute);
    const notInSitemap = requested.filter((u) => !byLoc.has(u));
    if (notInSitemap.length) {
      fail("validate", `以下 URL 不在 sitemap 中（可能缺少结尾斜杠、是 noindex 页面或尚未发布），已拒绝：${notInSitemap.join("、")}`, { urls: notInSitemap });
    }
    // 记录 sitemap 里的 lastmod，而不是当天日期，避免下次增量运行重复提交
    targets = requested.map((u) => byLoc.get(u));
  } else if (opt("--removed")) {
    MODE = "removed";
    const requested = opt("--removed")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(toAbsolute);
    for (const u of requested) {
      const check = await checkGone(u);
      if (!check.gone) fail("validate", `${u} 仍返回 HTTP ${check.status}${check.error ? `（${check.error}）` : ""}，不是 404/410/301/308，已拒绝提交`, { url: u, status: check.status });
      targets.push({ loc: u, lastmod: null, removed: true, status: check.status });
      if (check.movedTo) targets.push({ loc: check.movedTo, lastmod: null, movedFrom: u });
    }
  } else {
    const entries = await loadSitemap();
    const inSitemap = new Set(entries.map((e) => e.loc));
    if (ALL) {
      MODE = "all";
      targets = entries;
    } else {
      targets = entries.filter((e) => state.submitted[e.loc] !== (e.lastmod ?? ""));
      // 删除 / 迁移检测：提交过、但已不在 sitemap 里的 URL
      const dropped = Object.keys(state.submitted).filter((u) => !inSitemap.has(u));
      for (const u of dropped) {
        const check = await checkGone(u);
        if (check.gone) {
          targets.push({ loc: u, lastmod: null, removed: true, status: check.status });
          if (check.movedTo && !targets.some((t) => t.loc === check.movedTo)) targets.push({ loc: check.movedTo, lastmod: null, movedFrom: u });
        } else {
          console.warn(`[indexnow] 警告：${u} 已不在 sitemap 中，但仍返回 HTTP ${check.status}，未提交（若是有意改为 noindex，可忽略）。`);
        }
      }
    }
    console.log(`[indexnow] sitemap 共 ${entries.length} 个 URL，${MODE === "all" ? "全部提交" : `本次需要提交 ${targets.length} 个（新增、lastmod 变化或已删除 / 迁移）`}`);
  }

  const bad = targets.filter((t) => !t.loc.startsWith(SITE));
  if (bad.length) fail("validate", `以下 URL 不属于 ${HOST}，已拒绝：${bad.map((b) => b.loc).join("、")}`);

  // 只提交线上确实返回 200 的页面（删除通知除外）。
  // 用本地 --sitemap 时尤其重要：没上线的地址不提交、不记录，正式上线后的增量运行才会补交。
  const notLive = [];
  for (const t of targets) {
    if (t.removed) continue;
    let status = 0;
    try {
      const res = await fetch(t.loc, { method: "HEAD", redirect: "manual", headers: UA, signal: AbortSignal.timeout(20000) });
      status = res.status;
    } catch {
      status = 0;
    }
    if (status !== 200) notLive.push({ loc: t.loc, status });
  }
  if (notLive.length) {
    console.warn(`[indexnow] 以下 ${notLive.length} 个 URL 线上没有返回 200，本次不提交、也不记录：`);
    for (const n of notLive) console.warn(`  ${n.loc}（HTTP ${n.status || "无法连接"}）`);
    targets = targets.filter((t) => t.removed || !notLive.some((n) => n.loc === t.loc));
  }

  if (!targets.length) {
    console.log("[indexnow] 没有需要提交的 URL。");
    return;
  }

  console.log(`[indexnow] 将提交 ${targets.length} 个 URL（模式：${MODE}）：`);
  for (const t of targets) console.log(`  ${t.removed ? `[删除 ${t.status}] ` : t.movedFrom ? "[迁移后的新地址] " : ""}${t.loc}${t.lastmod ? `  (lastmod ${t.lastmod})` : ""}`);

  if (KEY) {
    const check = await verifyKeyFile();
    if (!check.ok) {
      const msg = `密钥文件尚不可访问：${check.url}（HTTP ${check.status}${check.error ? `，${check.error}` : ""}）。网站尚未部署或密钥文件未上线，本次不提交。`;
      if (DRY) console.error(`[indexnow] ${msg}`);
      else fail("verify-key", msg, { status: check.status }, 2);
    } else {
      console.log(`[indexnow] 密钥文件已验证：${check.url}`);
    }
  }

  if (DRY) {
    console.log("[indexnow] 干运行结束：未发送请求，未写入记录。");
    return;
  }

  const BATCH = 1000;
  for (let i = 0; i < targets.length; i += BATCH) {
    const chunk = targets.slice(i, i + BATCH);
    const body = { host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: chunk.map((t) => t.loc) };
    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", ...UA },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });
    } catch (e) {
      fail("submit", `提交请求失败（网络错误或超时）：${String(e)}`, { count: chunk.length, urls: chunk.map((t) => t.loc) }, 3);
    }
    const text = await res.text();
    const accepted = res.status === 200 || res.status === 202;
    const retryAfter = res.headers.get("retry-after");
    appendLog({
      stage: "submit",
      ok: accepted,
      status: res.status,
      retryAfter,
      count: chunk.length,
      response: text.slice(0, 500),
      urls: chunk.map((t) => (t.removed ? `[removed] ${t.loc}` : t.loc)),
    });
    console.log(`[indexnow] 批次 ${i / BATCH + 1}：HTTP ${res.status}${accepted ? "（已接收；202 表示密钥仍待验证。接收不等于收录）" : "（失败）"}`);
    if (!accepted) {
      console.error(`[indexnow] 响应：${text.slice(0, 300)}`);
      if (res.status === 429 || res.status >= 500) console.error(`[indexnow] 请稍后重试${retryAfter ? `（Retry-After：${retryAfter}）` : ""}。`);
      process.exit(3);
    }
    for (const t of chunk) {
      if (t.removed) delete state.submitted[t.loc];
      else if (t.lastmod !== null || !t.movedFrom) state.submitted[t.loc] = t.lastmod ?? "";
    }
    writeState(state);
  }
  console.log(`[indexnow] 完成。记录已写入 ${path.relative(process.cwd(), LOG_FILE)}`);
}

main().catch((e) => {
  console.error(`[indexnow] 出错：${e.message}`);
  appendLog({ stage: "unknown", ok: false, error: e.message });
  process.exit(1);
});
