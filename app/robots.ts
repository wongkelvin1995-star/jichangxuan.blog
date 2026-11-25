import type { MetadataRoute } from "next";

import { IS_PREVIEW, SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (IS_PREVIEW) {
    // 预览环境不禁止抓取：每个页面都带 noindex（以及 pages.dev 的 X-Robots-Tag），
    // 爬虫必须能抓取才能读到 noindex；同时不声明 sitemap。
    return { rules: [{ userAgent: "*", allow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 站内搜索页不禁止抓取：它带 noindex, follow，必须允许抓取 Bingbot 才能读到 noindex。
        // Next 内部数据目录不需要被抓取；静态资源目录 /_next/static/ 保持可访问以便渲染
        disallow: ["/_next/data/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
