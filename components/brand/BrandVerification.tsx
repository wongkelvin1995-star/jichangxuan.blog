import type { Brand } from "@/lib/brands";

/** 站主 2026-11-13 补充核验表与矛盾清单（只对有这些内容的品牌显示） */
export function BrandVerification({ brand }: { brand: Brand }) {
  if (!brand.verificationNotes.length && !brand.conflicts.length) return null;
  return (
    <div className="space-y-6">
      {brand.verificationNotes.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-ink">补充核验（{brand.materialDate}）</h3>
          <p className="mt-1 text-sm text-muted">站长对公开资料做的逐项核对；状态为“待核实”“有冲突”的字段，本站不作为事实展示。</p>
          <div className="table-wrap mt-3">
            <table>
              <caption className="sr-only">{brand.name}补充核验表</caption>
              <thead>
                <tr>
                  <th scope="col">字段</th>
                  <th scope="col">可用信息 / 核对结果</th>
                  <th scope="col">状态</th>
                </tr>
              </thead>
              <tbody>
                {brand.verificationNotes.map((n) => (
                  <tr key={n.field}>
                    <td>{n.field}</td>
                    <td className="whitespace-normal font-normal">{n.finding}</td>
                    <td className="whitespace-normal text-xs">{n.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {brand.conflicts.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning-bg/60 p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">需要复核的矛盾与风险</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {brand.conflicts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
