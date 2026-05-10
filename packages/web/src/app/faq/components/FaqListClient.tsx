"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminContext";
import EditAffordance from "@/components/admin/EditAffordance";
import FaqEditForm from "@/components/admin/FaqEditForm";
import FaqNewForm from "@/components/admin/FaqNewForm";
import type { FAQ } from "@sgs/data";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FaqCategory = "rule" | "general";

export interface RelatedLink {
  id: string;
  name: string;
  href: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  relatedGenerals: RelatedLink[];
  relatedSkills: string[];
}

type CategoryTab = "all" | FaqCategory;

const TABS: { key: CategoryTab; label: string; count?: number }[] = [
  { key: "all", label: "\u5168\u90E8" },
  { key: "rule", label: "\u89C4\u5219FAQ" },
  { key: "general", label: "\u6B66\u5C06FAQ" },
];

/* ------------------------------------------------------------------ */
/*  Accordion item                                                     */
/* ------------------------------------------------------------------ */

function AccordionItem({
  entry,
  isOpen,
  onToggle,
  allGenerals,
}: {
  entry: FaqEntry;
  isOpen: boolean;
  onToggle: () => void;
  allGenerals: Array<{ id: string; name: string }>;
}) {
  const { authed } = useAdmin();
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        onClick={onToggle}
        type="button"
      >
        <svg
          className={[
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            isOpen ? "rotate-90" : "",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M9 5l7 7-7 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {entry.question}
        </span>
        <span
          className={[
            "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            entry.category === "rule"
              ? "border-blue-200/60 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-300"
              : "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300",
          ].join(" ")}
        >
          {entry.category === "rule" ? "\u89C4\u5219" : "\u6B66\u5C06"}
        </span>
      </button>

      {authed && (
        <div className="border-t border-slate-200/40 px-5 py-2 dark:border-slate-700/40">
          <EditAffordance
            ariaLabel="\u7F16\u8F91\u8BE5 FAQ"
            trigger={
              <span className="inline-flex items-center gap-1 text-xs text-vermillion">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                \u7F16\u8F91 / \u5220\u9664
              </span>
            }
            renderForm={(close) => (
              <FaqEditForm
                faq={{
                  id: entry.id as unknown as FAQ["id"],
                  question: entry.question,
                  answer: entry.answer,
                  category: entry.category as unknown as FAQ["category"],
                  relatedGeneralIds: entry.relatedGenerals.map((g) => g.id) as unknown as FAQ["relatedGeneralIds"],
                } as FAQ}
                allGenerals={allGenerals}
                onClose={close}
              />
            )}
          />
        </div>
      )}

      {isOpen && (
        <div className="border-t border-slate-200/40 px-5 pb-5 pt-4 dark:border-slate-700/40">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {entry.answer}
          </p>

          {/* Related links */}
          {(entry.relatedGenerals.length > 0 ||
            entry.relatedSkills.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {"\u76F8\u5173\uFF1A"}
              </span>
              {entry.relatedGenerals.map((g) => (
                <Link
                  key={g.id}
                  className="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  href={g.href}
                >
                  {g.name}
                </Link>
              ))}
              {entry.relatedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-lg border border-qun/20 bg-qun/5 px-2.5 py-1 text-xs font-medium text-qun dark:border-qun/30 dark:bg-qun/10 dark:text-yellow-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main client component                                              */
/* ------------------------------------------------------------------ */

interface FaqListClientProps {
  entries: FaqEntry[];
  allGenerals: Array<{ id: string; name: string }>;
}

export default function FaqListClient({ entries, allGenerals }: FaqListClientProps) {
  const { authed } = useAdmin();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = entries;

    // Category filter
    if (activeTab !== "all") {
      result = result.filter((e) => e.category === activeTab);
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.question.toLowerCase().includes(q) ||
          e.answer.toLowerCase().includes(q) ||
          e.relatedGenerals.some((g) => g.name.toLowerCase().includes(q)) ||
          e.relatedSkills.some((s) => s.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [entries, activeTab, search]);

  const ruleFaqs = useMemo(
    () => filtered.filter((e) => e.category === "rule"),
    [filtered],
  );
  const generalFaqs = useMemo(
    () => filtered.filter((e) => e.category === "general"),
    [filtered],
  );

  const tabCounts = useMemo(() => {
    const all = entries.length;
    const rule = entries.filter((e) => e.category === "rule").length;
    const general = entries.filter((e) => e.category === "general").length;
    return { all, rule, general };
  }, [entries]);

  return (
    <div className="space-y-6">
      {authed && (
        <div className="flex justify-end">
          <EditAffordance
            ariaLabel="新建 FAQ"
            trigger={
              <span className="inline-flex items-center gap-1 rounded border border-vermillion/40 px-3 py-1.5 text-xs text-vermillion">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                新建 FAQ
              </span>
            }
            renderForm={(close) => (
              <FaqNewForm allGenerals={allGenerals} onClose={close} />
            )}
          />
        </div>
      )}
      {/* Toolbar */}
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              className="w-full rounded-xl border border-slate-200/80 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand/50 dark:focus:ring-brand/30"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={"\u641C\u7D22\u95EE\u9898\u3001\u7B54\u6848\u3001\u6B66\u5C06\u540D\u3001\u6280\u80FD\u540D\u2026"}
              type="text"
              value={search}
            />
            {search && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                onClick={() => setSearch("")}
                type="button"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count =
                tabCounts[tab.key as keyof typeof tabCounts] ?? 0;
              return (
                <button
                  key={tab.key}
                  className={[
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-qun/30 bg-qun/10 text-qun dark:border-qun/50 dark:bg-qun/20 dark:text-yellow-200"
                      : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                  ].join(" ")}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Result count */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {"\u5171"} {filtered.length} {"\u6761\u95EE\u7B54"}
            {activeTab !== "all" || search.trim()
              ? `\uFF08\u5DF2\u7B5B\u9009\uFF0C\u5168\u90E8 ${entries.length} \u6761\uFF09`
              : ""}
          </p>
        </div>
      </div>

      {/* FAQ groups */}
      {filtered.length > 0 ? (
        <div className="space-y-8">
          {/* Rule FAQs */}
          {ruleFaqs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {"\u89C4\u5219FAQ"}
                </h2>
                <span className="rounded-full border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  {ruleFaqs.length}
                </span>
              </div>
              <div className="space-y-2">
                {ruleFaqs.map((entry) => (
                  <AccordionItem
                    key={entry.id}
                    entry={entry}
                    isOpen={openIds.has(entry.id)}
                    onToggle={() => toggle(entry.id)}
                    allGenerals={allGenerals}
                  />
                ))}
              </div>
            </section>
          )}

          {/* General FAQs */}
          {generalFaqs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {"\u6B66\u5C06FAQ"}
                </h2>
                <span className="rounded-full border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  {generalFaqs.length}
                </span>
              </div>
              <div className="space-y-2">
                {generalFaqs.map((entry) => (
                  <AccordionItem
                    key={entry.id}
                    entry={entry}
                    isOpen={openIds.has(entry.id)}
                    onToggle={() => toggle(entry.id)}
                    allGenerals={allGenerals}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="panel flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            {"\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u95EE\u7B54"}
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            {"\u5C1D\u8BD5\u4FEE\u6539\u641C\u7D22\u6761\u4EF6\u6216\u6E05\u9664\u7B5B\u9009"}
          </p>
          <button
            className="mt-4 rounded-lg border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => {
              setSearch("");
              setActiveTab("all");
            }}
            type="button"
          >
            {"\u6E05\u9664\u6240\u6709\u7B5B\u9009"}
          </button>
        </div>
      )}
    </div>
  );
}
