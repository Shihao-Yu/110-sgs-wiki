"use client";

import { useMemo, useState } from "react";
import type { ReplayData, ReplayAction, ReplayTurn } from "@/lib/replay";

/* ------------------------------------------------------------------ */
/*  Per-player running stats                                           */
/* ------------------------------------------------------------------ */

interface PlayerStats {
  id: string;
  name: string;
  faction: string;
  damageDealt: number;
  damageReceived: number;
  cardsPlayed: number;
  skillsUsed: number;
}

/**
 * Walk the replay up to `upToStep` and accumulate per-player stats.
 *
 * Step 0 is the initial snapshot (no actions).
 * Steps 1..N correspond to actions in turn order.
 * The final step is the "game over" snapshot.
 */
function computeStats(
  replay: ReplayData,
  upToStep: number,
): PlayerStats[] {
  const stats = new Map<string, PlayerStats>(
    replay.players.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        faction: p.faction as string,
        damageDealt: 0,
        damageReceived: 0,
        cardsPlayed: 0,
        skillsUsed: 0,
      },
    ]),
  );

  // Step 0 = initial snapshot; actions start at step 1
  let step = 0;
  for (const turn of replay.turns) {
    for (const action of turn.actions) {
      step++;
      if (step > upToStep) break;
      applyStats(stats, action, turn);
    }
    if (step >= upToStep) break;
  }

  return replay.players.map((p) => stats.get(p.id)!);
}

function applyStats(
  stats: Map<string, PlayerStats>,
  action: ReplayAction,
  turn: ReplayTurn,
) {
  switch (action.type) {
    case "damage": {
      const attacker = stats.get(action.from);
      const target = stats.get(action.to);
      if (attacker) attacker.damageDealt += action.amount;
      if (target) target.damageReceived += action.amount;
      break;
    }
    case "playCard": {
      // The turn player is the one who played the card
      const player = stats.get(turn.player);
      if (player) player.cardsPlayed++;
      break;
    }
    case "useSkill": {
      const player = stats.get(turn.player);
      if (player) player.skillsUsed++;
      break;
    }
    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/*  Faction color map (matches tailwind.config theme)                   */
/* ------------------------------------------------------------------ */

const FACTION_BAR_COLORS: Record<string, string> = {
  wei: "bg-wei",
  shu: "bg-shu",
  wu: "bg-wu",
  qun: "bg-qun",
  jin: "bg-jin",
};

const FACTION_TEXT_COLORS: Record<string, string> = {
  wei: "text-wei",
  shu: "text-shu",
  wu: "text-wu",
  qun: "text-qun",
  jin: "text-jin",
};

function factionBg(faction: string) {
  return FACTION_BAR_COLORS[faction] ?? "bg-slate-500";
}

function factionText(faction: string) {
  return FACTION_TEXT_COLORS[faction] ?? "text-slate-600 dark:text-slate-400";
}

/* ------------------------------------------------------------------ */
/*  Simple horizontal bar chart                                        */
/* ------------------------------------------------------------------ */

function BarChart({
  items,
}: {
  items: { label: string; value: number; faction: string }[];
}) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="w-16 truncate text-right text-[10px] font-medium text-slate-600 dark:text-slate-400">
            {item.label}
          </span>
          <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ${factionBg(item.faction)}`}
              style={{ width: `${(item.value / maxVal) * 100}%`, opacity: 0.8 }}
            />
          </div>
          <span className="min-w-[1.5rem] text-right text-[10px] tabular-nums font-semibold text-slate-700 dark:text-slate-200">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible section                                                */
/* ------------------------------------------------------------------ */

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 py-1 text-left text-xs font-semibold text-slate-700 dark:text-slate-200"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path d="M4.5 2l4 4-4 4" />
        </svg>
        {title}
      </button>
      {open && <div className="pl-3.5 pt-1">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats table                                                        */
/* ------------------------------------------------------------------ */

function StatsTable({ stats }: { stats: PlayerStats[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-slate-200/80 dark:border-slate-700/80">
            <th className="px-1 py-1 text-left font-semibold text-slate-500 dark:text-slate-400">
              Player
            </th>
            <th className="px-1 py-1 text-right font-semibold text-slate-500 dark:text-slate-400">
              Dmg
            </th>
            <th className="px-1 py-1 text-right font-semibold text-slate-500 dark:text-slate-400">
              Recv
            </th>
            <th className="px-1 py-1 text-right font-semibold text-slate-500 dark:text-slate-400">
              Cards
            </th>
            <th className="px-1 py-1 text-right font-semibold text-slate-500 dark:text-slate-400">
              Skills
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((p) => (
            <tr
              key={p.id}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800"
            >
              <td className={`px-1 py-1 font-medium ${factionText(p.faction)}`}>
                {p.name}
              </td>
              <td className="px-1 py-1 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {p.damageDealt}
              </td>
              <td className="px-1 py-1 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {p.damageReceived}
              </td>
              <td className="px-1 py-1 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {p.cardsPlayed}
              </td>
              <td className="px-1 py-1 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {p.skillsUsed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main AnalysisOverlay component                                     */
/* ------------------------------------------------------------------ */

interface AnalysisOverlayProps {
  replay: ReplayData;
  /** Current step in the replay timeline (0-based). */
  currentStep: number;
}

export default function AnalysisOverlay({
  replay,
  currentStep,
}: AnalysisOverlayProps) {
  const [visible, setVisible] = useState(false);
  const stats = useMemo(
    () => computeStats(replay, currentStep),
    [replay, currentStep],
  );

  const damageDealtItems = stats.map((p) => ({
    label: p.name,
    value: p.damageDealt,
    faction: p.faction,
  }));

  const damageReceivedItems = stats.map((p) => ({
    label: p.name,
    value: p.damageReceived,
    faction: p.faction,
  }));

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
          visible
            ? "border-brand/30 bg-brand/10 text-brand dark:border-brand/50 dark:bg-brand/20"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        ].join(" ")}
        title={visible ? "Hide analysis panel" : "Show analysis panel"}
      >
        <AnalysisIcon />
        {visible ? "Hide Analysis" : "Analysis"}
      </button>

      {/* Collapsible sidebar panel */}
      {visible && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Game Analysis
            </h3>
            <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
              Step {currentStep}
            </span>
          </div>

          {/* Running stats table */}
          <CollapsibleSection title="Player Stats">
            <StatsTable stats={stats} />
          </CollapsibleSection>

          {/* Damage dealt bar chart */}
          <CollapsibleSection title="Damage Dealt">
            <BarChart items={damageDealtItems} />
          </CollapsibleSection>

          {/* Damage received bar chart */}
          <CollapsibleSection title="Damage Received">
            <BarChart items={damageReceivedItems} />
          </CollapsibleSection>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icon                                                    */
/* ------------------------------------------------------------------ */

function AnalysisIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="5" width="3" height="8" rx="0.5" />
      <rect x="5.5" y="1" width="3" height="12" rx="0.5" />
      <rect x="10" y="3" width="3" height="10" rx="0.5" />
    </svg>
  );
}
