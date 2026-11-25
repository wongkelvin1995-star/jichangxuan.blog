import { AlertCircle, BadgeCheck, FileText, FlaskConical, Handshake, PenLine, ScrollText } from "lucide-react";

export type BadgeKind = "verified" | "reference" | "pending" | "text-record" | "draft" | "sponsored" | "measured";

/**
 * 状态徽章。绿色勾选只用于“价格已核对”；测试记录用中性的烧杯图标，推广合作用握手图标，
 * 避免读者把“推广合作”“站长实测”误认为“已核实”。
 */
const MAP: Record<BadgeKind, { label: string; className: string; Icon: typeof BadgeCheck }> = {
  verified: { label: "价格已核对", className: "chip chip-success", Icon: BadgeCheck },
  reference: { label: "原稿参考价", className: "chip", Icon: ScrollText },
  pending: { label: "待核实", className: "chip chip-warning", Icon: AlertCircle },
  "text-record": { label: "文字记录", className: "chip chip-outline", Icon: FileText },
  measured: { label: "站长实测", className: "chip chip-outline", Icon: FlaskConical },
  draft: { label: "草稿", className: "chip chip-danger", Icon: PenLine },
  sponsored: { label: "推广合作", className: "chip chip-outline", Icon: Handshake },
};

export function StatusBadge({ kind, label }: { kind: BadgeKind; label?: string }) {
  const { label: defaultLabel, className, Icon } = MAP[kind];
  return (
    <span className={className}>
      <Icon size={12} aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}
