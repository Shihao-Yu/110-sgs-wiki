"use client";

import type { Faction } from "@sgs/data";
import Link from "next/link";
import { assetUrl } from "@/lib/assets";

type GeneralCardProps = {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  hp: number;
  image: string;
};

const FACTION_LABEL: Record<Faction, string> = {
  WEI: "魏",
  SHU: "蜀",
  WU: "吴",
  QUN: "群",
  JIN: "晋",
};

const factionGradient: Record<Faction, string> = {
  WEI: "from-wei/20 via-paper-mist/30 to-paper-mist",
  SHU: "from-shu/20 via-paper-mist/30 to-paper-mist",
  WU: "from-wu/20 via-paper-mist/30 to-paper-mist",
  QUN: "from-qun/25 via-paper-mist/30 to-paper-mist",
  JIN: "from-jin/20 via-paper-mist/30 to-paper-mist",
};

export default function GeneralCard({
  id,
  name,
  title,
  faction,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hp,
  image,
}: GeneralCardProps) {
  const gradient = factionGradient[faction];

  return (
    <Link
      className="group relative flex flex-col overflow-hidden rounded-sm border border-vermillion/20 bg-paper-mist/70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-vermillion/45 hover:shadow-ink dark:border-vermillion/25 dark:bg-night/70 dark:hover:border-vermillion/45"
      href={`/generals/${id}`}
    >
      {/* Inner thin gold rule */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[3px] rounded-[2px] border border-gold/20 transition-opacity duration-300 group-hover:border-gold/45"
      />

      {/* Image area with faction wash */}
      <div className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-b ${gradient}`}>
        <img
          alt={`${name} - ${title}`}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
          }}
          src={assetUrl(image)}
        />

        {/* Faction stamp — top-left, subtle seal */}
        <span
          aria-hidden
          className="font-seal absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-sm bg-vermillion/90 text-xs text-paper-mist shadow-seal sm:h-7 sm:w-7 sm:text-sm"
        >
          {FACTION_LABEL[faction]}
        </span>
      </div>

      {/* Info area */}
      <div className="relative flex flex-1 flex-col gap-0.5 px-2.5 py-2 sm:px-3 sm:py-2.5">
        {/* Vermillion accent line */}
        <span
          aria-hidden
          className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-vermillion/40 to-transparent"
        />
        <h3 className="font-display text-sm font-normal leading-snug tracking-wide text-ink sm:text-base dark:text-ivory">
          {name}
        </h3>
        <p className="truncate text-xs text-ink-mute dark:text-ivory-soft">{title}</p>
      </div>
    </Link>
  );
}
