// 构建前执行：根据 INDEXNOW_KEY 生成 public/<key>.txt，供 IndexNow 校验站点所有权。
// 未设置密钥时跳过（不影响构建），并清理之前生成的密钥文件。
import fs from "node:fs";
import path from "node:path";

import { loadEnv } from "./env.mjs";

loadEnv();

const publicDir = path.join(process.cwd(), "public");
fs.mkdirSync(publicDir, { recursive: true });

// 只清理旧的 IndexNow 密钥文件（内容等于文件名本身）；security.txt 等站长自己放的 .txt 不动
for (const file of fs.readdirSync(publicDir)) {
  const m = /^([a-zA-Z0-9-]{8,128})\.txt$/.exec(file);
  if (!m || file === "robots.txt") continue;
  const full = path.join(publicDir, file);
  if (fs.statSync(full).isFile() && fs.readFileSync(full, "utf8").trim() === m[1]) fs.unlinkSync(full);
}

const key = process.env.INDEXNOW_KEY;
if (!key) {
  console.log("[indexnow] 未设置 INDEXNOW_KEY，跳过密钥文件生成；上线前在 .env.local 或托管平台环境变量中设置。");
  process.exit(0);
}
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
  console.error("[indexnow] INDEXNOW_KEY 不合法：需要 8–128 位字母、数字或连字符。");
  process.exit(1);
}
fs.writeFileSync(path.join(publicDir, `${key}.txt`), key, "utf8");
console.log(`[indexnow] 已生成 public/${key}.txt`);
