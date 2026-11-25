import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { BrandCTA } from "@/components/brand/BrandCTA";
import { InlineBrandRecommendation } from "@/components/brand/InlineBrandRecommendation";
import { PlanTable } from "@/components/brand/PlanTable";
import { Callout } from "@/components/ui/Callout";
import { BRANDS, getBrand } from "@/lib/brands";
import type { BrandId } from "@/lib/types";

/** 推广链接的主机名（正文里出现时自动加 sponsored；validate-content 也会阻止正文直接写推广链接） */
const AFFILIATE_HOSTS = new Set(
  BRANDS.map((b) => b.affiliateUrl)
    .filter((u): u is string => !!u)
    .map((u) => new URL(u).host),
);

function Anchor({ href = "", children, ...rest }: ComponentPropsWithoutRef<"a">) {
  const external = /^https?:\/\//i.test(href);
  if (external) {
    let sponsored = false;
    try {
      sponsored = AFFILIATE_HOSTS.has(new URL(href).host);
    } catch {
      sponsored = false;
    }
    return (
      <a href={href} target="_blank" rel={sponsored ? "sponsored nofollow noopener noreferrer" : "nofollow noopener noreferrer"} {...rest}>
        {children}
      </a>
    );
  }
  if (href.startsWith("#") || href.startsWith("mailto:")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="table-wrap">
      <table {...props} />
    </div>
  );
}

function Img({ alt = "", ...props }: ComponentPropsWithoutRef<"img">) {
  return <img alt={alt} loading="lazy" decoding="async" {...props} />;
}

/**
 * 证据图 / 配图。注意：next-mdx-remote 不会传递 `width={925}` 这类表达式属性，
 * MDX 中请写成字符串 `width="925" height="1024"`。
 */
export function Figure({
  src,
  alt,
  width,
  height,
  caption,
}: {
  src: string;
  alt: string;
  width: number | string;
  height: number | string;
  caption?: ReactNode;
}) {
  return (
    <figure>
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** MDX 里的 <BrandCTA brand="..." />：必须写明品牌，不再默认指向灵动云 */
function BrandLink({ brand, label }: { brand: BrandId; label?: string }) {
  const b = brand ? getBrand(brand) : undefined;
  if (!b) throw new Error(`MDX 中的 <BrandCTA> 缺少有效的 brand 属性（收到：${String(brand)}）`);
  return <BrandCTA brand={b} label={label} size="sm" />;
}

export const mdxComponents = {
  a: Anchor,
  table: Table,
  img: Img,
  Callout,
  Figure,
  PlanTable,
  InlineBrandRecommendation,
  BrandCTA: BrandLink,
};
