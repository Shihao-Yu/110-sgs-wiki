"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ReplayAction,
  ReplayData,
  ReplayPlayer,
} from "@/lib/replay";
import type { PlayerSlotData, EquipmentSlots, Faction } from "@/lib/game/store";
import PlayerSlot from "@/components/game/PlayerSlot";
import ReplayControls from "./ReplayControls";
import Timeline from "./Timeline";

/* ------------------------------------------------------------------ */
/*  Phase labels (shared with GameTable)                               */
/* ------------------------------------------------------------------ */

const PHASE_LABELS: Record<string, string> = {
  prepare: "准备阶段",
  draw: "摸牌阶段",
  play: "出牌阶段",
  discard: "弃牌阶段",
  end: "结束阶段",
};

/* ------------------------------------------------------------------ */
/*  Snapshot: the full game state at a single point in time            */
/* ------------------------------------------------------------------ */

interface PlayerState {
  id: string;
  name: string;
  seat: number;
  mainGeneral: string;
  deputyGeneral: string;
  faction: Faction;
  hp: number;
  maxHp: number;
  handCardCount: number;
  alive: boolean;
}

interface GameSnapshot {
  players: PlayerState[];
  /** Which player's turn it is (player id). */
  activePlayerId: string;
  turnNumber: number;
  /** Derived phase from the most recent action type. */
  phase: string;
  /** Human-readable description of what just happened. */
  logEntry: string;
}

/* ------------------------------------------------------------------ */
/*  Build the linear timeline of snapshots                             */
/* ------------------------------------------------------------------ */

function describeAction(
  action: ReplayAction,
  playerMap: Map<string, ReplayPlayer>,
): string {
  const name = (id: string) => playerMap.get(id)?.name ?? id;

  switch (action.type) {
    case "drawCards":
      return `${name(action.player)} draws ${action.count} card${action.count === 1 ? "" : "s"}`;
    case "playCard": {
      const targets =
        action.targets.length > 0
          ? ` targeting ${action.targets.map(name).join(", ")}`
          : "";
      return `${name(action.targets[0] ?? "")} — plays ${action.card}${targets}`;
    }
    case "useSkill": {
      const targets =
        action.targets.length > 0
          ? ` on ${action.targets.map(name).join(", ")}`
          : "";
      return `Uses skill [${action.skill}]${targets}`;
    }
    case "response":
      return `Responds with ${action.card} to ${action.to}`;
    case "damage":
      return `${name(action.from)} deals ${action.amount} damage to ${name(action.to)}`;
    case "death":
      return `${name(action.player)} is eliminated`;
    case "discard":
      return `${name(action.player)} discards ${action.cards.join(", ")}`;
    default:
      return "Unknown action";
  }
}

function phaseFromAction(action: ReplayAction): string {
  switch (action.type) {
    case "drawCards":
      return "draw";
    case "playCard":
    case "useSkill":
    case "response":
    case "damage":
      return "play";
    case "discard":
      return "discard";
    case "death":
      return "end";
    default:
      return "play";
  }
}

function buildTimeline(replay: ReplayData): GameSnapshot[] {
  const playerMap = new Map(replay.players.map((p) => [p.id, p]));

  // Initial player state (before any turns)
  const initialStates: Map<string, PlayerState> = new Map(
    replay.players.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        seat: p.seat,
        mainGeneral: p.generals.main,
        deputyGeneral: p.generals.deputy,
        faction: p.faction as Faction,
        hp: 4,
        maxHp: 4,
        handCardCount: 4,
        alive: true,
      },
    ]),
  );

  const snapshots: GameSnapshot[] = [];

  // Snapshot 0: initial game state
  snapshots.push({
    players: Array.from(initialStates.values()),
    activePlayerId: replay.turns[0]?.player ?? replay.players[0]?.id ?? "",
    turnNumber: 0,
    phase: "prepare",
    logEntry: "Game begins",
  });

  // Current mutable state tracker
  const state = new Map(
    Array.from(initialStates.entries()).map(([k, v]) => [k, { ...v }]),
  );

  for (const turn of replay.turns) {
    for (const action of turn.actions) {
      // Apply the action to state
      applyAction(state, action);

      snapshots.push({
        players: Array.from(state.values()).map((p) => ({ ...p })),
        activePlayerId: turn.player,
        turnNumber: turn.turnNumber,
        phase: phaseFromAction(action),
        logEntry: `Turn ${turn.turnNumber}: ${describeAction(action, playerMap)}`,
      });
    }
  }

  // Final snapshot: game result
  snapshots.push({
    players: Array.from(state.values()).map((p) => ({ ...p })),
    activePlayerId: "",
    turnNumber: replay.turns.length > 0 ? replay.turns[replay.turns.length - 1]!.turnNumber : 0,
    phase: "end",
    logEntry: `Game over — Winner: ${replay.result.winner}. ${replay.result.reason}`,
  });

  return snapshots;
}

function applyAction(state: Map<string, PlayerState>, action: ReplayAction) {
  switch (action.type) {
    case "drawCards": {
      const p = state.get(action.player);
      if (p) p.handCardCount += action.count;
      break;
    }
    case "playCard": {
      // The active player's hand decreases by 1
      // We find who is playing from the action context — the turn player
      // We cannot determine here, so use a heuristic: targets might tell us
      break;
    }
    case "damage": {
      const target = state.get(action.to);
      if (target) {
        target.hp = Math.max(0, target.hp - action.amount);
      }
      break;
    }
    case "death": {
      const p = state.get(action.player);
      if (p) {
        p.alive = false;
        p.hp = 0;
      }
      break;
    }
    case "discard": {
      const p = state.get(action.player);
      if (p) {
        p.handCardCount = Math.max(0, p.handCardCount - action.cards.length);
      }
      break;
    }
    // useSkill, response: no direct state mutation needed for display
    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/*  Seat position layout (matching GameTable)                          */
/* ------------------------------------------------------------------ */

function seatPositions(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i - 90;
    const rad = ((angle + 180) * Math.PI) / 180;
    const x = 50 + 44 * Math.cos(rad);
    const y = 50 + 42 * Math.sin(rad);
    return { x, y };
  });
}

/* ------------------------------------------------------------------ */
/*  Convert snapshot player to PlayerSlotData                          */
/* ------------------------------------------------------------------ */

const emptyEquipment: EquipmentSlots = {
  weapon: null,
  armor: null,
  defensiveHorse: null,
  offensiveHorse: null,
  treasure: null,
};

function toSlotData(p: PlayerState): PlayerSlotData {
  return {
    id: p.id,
    name: p.name,
    seat: p.seat,
    mainGeneral: p.mainGeneral,
    deputyGeneral: p.deputyGeneral,
    hp: p.hp,
    maxHp: p.maxHp,
    handCardCount: p.handCardCount,
    equipment: emptyEquipment,
    faction: p.faction,
    alive: p.alive,
  };
}

/* ------------------------------------------------------------------ */
/*  Main ReplayViewer component                                        */
/* ------------------------------------------------------------------ */

interface ReplayViewerProps {
  replay: ReplayData;
}

export default function ReplayViewer({ replay }: ReplayViewerProps) {
  const timeline = useMemo(() => buildTimeline(replay), [replay]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const logRef = useRef<HTMLDivElement>(null);

  const snapshot = timeline[currentStep] ?? timeline[0]!;
  const positions = seatPositions(snapshot.players.length);

  // Auto-scroll the log when step changes
  useEffect(() => {
    if (logRef.current) {
      const activeEntry = logRef.current.querySelector("[data-active='true']");
      activeEntry?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentStep]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= timeline.length - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = 1000 / speed;
    const timer = setTimeout(() => {
      setCurrentStep((s) => Math.min(s + 1, timeline.length - 1));
    }, interval);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, speed, timeline.length]);

  const handlePlay = useCallback(() => {
    if (currentStep >= timeline.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  }, [currentStep, timeline.length]);

  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((s) => Math.min(s + 1, timeline.length - 1));
  }, [timeline.length]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSeek = useCallback(
    (step: number) => {
      setIsPlaying(false);
      setCurrentStep(Math.max(0, Math.min(step, timeline.length - 1)));
    },
    [timeline.length],
  );

  const handleSpeedChange = useCallback((s: number) => setSpeed(s), []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          handleStepForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleStepBack();
          break;
        case " ":
          e.preventDefault();
          if (isPlaying) handlePause();
          else handlePlay();
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleStepForward, handleStepBack, handlePlay, handlePause, isPlaying]);

  return (
    <div className="flex flex-col gap-4">
      {/* Turn counter and phase indicator */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Turn {snapshot.turnNumber}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-jin/20 bg-jin/10 px-3 py-1.5 text-sm font-medium text-jin dark:border-jin/40 dark:bg-jin/20">
          {PHASE_LABELS[snapshot.phase] ?? snapshot.phase}
        </span>
        {snapshot.activePlayerId && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Active:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {snapshot.players.find((p) => p.id === snapshot.activePlayerId)?.name ?? snapshot.activePlayerId}
            </span>
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {replay.players.length} players &middot; {replay.turns.length} turns &middot; {timeline.length} steps
        </span>
      </div>

      {/* Game table + Action log side by side on large screens */}
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Game table */}
        <div>
          {/* Small screen: grid fallback */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden">
            {snapshot.players.map((p) => (
              <div className="flex justify-center" key={p.id}>
                <PlayerSlot
                  isCurrent={p.id === snapshot.activePlayerId}
                  player={toSlotData(p)}
                />
              </div>
            ))}
          </div>

          {/* Medium+ screen: oval layout */}
          <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-3xl md:block">
            {/* Table surface */}
            <div className="absolute inset-8 rounded-[40%] border border-emerald-700/30 bg-gradient-to-br from-emerald-900/80 via-emerald-800/70 to-emerald-900/80 shadow-inner dark:from-emerald-950/80 dark:via-emerald-900/60 dark:to-emerald-950/90" />

            {/* Players positioned around oval */}
            {snapshot.players.map((p, i) => {
              const pos = positions[i] ?? { x: 50, y: 50 };
              return (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  key={p.id}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <PlayerSlot
                    isCurrent={p.id === snapshot.activePlayerId}
                    player={toSlotData(p)}
                  />
                </div>
              );
            })}

            {/* Center info */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm">
                <p className="text-xs font-semibold text-emerald-100/90">
                  Turn {snapshot.turnNumber}
                </p>
                <p className="text-[10px] text-emerald-200/60">
                  {PHASE_LABELS[snapshot.phase] ?? snapshot.phase}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action log */}
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90">
          <div className="border-b border-slate-200/80 px-4 py-2.5 dark:border-slate-700/80">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Action Log
            </h3>
          </div>
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto px-3 py-2"
            style={{ maxHeight: "28rem" }}
          >
            {timeline.map((snap, i) => (
              <button
                key={i}
                type="button"
                data-active={i === currentStep}
                onClick={() => handleSeek(i)}
                className={[
                  "w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                  i === currentStep
                    ? "bg-brand/10 font-medium text-brand dark:bg-brand/20"
                    : i < currentStep
                      ? "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                      : "text-slate-400 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                <span className="mr-1.5 inline-block min-w-[1.5rem] tabular-nums text-slate-400 dark:text-slate-500">
                  {i}
                </span>
                {snap.logEntry}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual timeline */}
      <Timeline
        replay={replay}
        currentStep={currentStep}
        totalSteps={timeline.length}
        onSeek={handleSeek}
      />

      {/* Playback controls */}
      <ReplayControls
        currentStep={currentStep}
        totalSteps={timeline.length}
        isPlaying={isPlaying}
        speed={speed}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        onSeek={handleSeek}
        onSpeedChange={handleSpeedChange}
      />
    </div>
  );
}
