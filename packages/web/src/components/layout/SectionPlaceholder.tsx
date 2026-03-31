import Link from "next/link";

type SectionPlaceholderProps = {
  description: string;
  plannedFeatures: readonly string[];
  title: string;
};

export default function SectionPlaceholder({
  description,
  plannedFeatures,
  title,
}: SectionPlaceholderProps) {
  return (
    <div className="page-shell py-10 sm:py-14">
      <section className="panel p-6 sm:p-8">
        <span className="eyebrow">Static Placeholder</span>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {description} This route stays static in T-091 so the shared shell
              can be reviewed before real data and interactive features land.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                href="/"
              >
                返回首页
              </Link>
              <Link
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
                href="/stats"
              >
                查看统计占位页
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-panel dark:border-slate-800/80 dark:bg-slate-950/80">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Planned Surface
            </p>
            <ul className="mt-5 space-y-3">
              {plannedFeatures.map((feature) => (
                <li
                  key={feature}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
                >
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
