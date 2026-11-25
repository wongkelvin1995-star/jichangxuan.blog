import type { Metadata } from "next";

import { BrandFeatureCard } from "@/components/brand/BrandFeatureCard";
import { FaqSection } from "@/components/home/FaqSection";
import { Hero } from "@/components/home/Hero";
import { HomeAbout } from "@/components/home/HomeAbout";
import { HomeNeeds } from "@/components/home/HomeNeeds";
import { HomeOverview } from "@/components/home/HomeOverview";
import { HomePriceTable } from "@/components/home/HomePriceTable";
import { HomeRanking } from "@/components/home/HomeRanking";
import { LatestArticles } from "@/components/home/LatestArticles";
import { TutorialsSection } from "@/components/home/TutorialsSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { brandPath, getBrand, LINGDONGYUN } from "@/lib/brands";
import { getFeaturedArticles, getPublishedArticles, toSummary } from "@/lib/content";
import { HOME_FAQ } from "@/lib/faq";
import { HOME_RANKING, RANKING_DISCLOSURE, RANKING_TITLE } from "@/lib/ranking";
import { buildMetadata, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

/** 首页 Title / Description / H1 / 副标题由站主指定，见 lib/site.ts 的 SITE.home* 字段 */
export const metadata: Metadata = buildMetadata({
  title: SITE.homeTitle,
  absoluteTitle: true,
  description: SITE.homeDescription,
  path: "/",
});

export default function HomePage() {
  const published = getPublishedArticles();
  const featured = getFeaturedArticles(3).map(toSummary);
  const latest = published.slice(0, 12).map(toSummary);
  const rankingItems = HOME_RANKING.map((r) => {
    const b = getBrand(r.brandId);
    return b ? { name: r.displayName, path: brandPath(b) } : null;
  }).filter((x): x is { name: string; path: string } => !!x);

  return (
    <>
      <JsonLd
        data={[
          itemListJsonLd({ name: RANKING_TITLE, description: RANKING_DISCLOSURE, path: "/", items: rankingItems }),
          faqJsonLd(HOME_FAQ),
        ]}
      />
      <Hero />
      <HomeOverview />
      <BrandFeatureCard brand={LINGDONGYUN} />
      <HomeRanking />
      <HomePriceTable />
      <HomeNeeds />
      <TutorialsSection />
      <FaqSection />
      <LatestArticles featured={featured} latest={latest} total={published.length} />
      <HomeAbout />
    </>
  );
}
