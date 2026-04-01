"use client";

import type { Faction } from "@sgs/data";
import { useMemo, useState } from "react";

export type LeaderboardEntry = {
  rank: number;
  name: string;
  faction: Faction;
  winRate: number;
  games: number;
  avgSurvival: number;
};

export type SortField =
  | "rank"
  | "name"
  | "faction"
  | "winRate"
  | "games"
  | "avgSurvival";

type SortDirection = "asc" | "desc";

const FACTION_LABEL: Record<Faction, string> = {
  WEI: "魏",
  SHU: "蜀",
  WU: "吴",
  QUN: "群",
  JIN: "晋",
};

const FACTION_ORDER: Record<Faction, number> = {
  WEI: 0,
  SHU: 1,
  WU: 2,
  QUN: 3,
  JIN: 4,
};

const factionBadge: Record<Faction, string> = {
  WEI: "border-wei/30 bg-wei/10 text-wei dark:border-wei/40 dark:bg-wei/15 dark:text-blue-300",
  SHU: "border-shu/30 bg-shu/10 text-shu dark:border-shu/40 dark:bg-shu/15 dark:text-red-300",
  WU: "border-wu/30 bg-wu/10 text-wu dark:border-wu/40 dark:bg-wu/15 dark:text-green-300",
  QUN: "border-qun/30 bg-qun/10 text-qun dark:border-qun/40 dark:bg-qun/15 dark:text-yellow-200",
  JIN: "border-jin/30 bg-jin/10 text-jin dark:border-jin/40 dark:bg-jin/15 dark:text-purple-200",
};

const COLUMNS: { field: SortField; label: string; align: string }[] = [
  { field: "rank", label: "#", align: "text-center" },
  { field: "name", label: "武将", align: "text-left" },
  { field: "faction", label: "势力", align: "text-center" },
  { field: "winRate", label: "胜率", align: "text-right" },
  { field: "games", label: "场次", align: "text-right" },
  { field: "avgSurvival", label: "存活", align: "text-right" },
];

function rankDecoration(rank: number): string | null {
  if (rank === 1) return "text-amber-500 dark:text-amber-400";
  if (rank === 2) return "text-slate-400 dark:text-slate-300";
  if (rank === 3) return "text-amber-700 dark:text-amber-600";
  return null;
}

function rankMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

type LeaderboardTableProps = {
  data: LeaderboardEntry[];
  factionFilter: Set<Faction>;
};

export default function LeaderboardTable({
  data,
  factionFilter,
}: LeaderboardTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Default direction: ascending for rank/name/faction, descending for stats
      setSortDir(
        field === "rank" || field === "name" || field === "faction"
          ? "asc"
          : "desc"
      );
    }
  };

  const sorted = useMemo(() => {
    let filtered = data;
    if (factionFilter.size > 0) {
      filtered = data.filter((d) => factionFilter.has(d.faction));
    }

    const result = [...filtered];
    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "rank":
          return (a.rank - b.rank) * dir;
        case "name":
          return a.name.localeCompare(b.name, "zh-CN") * dir;
        case "faction": {
          const fDiff = FACTION_ORDER[a.faction] - FACTION_ORDER[b.faction];
          if (fDiff !== 0) return fDiff * dir;
          return (a.rank - b.rank) * dir;
        }
        case "winRate":
          return (a.winRate - b.winRate) * dir;
        case "games":
          return (a.games - b.games) * dir;
        case "avgSurvival":
          return (a.avgSurvival - b.avgSurvival) * dir;
        default:
          return 0;
      }
    });
    return result;
  }, [data, factionFilter, sortField, sortDir]);

  const sortIndicator = (field: SortField) => {
    if (field !== sortField) return null;
    return (
      <span className="ml-1 text-brand">
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 dark:border-slate-700/80">
            {COLUMNS.map(({ field, label, align }) => (
              <th
                key={field}
                className={`cursor-pointer select-none whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${align}`}
                onClick={() => handleSort(field)}
              >
                {label}
                {sortIndicator(field)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {sorted.map((entry) => {
            const decoration = rankDecoration(entry.rank);
            return (
              <tr
                key={entry.name}
                className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                {/* Rank */}
                <td
                  className={`whitespace-nowrap px-3 py-3 text-center font-semibold ${decoration ?? "text-slate-500 dark:text-slate-400"}`}
                >
                  {rankMedal(entry.rank)}
                </td>
                {/* Name */}
                <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {entry.name}
                </td>
                {/* Faction */}
                <td className="whitespace-nowrap px-3 py-3 text-center">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${factionBadge[entry.faction]}`}
                  >
                    {FACTION_LABEL[entry.faction]}
                  </span>
                </td>
                {/* Win Rate */}
                <td className="whitespace-nowrap px-3 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {entry.winRate.toFixed(1)}%
                </td>
                {/* Games */}
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {entry.games.toLocaleString()}
                </td>
                {/* Avg Survival */}
                <td className="whitespace-nowrap px-3 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  {entry.avgSurvival.toFixed(1)}
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td
                className="px-3 py-12 text-center text-slate-400 dark:text-slate-500"
                colSpan={6}
              >
                没有匹配的武将数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
