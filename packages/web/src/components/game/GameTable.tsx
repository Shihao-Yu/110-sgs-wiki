"use client";

import { useGameStore } from "@/lib/game/store";
import PlayerSlot from "./PlayerSlot";
import HandCards from "./HandCards";
import DropZone from "./DropZone";
import SkillPanel from "./SkillPanel";
import TargetSelector from "./TargetSelector";
import ResponsePrompt from "./ResponsePrompt";

/* ------------------------------------------------------------------ */
/*  Phase label mapping                                                */
/* ------------------------------------------------------------------ */

const PHASE_LABELS: Record<string, string> = {
  prepare: "准备阶段",
  judgment: "判定阶段",
  draw: "摸牌阶段",
  play: "出牌阶段",
  discard: "弃牌阶段",
  end: "结束阶段",
};

/* ------------------------------------------------------------------ */
/*  Layout: compute positions around an ellipse                        */
/*                                                                      */
/*  Seat 0 (the "self" / bottom player) is anchored at 6-o'clock.     */
/*  Other players are distributed clockwise.                           */
/* ------------------------------------------------------------------ */

function seatPositions(count: number) {
  return Array.from({ length: count }, (_, i) => {
    // Start at bottom (90deg in standard math coords = 6-o'clock)
    // Go clockwise: subtract from 360 because CSS positive angles go clockwise
    const angle = (360 / count) * i - 90; // -90 puts seat-0 at bottom
    const rad = ((angle + 180) * Math.PI) / 180; // +180 to start at bottom
    const x = 50 + 44 * Math.cos(rad); // percentage of container
    const y = 50 + 42 * Math.sin(rad); // slightly squished vertically for oval
    return { x, y };
  });
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function GameTable() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const turnCount = useGameStore((s) => s.turnCount);
  const drawPileCount = useGameStore((s) => s.drawPileCount);
  const discardPileCount = useGameStore((s) => s.discardPileCount);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const togglePlayerAlive = useGameStore((s) => s.togglePlayerAlive);
  const setPlayerCount = useGameStore((s) => s.setPlayerCount);
  const playCard = useGameStore((s) => s.playCard);
  const showResponsePrompt = useGameStore((s) => s.showResponsePrompt);

  const positions = seatPositions(players.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Players:</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            value={players.length}
          >
            {[4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={nextTurn}
          type="button"
        >
          Next Turn
        </button>

        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() =>
            showResponsePrompt({
              message: "是否使用闪?",
              cardName: "闪",
              promptId: "test-shan",
            })
          }
          type="button"
        >
          Test Response
        </button>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Turn {turnCount} &middot; {PHASE_LABELS[currentPhase] ?? currentPhase}
        </span>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Table surface — circular layout for md+ screens,            */}
      {/*  stacked grid for small screens                               */}
      {/* ------------------------------------------------------------ */}

      {/* Small screen: grid fallback */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden">
        {players.map((p, i) => (
          <div className="flex justify-center" key={p.id}>
            <PlayerSlot
              isCurrent={i === currentPlayerIndex}
              onToggleAlive={() => togglePlayerAlive(p.id)}
              player={p}
            />
          </div>
        ))}

        {/* Center info (inline on small screens) */}
        <div className="col-span-2 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/80 sm:col-span-3">
          <CenterInfo
            discardPileCount={discardPileCount}
            drawPileCount={drawPileCount}
            currentPhase={currentPhase}
            turnCount={turnCount}
            currentPlayerName={players[currentPlayerIndex]?.name ?? "—"}
          />
          <DropZone
            className="h-16 w-full"
            label="拖牌到此处出牌"
            onDrop={playCard}
          />
        </div>

        {/* Hand cards (small screen) */}
        <div className="col-span-2 sm:col-span-3">
          <HandCards />
        </div>
      </div>

      {/* Medium+ screen: oval layout */}
      <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-4xl md:block">
        {/* Table surface background */}
        <div className="absolute inset-8 rounded-[40%] border border-emerald-700/30 bg-gradient-to-br from-emerald-900/80 via-emerald-800/70 to-emerald-900/80 shadow-inner dark:from-emerald-950/80 dark:via-emerald-900/60 dark:to-emerald-950/90" />

        {/* Player slots positioned around the oval */}
        {players.map((p, i) => {
          const pos = positions[i] ?? { x: 50, y: 50 };
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              key={p.id}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <PlayerSlot
                isCurrent={i === currentPlayerIndex}
                onToggleAlive={() => togglePlayerAlive(p.id)}
                player={p}
              />
            </div>
          );
        })}

        {/* Center area: draw pile, discard pile, turn info, drop zone */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-6 py-4 backdrop-blur-sm">
            <CenterInfo
              discardPileCount={discardPileCount}
              drawPileCount={drawPileCount}
              currentPhase={currentPhase}
              turnCount={turnCount}
              currentPlayerName={players[currentPlayerIndex]?.name ?? "—"}
            />
            <DropZone
              className="h-14 w-40"
              label="拖牌到此处出牌"
              onDrop={playCard}
            />
          </div>
        </div>
      </div>

      {/* Hand cards at bottom — visible on md+ */}
      <div className="mx-auto hidden w-full max-w-4xl md:block">
        <HandCards />
      </div>

      {/* Skill panel — below hand cards */}
      <div className="mx-auto w-full max-w-4xl">
        <SkillPanel />
      </div>

      {/* Overlays — rendered outside layout flow */}
      <TargetSelector />
      <ResponsePrompt />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Center info (reused in both layouts)                               */
/* ------------------------------------------------------------------ */

function CenterInfo({
  drawPileCount,
  discardPileCount,
  currentPhase,
  turnCount,
  currentPlayerName,
}: {
  drawPileCount: number;
  discardPileCount: number;
  currentPhase: string;
  turnCount: number;
  currentPlayerName: string;
}) {
  return (
    <>
      <div className="flex items-center gap-4">
        {/* Draw pile */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-12 w-9 items-center justify-center rounded-lg border-2 border-blue-400/60 bg-blue-950/60 text-xs font-bold text-blue-300 shadow-md">
            {drawPileCount}
          </div>
          <span className="text-[10px] text-emerald-200/80 dark:text-slate-400 md:text-emerald-200/80">
            Draw
          </span>
        </div>

        {/* Discard pile */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-12 w-9 items-center justify-center rounded-lg border-2 border-red-400/40 bg-red-950/40 text-xs font-bold text-red-300 shadow-md">
            {discardPileCount}
          </div>
          <span className="text-[10px] text-emerald-200/80 dark:text-slate-400 md:text-emerald-200/80">
            Discard
          </span>
        </div>
      </div>

      {/* Turn info */}
      <div className="text-center">
        <p className="text-xs font-semibold text-emerald-100/90 dark:text-slate-300 md:text-emerald-100/90">
          {currentPlayerName}
        </p>
        <p className="text-[10px] text-emerald-200/60 dark:text-slate-500 md:text-emerald-200/60">
          Turn {turnCount} &middot; {PHASE_LABELS[currentPhase] ?? currentPhase}
        </p>
      </div>
    </>
  );
}
