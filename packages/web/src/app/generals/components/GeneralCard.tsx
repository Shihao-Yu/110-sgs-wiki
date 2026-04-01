"use client";

import type { Faction } from "@sgs/data";
import Link from "next/link";

type GeneralCardProps = {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  hp: number;
  image: string;
};

const factionBadge: Record<
  Faction,
  { bg: string; text: string; border: string; label: string }
> = {
  WEI: {
    bg: "bg-wei/15 dark:bg-wei/25",
    text: "text-wei dark:text-blue-300",
    border: "border-wei/25 dark:border-wei/40",
    label: "魏",
  },
  SHU: {
    bg: "bg-shu/15 dark:bg-shu/25",
    text: "text-shu dark:text-red-300",
    border: "border-shu/25 dark:border-shu/40",
    label: "蜀",
  },
  WU: {
    bg: "bg-wu/15 dark:bg-wu/25",
    text: "text-wu dark:text-green-300",
    border: "border-wu/25 dark:border-wu/40",
    label: "吴",
  },
  QUN: {
    bg: "bg-qun/15 dark:bg-qun/25",
    text: "text-qun dark:text-yellow-200",
    border: "border-qun/30 dark:border-qun/40",
    label: "群",
  },
  JIN: {
    bg: "bg-jin/15 dark:bg-jin/25",
    text: "text-jin dark:text-purple-200",
    border: "border-jin/25 dark:border-jin/40",
    label: "晋",
  },
};

const factionGradient: Record<Faction, string> = {
  WEI: "from-wei/20 to-wei/5 dark:from-wei/30 dark:to-wei/10",
  SHU: "from-shu/20 to-shu/5 dark:from-shu/30 dark:to-shu/10",
  WU: "from-wu/20 to-wu/5 dark:from-wu/30 dark:to-wu/10",
  QUN: "from-qun/20 to-qun/5 dark:from-qun/30 dark:to-qun/10",
  JIN: "from-jin/20 to-jin/5 dark:from-jin/30 dark:to-jin/10",
};

export default function GeneralCard({
  id,
  name,
  title,
  faction,
  hp,
  image,
}: GeneralCardProps) {
  const badge = factionBadge[faction];
  const gradient = factionGradient[faction];

  return (
    <Link
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/80 dark:bg-slate-950/80 dark:hover:border-slate-700/80"
      href={`/generals/${id}`}
    >
      {/* Image area with faction gradient fallback */}
      <div
        className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-b ${gradient}`}
      >
        <img
          alt={`${name} - ${title}`}
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
          }}
          src={`/assets/${image}`}
        />

        {/* Faction badge */}
        <span
          className={`absolute left-2 top-2 rounded-md border px-1.5 py-0.5 text-xs font-bold ${badge.bg} ${badge.text} ${badge.border} backdrop-blur-sm`}
        >
          {badge.label}
        </span>

        {/* HP indicator */}
        <div className="absolute right-2 top-2 flex flex-col gap-0.5">
          {Array.from({ length: hp }, (_, i) => (
            <span
              key={i}
              className="block h-2.5 w-2.5 rounded-full border border-red-400/50 bg-red-500 shadow-sm shadow-red-900/30"
            />
          ))}
        </div>
      </div>

      {/* Info area */}
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-white">
          {name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
      </div>
    </Link>
  );
}
