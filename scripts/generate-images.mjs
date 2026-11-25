#!/usr/bin/env node
/**
 * 生成站内图片（手动执行 `npm run og`，输出提交到仓库）：
 *  1. public/images/covers/<name>.svg   文章封面（浏览器渲染，矢量，含中文）
 *  2. public/images/og/<name>.png       Open Graph 图（1200×630，PNG）
 *  3. public/images/og/logo-512.png     Organization logo
 *  4. public/images/evidence/*.webp     站长提供的测速截图（≤1600px、webp）
 *
 * 参数：--latin-only  OG 图只用拉丁文字（当本机缺少中文字体导致 PNG 渲染为方块时使用）
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LATIN_ONLY = process.argv.includes("--latin-only");

const COVERS = [
  { name: "default", kicker: "JICHANGXUAN", label: "机场优选", sub: "2026 机场推荐与套餐对比", seed: 0 },
  { name: "recommend", kicker: "RECOMMEND", label: "按需选机场", sub: "AI 工具、流媒体、多设备与预算", seed: 1 },
  { name: "reviews", kicker: "REVIEWS", label: "机场测评", sub: "基于资料与测试记录的评价", seed: 2 },
  { name: "compare", kicker: "COMPARE", label: "套餐比较", sub: "价格、流量、周期一目了然", seed: 3 },
  { name: "speedtest", kicker: "SPEEDTEST", label: "节点实测", sub: "测试记录与节点知识", seed: 4 },
  { name: "guides", kicker: "GUIDES", label: "使用教程", sub: "Windows、Android、iOS 与 Clash", seed: 5 },
  { name: "lingdongyun", kicker: "LINGDONGYUN", label: "灵动云专区", sub: "品牌介绍、套餐与教程", seed: 6 },
  // 测评专区：每家一张封面，主色不同，主标题为“品牌名测评”
  { name: "review-lingdongyun", kicker: "REVIEW · LINGDONGYUN", label: "灵动云测评", sub: "资料与三份带日期的测试记录", seed: 11, color: "#2563EB" },
  { name: "review-muguang-jiasu", kicker: "REVIEW · TWILIGHT", label: "暮光加速测评", sub: "四档套餐与 IPLC 专线出口", seed: 12, color: "#7C3AED" },
  { name: "review-weifeng-wangluo", kicker: "REVIEW · BREEZENET", label: "微风网络测评", sub: "全 IPLC 专线与共享流量", seed: 13, color: "#0D9488" },
  { name: "review-feimaoyun", kicker: "REVIEW · FLYCAT", label: "飞猫云测评", sub: "全 IPLC 与学生版年付", seed: 14, color: "#EA580C" },
  { name: "review-dalaoyun", kicker: "REVIEW · DALAOYUN", label: "大佬云测评", sub: "IEPL 专线与入门月付", seed: 15, color: "#B45309" },
  { name: "review-yinxingren", kicker: "REVIEW · INVISIBLE", label: "隐形人测评", sub: "IEPL + BGP 与限设备流量包", seed: 16, color: "#475569" },
  { name: "review-flyv", kicker: "REVIEW · FLYV", label: "FLYV 飞V测评", sub: "分地区线路与官方客户端", seed: 17, color: "#0284C7" },
  { name: "review-langwang", kicker: "REVIEW · WAVENET", label: "浪网测评", sub: "企业级 IEPL 与大流量档", seed: 18, color: "#0369A1" },
  { name: "review-tiziyun", kicker: "REVIEW · LADDERCLOUD", label: "梯子云测评", sub: "中转与专线分档的四档套餐", seed: 19, color: "#16A34A" },
  { name: "review-wuyou", kicker: "REVIEW · WUYOU", label: "无忧链接测评", sub: "全线 IPLC 与低价入门档", seed: 20, color: "#DB2777" },
  { name: "review-firefly", kicker: "REVIEW · FIREFLY", label: "Firefly测评", sub: "IPLC 专线与四档周期套餐", seed: 21, color: "#CA8A04" },
  { name: "review-quanqiuyun", kicker: "REVIEW · QUANQIUYUN", label: "全球云测评", sub: "BGP 专线出口与轻量版", seed: 22, color: "#4F46E5" },
];

const EVIDENCE = [
  { src: "source-materials/evidence/灵动云_实测报告_浅色版.png", out: "lingdongyun-2026-11-10-report.webp" },
  { src: "source-materials/evidence/灵动云节点检测-2026-11-01.jpg", out: "lingdongyun-2026-11-01-miaoko.webp" },
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 伪随机：同一 seed 产生同一组装饰形状，保证构建可重复 */
function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function artwork(seed, color = "#2563EB") {
  const r = rng(seed + 7);
  const circles = [];
  for (let i = 0; i < 3; i++) {
    const cx = 760 + r() * 360;
    const cy = 80 + r() * 420;
    const rad = 60 + r() * 150;
    circles.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" stroke="${color}" stroke-opacity="${(0.1 + r() * 0.15).toFixed(2)}" fill="none" stroke-width="1.5"/>`);
  }
  const dots = [];
  for (let i = 0; i < 6; i++) {
    dots.push(`<circle cx="${(700 + r() * 460).toFixed(0)}" cy="${(60 + r() * 500).toFixed(0)}" r="${(3 + r() * 5).toFixed(0)}" fill="${color}" fill-opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`);
  }
  const y1 = 380 + r() * 160;
  const y2 = 420 + r() * 160;
  const curve = `<path d="M-20 ${y1.toFixed(0)} C 260 ${(y1 - 160).toFixed(0)}, 480 ${(y2 + 80).toFixed(0)}, 760 ${(y2 - 120).toFixed(0)} S 1100 ${(y1 - 60).toFixed(0)}, 1240 ${(y1 - 140).toFixed(0)}" stroke="url(#line)" stroke-width="2.5" fill="none"/>`;
  const curve2 = `<path d="M-20 ${(y1 + 60).toFixed(0)} C 300 ${(y1 - 80).toFixed(0)}, 520 ${(y2 + 120).toFixed(0)}, 800 ${(y2 - 40).toFixed(0)} S 1120 ${(y1 + 20).toFixed(0)}, 1240 ${(y1 - 60).toFixed(0)}" stroke="url(#line)" stroke-width="1.5" fill="none"/>`;
  const card1 = `<rect x="${(820 + r() * 100).toFixed(0)}" y="${(330 + r() * 80).toFixed(0)}" width="200" height="110" rx="18" fill="#DCEBFF" fill-opacity="0.75"/>`;
  const card2 = `<rect x="${(1000 + r() * 60).toFixed(0)}" y="${(400 + r() * 60).toFixed(0)}" width="150" height="84" rx="14" fill="#DCEBFF" fill-opacity="0.55"/>`;
  return `${circles.join("")}${curve}${curve2}${card1}${card2}${dots.join("")}`;
}

const FONT = `Inter, 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', Roboto, Arial, sans-serif`;

function coverSvg({ kicker, label, sub, seed, color = "#2563EB" }, { latin = false, forOg = false } = {}) {
  const review = kicker.startsWith("REVIEW");
  const title = latin ? kicker.charAt(0) + kicker.slice(1).toLowerCase() : label;
  const subtitle = latin ? "jichangxuan.blog" : sub;
  const brand = latin ? "JichangXuan · jichangxuan.blog" : "机场优选 · JichangXuan";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(label)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#F3F7FD"/>
      <stop offset="1" stop-color="#DCEBFF"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${color}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0.05"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" stroke="${color}" stroke-opacity="0.08" fill="none"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  ${artwork(seed, color)}
  ${review ? `<rect x="900" y="96" width="228" height="56" rx="28" fill="${color}" fill-opacity="0.12"/><text x="1014" y="133" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="700" fill="${color}">2026 测评</text>` : ""}
  <g transform="translate(72 78)">
    <rect width="56" height="56" rx="14" fill="${color}"/>
    <path d="M14 31 42 16.5 32 42l-5-10.3L14 31Z" fill="#fff" opacity="0.95"/>
  </g>
  <text x="72" y="${forOg ? 220 : 236}" font-family="${FONT}" font-size="22" font-weight="700" letter-spacing="6" fill="${color}">${esc(kicker)}</text>
  <text x="72" y="${forOg ? 330 : 346}" font-family="${FONT}" font-size="${latin ? 88 : review && label.length > 5 ? 84 : 96}" font-weight="700" fill="#14273D" letter-spacing="-1">${esc(title)}</text>
  <text x="72" y="${forOg ? 400 : 416}" font-family="${FONT}" font-size="30" fill="#3B4D63">${esc(subtitle)}</text>
  <text x="72" y="560" font-family="${FONT}" font-size="22" font-weight="600" fill="#5B6B7F">${esc(brand)}</text>
</svg>
`;
}

function logoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#2563EB"/><path d="M12 26.5 36 14l-8.5 22-4.3-8.8L12 26.5Z" fill="#fff" opacity="0.95"/><path d="M23.2 27.2 36 14" stroke="#DCEBFF" stroke-width="2" stroke-linecap="round"/></svg>`;
}

async function main() {
  const coversDir = path.join(ROOT, "public", "images", "covers");
  const ogDir = path.join(ROOT, "public", "images", "og");
  const evidenceDir = path.join(ROOT, "public", "images", "evidence");
  for (const d of [coversDir, ogDir, evidenceDir]) fs.mkdirSync(d, { recursive: true });

  for (const c of COVERS) {
    fs.writeFileSync(path.join(coversDir, `${c.name}.svg`), coverSvg(c), "utf8");
  }
  console.log(`[images] 封面 SVG：${COVERS.length} 个 → public/images/covers/`);

  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn("[images] 未安装 sharp，跳过 PNG / webp 生成（npm install 后重试）。");
    return;
  }

  for (const c of COVERS) {
    const svg = Buffer.from(coverSvg(c, { latin: LATIN_ONLY, forOg: true }));
    await sharp(svg, { density: 144 }).resize(1200, 630).png({ compressionLevel: 9 }).toFile(path.join(ogDir, `${c.name}.png`));
  }
  await sharp(Buffer.from(logoSvg())).resize(512, 512).png().toFile(path.join(ogDir, "logo-512.png"));
  console.log(`[images] OG PNG：${COVERS.length} 个 + logo-512.png → public/images/og/（${LATIN_ONLY ? "仅拉丁文字" : "含中文"}）`);

  for (const e of EVIDENCE) {
    const src = path.join(ROOT, e.src);
    if (!fs.existsSync(src)) {
      console.warn(`[images] 证据图不存在，跳过：${e.src}`);
      continue;
    }
    const out = path.join(evidenceDir, e.out);
    const info = await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
    console.log(`[images] 证据图：${e.out}（${info.width}×${info.height}，${Math.round(info.size / 1024)} KB）`);
  }
}

main().catch((e) => {
  console.error(`[images] 失败：${e.message}`);
  process.exit(1);
});
