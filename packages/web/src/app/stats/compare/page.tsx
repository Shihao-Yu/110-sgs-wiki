"use client";

import type { Faction } from "@sgs/data";
import { useState } from "react";
import ComparisonChart, {
  type ComparisonEntry,
} from "./components/ComparisonChart";

/* ------------------------------------------------------------------ */
/*  Mock general pool — reuses subset from leaderboard + adds scores   */
/* ------------------------------------------------------------------ */

type GeneralOption = {
  id: string;
  name: string;
  faction: Faction;
  hp: number;
  winRate: number;
  games: number;
  /** [过牌, 控场, 爆发, 防御] */
  scores: [number, number, number, number];
};

const GENERALS: GeneralOption[] = [
  { id: "simayi",    name: "司马懿",  faction: "WEI", hp: 3, winRate: 58.3, games: 12480, scores: [6, 8, 5, 7] },
  { id: "zhugeliang", name: "诸葛亮",  faction: "SHU", hp: 3, winRate: 57.1, games: 14200, scores: [7, 9, 4, 5] },
  { id: "sunquan",   name: "孙权",    faction: "WU",  hp: 4, winRate: 56.4, games: 11350, scores: [8, 5, 3, 8] },
  { id: "caocao",    name: "曹操",    faction: "WEI", hp: 4, winRate: 55.8, games: 13900, scores: [7, 7, 6, 5] },
  { id: "liubei",    name: "刘备",    faction: "SHU", hp: 4, winRate: 55.2, games: 12100, scores: [5, 4, 7, 7] },
  { id: "luxun",     name: "陆逊",    faction: "WU",  hp: 3, winRate: 54.7, games: 9870,  scores: [9, 6, 5, 4] },
  { id: "guojia",    name: "郭嘉",    faction: "WEI", hp: 3, winRate: 54.1, games: 10540, scores: [8, 5, 4, 3] },
  { id: "zhangjiao", name: "张角",    faction: "QUN", hp: 3, winRate: 53.6, games: 8920,  scores: [4, 8, 7, 3] },
  { id: "zhouyu",    name: "周瑜",    faction: "WU",  hp: 3, winRate: 53.0, games: 11200, scores: [5, 7, 8, 3] },
  { id: "guanyu",    name: "关羽",    faction: "SHU", hp: 4, winRate: 52.5, games: 13400, scores: [3, 5, 9, 6] },
  { id: "zhangliao", name: "张辽",    faction: "WEI", hp: 4, winRate: 52.1, games: 10800, scores: [4, 6, 7, 5] },
  { id: "zhaoyun",   name: "赵云",    faction: "SHU", hp: 4, winRate: 51.8, games: 14800, scores: [4, 3, 6, 9] },
  { id: "ganning",   name: "甘宁",    faction: "WU",  hp: 4, winRate: 51.3, games: 9200,  scores: [5, 7, 6, 4] },
  { id: "jiaxu",     name: "贾诩",    faction: "QUN", hp: 3, winRate: 50.9, games: 8750,  scores: [3, 9, 6, 5] },
  { id: "lvmeng",    name: "吕蒙",    faction: "WU",  hp: 4, winRate: 50.4, games: 9500,  scores: [6, 6, 4, 6] },
  { id: "xunyu",     name: "荀彧",    faction: "WEI", hp: 3, winRate: 50.0, games: 8300,  scores: [7, 4, 2, 6] },
  { id: "pangtong",  name: "庞统",    faction: "SHU", hp: 3, winRate: 49.6, games: 7600,  scores: [5, 8, 7, 2] },
  { id: "simazhao",  name: "司马昭",  faction: "JIN", hp: 3, winRate: 49.2, games: 6100,  scores: [5, 6, 5, 6] },
  { id: "huatuo",    name: "华佗",    faction: "QUN", hp: 3, winRate: 48.7, games: 10200, scores: [4, 3, 2, 9] },
  { id: "simashi",   name: "司马师",  faction: "JIN", hp: 3, winRate: 48.3, games: 5800,  scores: [5, 7, 4, 6] },
];

const FACTION_LABEL: Record<Faction, string> = {
  WEI: "魏",
  SHU: "蜀",
  WU: "吴",
  QUN: "群",
  JIN: "晋",
};

const factionBadge: Record<Faction, string> = {
  WEI: "border-wei/30 bg-wei/10 text-wei dark:border-wei/40 dark:bg-wei/15 dark:text-blue-300",
  SHU: "border-shu/30 bg-shu/10 text-shu dark:border-shu/40 dark:bg-shu/15 dark:text-red-300",
  WU:  "border-wu/30 bg-wu/10 text-wu dark:border-wu/40 dark:bg-wu/15 dark:text-green-300",
  QUN: "border-qun/30 bg-qun/10 text-qun dark:border-qun/40 dark:bg-qun/15 dark:text-yellow-200",
  JIN: "border-jin/30 bg-jin/10 text-jin dark:border-jin/40 dark:bg-jin/15 dark:text-purple-200",
};

const FACTION_HEX: Record<Faction, string> = {
  WEI: "#2563EB",
  SHU: "#DC2626",
  WU:  "#16A34A",
  QUN: "#CA8A04",
  JIN: "#9333EA",
};

const DIMENSION_LABELS = ["过牌", "控场", "爆发", "防御"] as const;

const MAX_SELECTIONS = 4;

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  /* ---------- Derived data ---------- */

  const selectedGenerals = selectedIds
    .map((id) => GENERALS.find((g) => g.id === id))
    .filter((g): g is GeneralOption => g != null);

  const chartEntries: ComparisonEntry[] = selectedGenerals.map((g) => ({
    name: g.name,
    faction: g.faction,
    scores: g.scores,
  }));

  /* ---------- Dropdown filter ---------- */

  const filteredOptions = GENERALS.filter(
    (g) =>
      !selectedIds.includes(g.id) &&
      (query === "" || g.name.includes(query) || g.id.includes(query.toLowerCase())),
  );

  /* ---------- Selection handlers ---------- */

  const addGeneral = (id: string) => {
    if (selectedIds.length >= MAX_SELECTIONS) return;
    setSelectedIds((prev) => [...prev, id]);
    setQuery("");
  };

  const removeGeneral = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">Comparison</span>
        <h1 className="section-title mt-3">武将对比</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          选择 2-4 名武将，叠加雷达图对比过牌、控场、爆发、防御四维评分，并查看详细属性差异。
        </p>
      </header>

      {/* ---- General selector ---- */}
      <div className="panel mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
            选择武将:
          </span>

          <div className="relative flex-1">
            <input
              className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              disabled={selectedIds.length >= MAX_SELECTIONS}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selectedIds.length >= MAX_SELECTIONS
                  ? "已达上限 (最多4名)"
                  : "搜索武将名称..."
              }
              type="text"
              value={query}
            />

            {/* Dropdown */}
            {query.length > 0 && filteredOptions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-700/80 dark:bg-slate-900">
                {filteredOptions.slice(0, 8).map((g) => (
                  <li key={g.id}>
                    <button
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      onClick={() => addGeneral(g.id)}
                      type="button"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {g.name}
                      </span>
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${factionBadge[g.faction]}`}
                      >
                        {FACTION_LABEL[g.faction]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Selected tags */}
        {selectedIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedGenerals.map((g) => (
              <span
                key={g.id}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium"
                style={{
                  borderColor: `${FACTION_HEX[g.faction]}40`,
                  backgroundColor: `${FACTION_HEX[g.faction]}15`,
                  color: FACTION_HEX[g.faction],
                }}
              >
                {g.name}
                <button
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  onClick={() => removeGeneral(g.id)}
                  type="button"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ---- Main content grid ---- */}
      {selectedGenerals.length >= 2 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Radar chart */}
          <div className="panel flex flex-col items-center p-6 sm:p-8">
            <h2 className="mb-4 w-full text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              四维对比
            </h2>
            <div className="aspect-square w-full max-w-xs">
              <ComparisonChart entries={chartEntries} />
            </div>
          </div>

          {/* Stats table */}
          <div className="panel overflow-hidden">
            <h2 className="px-6 pt-6 text-sm font-semibold uppercase tracking-wider text-slate-500 sm:px-8 sm:pt-8 dark:text-slate-400">
              属性对比
            </h2>
            <div className="overflow-x-auto">
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-700/80">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      指标
                    </th>
                    {selectedGenerals.map((g) => (
                      <th
                        key={g.id}
                        className="px-4 py-2.5 text-center text-xs font-semibold"
                        style={{ color: FACTION_HEX[g.faction] }}
                      >
                        {g.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* Faction */}
                  <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                      势力
                    </td>
                    {selectedGenerals.map((g) => (
                      <td key={g.id} className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${factionBadge[g.faction]}`}
                        >
                          {FACTION_LABEL[g.faction]}
                        </span>
                      </td>
                    ))}
                  </tr>
                  {/* HP */}
                  <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                      体力
                    </td>
                    {selectedGenerals.map((g) => (
                      <td
                        key={g.id}
                        className="px-4 py-2.5 text-center font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      >
                        {g.hp}
                      </td>
                    ))}
                  </tr>
                  {/* Win Rate */}
                  <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                      胜率
                    </td>
                    {selectedGenerals.map((g) => (
                      <td
                        key={g.id}
                        className="px-4 py-2.5 text-center font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      >
                        {g.winRate.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  {/* Games */}
                  <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                      场次
                    </td>
                    {selectedGenerals.map((g) => (
                      <td
                        key={g.id}
                        className="px-4 py-2.5 text-center tabular-nums text-slate-600 dark:text-slate-300"
                      >
                        {g.games.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  {/* Dimension scores */}
                  {DIMENSION_LABELS.map((label, di) => (
                    <tr
                      key={label}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                        {label}
                      </td>
                      {selectedGenerals.map((g) => {
                        const val = g.scores[di];
                        /* Highlight the highest value in this dimension */
                        const max = Math.max(
                          ...selectedGenerals.map((x) => x.scores[di]),
                        );
                        const isBest = val === max;
                        return (
                          <td
                            key={g.id}
                            className={`px-4 py-2.5 text-center font-mono tabular-nums ${
                              isBest
                                ? "font-semibold text-slate-900 dark:text-white"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
          <svg
            className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            viewBox="0 0 24 24"
          >
            <path
              d="M8 7h3V4H8zm0 13h3v-3H8zm5-13h3V4h-3zm0 13h3v-3h-3zM3 11h18v2H3z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            请至少选择 2 名武将开始对比
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            最多可选 4 名武将同时比较
          </p>
        </div>
      )}

      {/* Data disclaimer */}
      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        评分数据为模拟数据，仅供界面演示。正式数据将接入 AI 评分引擎。
      </p>
    </div>
  );
}
