// 极简 .env 加载：依次读取 .env、.env.local（后者覆盖前者），已存在的进程环境变量优先。
import fs from "node:fs";
import path from "node:path";

export function loadEnv(cwd = process.cwd()) {
  for (const file of [".env", ".env.local"]) {
    const p = path.join(cwd, file);
    if (!fs.existsSync(p)) continue;
    for (const raw of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://jichangxuan.blog").replace(/\/+$/, "");
}
