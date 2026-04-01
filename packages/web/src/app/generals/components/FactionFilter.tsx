"use client";

import type { Faction } from "@sgs/data";

const FACTIONS: { id: Faction; label: string; cn: string }[] = [
  { id: "WEI", label: "WEI", cn: "魏" },
  { id: "SHU", label: "SHU", cn: "蜀" },
  { id: "WU", label: "WU", cn: "吴" },
  { id: "QUN", label: "QUN", cn: "群" },
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

type FactionFilterProps = {
  selected: Set<Faction>;
  onToggle: (faction: Faction) => void;
};

export default function FactionFilter({
  selected,
  onToggle,
}: FactionFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FACTIONS.map(({ id, cn }) => {
        const isActive = selected.has(id);
        const style = factionStyles[id];
        return (
          <button
            key={id}
            className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-all ${
              isActive ? style.active : style.inactive
            }`}
            onClick={() => onToggle(id)}
            type="button"
          >
            {cn}
          </button>
        );
      })}
    </div>
  );
}
