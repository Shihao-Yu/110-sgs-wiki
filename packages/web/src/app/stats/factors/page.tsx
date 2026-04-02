"use client";

import type { Faction } from "@sgs/data";
import { useState } from "react";
import HeatMap, { type HeatMapCell } from "./components/HeatMap";
import BarChart, { type BarDatum } from "./components/BarChart";

/* ================================================================== */
/*  Mock data                                                          */
/* ================================================================== */

/* -- Faction win-rate matrix (row faction vs column faction) -------- */

const FACTIONS: { id: Faction; label: string }[] = [
  { id: "WEI", label: "魏" },
  { id: "SHU", label: "蜀" },
  { id: "WU",  label: "吴" },
  { id: "QUN", label: "群" },
  { id: "JIN", label: "晋" },
];

/** Row = our faction, Col = opponent faction, value = our win rate */
const HEATMAP_DATA: HeatMapCell[] = [
  // WEI row
  { row: "WEI", col: "WEI", value: 50.0 },
  { row: "WEI", col: "SHU", value: 52.4 },
  { row: "WEI", col: "WU",  value: 48.1 },
  { row: "WEI", col: "QUN", value: 54.8 },
  { row: "WEI", col: "JIN", value: 51.3 },
  // SHU row
  { row: "SHU", col: "WEI", value: 47.6 },
  { row: "SHU", col: "SHU", value: 50.0 },
  { row: "SHU", col: "WU",  value: 49.2 },
  { row: "SHU", col: "QUN", value: 53.1 },
  { row: "SHU", col: "JIN", value: 50.7 },
  // WU row
  { row: "WU",  col: "WEI", value: 51.9 },
  { row: "WU",  col: "SHU", value: 50.8 },
  { row: "WU",  col: "WU",  value: 50.0 },
  { row: "WU",  col: "QUN", value: 55.2 },
  { row: "WU",  col: "JIN", value: 52.6 },
  // QUN row
  { row: "QUN", col: "WEI", value: 45.2 },
  { row: "QUN", col: "SHU", value: 46.9 },
  { row: "QUN", col: "WU",  value: 44.8 },
  { row: "QUN", col: "QUN", value: 50.0 },
  { row: "QUN", col: "JIN", value: 47.5 },
  // JIN row
  { row: "JIN", col: "WEI", value: 48.7 },
  { row: "JIN", col: "SHU", value: 49.3 },
  { row: "JIN", col: "WU",  value: 47.4 },
  { row: "JIN", col: "QUN", value: 52.5 },
  { row: "JIN", col: "JIN", value: 50.0 },
];

/* -- HP correlation (win rate by HP value) ------------------------- */

const HP_CORRELATION: BarDatum[] = [
  { label: "1 体力", value: 42.3, color: "#ef4444" },
  { label: "2 体力", value: 46.8, color: "#f97316" },
  { label: "3 体力", value: 51.2, color: "#eab308" },
  { label: "4 体力", value: 54.6, color: "#22c55e" },
  { label: "5 体力", value: 56.1, color: "#3b82f6" },
];

/* -- Skill impact ranking ----------------------------------------- */

type SkillImpact = {
  name: string;
  general: string;
  faction: Faction;
  winDelta: number;
};

const SKILL_IMPACT: SkillImpact[] = [
  { name: "反馈",   general: "司马懿", faction: "WEI", winDelta: +8.3 },
  { name: "观星",   general: "诸葛亮", faction: "SHU", winDelta: +7.1 },
  { name: "制衡",   general: "孙权",   faction: "WU",  winDelta: +6.4 },
  { name: "奸雄",   general: "曹操",   faction: "WEI", winDelta: +5.8 },
  { name: "仁德",   general: "刘备",   faction: "SHU", winDelta: +5.2 },
  { name: "连营",   general: "陆逊",   faction: "WU",  winDelta: +4.7 },
  { name: "天妒",   general: "郭嘉",   faction: "WEI", winDelta: +4.1 },
  { name: "雷击",   general: "张角",   faction: "QUN", winDelta: +3.6 },
  { name: "反间",   general: "周瑜",   faction: "WU",  winDelta: +3.0 },
  { name: "武圣",   general: "关羽",   faction: "SHU", winDelta: +2.5 },
];

/* -- Pairing synergy ---------------------------------------------- */

type Pairing = {
  generalA: string;
  generalB: string;
  faction: Faction;
  synergyScore: number;
  winRate: number;
};

const PAIRINGS: Pairing[] = [
  { generalA: "刘备",   generalB: "诸葛亮", faction: "SHU", synergyScore: 9.2, winRate: 62.1 },
  { generalA: "曹操",   generalB: "司马懿", faction: "WEI", synergyScore: 8.7, winRate: 60.5 },
  { generalA: "孙权",   generalB: "周瑜",   faction: "WU",  synergyScore: 8.4, winRate: 59.8 },
  { generalA: "孙权",   generalB: "陆逊",   faction: "WU",  synergyScore: 8.1, winRate: 58.9 },
  { generalA: "曹操",   generalB: "郭嘉",   faction: "WEI", synergyScore: 7.8, winRate: 57.6 },
  { generalA: "刘备",   generalB: "关羽",   faction: "SHU", synergyScore: 7.5, winRate: 57.1 },
  { generalA: "张角",   generalB: "贾诩",   faction: "QUN", synergyScore: 7.2, winRate: 56.3 },
  { generalA: "司马昭", generalB: "司马师", faction: "JIN", synergyScore: 7.0, winRate: 55.8 },
];

/* ================================================================== */
/*  Faction styling (consistent with other stats pages)                */
/* ================================================================== */

const FACTION_BADGE: Record<Faction, string> = {
  WEI: "border-wei/30 bg-wei/10 text-wei dark:border-wei/40 dark:bg-wei/15 dark:text-blue-300",
  SHU: "border-shu/30 bg-shu/10 text-shu dark:border-shu/40 dark:bg-shu/15 dark:text-red-300",
  WU:  "border-wu/30 bg-wu/10 text-wu dark:border-wu/40 dark:bg-wu/15 dark:text-green-300",
  QUN: "border-qun/30 bg-qun/10 text-qun dark:border-qun/40 dark:bg-qun/15 dark:text-yellow-200",
  JIN: "border-jin/30 bg-jin/10 text-jin dark:border-jin/40 dark:bg-jin/15 dark:text-purple-200",
};

const FACTION_LABEL: Record<Faction, string> = {
  WEI: "魏", SHU: "蜀", WU: "吴", QUN: "群", JIN: "晋",
};

/* ================================================================== */
/*  Tabs                                                               */
/* ================================================================== */

const TABS = [
  { id: "heatmap",  label: "势力胜率", english: "Faction Win Rate" },
  { id: "hp",       label: "体力相关", english: "HP Correlation" },
  { id: "skills",   label: "技能影响", english: "Skill Impact" },
  { id: "pairings", label: "配合分析", english: "Pairings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ================================================================== */
/*  Page component                                                     */
/* ================================================================== */

export default function FactorsPage() {
  const [tab, setTab] = useState<TabId>("heatmap");

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">Factor Analysis</span>
        <h1 className="section-title mt-3">因子分析</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          拆解影响胜率的核心因子：势力克制关系、体力值影响、技能贡献排名与武将配合协同。
        </p>
      </header>

      {/* Tab bar */}
      <div className="panel mb-6 p-1.5">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
              }`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.slice(0, 2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      {tab === "heatmap" && <HeatmapPanel />}
      {tab === "hp" && <HpPanel />}
      {tab === "skills" && <SkillsPanel />}
      {tab === "pairings" && <PairingsPanel />}

      {/* Data disclaimer */}
      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        数据为模拟数据，仅供界面演示。正式数据将接入蒙特卡洛模拟引擎。
      </p>
    </div>
  );
}

/* ================================================================== */
/*  Sub-panels                                                         */
/* ================================================================== */

function HeatmapPanel() {
  return (
    <div className="panel p-6 sm:p-8">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Faction Win Rate
      </h2>
      <p className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        行势力 vs 列势力的胜率（行方视角）。颜色越暖表示行方胜率越高。
      </p>
      <div className="flex justify-center">
        <HeatMap
          cells={HEATMAP_DATA}
          cols={FACTIONS}
          max={56}
          min={44}
          rows={FACTIONS}
        />
      </div>
    </div>
  );
}

function HpPanel() {
  return (
    <div className="panel p-6 sm:p-8">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        HP Correlation
      </h2>
      <p className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        不同体力值武将的平均胜率。体力越高，胜率总体越高，但顶级低体力武将可凭技能弥补。
      </p>
      <div className="mx-auto max-w-lg">
        <BarChart data={HP_CORRELATION} maxValue={60} />
      </div>
    </div>
  );
}

function SkillsPanel() {
  return (
    <div className="panel overflow-hidden">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Skill Impact Ranking
        </h2>
        <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
          单技能对胜率的边际贡献（相比同体力无技能基准）。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-700/80">
              <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                #
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                技能
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                武将
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                势力
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                胜率贡献
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {SKILL_IMPACT.map((s, i) => (
              <tr
                key={s.name}
                className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <td className="px-6 py-2.5 font-mono text-xs tabular-nums text-slate-400 dark:text-slate-500">
                  {i + 1}
                </td>
                <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                  {s.name}
                </td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                  {s.general}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${FACTION_BADGE[s.faction]}`}
                  >
                    {FACTION_LABEL[s.faction]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  +{s.winDelta.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PairingsPanel() {
  return (
    <div className="panel overflow-hidden">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Pairing Synergy
        </h2>
        <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
          同势力武将配合时的协同评分与实际胜率。协同评分越高，搭配效果越强。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-700/80">
              <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                武将 A
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                武将 B
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                势力
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                协同分
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                配合胜率
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {PAIRINGS.map((p) => (
              <tr
                key={`${p.generalA}-${p.generalB}`}
                className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <td className="px-6 py-2.5 font-semibold text-slate-900 dark:text-white">
                  {p.generalA}
                </td>
                <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                  {p.generalB}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${FACTION_BADGE[p.faction]}`}
                  >
                    {FACTION_LABEL[p.faction]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-brand">
                  {p.synergyScore.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {p.winRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
