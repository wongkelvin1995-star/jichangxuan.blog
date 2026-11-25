import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts", "reports/**", "public/**"],
  },
  {
    rules: {
      // 站内图片为本地 SVG 封面与已压缩的 webp，均显式声明 width/height 并懒加载；
      // 项目需兼容纯静态导出（无图片优化服务），因此使用原生 <img>。
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
