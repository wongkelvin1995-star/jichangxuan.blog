import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}page/${page}/`;
}

/** 真实分页链接（服务端渲染，可被抓取） */
export function Pagination({ basePath, page, totalPages }: { basePath: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav aria-label="分页" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={pageHref(basePath, page - 1)} rel="prev" className="btn btn-secondary btn-sm">
          <ChevronLeft size={16} aria-hidden="true" />
          上一页
        </Link>
      ) : (
        <span className="btn btn-secondary btn-sm cursor-not-allowed opacity-50" aria-disabled="true">
          <ChevronLeft size={16} aria-hidden="true" />
          上一页
        </span>
      )}
      <ul className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`e${i}`} className="px-2 text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={pageHref(basePath, p)}
                aria-current={p === page ? "page" : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${
                  p === page ? "bg-brand text-white" : "border border-line bg-white text-ink-soft hover:border-brand hover:text-brand-strong"
                }`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < totalPages ? (
        <Link href={pageHref(basePath, page + 1)} rel="next" className="btn btn-secondary btn-sm">
          下一页
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span className="btn btn-secondary btn-sm cursor-not-allowed opacity-50" aria-disabled="true">
          下一页
          <ChevronRight size={16} aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
