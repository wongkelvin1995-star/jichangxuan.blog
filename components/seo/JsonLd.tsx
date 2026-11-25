/**
 * 输出 JSON-LD。内容全部来自站内数据，不含用户输入；仍转义 < 以防止提前闭合 script。
 */
export function JsonLd({ data }: { data: object | null | undefined | (object | null | undefined)[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter((d): d is object => !!d);
  if (!items.length) return null;
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
