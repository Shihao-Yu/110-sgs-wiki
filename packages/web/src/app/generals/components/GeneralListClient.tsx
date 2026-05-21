"use client";

import type { Faction } from "@sgs/data";
import { useEffect, useMemo, useState } from "react";
import type { RatingTier } from "@/lib/ratings";
import FactionFilter from "./FactionFilter";
import GeneralCard from "./GeneralCard";
import HpFilter from "./HpFilter";
import RatingFilter, { type RatingFilterValue } from "./RatingFilter";
import SearchBar from "./SearchBar";
import SortSelect, { type SortKey } from "./SortSelect";

const SCROLL_STORAGE_KEY = "generals-list-scroll-y";

export type GeneralEntry = {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  hp: number;
  image: string;
  skillNames: string[];
  topTier: RatingTier | null;
};

type GeneralListClientProps = {
  generals: GeneralEntry[];
};

const FACTION_ORDER: Record<Faction, number> = {
  WEI: 0,
  SHU: 1,
  WU: 2,
  QUN: 3,
  JIN: 4,
};

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  // Simple substring match -- covers name, title, skill names
  return lower.includes(q);
}

export default function GeneralListClient({
  generals,
}: GeneralListClientProps) {
  const [search, setSearch] = useState("");
  const [factions, setFactions] = useState<Set<Faction>>(new Set());
  const [hpFilter, setHpFilter] = useState(0); // 0 = all
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>("all");
  const [sortKey, setSortKey] = useState<SortKey>("faction");

  /* Restore scroll position from a prior visit, save on scroll. Lets users
   * return to the same card after viewing a general's detail page. */
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (saved) {
      const y = Number.parseInt(saved, 10);
      if (Number.isFinite(y) && y > 0) {
        // Defer to allow grid to layout first.
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
      }, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const toggleFaction = (faction: Faction) => {
    setFactions((prev) => {
      const next = new Set(prev);
      if (next.has(faction)) {
        next.delete(faction);
      } else {
        next.add(faction);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = generals;

    // Faction filter
    if (factions.size > 0) {
      result = result.filter((g) => factions.has(g.faction));
    }

    // HP filter
    if (hpFilter > 0) {
      if (hpFilter >= 5) {
        result = result.filter((g) => g.hp >= 5);
      } else {
        result = result.filter((g) => g.hp === hpFilter);
      }
    }

    // Rating filter
    if (ratingFilter === "unrated") {
      result = result.filter((g) => g.topTier === null);
    } else if (ratingFilter !== "all") {
      result = result.filter((g) => g.topTier === ratingFilter);
    }

    // Search filter (fuzzy match on name, title, skill names)
    if (search.trim()) {
      const q = search.trim();
      result = result.filter(
        (g) =>
          fuzzyMatch(g.name, q) ||
          fuzzyMatch(g.title, q) ||
          g.skillNames.some((s) => fuzzyMatch(s, q))
      );
    }

    // Sort
    const sorted = [...result];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name, "zh-CN");
        case "id":
          return a.id.localeCompare(b.id);
        case "faction": {
          const fDiff = FACTION_ORDER[a.faction] - FACTION_ORDER[b.faction];
          if (fDiff !== 0) return fDiff;
          return a.id.localeCompare(b.id);
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [generals, factions, hpFilter, ratingFilter, search, sortKey]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <SearchBar onChange={setSearch} value={search} />

          {/* Filters row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <FactionFilter onToggle={toggleFaction} selected={factions} />
            <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <HpFilter onChange={setHpFilter} selected={hpFilter} />
              <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
              <RatingFilter onChange={setRatingFilter} selected={ratingFilter} />
              <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
              <SortSelect onChange={setSortKey} value={sortKey} />
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            共 {filtered.length} 名武将
            {factions.size > 0 || hpFilter > 0 || ratingFilter !== "all" || search.trim()
              ? `（已筛选，共 ${generals.length} 名）`
              : ""}
          </p>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((g) => (
            <GeneralCard
              key={g.id}
              faction={g.faction}
              hp={g.hp}
              id={g.id}
              image={g.image}
              name={g.name}
              title={g.title}
            />
          ))}
        </div>
      ) : (
        <div className="panel flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            没有找到匹配的武将
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            尝试修改搜索条件或清除筛选
          </p>
          <button
            className="mt-4 rounded-lg border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => {
              setSearch("");
              setFactions(new Set());
              setHpFilter(0);
              setRatingFilter("all");
            }}
            type="button"
          >
            清除所有筛选
          </button>
        </div>
      )}
    </div>
  );
}
