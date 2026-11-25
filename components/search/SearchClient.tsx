"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SearchDoc } from "@/lib/content";
import { formatDate } from "@/lib/format";

interface Scored {
  doc: SearchDoc;
  score: number;
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,，、/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function score(doc: SearchDoc, query: string, tokens: string[]): number {
  const title = doc.title.toLowerCase();
  const desc = doc.description.toLowerCase();
  const tags = doc.tags.join(" ").toLowerCase();
  const excerpt = doc.excerpt.toLowerCase();
  let s = 0;
  if (title.includes(query)) s += 20;
  if (desc.includes(query)) s += 8;
  for (const t of tokens) {
    if (title.includes(t)) s += 10;
    if (tags.includes(t)) s += 6;
    if (desc.includes(t)) s += 4;
    if (excerpt.includes(t)) s += 2;
  }
  return s;
}

const QUICK_LINKS = [
  { label: "机场推荐", href: "/recommend/" },
  { label: "套餐比较", href: "/compare/" },
  { label: "节点实测", href: "/speedtest/" },
  { label: "使用教程", href: "/guides/" },
  { label: "灵动云专区", href: "/lingdongyun/" },
];

export function SearchClient() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [index, setIndex] = useState<SearchDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/search-index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`索引加载失败（${r.status}）`);
        return r.json();
      })
      .then((data: SearchDoc[]) => {
        if (!cancelled) setIndex(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (query.trim()) url.searchParams.set("q", query.trim());
      else url.searchParams.delete("q");
      window.history.replaceState(null, "", url.toString());
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!initial) inputRef.current?.focus();
  }, [initial]);

  const results = useMemo<Scored[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !index) return [];
    const tokens = tokenize(q);
    return index
      .map((doc) => ({ doc, score: score(doc, q, tokens) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.doc.date.localeCompare(a.doc.date))
      .slice(0, 30);
  }, [query, index]);

  const q = query.trim();

  return (
    <div>
      <form role="search" action="/search/" method="get" className="relative" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="search-input" className="sr-only">
          搜索站内文章
        </label>
        <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          id="search-input"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="输入关键词，如：Clash、灵动云、DNS、套餐"
          className="input pl-12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="mt-6" aria-live="polite">
        {error && <p className="rounded-xl border border-danger/30 bg-danger-bg p-4 text-sm text-danger">{error}</p>}
        {!error && !q && (
          <div className="text-sm text-muted">
            <p>输入关键词后即时显示结果。也可以从这些栏目开始：</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="chip hover:bg-sky">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!error && q && index === null && <p className="text-sm text-muted">正在加载索引…</p>}
        {!error && q && index !== null && (
          <>
            <p className="text-sm text-muted">
              “{q}” 找到 <strong className="text-ink">{results.length}</strong> 条结果
            </p>
            <ol className="mt-4 space-y-3">
              {results.map(({ doc }) => (
                <li key={doc.path} className="card card-hover p-5">
                  <span className="chip">{doc.categoryLabel}</span>
                  <h2 className="mt-2 text-lg font-semibold leading-snug">
                    <Link href={doc.path} className="text-ink hover:text-brand-strong">
                      {doc.title}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{doc.description}</p>
                  <p className="mt-2 text-xs text-muted">
                    更新于 <time dateTime={doc.date}>{formatDate(doc.date)}</time>
                    {doc.tags.length ? ` · ${doc.tags.slice(0, 4).join(" / ")}` : ""}
                  </p>
                </li>
              ))}
            </ol>
            {!results.length && (
              <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">
                没有匹配的文章。换个更短的关键词试试，例如“Clash”“订阅”“延迟”。
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
