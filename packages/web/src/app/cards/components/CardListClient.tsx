"use client";

import { useMemo, useState } from "react";
import type { CardSummary } from "../page";
import CardEntry from "./CardEntry";

/* ------------------------------------------------------------------ */
/*  Filter tab definitions                                             */
/* ------------------------------------------------------------------ */

type FilterTab = "all" | "basic" | "trick" | "equipment";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "\u5168\u90E8" },
  { key: "basic", label: "\u57FA\u672C\u724C" },
  { key: "trick", label: "\u9526\u56CA\u724C" },
  { key: "equipment", label: "\u88C5\u5907\u724C" },
];

/* ------------------------------------------------------------------ */
/*  Equipment sub-group ordering                                       */
/* ------------------------------------------------------------------ */

const EQUIPMENT_SUBGROUPS: { key: string; label: string }[] = [
  { key: "weapon", label: "\u6B66\u5668" },
  { key: "armor", label: "\u9632\u5177" },
  { key: "defensiveHorse", label: "\u9632\u5FA1\u5750\u9A91" },
  { key: "offensiveHorse", label: "\u8FDB\u653B\u5750\u9A91" },
  { key: "treasure", label: "\u5B9D\u7269" },
];

const TRICK_SUBGROUPS: { key: string; label: string }[] = [
  { key: "instantTrick", label: "\u5373\u65F6\u9526\u56CA" },
  { key: "delayedTrick", label: "\u5EF6\u65F6\u9526\u56CA" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </h2>
      <span className="rounded-full border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        {count}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card grid for a group                                              */
/* ------------------------------------------------------------------ */

function CardGrid({ cards }: { cards: CardSummary[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const firstCopy = card.copies[0];
        if (!firstCopy) return null;
        return (
          <CardEntry
            key={card.name}
            count={card.copies.length}
            description={card.description}
            name={card.name}
            number={firstCopy.number}
            range={card.range}
            subtype={card.subtype}
            suit={firstCopy.suit}
            type={card.type}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Render a type section with optional sub-groups                     */
/* ------------------------------------------------------------------ */

function TypeSection({
  label,
  cards,
  subgroups,
}: {
  label: string;
  cards: CardSummary[];
  subgroups?: { key: string; label: string }[];
}) {
  if (cards.length === 0) return null;

  if (!subgroups) {
    return (
      <section className="space-y-3">
        <SectionHeader count={cards.length} label={label} />
        <CardGrid cards={cards} />
      </section>
    );
  }

  const grouped = groupBy(cards, (c) => c.subtype ?? "unknown");

  return (
    <section className="space-y-5">
      <SectionHeader count={cards.length} label={label} />
      {subgroups.map((sg) => {
        const group = grouped.get(sg.key);
        if (!group || group.length === 0) return null;
        return (
          <div key={sg.key} className="space-y-2 pl-0 sm:pl-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              {sg.label}
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ({group.length})
              </span>
            </h3>
            <CardGrid cards={group} />
          </div>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main client component                                              */
/* ------------------------------------------------------------------ */

interface CardListClientProps {
  cards: CardSummary[];
  totalCopies: number;
}

export default function CardListClient({
  cards,
  totalCopies,
}: CardListClientProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const { basics, tricks, equipment } = useMemo(() => {
    return {
      basics: cards.filter((c) => c.type === "basic"),
      tricks: cards.filter((c) => c.type === "trick"),
      equipment: cards.filter((c) => c.type === "equipment"),
    };
  }, [cards]);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "basic":
        return { basics, tricks: [], equipment: [] };
      case "trick":
        return { basics: [], tricks, equipment: [] };
      case "equipment":
        return { basics: [], tricks: [], equipment };
      default:
        return { basics, tricks, equipment };
    }
  }, [activeTab, basics, tricks, equipment]);

  const visibleCount =
    filtered.basics.length + filtered.tricks.length + filtered.equipment.length;

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  className={[
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-shu/30 bg-shu/10 text-shu dark:border-shu/50 dark:bg-shu/20 dark:text-red-300"
                      : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                  ].join(" ")}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Result count */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {"\u5171"} {visibleCount} {"\u79CD\u5361\u724C"}
            {activeTab !== "all"
              ? `\uFF08\u5DF2\u7B5B\u9009\uFF0C\u5171 ${cards.length} \u79CD / ${totalCopies} \u5F20\uFF09`
              : `\uFF08${totalCopies} \u5F20\uFF09`}
          </p>
        </div>
      </div>

      {/* Card sections */}
      <div className="space-y-8">
        <TypeSection
          cards={filtered.basics}
          label={"\u57FA\u672C\u724C"}
        />
        <TypeSection
          cards={filtered.tricks}
          label={"\u9526\u56CA\u724C"}
          subgroups={TRICK_SUBGROUPS}
        />
        <TypeSection
          cards={filtered.equipment}
          label={"\u88C5\u5907\u724C"}
          subgroups={EQUIPMENT_SUBGROUPS}
        />
      </div>

      {/* Empty state */}
      {visibleCount === 0 && (
        <div className="panel flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            {"\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u5361\u724C"}
          </p>
        </div>
      )}
    </div>
  );
}
