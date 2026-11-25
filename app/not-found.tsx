import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "页面不存在（404）",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="section-kicker">404</span>
      <h1 className="text-3xl font-bold text-ink sm:text-4xl">这个页面不存在或已被移动</h1>
      <p className="mt-4 max-w-md text-muted">地址可能输入有误，或者文章已经调整了栏目。可以从下面的入口继续浏览，或者直接搜索。</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          返回首页
        </Link>
        <Link href="/search/" className="btn btn-secondary">
          站内搜索
        </Link>
        <Link href="/articles/" className="btn btn-secondary">
          全部文章
        </Link>
      </div>
    </div>
  );
}
