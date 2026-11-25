import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface SectionHeadingProps {
  kicker: string;
  title: string;
  description?: string;
  link?: { label: string; href: string };
  id?: string;
}

export function SectionHeading({ kicker, title, description, link, id }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {description && <p className="section-desc">{description}</p>}
      </div>
      {link && (
        <Link href={link.href} className="link-arrow shrink-0 text-sm">
          {link.label}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="surface-gradient border-b border-line-soft">
      <div className="container-x py-10 md:py-14">
        {kicker && <span className="section-kicker">{kicker}</span>}
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">{description}</p>}
        {children}
      </div>
    </div>
  );
}
