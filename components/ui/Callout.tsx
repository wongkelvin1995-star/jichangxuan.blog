import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

const STYLES = {
  info: { className: "border-brand/30 bg-sky-soft text-ink", Icon: Info, label: "说明" },
  tip: { className: "border-success/30 bg-success-bg/60 text-ink", Icon: Lightbulb, label: "建议" },
  warning: { className: "border-warning/40 bg-warning-bg/70 text-ink", Icon: AlertTriangle, label: "注意" },
} as const;

export function Callout({ type = "info", title, children }: { type?: keyof typeof STYLES; title?: string; children: ReactNode }) {
  const { className, Icon, label } = STYLES[type];
  return (
    <div className={`not-prose my-6 rounded-xl border p-4 text-[0.95rem] leading-relaxed ${className}`} role="note">
      <div className="mb-1 flex items-center gap-2 font-semibold">
        <Icon size={16} aria-hidden="true" />
        {title ?? label}
      </div>
      <div className="[&>p]:mt-2 [&>p:first-child]:mt-0 [&>ul]:mt-2 [&>ul]:list-disc [&>ul]:pl-5">{children}</div>
    </div>
  );
}
