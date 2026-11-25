import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLatestArticles, getSiteLastModified } from "@/lib/content";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { IS_PREVIEW, SITE } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.homeTitle,
    template: `%s - ${SITE.name}`,
  },
  description: SITE.homeDescription,
  applicationName: SITE.name,
  robots: IS_PREVIEW ? { index: false, follow: false } : { index: true, follow: true },
  icons: { icon: "/icon.svg" },
  alternates: {
    types: { "application/rss+xml": `${SITE.url}/rss.xml` },
  },
  ...(SITE.bingVerification ? { verification: { other: { "msvalidate.01": [SITE.bingVerification] } } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const latest = getLatestArticles(3).map((a) => ({ title: a.frontmatter.title, href: a.path }));
  const lastUpdated = getSiteLastModified();

  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <a href="#main" className="skip-link">
          跳到主要内容
        </a>
        {IS_PREVIEW && (
          <div className="bg-warning-bg px-4 py-2 text-center text-xs font-semibold text-warning">预览环境：本构建已设置 noindex，不要部署到正式域名</div>
        )}
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer lastUpdated={lastUpdated} latest={latest} />
      </body>
    </html>
  );
}
