import { getPublishedArticles } from "@/lib/content";
import { SITE, absoluteUrl, getAuthor, getCategory } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function rfc822(date: string): string {
  return new Date(`${date}T08:00:00+08:00`).toUTCString();
}

export function GET() {
  const articles = getPublishedArticles().slice(0, 20);
  const lastBuild = articles[0]?.frontmatter.updatedAt ?? SITE.launchedAt;
  const items = articles
    .map((a) => {
      const url = absoluteUrl(a.path);
      const cat = getCategory(a.frontmatter.category);
      return `    <item>
      <title>${escapeXml(a.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(a.frontmatter.description)}</description>
      <category>${escapeXml(cat?.label ?? a.frontmatter.category)}</category>
      <dc:creator>${escapeXml(getAuthor(a.frontmatter.author).name)}</dc:creator>
      <pubDate>${rfc822(a.frontmatter.publishedAt)}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${SITE.url}/</link>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
