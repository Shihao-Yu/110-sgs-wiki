"use client";

import type { Faction } from "@sgs/data";
import Link from "next/link";
import { assetUrl } from "@/lib/assets";
import {
  getGeneralPackVersion,
  GENERAL_PACK_VERSION_LABEL,
} from "../../../../../data/src/types/general";

type GeneralCardProps = {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  hp: number;
  image: string;
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
  const packVersion = getGeneralPackVersion(id);
  const packVersionLabel = GENERAL_PACK_VERSION_LABEL[packVersion];

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

        {/* Pack-version tag — both packs coexist and share many names/titles
            (曹丕、貂蝉、诸葛亮…), so every card needs to say which one it is. */}
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-ink/75 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide text-ivory shadow-sm dark:bg-night/80 dark:text-ivory-soft">
          {packVersionLabel}
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
