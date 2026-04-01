"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { search, type SearchResult, type SearchResultType } from "./search-data";

/* ------------------------------------------------------------------ */
/*  Icons & labels per result type                                     */
/* ------------------------------------------------------------------ */

const TYPE_META: Record<
  SearchResultType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  general: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    label: "武将",
    color: "text-shu",
  },
  skill: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: "技能",
    color: "text-wei",
  },
  card: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    label: "卡牌",
    color: "text-wu",
  },
  faq: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "FAQ",
    color: "text-qun",
  },
};

/* ------------------------------------------------------------------ */
/*  Group results by type for the dropdown                             */
/* ------------------------------------------------------------------ */

function groupResults(
  results: SearchResult[],
): { type: SearchResultType; items: SearchResult[] }[] {
  const order: SearchResultType[] = ["general", "skill", "card", "faq"];
  const map = new Map<SearchResultType, SearchResult[]>();

  for (const r of results) {
    const list = map.get(r.type) ?? [];
    list.push(r);
    map.set(r.type, list);
  }

  return order
    .filter((t) => map.has(t))
    .map((t) => ({ type: t, items: map.get(t)! }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  /* Run search on query change */
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    const hits = search(query, 20);
    setResults(hits);
    setIsOpen(hits.length > 0);
    setActiveIndex(-1);
  }, [query]);

  /* Close dropdown on outside click */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* Global Ctrl+K / Cmd+K shortcut to focus */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Navigate to a result */
  const navigateTo = useCallback(
    (r: SearchResult) => {
      setQuery("");
      setIsOpen(false);
      router.push(r.href);
    },
    [router],
  );

  /* Submit full search query → /search?q=... */
  const submitFullSearch = useCallback(() => {
    if (query.trim().length === 0) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }, [query, router]);

  /* Keyboard navigation */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen && e.key !== "Enter") return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            navigateTo(results[activeIndex]);
          } else {
            submitFullSearch();
          }
          break;
        case "Escape":
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, activeIndex, navigateTo, submitFullSearch],
  );

  /* Scroll active item into view */
  useEffect(() => {
    if (activeIndex < 0 || !dropdownRef.current) return;
    const items = dropdownRef.current.querySelectorAll("[data-search-item]");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const grouped = groupResults(results);

  /* Flatten index: map flat index -> (group, item) for rendering active state */
  let flatIdx = 0;

  return (
    <div className="relative w-full lg:w-72 xl:w-80">
      {/* Input */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          aria-autocomplete="list"
          aria-controls="global-search-results"
          aria-expanded={isOpen}
          className="w-full rounded-full border border-slate-200/80 bg-white/85 py-2 pl-9 pr-16 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-brand/40 dark:focus:ring-brand/30"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="搜索武将、技能、卡牌..."
          role="combobox"
          type="text"
          value={query}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 sm:inline-block">
          Ctrl K
        </kbd>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95"
          id="global-search-results"
          role="listbox"
        >
          {grouped.map((group) => {
            const meta = TYPE_META[group.type];
            return (
              <div key={group.type}>
                {/* Group header */}
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
                  {meta.label}
                </div>
                {/* Items */}
                {group.items.map((item) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={item.id}
                      aria-selected={idx === activeIndex}
                      className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                        idx === activeIndex
                          ? "bg-brand/8 dark:bg-brand/15"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                      data-search-item
                      onClick={() => navigateTo(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      role="option"
                      type="button"
                    >
                      <span
                        className={`mt-0.5 shrink-0 ${meta.color}`}
                      >
                        {meta.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.subtitle}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Footer: view all results */}
          <button
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-xs font-medium text-brand hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            onClick={submitFullSearch}
            type="button"
          >
            查看全部结果
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
