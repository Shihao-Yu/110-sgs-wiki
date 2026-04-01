"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameTable from "@/components/game/GameTable";
import { useGameController } from "@/lib/game/hooks/useGameController";
import { useGameStore } from "@/lib/game/store";
import { ReplayRecorder } from "@/lib/game/replay-recorder";
import type { RecordedPlayer } from "@/lib/game/replay-recorder";
import type { Faction } from "@/lib/game/store";
import GameSetup from "./components/GameSetup";
import type { GameSetupResult } from "./components/GameSetup";

/* Local card type — avoids build-time dependency on @sgs/data */
interface Card {
  id: string;
  name: string;
  type: "basic" | "trick" | "equipment";
  subtype?: string;
  suit: "spade" | "heart" | "club" | "diamond";
  number: number;
  description: string;
  range?: number;
}

/* ------------------------------------------------------------------ */
/*  Minimal deck builder for sandbox testing                           */
/*                                                                      */
/*  In a real game the deck comes from @sgs/data cards.json.           */
/*  Here we generate a simplified 146-card deck so the controller has  */
/*  enough cards to deal and draw without importing the full JSON at   */
/*  page level.                                                         */
/* ------------------------------------------------------------------ */

const SUITS = ["spade", "heart", "club", "diamond"] as const;

function makeSandboxDeck(): Card[] {
  const deck: Card[] = [];
  let idx = 0;

  const push = (
    name: string,
    type: Card["type"],
    count: number,
    extra?: Partial<Card>,
  ) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `deck-${++idx}` as Card["id"],
        name,
        type,
        suit: SUITS[i % 4]!,
        number: (i % 13) + 1,
        description: "",
        ...extra,
      });
    }
  };

  // Basic cards
  push("杀", "basic", 30);
  push("闪", "basic", 15);
  push("桃", "basic", 8);
  push("火杀", "basic", 5);
  push("雷杀", "basic", 9);
  push("酒", "basic", 5);

  // Tricks
  push("无中生有", "trick", 4, { subtype: "instantTrick" });
  push("过河拆桥", "trick", 6, { subtype: "instantTrick" });
  push("顺手牵羊", "trick", 5, { subtype: "instantTrick" });
  push("南蛮入侵", "trick", 3, { subtype: "instantTrick" });
  push("万箭齐发", "trick", 1, { subtype: "instantTrick" });
  push("桃园结义", "trick", 1, { subtype: "instantTrick" });
  push("决斗", "trick", 3, { subtype: "instantTrick" });
  push("乐不思蜀", "trick", 3, { subtype: "delayedTrick" });
  push("兵粮寸断", "trick", 2, { subtype: "delayedTrick" });
  push("闪电", "trick", 2, { subtype: "delayedTrick" });

  // Equipment — weapons
  push("诸葛连弩", "equipment", 2, { subtype: "weapon", range: 1 });
  push("青龙偃月刀", "equipment", 1, { subtype: "weapon", range: 3 });
  push("丈八蛇矛", "equipment", 1, { subtype: "weapon", range: 3 });
  push("贯石斧", "equipment", 1, { subtype: "weapon", range: 3 });
  push("方天画戟", "equipment", 1, { subtype: "weapon", range: 4 });
  push("麒麟弓", "equipment", 1, { subtype: "weapon", range: 5 });
  push("青釭剑", "equipment", 1, { subtype: "weapon", range: 2 });
  push("雌雄双股剑", "equipment", 1, { subtype: "weapon", range: 2 });

  // Equipment — armor
  push("八卦阵", "equipment", 2, { subtype: "armor" });
  push("仁王盾", "equipment", 1, { subtype: "armor" });
  push("藤甲", "equipment", 1, { subtype: "armor" });

  // Equipment — horses
  push("的卢", "equipment", 1, { subtype: "defensiveHorse" });
  push("爪黄飞电", "equipment", 1, { subtype: "defensiveHorse" });
  push("绝影", "equipment", 1, { subtype: "defensiveHorse" });
  push("赤兔", "equipment", 1, { subtype: "offensiveHorse" });
  push("紫骍", "equipment", 1, { subtype: "offensiveHorse" });
  push("大宛", "equipment", 1, { subtype: "offensiveHorse" });

  // Equipment — treasures
  push("木牛流马", "equipment", 2, { subtype: "treasure" });

  return deck;
}

/* ------------------------------------------------------------------ */
/*  Faction assignments                                                */
/* ------------------------------------------------------------------ */

const FACTIONS: Faction[] = ["WEI", "SHU", "WU", "QUN", "JIN"];

/* ------------------------------------------------------------------ */
/*  AI Thinking Indicator                                              */
/* ------------------------------------------------------------------ */

function AIThinkingBanner() {
  const aiThinking = useGameStore((s) => s.aiThinking);
  const aiCurrentPlayer = useGameStore((s) => s.aiCurrentPlayer);
  const aiCurrentAction = useGameStore((s) => s.aiCurrentAction);

  if (!aiThinking) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-indigo-400/40 bg-indigo-950/60 px-4 py-2.5 shadow-md">
      {/* Animated dots */}
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "300ms" }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-indigo-200">
          {aiCurrentPlayer
            ? `${aiCurrentPlayer} is thinking...`
            : "AI players taking turns..."}
        </p>
        {aiCurrentAction && (
          <p className="truncate text-xs text-indigo-300/70">
            {aiCurrentAction}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Game-over overlay with replay actions                              */
/* ------------------------------------------------------------------ */

function GameOverOverlay({
  onDownload,
  onViewReplay,
  onNewGame,
}: {
  onDownload: () => void;
  onViewReplay: () => void;
  onNewGame: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-950/50 p-6 text-center">
      <h3 className="text-lg font-semibold text-amber-200">
        Game Over
      </h3>
      <p className="mt-1 text-sm text-amber-300/70">
        The game has ended. You can download the replay, view it in the
        replay viewer, or start a new game.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onDownload}
          className="rounded-lg border border-slate-300/60 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Download Replay
        </button>
        <button
          type="button"
          onClick={onViewReplay}
          className="rounded-lg border border-blue-400/60 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500"
        >
          View Replay
        </button>
        <button
          type="button"
          onClick={onNewGame}
          className="rounded-lg border border-emerald-400/60 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
        >
          New Game
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SandboxClient() {
  const router = useRouter();
  const {
    isActive,
    aiThinking,
    initGame,
    endTurn,
    validActions,
  } = useGameController();

  const [showSetup, setShowSetup] = useState(true);
  const [setupResult, setSetupResult] = useState<GameSetupResult | null>(null);
  const recorderRef = useRef<ReplayRecorder | null>(null);

  const gameOver = useGameStore((s) => s.gameOver);
  const turnCount = useGameStore((s) => s.turnCount);
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);

  /* -- Record actions on state changes ------------------------------ */

  // We subscribe to store changes via a ref-based approach to avoid
  // re-render loops. The recorder captures key game events.

  const lastTurnRef = useRef(0);

  // Record turn transitions
  if (recorderRef.current && isActive && turnCount !== lastTurnRef.current) {
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer) {
      recorderRef.current.beginTurn(currentPlayer.id, turnCount);
      recorderRef.current.recordDraw(currentPlayer.id, 2);
    }
    lastTurnRef.current = turnCount;
  }

  /* -- Setup handler ------------------------------------------------ */

  const handleSetupStart = useCallback(
    (result: GameSetupResult) => {
      setSetupResult(result);
      setShowSetup(false);

      // Build the recorded players list for the replay
      const recordedPlayers: RecordedPlayer[] = Array.from(
        { length: result.playerCount },
        (_, i) => {
          const pick = result.generalPicks[i];
          const faction = FACTIONS[i % FACTIONS.length]!;
          return {
            id: `p${i}`,
            name: `Player ${i + 1}`,
            seat: i,
            mainGeneral: pick?.main ?? "Unknown",
            deputyGeneral: pick?.deputy ?? "Unknown",
            faction,
          };
        },
      );

      // Create the replay recorder
      recorderRef.current = new ReplayRecorder(recordedPlayers);
      lastTurnRef.current = 0;

      // Determine human index
      const humanIdx = result.humanPlayerIndex ?? -1;

      initGame({
        playerCount: result.playerCount,
        deck: makeSandboxDeck(),
        humanPlayerIndex: humanIdx >= 0 ? humanIdx : undefined,
      });
    },
    [initGame],
  );

  /* -- Replay export helpers ---------------------------------------- */

  const getReplayResult = useCallback((): { winner: string; reason: string } => {
    const alivePlayers = players.filter((p) => p.alive);
    if (alivePlayers.length === 0) {
      return { winner: "Draw", reason: "All players eliminated" };
    }
    const factions = new Set(alivePlayers.map((p) => p.faction).filter(Boolean));
    if (factions.size === 1) {
      const winner = [...factions][0] ?? "Unknown";
      return { winner, reason: `${winner} faction victory` };
    }
    if (alivePlayers.length === 1) {
      return {
        winner: alivePlayers[0]!.faction ?? alivePlayers[0]!.name,
        reason: `${alivePlayers[0]!.name} is the last player standing`,
      };
    }
    return { winner: "Unknown", reason: "Game ended" };
  }, [players]);

  const handleDownloadReplay = useCallback(() => {
    if (!recorderRef.current) return;
    const { winner, reason } = getReplayResult();
    recorderRef.current.downloadJSON(winner, reason);
  }, [getReplayResult]);

  const handleViewReplay = useCallback(() => {
    if (!recorderRef.current) return;
    const { winner, reason } = getReplayResult();
    const json = recorderRef.current.toJSON(winner, reason);
    // Store in sessionStorage so the /replay page can pick it up
    try {
      sessionStorage.setItem("sandbox-replay", json);
    } catch {
      // sessionStorage might be unavailable; fall back to download
      recorderRef.current.downloadJSON(winner, reason);
      return;
    }
    router.push("/replay?source=sandbox");
  }, [getReplayResult, router]);

  const handleNewGame = useCallback(() => {
    recorderRef.current = null;
    lastTurnRef.current = 0;
    setSetupResult(null);
    setShowSetup(true);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Before a game starts, show the setup screen                      */
  /* ---------------------------------------------------------------- */

  if (showSetup || !isActive) {
    return <GameSetup onStart={handleSetupStart} />;
  }

  /* ---------------------------------------------------------------- */
  /*  Active game — show table with engine-driven actions              */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-4">
      {/* Game over overlay */}
      {gameOver && (
        <GameOverOverlay
          onDownload={handleDownloadReplay}
          onViewReplay={handleViewReplay}
          onNewGame={handleNewGame}
        />
      )}

      {/* AI thinking indicator */}
      <AIThinkingBanner />

      {/* Engine-specific toolbar additions */}
      <div className="flex flex-wrap items-center gap-3">
        {validActions?.canEndPhase && !aiThinking && !gameOver && (
          <button
            className="rounded-lg border border-amber-400/60 bg-amber-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-amber-500"
            onClick={endTurn}
            type="button"
          >
            End Turn
          </button>
        )}
        {validActions && validActions.mustDiscard > 0 && !aiThinking && (
          <span className="text-xs text-red-400">
            Must discard {validActions.mustDiscard} card
            {validActions.mustDiscard > 1 ? "s" : ""}
          </span>
        )}
        <span className="text-[10px] text-emerald-400">
          Engine Mode {aiThinking ? " (AI)" : ""}
          {setupResult
            ? ` | ${setupResult.mode === "human-vs-ai" ? "Human vs AI" : setupResult.mode === "full-ai" ? "AI Observation" : "Custom"}`
            : ""}
        </span>

        {/* Replay recording indicator */}
        {recorderRef.current && !gameOver && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
            Recording
          </span>
        )}
      </div>

      <GameTable />
    </div>
  );
}
