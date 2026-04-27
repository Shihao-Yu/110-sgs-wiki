import Link from "next/link";
import { navigationItems, siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <section className="panel overflow-hidden p-6 sm:p-8">
        <div className="space-y-3">
          <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white">
            {siteConfig.name}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            {siteConfig.description}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-title mb-5">浏览入口</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              className={`panel block p-5 ${item.cardClassName}`}
              href={item.href}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">
                  {item.label}
                </h3>
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
    </div>
  );
}
