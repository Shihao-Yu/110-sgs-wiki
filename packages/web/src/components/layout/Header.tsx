"use client";

import { useState } from "react";
import Link from "next/link";
import AdminAffordances from "@/components/admin/AdminAffordances";
import Navigation from "@/components/layout/Navigation";
import GlobalSearch from "@/components/search/GlobalSearch";
import { siteConfig } from "@/lib/site";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative border-b border-vermillion/15 bg-paper-mist/60 backdrop-blur-sm">
      {/* Hairline gold accent under the header */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      <div className="page-shell flex items-center justify-between gap-3 py-3 lg:py-4">
        {/* Seal + title */}
        <div className="min-w-0 shrink-0">
          <Link className="inline-flex items-center gap-3 sm:gap-4" href="/">
            <span
              aria-hidden
              className="seal anim-stamp h-10 w-10 text-base sm:h-12 sm:w-12 sm:text-lg"
            >
              三國
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-normal tracking-wide text-ink sm:text-xl dark:text-ivory">
                {siteConfig.name}
              </span>
              <span className="hidden truncate text-xs text-ink-mute sm:block dark:text-ivory-soft">
                武将 · 卡牌 · 常见问题
              </span>
            </span>
          </Link>
        </div>

        {/* Desktop: search + nav + admin chrome inline */}
        <div className="hidden items-center gap-4 lg:flex">
          <AdminAffordances />
          <GlobalSearch />
          <Navigation />
        </div>

        {/* Mobile: hamburger button */}
        <button
          aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-vermillion/30 bg-paper-mist/70 text-ink transition-colors hover:bg-paper-mist lg:hidden dark:border-vermillion/40 dark:bg-night/60 dark:text-ivory"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
        >
          {mobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="border-t border-vermillion/15 px-4 pb-4 pt-3 lg:hidden">
          <div className="flex flex-col gap-3">
            <GlobalSearch />
            <Navigation onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
