/** 日期显示：2026-11-12 → 2026 年 11 月 12 日 */
export function formatDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  return `${m[1]} 年 ${Number(m[2])} 月 ${Number(m[3])} 日`;
}

/** 测试时间显示：保留日期与时间，去掉时区偏移 */
export function formatDateTime(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return formatDate(iso);
  return `${m[1]} 年 ${Number(m[2])} 月 ${Number(m[3])} 日 ${m[4]}:${m[5]}`;
}

/** 以北京时间取“今天”的 YYYY-MM-DD，用于校验未来日期 */
export function todayInBeijing(): string {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().slice(0, 10);
}

export function maxDate(dates: (string | undefined | null)[]): string | undefined {
  const valid = dates.filter((d): d is string => typeof d === "string" && d.length >= 10).map((d) => d.slice(0, 10));
  if (!valid.length) return undefined;
  return valid.sort().at(-1);
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "待核实";
  return `¥${Number.isInteger(value) ? value : value.toFixed(value * 10 % 1 === 0 ? 1 : 2)}`;
}
