import { SectionHeading } from "@/components/layout/SectionHeading";
import { Faq } from "@/components/ui/Faq";
import { HOME_FAQ } from "@/lib/faq";

/** 首页 H2「机场购买与使用常见问题」；问答与 FAQPage 结构化数据共用 HOME_FAQ */
export function FaqSection() {
  return (
    <section id="faq" className="container-x scroll-mt-24 py-12 md:py-16" aria-labelledby="faq-title">
      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <SectionHeading
            id="faq-title"
            kicker="FAQ"
            title="机场购买与使用常见问题"
            description="购买前后最常问的问题，答案尽量具体；更多细节在对应的教程、品牌页和方法页里。"
          />
        </div>
        <Faq items={HOME_FAQ} />
      </div>
    </section>
  );
}
