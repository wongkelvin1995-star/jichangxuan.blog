"use client";

import { ListFilter, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { formatDate } from "@/lib/format";
import { AUDIENCE_TAGS, CYCLE_LABELS, type CycleId, type PlanRow } from "@/lib/plan-constants";

type PriceBucket = "all" | "le20" | "21-50" | "51-100" | "gt100";
type TrafficBucket = "all" | "le100" | "101-300" | "301-700" | "gt700";
type DeviceFilter = "all" | "unlimited" | "limited" | "pending";

interface Filters {
  brand: "all" | string;
  price: PriceBucket;
  traffic: TrafficBucket;
  cycle: "all" | CycleId;
  devices: DeviceFilter;
  audience: "all" | string;
}

const DEFAULT: Filters = { brand: "all", price: "all", traffic: "all", cycle: "all", devices: "all", audience: "all" };

function inPriceBucket(row: PlanRow, b: PriceBucket): boolean {
  if (b === "all") return true;
  // 筛选项是“月均价格”：一次性流量包没有月均价，选了价格区间时不参与比较
  if (row.monthlyEquivalent === null) return false;
  const v = row.monthlyEquivalent;
  if (b === "le20") return v <= 20;
  if (b === "21-50") return v > 20 && v <= 50;
  if (b === "51-100") return v > 50 && v <= 100;
  return v > 100;
}

function inTrafficBucket(row: PlanRow, b: TrafficBucket): boolean {
  if (b === "all") return true;
  const v = row.trafficGb;
  if (v === null) return false;
  if (b === "le100") return v <= 100;
  if (b === "101-300") return v > 100 && v <= 300;
  if (b === "301-700") return v > 300 && v <= 700;
  return v > 700;
}

function matchDevices(row: PlanRow, d: DeviceFilter): boolean {
  if (d === "all") return true;
  if (d === "pending") return row.devices === null;
  if (row.devices === null) return false;
  const unlimited = /不限|无限/.test(row.devices) && !/^限/.test(row.devices);
  return d === "unlimited" ? unlimited : !unlimited;
}

function money(v: number | null): string {
  if (v === null) return "待核实";
  return `¥${Number.isInteger(v) ? v : v.toFixed(2).replace(/0$/, "")}`;
}

interface PlanCompareProps {
  /** 服务端渲染的初始行（搜索引擎与不执行脚本的读者看到的就是这些） */
  rows: PlanRow[];
  compact?: boolean;
  note?: string;
  /** 提供时可按需加载完整套餐数据（静态 JSON）：空闲时预取，但只在读者操作后才追加到表格，避免布局偏移 */
  fullRowsUrl?: string;
  fullCount?: number;
  /** 品牌下拉选项（服务端传入，完整数据加载前也能按任意品牌筛选） */
  brandOptions?: { id: string; name: string }[];
  /** 品牌名链接到对应测评文章（没有测评的品牌仍链接到品牌资料页） */
  reviewPaths?: Record<string, string>;
}

/**
 * 套餐筛选表（客户端组件，只接收可序列化的套餐行）。
 * 桌面为表格；窄屏由 CSS（.plan-table）把每行变成卡片，不重复渲染 DOM。
 * 完整数据不会在加载后自动替换表格：读者点“显示全部”或改动筛选条件时才使用。
 */
export function PlanCompare({ rows: initialRows, compact = false, note, fullRowsUrl, fullCount, brandOptions, reviewPaths }: PlanCompareProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [loaded, setLoaded] = useState<PlanRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const prefetched = useRef<Promise<PlanRow[]> | null>(null);
  // “显示全部”按钮加载完成后会卸载；记下是它触发的，加载后把焦点移到表格，避免焦点落回 <body>
  const focusTableAfterLoad = useRef(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const rows = loaded ?? initialRows;
  const active = Object.entries(filters).some(([k, v]) => v !== DEFAULT[k as keyof Filters]);

  const fetchAll = useCallback((): Promise<PlanRow[]> => {
    if (!fullRowsUrl) return Promise.resolve(initialRows);
    if (!prefetched.current) {
      prefetched.current = fetch(fullRowsUrl).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<PlanRow[]>;
      });
      prefetched.current.catch(() => {
        prefetched.current = null;
      });
    }
    return prefetched.current;
  }, [fullRowsUrl, initialRows]);

  // 浏览器空闲时预取（不改动页面），读者操作时通常已经下载好
  useEffect(() => {
    if (!fullRowsUrl) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => void fetchAll().catch(() => undefined));
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => void fetchAll().catch(() => undefined), 2500);
    return () => window.clearTimeout(id);
  }, [fullRowsUrl, fetchAll]);

  useEffect(() => {
    if (loaded && focusTableAfterLoad.current) {
      focusTableAfterLoad.current = false;
      tableRef.current?.focus();
    }
  }, [loaded]);

  const ensureAll = useCallback(() => {
    if (!fullRowsUrl || loaded || loading) return;
    setLoading(true);
    fetchAll()
      .then((data) => {
        setLoaded(data);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [fullRowsUrl, loaded, loading, fetchAll]);

  const brands = useMemo(() => {
    if (brandOptions?.length) return brandOptions.map((b) => [b.id, b.name] as [string, string]);
    const seen = new Map<string, string>();
    for (const r of rows) if (!seen.has(r.brandId)) seen.set(r.brandId, r.brandName);
    return [...seen.entries()];
  }, [rows, brandOptions]);

  // 筛选计算放到低优先级，保证下拉框先响应（INP）
  const deferredFilters = useDeferredValue(filters);
  const deferredRows = useDeferredValue(rows);
  const list = useMemo(
    () =>
      deferredRows.filter(
        (r) =>
          (deferredFilters.brand === "all" || r.brandId === deferredFilters.brand) &&
          inPriceBucket(r, deferredFilters.price) &&
          inTrafficBucket(r, deferredFilters.traffic) &&
          (deferredFilters.cycle === "all" || r.cycle === deferredFilters.cycle) &&
          matchDevices(r, deferredFilters.devices) &&
          (deferredFilters.audience === "all" || r.audiences.includes(deferredFilters.audience as PlanRow["audiences"][number])),
      ),
    [deferredRows, deferredFilters],
  );

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    ensureAll();
  };
  const referenceCount = list.filter((r) => r.status === "reference").length;

  return (
    <div>
      <form className="card p-4 md:p-5" aria-label="套餐筛选条件" onSubmit={(e) => e.preventDefault()}>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <ListFilter size={16} aria-hidden="true" />
          筛选条件
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block">
            <span className="field-label">品牌</span>
            <select className="select mt-1" value={filters.brand} onChange={(e) => set("brand", e.target.value)}>
              <option value="all">全部（{brands.length}）</option>
              {brands.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">月均价格</span>
            <select className="select mt-1" value={filters.price} onChange={(e) => set("price", e.target.value as PriceBucket)}>
              <option value="all">全部</option>
              <option value="le20">¥20 及以下</option>
              <option value="21-50">¥21–50</option>
              <option value="51-100">¥51–100</option>
              <option value="gt100">¥100 以上</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">流量</span>
            <select className="select mt-1" value={filters.traffic} onChange={(e) => set("traffic", e.target.value as TrafficBucket)}>
              <option value="all">全部</option>
              <option value="le100">100 GB 及以下</option>
              <option value="101-300">101–300 GB</option>
              <option value="301-700">301–700 GB</option>
              <option value="gt700">700 GB 以上</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">周期</span>
            <select className="select mt-1" value={filters.cycle} onChange={(e) => set("cycle", e.target.value as Filters["cycle"])}>
              <option value="all">全部</option>
              {(Object.keys(CYCLE_LABELS) as CycleId[]).map((c) => (
                <option key={c} value={c}>
                  {CYCLE_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">设备数</span>
            <select className="select mt-1" value={filters.devices} onChange={(e) => set("devices", e.target.value as DeviceFilter)}>
              <option value="all">全部</option>
              <option value="unlimited">不限设备</option>
              <option value="limited">有设备限制</option>
              <option value="pending">待核实</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">适合人群</span>
            <select className="select mt-1" value={filters.audience} onChange={(e) => set("audience", e.target.value)}>
              <option value="all">全部</option>
              {AUDIENCE_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted" aria-live="polite">
            符合条件 <strong className="text-ink">{list.length}</strong> 条{referenceCount > 0 && <span>，其中 {referenceCount} 条为原稿参考价</span>}
            {fullRowsUrl && !loaded && !loading && !loadError && <span>（当前显示各品牌入门档，共 {fullCount ?? ""} 条）</span>}
            {loading && <span>（正在加载全部套餐…）</span>}
            {fullRowsUrl && loadError && <span className="text-warning">（完整套餐数据加载失败，当前只显示各品牌入门档）</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {fullRowsUrl && !loaded && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  focusTableAfterLoad.current = true;
                  ensureAll();
                }}
                disabled={loading}
              >
                显示全部 {fullCount ?? ""} 条
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFilters(DEFAULT)} disabled={!active}>
              <RotateCcw size={14} aria-hidden="true" />
              重置
            </button>
          </div>
        </div>
      </form>

      <div className="table-wrap mt-5">
        <table ref={tableRef} tabIndex={-1} className="plan-table">
          <caption className="sr-only">机场套餐比较表</caption>
          <thead>
            <tr>
              <th scope="col">品牌 / 套餐</th>
              <th scope="col">流量</th>
              <th scope="col">周期</th>
              <th scope="col">价格</th>
              <th scope="col">月均</th>
              <th scope="col">每 GB</th>
              <th scope="col">设备数</th>
              {!compact && <th scope="col">适合人群（编辑建议）</th>}
              <th scope="col">资料状态</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td data-label="品牌 / 套餐">
                  <Link href={reviewPaths?.[r.brandId] ?? r.brandPath} className="block text-ink hover:text-brand-strong">
                    {r.brandName}
                  </Link>
                  <span className="block text-xs font-normal text-muted">{r.plan}</span>
                </td>
                <td data-label="流量" className="md:whitespace-nowrap">
                  {r.trafficLabel}
                </td>
                <td data-label="周期" className="md:whitespace-nowrap">
                  {r.cycleLabel}
                </td>
                <td data-label="价格" className="tabular-nums md:whitespace-nowrap">
                  {money(r.price)}
                </td>
                <td data-label="月均" className="tabular-nums md:whitespace-nowrap">
                  {r.monthlyEquivalent === null ? "—" : money(r.monthlyEquivalent)}
                </td>
                <td data-label="每 GB" className="tabular-nums md:whitespace-nowrap">
                  {r.perGb === null ? "—" : `约 ¥${r.perGb.toFixed(2)}`}
                </td>
                <td data-label="设备数" className="text-xs">
                  {r.devices ?? <span className="data-pending">待核实</span>}
                </td>
                {!compact && (
                  <td data-label="适合人群（编辑建议）" className="text-xs text-ink-soft">
                    {r.audiences.length ? r.audiences.join("、") : "—"}
                  </td>
                )}
                <td data-label="资料状态" className="text-xs md:whitespace-nowrap">
                  {r.status === "verified" ? (
                    <span className="text-success">已核对 {formatDate(r.statusDate)}</span>
                  ) : (
                    <span className="text-ink-soft">原稿参考价 {formatDate(r.statusDate)}</span>
                  )}
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={compact ? 8 : 9} className="py-8 text-center font-normal text-muted">
                  没有符合条件的套餐，试试放宽筛选条件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {note ??
            "月均与每 GB 单价由本站按标价计算，仅供比较；价格于 2026-11-25 由站长在各品牌官网或用户后台核对。适合人群是本站按流量档位给的编辑建议，不是品牌数据。表中品牌均与本站存在推广合作，价格与优惠以各品牌官网结算页为准。"}
        </p>
        <Link href="/brands/" className="shrink-0 font-semibold text-brand-strong hover:underline">
          机场品牌资料库
        </Link>
      </div>
    </div>
  );
}
