// content-keywords 审计用临时脚本：按 data/brands.json 字段统计七个品牌的散文/要点汉字数（只读）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const brands = JSON.parse(fs.readFileSync(path.join(root, "data", "brands.json"), "utf8"));
const han = (s) => ((s ?? "").match(/[㐀-鿿豈-﫿]/g) || []).length;
const sum = (arr) => (arr ?? []).reduce((n, s) => n + han(typeof s === "string" ? s : JSON.stringify(s)), 0);

const ids = ["lingdongyun", "muguang-jiasu", "weifeng-wangluo", "feimaoyun", "flyv", "langwang", "yinxingren"];
for (const id of ids) {
  const b = brands.find((x) => x.id === id);
  const row = {
    id,
    tagline: han(b.tagline),
    summary: han(b.summary),
    audiences: sum(b.audiences),
    clientPolicy: sum(b.clientPolicy),
    trafficRules: sum(b.trafficRules),
    caveats: sum(b.caveats),
    conflicts: sum(b.conflicts),
    marketingClaims: sum(b.marketingClaims),
    streamingNote: han(b.streamingNote),
    nodeCountNote: han(b.nodeCountNote),
    support: sum(Object.values(b.support ?? {}).flat().filter((v) => typeof v === "string")),
    purchaseSteps: sum(b.purchaseSteps),
    verificationNotes: sum((b.verificationNotes ?? []).map((v) => `${v.field}${v.finding}${v.status}`)),
  };
  row.proseIntro = row.tagline + row.summary;
  row.brandSpecificBullets = row.audiences + row.clientPolicy + row.trafficRules + row.caveats + row.conflicts + row.marketingClaims + row.streamingNote + row.nodeCountNote + row.support + row.verificationNotes;
  console.log(JSON.stringify(row));
}

// 灵动云专题页里写死的编辑文案
const page = fs.readFileSync(path.join(root, "app", "lingdongyun", "page.tsx"), "utf8");
const faq = fs.readFileSync(path.join(root, "lib", "faq.ts"), "utf8");
const block = (src, start, end) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));
const features = block(page, "const FEATURES", "];");
const trouble = block(page, "const TROUBLESHOOTING", "];");
const ldyFaq = faq.slice(faq.indexOf("LINGDONGYUN_FAQ"));
const notSuitable = (page.match(/不太适合：[^<]+/) || [""])[0];
console.log(JSON.stringify({ hubFeaturesHan: han(features), hubTroubleshootingHan: han(trouble.replace(/href: "[^"]+"/g, "")), hubFaqHan: han(ldyFaq), hubNotSuitableHan: han(notSuitable) }));
