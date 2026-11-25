import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { brandPath, getBrand, type Brand } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { CLIENT_SHORT, NEED_FACT_OVERRIDES, NEED_GROUPS, NODE_KNOWLEDGE_LINKS, type NeedGroup } from "@/lib/home-content";
import { getEntryPlan, getPlanRowsByBrand } from "@/lib/plans";
import { HOME_RANKING } from "@/lib/ranking";
import { reviewPathForBrand } from "@/lib/reviews";

/** 每个需求分组的品牌对照：只取资料里的对应字段，品牌说法注明未测试 */
function brandFact(brand: Brand, field: NeedGroup["brandField"]): string {
  const override = NEED_FACT_OVERRIDES[brand.id]?.[field];
  if (override) return override;
  const rows = getPlanRowsByBrand(brand.id);
  const status = brand.dataStatus === "verified" ? "已核对" : "原稿参考价";
  switch (field) {
    case "aiTools":
      // 站长 2026-11-25 要求：这一栏只列可使用的 AI 工具，不加来源与测试标注
      return brand.aiTools.length ? brand.aiTools.join("、") : "资料未写";
    case "streaming": {
      const periodic = rows.filter((r) => r.kind === "periodic");
      const top = periodic.length ? Math.max(...periodic.map((r) => r.trafficGb ?? 0)) : null;
      const claims = brand.streaming.length ? `资料列出 ${brand.streaming.join("、")}` : "资料未写";
      const tested =
        brand.id === "lingdongyun"
          ? "；本站 2026-11-01 检测了 YouTube、Netflix、Disney+、TikTok、Abema 等的地区标签，2026-11-10 记录了 YouTube 720p 播放，其余平台未测"
          : "（品牌说法，本站未测试）";
      return `${claims}${tested}${top ? `；最大档每月 ${top} GB（${status}）` : ""}`;
    }
    case "devices": {
      // 只列资料对流量包单独写了设备数的情况（lib/plans.ts 不再让流量包继承周期套餐的设备说明）
      const packs = rows.filter((r) => r.kind === "data-pack" && r.devices);
      return `${brand.deviceLimit ?? "资料未写"}${packs.length ? `；不限时流量包：${packs.map((p) => `${p.trafficGb} GB ${p.devices}`).join("，")}` : ""}${
        brand.supportedPlatforms?.length ? `；系统：${brand.supportedPlatforms.join("、")}` : ""
      }`;
    }
    case "budget": {
      const entry = getEntryPlan(brand.id);
      const small = rows.find((r) => r.kind === "yearly-small");
      return `${entry ? `最低档 ${entry.plan} ${entry.trafficLabel} ¥${entry.price} / ${entry.cycleLabel}` : "套餐待核实"}${
        small ? `；年付小包 ${small.plan} ${small.trafficGb} GB / 月 ¥${small.price} / 年` : ""
      }（${status}，${formatDate(entry?.statusDate ?? brand.materialDate)}）`;
    }
    case "client":
      return CLIENT_SHORT[brand.id] ?? brand.clientPolicy[0] ?? "资料未写";
    case "start":
      return [brand.clientPolicy[0], brand.support?.trial ? `试用：${brand.support.trial}` : "试用：资料未写", brand.support?.refund ? `退款：${brand.support.refund}` : "退款：资料未写"]
        .filter(Boolean)
        .join("；");
  }
}

/** /recommend/（按需选机场）：按使用需求分组，每组列出首页推荐榜各家的对应资料 */
export function NeedsDirectory() {
  const brands = HOME_RANKING.map((r) => ({ r, b: getBrand(r.brandId) })).filter((x): x is { r: (typeof HOME_RANKING)[number]; b: Brand } => !!x.b);
  return (
    <div className="mb-14 space-y-12">
      <div className="rounded-2xl border border-brand/25 bg-sky-soft/70 p-5 text-sm leading-relaxed text-ink-soft">
        <p>
          每组列出首页推荐榜 {brands.length} 家的对应资料，顺序沿用首页的编辑推荐顺序（含推广合作因素，不是测速或评分排名）。这 {brands.length} 家均与本站存在推广合作；价格于 2026-11-25 由站长在各品牌官网或用户后台核对，购买前以官网结算页为准。只想看排名和价格的话，回到
          <Link href="/#ranking" className="mx-0.5 font-semibold text-brand-strong underline underline-offset-2">
            首页推荐榜
          </Link>
          或
          <Link href="/compare/" className="mx-0.5 font-semibold text-brand-strong underline underline-offset-2">
            套餐比较表
          </Link>
          。
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {NEED_GROUPS.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} className="chip hover:bg-sky">
                {n.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {NEED_GROUPS.map((n) => (
        <section key={n.id} id={n.id} className="scroll-mt-24" aria-labelledby={`${n.id}-title`}>
          <h2 id={`${n.id}-title`} className="section-title">
            {n.title}
          </h2>
          <p className="mt-3 max-w-3xl text-[0.98rem] leading-relaxed text-ink-soft">{n.summary}</p>
          <ul className="mt-3 max-w-3xl list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {n.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <dl className="mt-5 divide-y divide-line-soft rounded-2xl border border-line bg-white text-sm">
            {brands.map(({ r, b }) => (
              <div key={b.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                <dt className="font-semibold">
                  <Link href={reviewPathForBrand(b.id) ?? brandPath(b)} className="text-ink hover:text-brand-strong">
                    {r.displayName}
                  </Link>
                </dt>
                <dd className="text-ink-soft">{brandFact(b, n.brandField)}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {n.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-arrow">
                  {l.label}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-sm text-ink-soft">
        节点与线路知识：
        {NODE_KNOWLEDGE_LINKS.map((l, i) => (
          <span key={l.href}>
            <Link href={l.href} className="font-medium text-brand-strong hover:underline">
              {l.label}
            </Link>
            {i < NODE_KNOWLEDGE_LINKS.length - 1 ? "、" : "。"}
          </span>
        ))}
      </p>
    </div>
  );
}
