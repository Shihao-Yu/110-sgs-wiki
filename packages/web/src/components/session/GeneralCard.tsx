"use client";

import Link from "next/link";
import { assetUrl } from "@/lib/assets";

interface GeneralOption {
  id: string;
  name: string;
  faction: string;
  hp: number;
  image: string;
}

const FACTION_LABEL: Record<string, string> = {
  WEI: "魏", SHU: "蜀", WU: "吴", QUN: "群", JIN: "晋",
};

const FACTION_GRADIENT: Record<string, string> = {
  WEI: "from-wei/30 to-wei/5",
  SHU: "from-shu/30 to-shu/5",
  WU: "from-wu/30 to-wu/5",
  QUN: "from-qun/30 to-qun/5",
  JIN: "from-jin/30 to-jin/5",
};

const FACTION_BADGE: Record<string, string> = {
  WEI: "border-wei/40 bg-wei/15 text-wei dark:text-blue-300",
  SHU: "border-shu/40 bg-shu/15 text-shu dark:text-red-300",
  WU: "border-wu/40 bg-wu/15 text-wu dark:text-green-300",
  QUN: "border-qun/40 bg-qun/15 text-qun dark:text-yellow-200",
  JIN: "border-jin/40 bg-jin/15 text-jin dark:text-purple-200",
};

export default function GeneralCard({
  general,
  onClear,
  showActions = true,
}: {
  general: GeneralOption;
  onClear: () => void;
  showActions?: boolean;
}) {
  const gradient = FACTION_GRADIENT[general.faction] ?? "from-slate-300/30 to-slate-300/5";
  const badge = FACTION_BADGE[general.faction] ?? "border-slate-300 text-ink-mute";
  return (
    <div className="group relative overflow-hidden rounded-md border border-vermillion/25 bg-paper-mist/70 shadow-sm dark:border-vermillion/40 dark:bg-paper-deep/70">
      <Link
        href={`/generals/${general.id}`}
        target="_blank"
        rel="noopener"
        aria-label={`${general.name} 详情（新标签）`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40"
      >
        <div className={`relative aspect-[3/4] w-full bg-gradient-to-b ${gradient}`}>
          <img
            src={assetUrl(general.image)}
            alt={general.name}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
          />
          <span className={`absolute right-1.5 top-1.5 rounded border px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${badge}`}>
            {FACTION_LABEL[general.faction] ?? general.faction}
          </span>
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {general.hp} 体力
          </span>
        </div>
        <div className="px-2 py-1.5 text-center">
          <p className="truncate font-display text-sm text-ink dark:text-ivory">{general.name}</p>
        </div>
      </Link>
      {showActions && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`移除 ${general.name}`}
          className="absolute right-1.5 top-1.5 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-vermillion group-hover:flex group-hover:opacity-100 focus-visible:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function EmptyGeneralCard({
  onClick,
  label = "选择武将",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group flex aspect-[3/4] w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-vermillion/25 bg-paper-mist/30 text-sm text-ink-mute transition-all hover:border-vermillion/50 hover:bg-vermillion/5 hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40 dark:bg-paper-deep/30 dark:text-ivory-soft"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 opacity-50 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
      <span className="mt-1 text-xs">{label}</span>
    </button>
  );
}
