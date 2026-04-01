"use client";

import { useGameStore } from "@/lib/game/store";

/* ------------------------------------------------------------------ */
/*  Target selector overlay                                            */
/*                                                                      */
/*  When visible, it darkens the table and highlights valid targets.    */
/*  Each valid-target player slot gets a ring; clicking toggles it.    */
/*  Confirm / Cancel buttons sit at the bottom.                        */
/* ------------------------------------------------------------------ */

export default function TargetSelector() {
  const targetSelection = useGameStore((s) => s.targetSelection);
  const players = useGameStore((s) => s.players);
  const toggleTarget = useGameStore((s) => s.toggleTarget);
  const confirmTargets = useGameStore((s) => s.confirmTargets);
  const cancelTargetSelection = useGameStore((s) => s.cancelTargetSelection);

  if (!targetSelection) return null;

  const {
    validTargetIds,
    selectedTargetIds,
    minTargets,
    maxTargets,
    prompt,
  } = targetSelection;

  const canConfirm = selectedTargetIds.length >= minTargets;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center">
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Content card */}
      <div className="relative z-50 mx-4 flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-700/80 bg-slate-900/95 px-6 py-5 shadow-2xl">
        {/* Header / prompt */}
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-100">{prompt}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            {minTargets === maxTargets
              ? `选择 ${minTargets} 名角色`
              : `选择 ${minTargets}–${maxTargets} 名角色`}
            {selectedTargetIds.length > 0 && (
              <span className="ml-1 text-emerald-400">
                (已选 {selectedTargetIds.length})
              </span>
            )}
          </p>
        </div>

        {/* Target grid */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {players
            .filter((p) => p.alive)
            .map((player) => {
              const isValid = validTargetIds.includes(player.id);
              const isSelected = selectedTargetIds.includes(player.id);

              return (
                <button
                  className={[
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center transition-all duration-150",
                    !isValid
                      ? "cursor-not-allowed border-slate-800 bg-slate-900/50 opacity-30"
                      : isSelected
                        ? "border-yellow-400/70 bg-yellow-500/15 shadow-md shadow-yellow-500/10 ring-2 ring-yellow-400/60"
                        : "border-slate-600 bg-slate-800/60 hover:border-emerald-400/50 hover:bg-emerald-900/20",
                  ].join(" ")}
                  disabled={!isValid}
                  key={player.id}
                  onClick={() => toggleTarget(player.id)}
                  type="button"
                >
                  {/* Portrait placeholder */}
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                      isSelected
                        ? "bg-yellow-500/30 text-yellow-200"
                        : isValid
                          ? "bg-slate-700 text-slate-200"
                          : "bg-slate-800 text-slate-600",
                    ].join(" ")}
                  >
                    {player.mainGeneral
                      ? player.mainGeneral.charAt(0)
                      : "?"}
                  </div>
                  <span
                    className={[
                      "truncate text-[11px] font-medium",
                      isSelected
                        ? "text-yellow-200"
                        : isValid
                          ? "text-slate-300"
                          : "text-slate-600",
                    ].join(" ")}
                  >
                    {player.mainGeneral ?? player.name}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {player.hp}/{player.maxHp} HP
                  </span>
                </button>
              );
            })}
        </div>

        {/* Confirm / Cancel buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            className={[
              "rounded-lg px-5 py-1.5 text-xs font-semibold transition-all",
              canConfirm
                ? "border border-emerald-400/60 bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
                : "cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-600",
            ].join(" ")}
            disabled={!canConfirm}
            onClick={confirmTargets}
            type="button"
          >
            Confirm
          </button>
          <button
            className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700"
            onClick={cancelTargetSelection}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
