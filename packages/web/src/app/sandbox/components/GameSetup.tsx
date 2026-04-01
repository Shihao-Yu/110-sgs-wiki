"use client";

import { useCallback, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type GameMode = "human-vs-ai" | "full-ai" | "custom";

export interface GeneralPick {
  main: string;
  deputy: string;
}

export interface GameSetupResult {
  mode: GameMode;
  playerCount: number;
  /** Per-player general picks (indexed by seat). Null = random / AI-chosen. */
  generalPicks: (GeneralPick | null)[];
  /** Index of the human player (null for full-ai observation mode). */
  humanPlayerIndex: number | null;
}

interface GameSetupProps {
  onStart: (result: GameSetupResult) => void;
}

/* ------------------------------------------------------------------ */
/*  General pool — same names the store uses for sandbox placeholders  */
/* ------------------------------------------------------------------ */

const GENERALS_BY_FACTION: Record<string, string[]> = {
  WEI: ["曹操", "司马懿", "张辽", "许褚", "郭嘉", "甄姬", "夏侯惇", "夏侯渊"],
  SHU: ["刘备", "关羽", "张飞", "诸葛亮", "赵云", "马超", "黄忠", "魏延"],
  WU: ["孙权", "周瑜", "陆逊", "甘宁", "吕蒙", "孙尚香", "黄盖", "大乔"],
  QUN: ["吕布", "貂蝉", "董卓", "袁绍", "华佗", "张角", "公孙瓒", "颜良文丑"],
  JIN: ["司马师", "司马昭", "贾充", "钟会", "邓艾", "王元姬", "张春华", "乐綝"],
};

const ALL_GENERALS = Object.values(GENERALS_BY_FACTION).flat();

const FACTION_FOR_GENERAL: Record<string, string> = {};
for (const [faction, generals] of Object.entries(GENERALS_BY_FACTION)) {
  for (const g of generals) {
    FACTION_FOR_GENERAL[g] = faction;
  }
}

const FACTIONS = Object.keys(GENERALS_BY_FACTION);

const FACTION_COLORS: Record<string, string> = {
  WEI: "text-blue-400",
  SHU: "text-red-400",
  WU: "text-green-400",
  QUN: "text-yellow-400",
  JIN: "text-purple-400",
};

/* ------------------------------------------------------------------ */
/*  Mode descriptions                                                  */
/* ------------------------------------------------------------------ */

const MODE_INFO: Record<GameMode, { label: string; desc: string }> = {
  "human-vs-ai": {
    label: "Human vs AI",
    desc: "Pick your 2 generals. AI controls all other players.",
  },
  "full-ai": {
    label: "Full AI Observation",
    desc: "Assign generals to all players and watch the AI play the entire game.",
  },
  custom: {
    label: "Custom Setup",
    desc: "Choose generals for every player. You control Player 1.",
  },
};

/* ------------------------------------------------------------------ */
/*  General picker sub-component                                       */
/* ------------------------------------------------------------------ */

function GeneralPicker({
  label,
  mainValue,
  deputyValue,
  onMainChange,
  onDeputyChange,
  factionFilter,
  onFactionFilter,
}: {
  label: string;
  mainValue: string;
  deputyValue: string;
  onMainChange: (v: string) => void;
  onDeputyChange: (v: string) => void;
  factionFilter: string;
  onFactionFilter: (v: string) => void;
}) {
  const filtered =
    factionFilter === "ALL"
      ? ALL_GENERALS
      : GENERALS_BY_FACTION[factionFilter] ?? ALL_GENERALS;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </p>

      {/* Faction filter tabs */}
      <div className="mb-3 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onFactionFilter("ALL")}
          className={pillClass(factionFilter === "ALL")}
        >
          All
        </button>
        {FACTIONS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFactionFilter(f)}
            className={pillClass(factionFilter === f)}
          >
            <span className={FACTION_COLORS[f]}>{f}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Main general
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            value={mainValue}
            onChange={(e) => onMainChange(e.target.value)}
          >
            {filtered.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Deputy general
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            value={deputyValue}
            onChange={(e) => onDeputyChange(e.target.value)}
          >
            {filtered.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function pillClass(active: boolean): string {
  return [
    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    active
      ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
  ].join(" ");
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function GameSetup({ onStart }: GameSetupProps) {
  const [mode, setMode] = useState<GameMode>("human-vs-ai");
  const [playerCount, setPlayerCount] = useState(8);

  /* Per-player general picks — initialised lazily when mode needs them */
  const [picks, setPicks] = useState<GeneralPick[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      main: ALL_GENERALS[i % ALL_GENERALS.length]!,
      deputy: ALL_GENERALS[(i + 1) % ALL_GENERALS.length]!,
    })),
  );

  /* Faction filter state for each picker */
  const [factionFilters, setFactionFilters] = useState<string[]>(() =>
    Array.from({ length: 8 }, () => "ALL"),
  );

  /* -- Helpers ------------------------------------------------------- */

  const updatePick = useCallback(
    (seat: number, field: "main" | "deputy", value: string) => {
      setPicks((prev) => {
        const next = [...prev];
        next[seat] = { ...next[seat]!, [field]: value };
        return next;
      });
    },
    [],
  );

  const updateFactionFilter = useCallback((seat: number, value: string) => {
    setFactionFilters((prev) => {
      const next = [...prev];
      next[seat] = value;
      return next;
    });
  }, []);

  /* -- Determine which seats need pickers --------------------------- */

  const humanSeat = mode === "full-ai" ? null : 0;
  const pickerSeats: number[] = [];

  if (mode === "human-vs-ai") {
    pickerSeats.push(0); // only the human
  } else {
    // full-ai and custom — all players
    for (let i = 0; i < playerCount; i++) pickerSeats.push(i);
  }

  /* -- Start handler ------------------------------------------------ */

  const handleStart = useCallback(() => {
    const generalPicks: (GeneralPick | null)[] = Array.from(
      { length: playerCount },
      (_, i) => {
        if (mode === "human-vs-ai" && i !== 0) return null;
        return picks[i] ?? null;
      },
    );

    onStart({
      mode,
      playerCount,
      generalPicks,
      humanPlayerIndex: humanSeat,
    });
  }, [mode, playerCount, picks, humanSeat, onStart]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Game Setup
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose a game mode, pick generals, and start the match.
        </p>
      </div>

      {/* Mode selector */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          Game Mode
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(MODE_INFO) as GameMode[]).map((m) => {
            const info = MODE_INFO[m];
            const selected = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={[
                  "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all",
                  selected
                    ? "border-emerald-500 bg-emerald-50/80 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/40"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-sm font-semibold",
                    selected
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-slate-700 dark:text-slate-200",
                  ].join(" ")}
                >
                  {info.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {info.desc}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Player count */}
      <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span className="font-medium">Players:</span>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          value={playerCount}
          onChange={(e) => setPlayerCount(Number(e.target.value))}
        >
          {[4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      {/* General pickers */}
      {pickerSeats.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {mode === "human-vs-ai"
              ? "Pick your generals"
              : "Assign generals to each player"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {pickerSeats.map((seat) => {
              const isHuman = seat === humanSeat;
              const seatLabel =
                mode === "human-vs-ai"
                  ? "Your Generals"
                  : `Player ${seat + 1}${isHuman ? " (You)" : mode === "full-ai" ? " (AI)" : ""}`;

              return (
                <GeneralPicker
                  key={seat}
                  label={seatLabel}
                  mainValue={picks[seat]?.main ?? ALL_GENERALS[0]!}
                  deputyValue={picks[seat]?.deputy ?? ALL_GENERALS[1]!}
                  onMainChange={(v) => updatePick(seat, "main", v)}
                  onDeputyChange={(v) => updatePick(seat, "deputy", v)}
                  factionFilter={factionFilters[seat] ?? "ALL"}
                  onFactionFilter={(v) => updateFactionFilter(seat, v)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Start button */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleStart}
          className="rounded-lg border border-emerald-400/60 bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
        >
          Start Game
        </button>
        <p className="max-w-md text-center text-xs text-slate-500 dark:text-slate-500">
          {mode === "human-vs-ai"
            ? "You play as Player 1. AI controls all other players."
            : mode === "full-ai"
              ? "All players are AI-controlled. Sit back and watch the battle unfold."
              : "You control Player 1. All other players are AI-controlled."}
        </p>
      </div>
    </div>
  );
}
