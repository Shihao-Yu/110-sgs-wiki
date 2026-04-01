"use client";

import type { Faction } from "@sgs/data";
import { useState } from "react";
import LeaderboardTable, {
  type LeaderboardEntry,
} from "../components/LeaderboardTable";

/* ------------------------------------------------------------------ */
/*  Mock data — 20 generals with plausible Sanguosha Kingdom War stats */
/* ------------------------------------------------------------------ */
const MOCK_DATA: LeaderboardEntry[] = [
  { rank: 1,  name: "司马懿",  faction: "WEI", winRate: 58.3, games: 12480, avgSurvival: 6.8 },
  { rank: 2,  name: "诸葛亮",  faction: "SHU", winRate: 57.1, games: 14200, avgSurvival: 6.5 },
  { rank: 3,  name: "孙权",    faction: "WU",  winRate: 56.4, games: 11350, avgSurvival: 7.1 },
  { rank: 4,  name: "曹操",    faction: "WEI", winRate: 55.8, games: 13900, avgSurvival: 6.2 },
  { rank: 5,  name: "刘备",    faction: "SHU", winRate: 55.2, games: 12100, avgSurvival: 6.9 },
  { rank: 6,  name: "陆逊",    faction: "WU",  winRate: 54.7, games: 9870,  avgSurvival: 7.3 },
  { rank: 7,  name: "郭嘉",    faction: "WEI", winRate: 54.1, games: 10540, avgSurvival: 5.4 },
  { rank: 8,  name: "张角",    faction: "QUN", winRate: 53.6, games: 8920,  avgSurvival: 5.1 },
  { rank: 9,  name: "周瑜",    faction: "WU",  winRate: 53.0, games: 11200, avgSurvival: 5.8 },
  { rank: 10, name: "关羽",    faction: "SHU", winRate: 52.5, games: 13400, avgSurvival: 5.6 },
  { rank: 11, name: "张辽",    faction: "WEI", winRate: 52.1, games: 10800, avgSurvival: 6.0 },
  { rank: 12, name: "赵云",    faction: "SHU", winRate: 51.8, games: 14800, avgSurvival: 6.7 },
  { rank: 13, name: "甘宁",    faction: "WU",  winRate: 51.3, games: 9200,  avgSurvival: 5.9 },
  { rank: 14, name: "贾诩",    faction: "QUN", winRate: 50.9, games: 8750,  avgSurvival: 6.3 },
  { rank: 15, name: "吕蒙",    faction: "WU",  winRate: 50.4, games: 9500,  avgSurvival: 6.1 },
  { rank: 16, name: "荀彧",    faction: "WEI", winRate: 50.0, games: 8300,  avgSurvival: 5.7 },
  { rank: 17, name: "庞统",    faction: "SHU", winRate: 49.6, games: 7600,  avgSurvival: 4.8 },
  { rank: 18, name: "司马昭",  faction: "JIN", winRate: 49.2, games: 6100,  avgSurvival: 6.4 },
  { rank: 19, name: "华佗",    faction: "QUN", winRate: 48.7, games: 10200, avgSurvival: 7.0 },
  { rank: 20, name: "司马师",  faction: "JIN", winRate: 48.3, games: 5800,  avgSurvival: 6.2 },
];

/* ------------------------------------------------------------------ */
/*  Faction filter (inline — matches existing FactionFilter pattern)   */
/* ------------------------------------------------------------------ */
const FACTIONS: { id: Faction; cn: string }[] = [
  { id: "WEI", cn: "魏" },
  { id: "SHU", cn: "蜀" },
  { id: "WU",  cn: "吴" },
  { id: "QUN", cn: "群" },
  { id: "JIN", cn: "晋" },
];

const factionStyles: Record<Faction, { active: string; inactive: string }> = {
  WEI: {
    active:
      "border-wei bg-wei text-white shadow-md shadow-wei/25 dark:shadow-wei/40",
    inactive:
      "border-wei/30 bg-wei/10 text-wei hover:bg-wei/20 dark:border-wei/40 dark:bg-wei/15 dark:text-blue-300 dark:hover:bg-wei/25",
  },
  SHU: {
    active:
      "border-shu bg-shu text-white shadow-md shadow-shu/25 dark:shadow-shu/40",
    inactive:
      "border-shu/30 bg-shu/10 text-shu hover:bg-shu/20 dark:border-shu/40 dark:bg-shu/15 dark:text-red-300 dark:hover:bg-shu/25",
  },
  WU: {
    active:
      "border-wu bg-wu text-white shadow-md shadow-wu/25 dark:shadow-wu/40",
    inactive:
      "border-wu/30 bg-wu/10 text-wu hover:bg-wu/20 dark:border-wu/40 dark:bg-wu/15 dark:text-green-300 dark:hover:bg-wu/25",
  },
  QUN: {
    active:
      "border-qun bg-qun text-white shadow-md shadow-qun/25 dark:shadow-qun/40",
    inactive:
      "border-qun/30 bg-qun/10 text-qun hover:bg-qun/20 dark:border-qun/40 dark:bg-qun/15 dark:text-yellow-200 dark:hover:bg-qun/25",
  },
  JIN: {
    active:
      "border-jin bg-jin text-white shadow-md shadow-jin/25 dark:shadow-jin/40",
    inactive:
      "border-jin/30 bg-jin/10 text-jin hover:bg-jin/20 dark:border-jin/40 dark:bg-jin/15 dark:text-purple-200 dark:hover:bg-jin/25",
  },
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function LeaderboardPage() {
  const [factions, setFactions] = useState<Set<Faction>>(new Set());

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

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">Leaderboard</span>
        <h1 className="section-title mt-3">胜率排行榜</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          按胜率排名的国战武将榜单。点击列头排序，按势力筛选。前三名以金银铜标记。
        </p>
      </header>

      {/* Faction filter toolbar */}
      <div className="panel mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            势力筛选:
          </span>
          {FACTIONS.map(({ id, cn }) => {
            const isActive = factions.has(id);
            const style = factionStyles[id];
            return (
              <button
                key={id}
                className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-all ${
                  isActive ? style.active : style.inactive
                }`}
                onClick={() => toggleFaction(id)}
                type="button"
              >
                {cn}
              </button>
            );
          })}
          {factions.size > 0 && (
            <button
              className="ml-2 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setFactions(new Set())}
              type="button"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="panel overflow-hidden">
        <LeaderboardTable data={MOCK_DATA} factionFilter={factions} />
      </div>

      {/* Data disclaimer */}
      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        数据为模拟数据，仅供界面演示。正式数据将接入蒙特卡洛模拟引擎。
      </p>
    </div>
  );
}
