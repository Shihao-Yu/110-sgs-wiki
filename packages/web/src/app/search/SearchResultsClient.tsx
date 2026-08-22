"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  search,
  type SearchResult,
  type SearchResultType,
} from "@/components/search/search-data";

/* ------------------------------------------------------------------ */
/*  Type metadata                                                      */
/* ------------------------------------------------------------------ */

const TYPE_META: Record<
  SearchResultType,
  { label: string; badgeClass: string }
> = {
  general: {
    label: "武将",
    badgeClass:
      "border-shu/20 bg-shu/10 text-shu dark:border-shu/40 dark:bg-shu/20 dark:text-red-300",
  },
  token: {
    label: "标记牌",
    badgeClass:
      "border-wei/20 bg-wei/10 text-wei dark:border-wei/40 dark:bg-wei/20 dark:text-blue-300",
  },
  card: {
    label: "卡牌",
    badgeClass:
      "border-wu/20 bg-wu/10 text-wu dark:border-wu/40 dark:bg-wu/20 dark:text-green-300",
  },
  faq: {
    label: "FAQ",
    badgeClass:
      "border-qun/20 bg-qun/10 text-qun dark:border-qun/40 dark:bg-qun/20 dark:text-yellow-200",
  },
};

/* ------------------------------------------------------------------ */
/*  Group helper                                                       */
/* ------------------------------------------------------------------ */

function groupResults(
  results: SearchResult[],
): { type: SearchResultType; items: SearchResult[] }[] {
  const order: SearchResultType[] = ["general", "token", "card", "faq"];
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
/*  Inner component that reads searchParams (must be in Suspense)      */
/* ------------------------------------------------------------------ */

function SearchResultsInner() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  if (q.trim().length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        请输入搜索关键词。
      </p>
    );
  }

  const results = search(q, 50);
  const grouped = groupResults(results);

  if (results.length === 0) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
          未找到与 &ldquo;{q}&rdquo; 相关的结果
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          试试其他关键词，或浏览武将、卡牌、FAQ 页面。
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
        共找到 <span className="font-semibold">{results.length}</span> 条与
        &ldquo;{q}&rdquo; 相关的结果
      </p>

      <div className="space-y-8">
        {grouped.map((group) => {
          const meta = TYPE_META[group.type];
          return (
            <section key={group.type}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                <span
                  className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                >
                  {meta.label}
                </span>
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  ({group.items.length})
                </span>
              </h2>

              <div className="space-y-2">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-5 py-3.5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/80 dark:hover:border-brand/40"
                    href={item.href}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800 group-hover:text-brand dark:text-slate-200 dark:group-hover:text-red-300">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </span>
                    </div>
                    <svg
                      className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand dark:text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported wrapper with Suspense (required by useSearchParams)       */
/* ------------------------------------------------------------------ */

export default function SearchResultsClient() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-slate-500 dark:text-slate-400">
          加载中...
        </p>
      }
    >
      <SearchResultsInner />
    </Suspense>
  );
}
