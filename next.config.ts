import type { NextConfig } from "next";

import redirectsTable from "./data/redirects.json";

/**
 * 构建模式
 *  - 默认：标准 Next.js 构建（Node 服务器 / Vercel），redirects 与 headers 由框架处理。
 *  - STATIC_EXPORT=1 或 Cloudflare Pages（自带 CF_PAGES 变量）：纯静态导出到 out/，
 *    301 与响应头改由 public/_redirects、public/_headers 提供（prebuild 自动生成）。
 *
 * 索引策略由 NEXT_PUBLIC_SITE_ENV 决定：只有显式设为 preview 时全站 noindex；
 * 未设置即视为正式站，避免因漏配环境变量而把正式站标成 noindex。
 */
const isStaticExport = process.env.STATIC_EXPORT === "1" || !!process.env.CF_PAGES;
const isPreview = process.env.NEXT_PUBLIC_SITE_ENV === "preview";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

type RedirectRule = { from: string; to: string };

const nextConfig: NextConfig = {
  // 所有公开路径统一以 / 结尾，与 canonical、sitemap 保持一致，避免同一正文出现两套 URL
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isStaticExport
    ? {
        output: "export",
        images: { unoptimized: true },
      }
    : {
        async redirects() {
          const rules = redirectsTable as RedirectRule[];
          // www 统一到主域名（Node / Vercel 部署时生效；Cloudflare Pages 静态部署需在 Cloudflare 的 Redirect Rules 中配置，见 DEPLOY.md）。
          // 目录路径保留结尾斜杠，一跳到达规范地址；文件路径（含扩展名）不加斜杠。
          const www = [{ type: "host" as const, value: "www.jichangxuan.blog" }];
          const wwwToApex = [
            { source: "/", has: www, destination: "https://jichangxuan.blog/", statusCode: 301 as const },
            { source: "/:file((?:.*/)?[^/]+\\.[a-zA-Z0-9]+)", has: www, destination: "https://jichangxuan.blog/:file", statusCode: 301 as const },
            { source: "/:path+/", has: www, destination: "https://jichangxuan.blog/:path+/", statusCode: 301 as const },
            { source: "/:path+", has: www, destination: "https://jichangxuan.blog/:path+/", statusCode: 301 as const },
          ];
          return [
            ...wwwToApex,
            ...rules.flatMap((r) => {
              const sources = r.from.endsWith("/") || r.from.includes(".") ? [r.from] : [r.from, `${r.from}/`];
              return sources.map((source) => ({ source, destination: r.to, statusCode: 301 as const }));
            }),
          ];
        },
        async headers() {
          const headers = [...securityHeaders];
          if (isPreview) {
            headers.push({ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" });
          }
          return [{ source: "/:path*", headers }];
        },
      }),
};

export default nextConfig;
