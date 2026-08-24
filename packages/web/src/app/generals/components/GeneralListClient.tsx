"use client";

import type { Faction } from "@sgs/data";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RATING_TIERS, type RatingTier } from "@/lib/ratings";
import {
  getGeneralPackVersion,
  type GeneralPackVersion,
} from "../../../../../data/src/types/general";
import FactionFilter from "./FactionFilter";
import GeneralCard from "./GeneralCard";
import PackVersionFilter from "./PackVersionFilter";
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
  averageTier: RatingTier | null;
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

const VALID_FACTIONS: ReadonlyArray<Faction> = ["WEI", "SHU", "WU", "QUN", "JIN"];
const VALID_VERSIONS: ReadonlyArray<GeneralPackVersion> = ["guozhan", "qlhd"];
const VALID_SORTS: ReadonlyArray<SortKey> = ["name", "id", "faction"];

function parseFactions(raw: string | null): Set<Faction> {
  if (!raw) return new Set();
  const out = new Set<Faction>();
  for (const part of raw.split(",")) {
    if ((VALID_FACTIONS as ReadonlyArray<string>).includes(part)) {
      out.add(part as Faction);
    }
  }
  return out;
}

function parseVersions(raw: string | null): Set<GeneralPackVersion> {
  if (!raw) return new Set();
  const out = new Set<GeneralPackVersion>();
  for (const part of raw.split(",")) {
    if ((VALID_VERSIONS as ReadonlyArray<string>).includes(part)) {
      out.add(part as GeneralPackVersion);
    }
  }
  return out;
}

function parseRating(raw: string | null): RatingFilterValue {
  if (raw === "unrated") return "unrated";
  if (raw && (RATING_TIERS as ReadonlyArray<string>).includes(raw)) return raw as RatingTier;
  return "all";
}

function parseSort(raw: string | null): SortKey {
  if (raw && (VALID_SORTS as ReadonlyArray<string>).includes(raw)) return raw as SortKey;
  return "faction";
}

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  // Simple substring match -- covers name, title
  return lower.includes(q);
}

export default function GeneralListClient({
  generals,
}: GeneralListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lazy-init state from URL on first render so back-nav restores filters.
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [factions, setFactions] = useState<Set<Faction>>(() => parseFactions(searchParams.get("faction")));
  const [packVersions, setPackVersions] = useState<Set<GeneralPackVersion>>(() => parseVersions(searchParams.get("version")));
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>(() => parseRating(searchParams.get("rating")));
  const [sortKey, setSortKey] = useState<SortKey>(() => parseSort(searchParams.get("sort")));

  /* Sync state → URL (skip first render — URL already reflects state). */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (factions.size > 0) params.set("faction", [...factions].join(","));
    if (packVersions.size > 0) params.set("version", [...packVersions].join(","));
    if (ratingFilter !== "all") params.set("rating", ratingFilter);
    if (sortKey !== "faction") params.set("sort", sortKey);
    const qs = params.toString();
    router.replace(qs ? `/generals?${qs}` : "/generals", { scroll: false });
  }, [search, factions, packVersions, ratingFilter, sortKey, router]);

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

  const togglePackVersion = (version: GeneralPackVersion) => {
    setPackVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
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

    // Pack version filter (国战 / 群狼环鼎, judged by id prefix)
    if (packVersions.size > 0) {
      result = result.filter((g) => packVersions.has(getGeneralPackVersion(g.id)));
    }

    // Rating filter (by weighted-average tier)
    if (ratingFilter === "unrated") {
      result = result.filter((g) => g.averageTier === null);
    } else if (ratingFilter !== "all") {
      result = result.filter((g) => g.averageTier === ratingFilter);
    }

    // Search filter (fuzzy match on name, title, average tier)
    if (search.trim()) {
      const q = search.trim();
      result = result.filter(
        (g) =>
          fuzzyMatch(g.name, q) ||
          fuzzyMatch(g.title, q) ||
          (g.averageTier != null && fuzzyMatch(g.averageTier, q))
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
  }, [generals, factions, packVersions, ratingFilter, search, sortKey]);

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
            <PackVersionFilter onToggle={togglePackVersion} selected={packVersions} />
            <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <RatingFilter onChange={setRatingFilter} selected={ratingFilter} />
              <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
              <SortSelect onChange={setSortKey} value={sortKey} />
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            共 {filtered.length} 名武将
            {factions.size > 0 || packVersions.size > 0 || ratingFilter !== "all" || search.trim()
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
              setPackVersions(new Set());
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
