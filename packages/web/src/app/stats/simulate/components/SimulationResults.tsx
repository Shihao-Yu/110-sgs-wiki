"use client";

import type { Faction } from "@sgs/data";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FactionWinRate = {
  faction: Faction;
  label: string;
  wins: number;
  total: number;
  rate: number;
};

export type TopGeneral = {
  name: string;
  faction: Faction;
  wins: number;
  games: number;
  winRate: number;
};

export type SimulationResultData = {
  factionWinRates: FactionWinRate[];
  topGenerals: TopGeneral[];
  avgTurns: number;
  totalGames: number;
  elapsedMs: number;
};

/* ------------------------------------------------------------------ */
/*  Faction styling — matches project patterns                         */
/* ------------------------------------------------------------------ */

const factionBarColor: Record<Faction, string> = {
  WEI: "bg-wei",
  SHU: "bg-shu",
  WU: "bg-wu",
  QUN: "bg-qun",
  JIN: "bg-jin",
};

const factionBadge: Record<Faction, string> = {
  WEI: "border-wei/30 bg-wei/10 text-wei dark:border-wei/40 dark:bg-wei/15 dark:text-blue-300",
  SHU: "border-shu/30 bg-shu/10 text-shu dark:border-shu/40 dark:bg-shu/15 dark:text-red-300",
  WU: "border-wu/30 bg-wu/10 text-wu dark:border-wu/40 dark:bg-wu/15 dark:text-green-300",
  QUN: "border-qun/30 bg-qun/10 text-qun dark:border-qun/40 dark:bg-qun/15 dark:text-yellow-200",
  JIN: "border-jin/30 bg-jin/10 text-jin dark:border-jin/40 dark:bg-jin/15 dark:text-purple-200",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type SimulationResultsProps = {
  data: SimulationResultData;
};

export default function SimulationResults({ data }: SimulationResultsProps) {
  const maxRate = Math.max(...data.factionWinRates.map((f) => f.rate), 1);

  return (
    <div className="space-y-6">
      {/* Summary stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="panel flex flex-col items-center p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            总场次
          </span>
          <span className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {data.totalGames.toLocaleString()}
          </span>
        </div>
        <div className="panel flex flex-col items-center p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            平均回合
          </span>
          <span className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {data.avgTurns.toFixed(1)}
          </span>
        </div>
        <div className="panel flex flex-col items-center p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            耗时
          </span>
          <span className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {data.elapsedMs < 1000
              ? `${data.elapsedMs}ms`
              : `${(data.elapsedMs / 1000).toFixed(1)}s`}
          </span>
        </div>
      </div>

      {/* Faction win rates — bar chart */}
      <div className="panel p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          势力胜率
        </h2>
        <div className="space-y-3">
          {data.factionWinRates.map((f) => (
            <div key={f.faction} className="flex items-center gap-3">
              <span
                className={`inline-flex w-8 justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${factionBadge[f.faction]}`}
              >
                {f.label}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                <div
                  className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${factionBarColor[f.faction]}`}
                  style={{ width: `${(f.rate / maxRate) * 100}%`, opacity: 0.8 }}
                />
                <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {f.rate.toFixed(1)}%
                </span>
              </div>
              <span className="w-16 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {f.wins}/{f.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top generals table */}
      <div className="panel overflow-hidden">
        <h2 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wider text-slate-500 sm:px-6 sm:pt-6 dark:text-slate-400">
          胜率最高武将
        </h2>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-700/80">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  #
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  武将
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  势力
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  胜率
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  胜/总
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.topGenerals.map((g, i) => (
                <tr
                  key={g.name}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                    {g.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-center">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${factionBadge[g.faction]}`}
                    >
                      {FACTION_CN[g.faction]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {g.winRate.toFixed(1)}%
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {g.wins}/{g.games}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const FACTION_CN: Record<Faction, string> = {
  WEI: "魏",
  SHU: "蜀",
  WU: "吴",
  QUN: "群",
  JIN: "晋",
};
