import { PLAN_ROWS } from "@/lib/plans";

export const dynamic = "force-static";

/**
 * 全部套餐行（构建期生成的静态 JSON）。套餐比较页先服务端渲染各品牌入门档，
 * 再在客户端加载这份完整数据用于筛选；各品牌页的套餐表仍完整输出在 HTML 中。
 */
export function GET() {
  return Response.json(PLAN_ROWS, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
