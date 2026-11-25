"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NAV } from "@/lib/site";

import { Logo } from "./Logo";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // 记录“在哪个路径上打开了菜单”：路径变化后 open 自动为 false，无需在 effect 里 setState
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (value: boolean) => setOpenAt(value ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-transparent bg-white/85 backdrop-blur-md transition-[box-shadow,border-color] duration-300"
      style={scrolled ? { boxShadow: "var(--shadow-header)", borderColor: "var(--color-line-soft)" } : undefined}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="主导航" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex h-10 items-center rounded-full px-3 text-[0.9rem] font-medium transition-colors duration-200 hover:bg-sky-soft hover:text-brand-strong ${
                      active ? "text-brand-strong" : "text-ink-soft"
                    }`}
                  >
                    {item.label}
                    {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search/"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3 text-sm font-medium text-ink-soft transition-colors duration-200 hover:border-brand hover:text-brand-strong"
            aria-label="搜索站内文章"
          >
            <Search size={18} aria-hidden="true" />
            <span className="hidden sm:inline">搜索</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition-colors duration-200 hover:border-brand hover:text-brand-strong lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line-soft bg-white lg:hidden"
      >
        <nav aria-label="移动端导航" className="container-x max-h-[calc(100vh-4rem)] overflow-y-auto py-3">
          <ul className="flex flex-col">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center rounded-xl px-3 text-base font-medium transition-colors duration-200 ${
                      active ? "bg-sky-soft text-brand-strong" : "text-ink hover:bg-sky-soft"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/search/" className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-base font-medium text-ink hover:bg-sky-soft">
                <Search size={18} aria-hidden="true" />
                搜索
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
