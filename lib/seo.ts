import type { Metadata } from "next";

import { getBrand } from "./brands";
import { IS_PREVIEW, SITE, absoluteUrl, getAuthor, getCategory } from "./site";
import type { Article, FaqItem } from "./types";

export interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  /** noindex 页面是否仍允许跟踪链接（标签页、搜索页用 true） */
  follow?: boolean;
  image?: string;
  /** 为 true 时 title 不再追加“ - 机场优选” */
  absoluteTitle?: boolean;
}

export function buildMetadata(o: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(o.path);
  const image = absoluteUrl(o.image ?? SITE.defaultOgImage);
  const noindex = o.noindex || IS_PREVIEW;
  const shareTitle = o.absoluteTitle ? o.title : `${o.title} - ${SITE.name}`;
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: o.follow ?? !o.noindex } : { index: true, follow: true },
    openGraph: {
      type: o.type ?? "website",
      locale: "zh_CN",
      siteName: SITE.name,
      url,
      title: shareTitle,
      description: o.description,
      images: [{ url: image, width: 1200, height: 630, alt: shareTitle }],
      ...(o.type === "article"
        ? {
            publishedTime: o.publishedTime ? `${o.publishedTime}T00:00:00+08:00` : undefined,
            modifiedTime: o.modifiedTime ? `${o.modifiedTime}T00:00:00+08:00` : undefined,
            authors: [absoluteUrl("/about/#author")],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: o.description,
      images: [image],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: `${SITE.url}/`,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE.logoImage),
      width: 512,
      height: 512,
    },
    description: SITE.description,
    ...(SITE.contactEmail
      ? {
          email: SITE.contactEmail,
          contactPoint: { "@type": "ContactPoint", contactType: "纠错与资料反馈", email: SITE.contactEmail, availableLanguage: ["zh-CN"] },
        }
      : {}),
  };
}

/** 不再输出 SearchAction：站内搜索页是 noindex 的客户端搜索，对搜索引擎没有用处 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: `${SITE.url}/`,
    inLanguage: SITE.locale,
    publisher: { "@id": `${SITE.url}/#organization` },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  const list = [{ name: "首页", path: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function authorNode(authorId: string) {
  const author = getAuthor(authorId);
  return { "@type": "Organization", name: author.name, url: absoluteUrl(author.url) };
}

function sponsorNode(brandId: string | undefined) {
  const brand = brandId ? getBrand(brandId) : undefined;
  return brand?.relationship === "sponsored" ? { sponsor: { "@type": "Organization", name: brand.name } } : {};
}

/** 文章页：BlogPosting（headline 与页面 H1 一致，日期与页面显示的日期一致） */
export function articleJsonLd(article: Article) {
  const fm = article.frontmatter;
  const category = getCategory(fm.category);
  const url = absoluteUrl(article.path);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: fm.title,
    description: fm.description,
    inLanguage: SITE.locale,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: [absoluteUrl(ogImageForArticle(fm))],
    datePublished: `${fm.publishedAt}T00:00:00+08:00`,
    dateModified: `${fm.updatedAt}T00:00:00+08:00`,
    author: authorNode(fm.author),
    publisher: { "@id": `${SITE.url}/#organization` },
    articleSection: category?.label,
    keywords: fm.tags.join(", "),
    wordCount: article.charCount,
    ...sponsorNode(fm.brand),
  };
}

/** 品牌页：BlogPosting，about 指向品牌。不输出 Product / Offer / Review / Rating */
export function brandPageJsonLd(o: {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  author: string;
  brandId: string;
  image?: string;
}) {
  const url = absoluteUrl(o.path);
  const brand = getBrand(o.brandId);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: o.headline,
    description: o.description,
    inLanguage: SITE.locale,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: [absoluteUrl(o.image ?? ogImageForCategory("recommend"))],
    datePublished: `${o.datePublished}T00:00:00+08:00`,
    dateModified: `${o.dateModified}T00:00:00+08:00`,
    author: authorNode(o.author),
    publisher: { "@id": `${SITE.url}/#organization` },
    ...(brand
      ? {
          about: {
            "@type": "Organization",
            name: brand.name,
            ...(brand.nameEn && brand.nameEn !== brand.name ? { alternateName: brand.nameEn } : {}),
          },
        }
      : {}),
    ...sponsorNode(o.brandId),
  };
}

export function faqJsonLd(items: FaqItem[] | undefined) {
  if (!items || !items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** 有序列表（首页推荐榜、品牌资料库）。只放名称与链接，不放价格、评分或评论 */
export function itemListJsonLd(o: { name: string; description?: string; path: string; items: { name: string; path: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absoluteUrl(o.path)}#itemlist`,
    name: o.name,
    ...(o.description ? { description: o.description } : {}),
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: o.items.length,
    itemListElement: o.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function ogImageForCategory(category: string): string {
  return `/images/og/${category}.png`;
}

/** 有独立封面的测评文章（/images/covers/review-*.svg）使用同名的 OG 图，其余用栏目 OG 图 */
export function ogImageForArticle(fm: { category: string; cover: string }): string {
  const m = fm.cover.match(/^\/images\/covers\/(review-[a-z0-9-]+)\.svg$/);
  return m ? `/images/og/${m[1]}.png` : ogImageForCategory(fm.category);
}
