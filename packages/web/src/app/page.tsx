import Link from "next/link";
import { navigationItems, siteConfig, statsPreviewItems } from "@/lib/site";

export default function Home() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="panel overflow-hidden p-6 sm:p-8">
          <span className="eyebrow">Kingdom War Knowledge Base</span>
          <div className="mt-6 space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Wiki • Sandbox • Replay • Stats
              </p>
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white">
                {siteConfig.name}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                A clean shell for the future wiki, simulator sandbox, replay
                viewer, and statistics dashboard. This task ships the App Router
                foundation, navigation, and theme system for all frontend pages.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 sm:py-2.5"
                href="/generals"
              >
                浏览武将
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 sm:py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
                href="/sandbox"
              >
                打开沙盒占位页
              </Link>
            </div>
          </div>
        </div>

        <aside className="panel p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Faction Palette
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-wei/20 bg-wei/10 p-4 text-wei dark:border-wei/30 dark:bg-wei/20 dark:text-blue-300">
              <p className="text-xs uppercase tracking-[0.18em]">魏</p>
              <p className="mt-2 text-lg font-semibold">WEI</p>
            </div>
            <div className="rounded-2xl border border-shu/20 bg-shu/10 p-4 text-shu dark:border-shu/30 dark:bg-shu/20 dark:text-red-300">
              <p className="text-xs uppercase tracking-[0.18em]">蜀</p>
              <p className="mt-2 text-lg font-semibold">SHU</p>
            </div>
            <div className="rounded-2xl border border-wu/20 bg-wu/10 p-4 text-wu dark:border-wu/30 dark:bg-wu/20 dark:text-green-300">
              <p className="text-xs uppercase tracking-[0.18em]">吴</p>
              <p className="mt-2 text-lg font-semibold">WU</p>
            </div>
            <div className="rounded-2xl border border-qun/25 bg-qun/10 p-4 text-qun dark:border-qun/40 dark:bg-qun/20 dark:text-yellow-200">
              <p className="text-xs uppercase tracking-[0.18em]">群</p>
              <p className="mt-2 text-lg font-semibold">QUN</p>
            </div>
            <div className="rounded-2xl border border-jin/20 bg-jin/10 p-4 text-jin dark:border-jin/40 dark:bg-jin/20 dark:text-purple-200 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em]">晋</p>
              <p className="mt-2 text-lg font-semibold">JIN</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Quick Links</span>
            <h2 className="section-title mt-3">Frontend entry points</h2>
          </div>
          <p className="hidden max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400 md:block">
            Each section is wired as a static placeholder route so the shell is
            navigable before data and gameplay systems land.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              className={`panel block p-5 ${item.cardClassName}`}
              href={item.href}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${item.pillClassName}`}
                  >
                    {item.english}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
                    {item.label}
                  </h3>
                </div>
                <span className="text-2xl text-slate-300 dark:text-slate-700">
                  →
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-6 sm:p-8">
          <span className="eyebrow">Stats Preview</span>
          <h2 className="section-title mt-3">Planned analytics surfaces</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            This is a static preview for later simulation and replay data. Live
            data fetching is intentionally out of scope for this task.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {statsPreviewItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80"
              >
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6 sm:p-8">
          <span className="eyebrow">Scope</span>
          <h2 className="section-title mt-3">What this shell already covers</h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>
              App Router is in place with global metadata, responsive
              navigation, and a shared header/footer wrapper.
            </p>
            <p>
              Tailwind is extended with faction color tokens so future pages can
              stay consistent with the Kingdom War visual language.
            </p>
            <p>
              The rest of the product surfaces are represented as static
              placeholders to keep route structure stable while the real wiki,
              sandbox, replay, and stats implementations ship in later tasks.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
