import { getBrandEditorial } from "@/lib/brand-editorials";
import { LINGDONGYUN, brandPath, getPublishedBrands } from "@/lib/brands";
import { CHANGELOG } from "@/lib/changelog";
import { buildSearchIndex, type SearchDoc } from "@/lib/content";
import { pageLastModified } from "@/lib/lastmod";
import { getEntryPlan } from "@/lib/plans";
import { HOME_RANKING } from "@/lib/ranking";
import { CATEGORIES } from "@/lib/site";

export const dynamic = "force-static";

/** 站内搜索索引：构建期生成的静态 JSON，只含已发布内容 */
export function GET() {
  const brandDocs: SearchDoc[] = getPublishedBrands().map((b) => {
    const entry = getEntryPlan(b.id);
    const ed = getBrandEditorial(b.id);
    return {
      title: ed?.frontmatter.h1 ?? `${b.name}机场资料：套餐价格、节点与客户端政策`,
      description: ed?.frontmatter.description ?? b.summary,
      path: brandPath(b),
      category: "page",
      categoryLabel: b.hubPath ? "灵动云专区" : "品牌资料",
      tags: [b.name, b.nameEn ?? "", ...b.aliases, b.coupon?.code ?? "", ...b.regions].filter(Boolean),
      excerpt: [b.tagline, entry ? `最低档 ${entry.plan} ¥${entry.price} / ${entry.cycleLabel}` : "", ...b.audiences].filter(Boolean).join("；"),
      date: pageLastModified(brandPath(b)),
    };
  });

  const extra: SearchDoc[] = [
    ...brandDocs,
    {
      title: `机场品牌资料库：${getPublishedBrands().length} 个机场的套餐、节点与客户端政策`,
      description: "每个品牌页列出套餐价格、节点、线路、设备与客户端政策、优惠码与客服政策，并注明资料日期与核实状态。",
      path: "/brands/",
      category: "page",
      categoryLabel: "品牌资料",
      tags: ["品牌资料库", "机场品牌", LINGDONGYUN.name],
      excerpt: `前 ${HOME_RANKING.length} 家按首页编辑推荐顺序排列（含推广合作因素）；价格于 2026-11-25 由站长在品牌官网或用户后台核对，不显示评分。`,
      date: pageLastModified("/brands/"),
    },
    ...CATEGORIES.filter((c) => c.id !== "lingdongyun").map<SearchDoc>((c) => ({
      title: c.seoTitle,
      description: c.seoDescription,
      path: c.path,
      category: "page",
      categoryLabel: c.label,
      tags: [c.label],
      excerpt: c.intro,
      date: pageLastModified(c.path),
    })),
    {
      title: "测评方法与推荐榜排序原则",
      description: "机场优选如何核实套餐资料、执行与记录节点测试、评价品牌，以及首页推荐榜如何排序（编辑推荐，含推广合作因素）。",
      path: "/methodology/",
      category: "page",
      categoryLabel: "关于",
      tags: ["测评方法", "测速方法", "推荐榜排序原则"],
      excerpt: "资料优先、禁止虚构；测试记录注明日期与出口节点，网络环境、工具与方法写到资料能提供的程度；推荐榜不是测速或评分排名。",
      date: pageLastModified("/methodology/"),
    },
    {
      title: "商业关系披露",
      description: "机场优选与首页推荐榜及品牌资料库中各品牌的推广合作关系、推广链接的标注方式、推荐榜如何受合作影响，以及内容独立性原则。",
      path: "/disclosure/",
      category: "page",
      categoryLabel: "关于",
      tags: ["披露", "推广合作", "推荐榜"],
      excerpt: `上榜 ${HOME_RANKING.length} 家均与本站存在推广合作；通过本站链接购买，本站可能获得佣金，你支付的价格不变。`,
      date: pageLastModified("/disclosure/"),
    },
    {
      title: "更新记录",
      description: "机场优选按日期列出的实质修改：站点改版、品牌资料、价格状态与文章更正。",
      path: "/updates/",
      category: "page",
      categoryLabel: "关于",
      tags: ["更新记录"],
      excerpt: CHANGELOG.slice(0, 2)
        .map((c) => `${c.date} ${c.title}`)
        .join("；"),
      date: pageLastModified("/updates/"),
    },
  ];
  return Response.json(buildSearchIndex(extra), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
