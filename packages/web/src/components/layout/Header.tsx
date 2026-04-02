"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import GlobalSearch from "@/components/search/GlobalSearch";
import { siteConfig } from "@/lib/site";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="page-shell flex items-center justify-between gap-3 py-3 lg:py-4">
        {/* Logo + title */}
        <div className="min-w-0 shrink-0">
          <Link className="inline-flex items-center gap-2 sm:gap-3" href="/">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-red-950/20 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
              三国
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-slate-950 sm:text-lg dark:text-white">
                {siteConfig.name}
              </span>
              <span className="hidden truncate text-sm text-slate-500 sm:block dark:text-slate-400">
                Wiki shell for generals, cards, sandbox, replay, and stats
              </span>
            </span>
          </Link>
        </div>

        {/* Desktop: search + nav inline */}
        <div className="hidden items-center gap-3 lg:flex">
          <GlobalSearch />
          <Navigation />
        </div>

        {/* Mobile: hamburger button */}
        <button
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/85 text-slate-700 transition-colors hover:bg-slate-50 lg:hidden dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
        >
          {mobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200/60 px-4 pb-4 pt-3 lg:hidden dark:border-slate-800/60">
          <div className="flex flex-col gap-3">
            <GlobalSearch />
            <Navigation onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
