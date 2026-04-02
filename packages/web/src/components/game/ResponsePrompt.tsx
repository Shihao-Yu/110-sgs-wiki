"use client";

import { useGameStore } from "@/lib/game/store";

/* ------------------------------------------------------------------ */
/*  Response prompt dialog                                             */
/*                                                                      */
/*  Shown when the engine asks the player whether they want to play a  */
/*  reactive card (e.g. "是否使用闪?" or "是否使用桃?").               */
/* ------------------------------------------------------------------ */

export default function ResponsePrompt() {
  const responsePrompt = useGameStore((s) => s.responsePrompt);
  const respondYes = useGameStore((s) => s.respondYes);
  const respondNo = useGameStore((s) => s.respondNo);

  if (!responsePrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Dialog */}
      <div className="relative z-50 flex w-full flex-col items-center gap-4 rounded-t-2xl border border-slate-700/80 bg-slate-900/95 px-6 py-6 shadow-2xl sm:mx-4 sm:max-w-sm sm:rounded-2xl sm:px-8">
        {/* Card icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 ring-2 ring-amber-400/40">
          <span className="text-2xl font-bold text-amber-300">
            {responsePrompt.cardName.charAt(0)}
          </span>
        </div>

        {/* Prompt message */}
        <p className="text-center text-sm font-semibold text-slate-100">
          {responsePrompt.message}
        </p>

        {/* Card name */}
        <span className="rounded-md bg-amber-500/10 px-3 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
          {responsePrompt.cardName}
        </span>

        {/* Yes / No */}
        <div className="flex w-full items-center justify-center gap-3 pt-1">
          <button
            className="flex-1 rounded-lg border border-emerald-400/60 bg-emerald-600 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
            onClick={respondYes}
            type="button"
          >
            Yes
          </button>
          <button
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700"
            onClick={respondNo}
            type="button"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
