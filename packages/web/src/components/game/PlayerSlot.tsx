"use client";

import type { Faction, PlayerSlotData } from "@/lib/game/store";

/* ------------------------------------------------------------------ */
/*  Faction colour mapping (matches tailwind.config.ts theme)          */
/* ------------------------------------------------------------------ */

const FACTION_RING: Record<Faction, string> = {
  WEI: "ring-wei",
  SHU: "ring-shu",
  WU: "ring-wu",
  QUN: "ring-qun",
  JIN: "ring-jin",
};

const FACTION_BG: Record<Faction, string> = {
  WEI: "bg-wei/10 dark:bg-wei/20",
  SHU: "bg-shu/10 dark:bg-shu/20",
  WU: "bg-wu/10 dark:bg-wu/20",
  QUN: "bg-qun/10 dark:bg-qun/20",
  JIN: "bg-jin/10 dark:bg-jin/20",
};

const FACTION_TEXT: Record<Faction, string> = {
  WEI: "text-wei",
  SHU: "text-shu",
  WU: "text-wu",
  QUN: "text-qun",
  JIN: "text-jin",
};

const FACTION_LABEL: Record<Faction, string> = {
  WEI: "魏",
  SHU: "蜀",
  WU: "吴",
  QUN: "群",
  JIN: "晋",
};

/* ------------------------------------------------------------------ */
/*  Equipment icon mapping                                             */
/* ------------------------------------------------------------------ */

interface EquipRowProps {
  label: string;
  value: string | null;
  icon: string;
}

function EquipRow({ label, value, icon }: EquipRowProps) {
  if (!value) return null;
  return (
    <div
      className="flex items-center gap-1 truncate text-[10px] leading-tight text-slate-600 dark:text-slate-400"
      title={`${label}: ${value}`}
    >
      <span className="shrink-0 opacity-60">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HP display                                                         */
/* ------------------------------------------------------------------ */

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const hearts = Array.from({ length: maxHp }, (_, i) => {
    const filled = i < hp;
    const danger = hp <= Math.ceil(maxHp / 3);
    return (
      <span
        key={i}
        className={`inline-block h-2.5 w-2.5 rounded-full border ${
          filled
            ? danger
              ? "border-red-500 bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
              : "border-green-500 bg-green-500"
            : "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
        }`}
      />
    );
  });
  return <div className="flex flex-wrap gap-0.5">{hearts}</div>;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface PlayerSlotProps {
  player: PlayerSlotData;
  isCurrent: boolean;
  onToggleAlive?: () => void;
}

export default function PlayerSlot({
  player,
  isCurrent,
  onToggleAlive,
}: PlayerSlotProps) {
  const { faction, alive } = player;

  const ringColor = faction ? FACTION_RING[faction] : "ring-slate-300 dark:ring-slate-600";
  const bgColor = faction ? FACTION_BG[faction] : "";

  return (
    <div
      className={[
        "relative flex w-full max-w-[10rem] flex-col gap-1.5 rounded-2xl border p-2 shadow-sm transition-all sm:w-40 sm:p-2.5",
        alive
          ? "border-slate-200/80 bg-white/90 dark:border-slate-700/80 dark:bg-slate-900/90"
          : "border-slate-200/40 bg-slate-100/60 opacity-50 grayscale dark:border-slate-700/40 dark:bg-slate-800/40",
        isCurrent && alive
          ? "ring-2 shadow-lg scale-[1.03] " + ringColor
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Faction badge */}
      {faction && (
        <span
          className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${FACTION_BG[faction]} ${FACTION_TEXT[faction]} ring-1 ring-white dark:ring-slate-900`}
        >
          {FACTION_LABEL[faction]}
        </span>
      )}

      {/* Dead overlay */}
      {!alive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
          <span className="text-2xl font-bold text-red-500/70 select-none">
            阵亡
          </span>
        </div>
      )}

      {/* General portrait area */}
      <button
        className={`group relative flex h-16 items-center justify-center rounded-xl sm:h-20 ${bgColor || "bg-slate-50 dark:bg-slate-800"}`}
        onClick={onToggleAlive}
        title={alive ? "Click to mark dead" : "Click to revive"}
        type="button"
      >
        {player.mainGeneral ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {player.mainGeneral}
            </p>
            {player.deputyGeneral && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {player.deputyGeneral}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
              ?
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              暗将
            </p>
          </div>
        )}
      </button>

      {/* Player name + hand cards */}
      <div className="flex items-center justify-between gap-1 px-0.5">
        <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
          {player.name}
        </span>
        <span
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          title="Hand cards"
        >
          {player.handCardCount}
        </span>
      </div>

      {/* HP */}
      <div className="px-0.5">
        <HpBar hp={player.hp} maxHp={player.maxHp} />
      </div>

      {/* Equipment slots */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <EquipRow icon="🗡" label="Weapon" value={player.equipment.weapon} />
        <EquipRow icon="🛡" label="Armor" value={player.equipment.armor} />
        <EquipRow
          icon="🐴"
          label="+1 Horse"
          value={player.equipment.defensiveHorse}
        />
        <EquipRow
          icon="🏇"
          label="-1 Horse"
          value={player.equipment.offensiveHorse}
        />
        <EquipRow icon="💎" label="Treasure" value={player.equipment.treasure} />
      </div>

      {/* Current turn indicator */}
      {isCurrent && alive && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
        </div>
      )}
    </div>
  );
}
