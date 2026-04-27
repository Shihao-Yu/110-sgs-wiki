import Link from "next/link";
import { navigationItems, siteConfig } from "@/lib/site";

const SECTION_NUMERAL: Record<string, string> = {
  generals: "壹",
  cards: "貳",
  faq: "叄",
};

export default function Home() {
  return (
    <div className="page-shell py-10 sm:py-16">
      {/* Hero — calligraphic title with seal-script accent */}
      <section className="anim-rise relative overflow-hidden">
        <div className="panel ornate-corner relative px-6 py-10 sm:px-12 sm:py-14">
          {/* Watermark hanzi behind the title */}
          <span
            aria-hidden
            className="font-seal pointer-events-none absolute -right-6 -top-6 select-none text-[10rem] leading-none text-vermillion/[0.06] sm:-right-10 sm:-top-10 sm:text-[16rem]"
          >
            戰
          </span>

          <div className="relative grid gap-6 lg:grid-cols-[auto_1fr] lg:items-end">
            {/* Vertical decorative spine: 三國 in writing-vertical */}
            <div className="hidden lg:block">
              <div className="flex flex-col items-center gap-4">
                <span className="font-seal writing-vertical text-3xl tracking-wider text-vermillion/80">
                  三國誌
                </span>
                <span aria-hidden className="h-12 w-px bg-vermillion/30" />
                <span className="font-latin text-xs uppercase tracking-[0.4em] text-ink-mute">
                  Wiki
                </span>
              </div>
            </div>

            <div>
              <p className="eyebrow">三國殺　·　國戰</p>
              <h1 className="font-display mt-5 text-3xl font-normal leading-[1.2] tracking-wide text-ink sm:text-5xl lg:text-6xl dark:text-ivory">
                <span className="block">三国杀国战</span>
                <span className="mt-1 block text-2xl text-ink-soft sm:text-3xl lg:text-4xl dark:text-ivory-soft">
                  武将 · 卡牌 · 常见问题
                </span>
              </h1>
              <p className="mt-6 max-w-2xl font-display text-base leading-loose text-ink-soft sm:text-lg dark:text-ivory-soft">
                {siteConfig.description}
              </p>

              {/* Scroll-edge mark */}
              <div className="mt-8 flex items-center gap-3 text-xs text-ink-mute dark:text-ivory-soft">
                <span aria-hidden className="h-px w-10 bg-vermillion/40" />
                <span className="font-display tracking-[0.32em]">壹卷　起</span>
                <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-vermillion/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section title */}
      <div className="mt-14 sm:mt-16">
        <p className="eyebrow">目錄</p>
        <h2 className="section-title mt-3">浏览入口</h2>
      </div>

      {/* 3-card layout */}
      <section className="mt-6 grid gap-5 md:grid-cols-3">
        {navigationItems.map((item, idx) => (
          <Link
            key={item.href}
            className="group relative block overflow-hidden anim-rise"
            href={item.href}
            style={{ animationDelay: `${(idx + 1) * 90}ms` }}
          >
            <div className="panel ornate-corner relative h-full bg-paper-grain p-6 transition-all duration-300 group-hover:-translate-y-0.5">
              {/* Numeral mark in corner */}
              <span
                aria-hidden
                className="font-seal absolute right-4 top-3 select-none text-2xl text-vermillion/30 transition-colors duration-300 group-hover:text-vermillion/60"
              >
                {SECTION_NUMERAL[item.slug] ?? ""}
              </span>

              {/* Title */}
              <h3 className="font-display mt-2 text-3xl font-normal tracking-wide text-ink dark:text-ivory">
                {item.label}
              </h3>

              {/* Vermillion → gold rule under title */}
              <span
                aria-hidden
                className="mt-3 block h-px w-10 bg-gradient-to-r from-vermillion to-gold transition-all duration-300 group-hover:w-16"
              />

              {/* Description */}
              <p className="mt-4 text-sm leading-relaxed text-ink-soft dark:text-ivory-soft">
                {item.description}
              </p>

              {/* Enter mark */}
              <span className="mt-6 inline-flex items-center gap-2 text-xs font-display tracking-[0.28em] text-vermillion">
                入　覽
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
