import changelogJson from "@/data/changelog.json";

import { changelogSchema, type ChangelogEntry } from "./schemas";

export type { ChangelogEntry } from "./schemas";

/**
 * 全站更新记录（data/changelog.json）。只写实质修改，不写“优化体验”这类空话。
 * 读取时按日期倒序排序（同一天保持文件中的先后），页面与 lastmod 不依赖文件里的书写顺序。
 */
export const CHANGELOG: ChangelogEntry[] = changelogSchema
  .parse(changelogJson)
  .map((entry, index) => ({ entry, index }))
  .sort((a, b) => b.entry.date.localeCompare(a.entry.date) || a.index - b.index)
  .map((x) => x.entry);

export function getLatestChange(): ChangelogEntry | undefined {
  return CHANGELOG[0];
}
