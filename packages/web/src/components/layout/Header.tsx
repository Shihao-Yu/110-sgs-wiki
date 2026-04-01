import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import GlobalSearch from "@/components/search/GlobalSearch";
import { siteConfig } from "@/lib/site";

export default function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="page-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-lg font-semibold text-white shadow-lg shadow-red-950/20">
              三国
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                {siteConfig.name}
              </span>
              <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
                Wiki shell for generals, cards, sandbox, replay, and stats
              </span>
            </span>
          </Link>
        </div>

        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          <GlobalSearch />
          <Navigation />
        </div>
      </div>
    </header>
  );
}
