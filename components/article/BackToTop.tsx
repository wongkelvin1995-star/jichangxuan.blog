"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="返回顶部"
      hidden={!visible}
      className="fixed bottom-6 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-brand shadow-[var(--shadow-card-hover)] transition-colors hover:bg-sky-soft md:right-6"
    >
      <ArrowUp size={20} aria-hidden="true" />
    </button>
  );
}
