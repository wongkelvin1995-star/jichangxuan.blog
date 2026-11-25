import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { BreadcrumbItem } from "@/lib/seo";

export function Breadcrumbs({ items, className = "" }: { items: BreadcrumbItem[]; className?: string }) {
  const list = [{ name: "首页", path: "/" }, ...items];
  return (
    <nav aria-label="面包屑" className={`text-sm text-muted ${className}`}>
      <ol className="flex flex-wrap items-center gap-1">
        {list.map((item, i) => {
          const last = i === list.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="line-clamp-1 text-ink-soft">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="transition-colors hover:text-brand-strong">
                  {item.name}
                </Link>
              )}
              {!last && <ChevronRight size={14} aria-hidden="true" className="text-line" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
