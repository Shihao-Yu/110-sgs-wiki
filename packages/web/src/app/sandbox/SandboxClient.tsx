"use client";

import { useCallback, useState } from "react";
import GameTable from "@/components/game/GameTable";
import { useGameController } from "@/lib/game/hooks/useGameController";

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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SandboxClient() {
  const {
    isActive,
    initGame,
    endTurn,
    validActions,
  } = useGameController();
  const [playerCount, setPlayerCount] = useState(8);

  const handleStart = useCallback(() => {
    initGame({
      playerCount,
      deck: makeSandboxDeck(),
      humanPlayerIndex: 0,
    });
  }, [initGame, playerCount]);

  /* ---------------------------------------------------------------- */
  /*  Before a game starts, show setup UI                              */
  /* ---------------------------------------------------------------- */

  if (!isActive) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Game Setup
        </h2>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Players:</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            value={playerCount}
          >
            {[4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          className="rounded-lg border border-emerald-400/60 bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
          onClick={handleStart}
          type="button"
        >
          Start Game (Engine Mode)
        </button>

        <p className="max-w-sm text-center text-xs text-slate-500 dark:text-slate-500">
          Starts a game driven by the @sgs/engine. Cards are dealt from a
          shuffled deck, turns follow the 6-phase system, and actions
          resolve through the engine&apos;s resolution stack.
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Active game — show table with engine-driven actions              */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-4">
      {/* Engine-specific toolbar additions */}
      <div className="flex flex-wrap items-center gap-3">
        {validActions?.canEndPhase && (
          <button
            className="rounded-lg border border-amber-400/60 bg-amber-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-amber-500"
            onClick={endTurn}
            type="button"
          >
            End Turn
          </button>
        )}
        {validActions && validActions.mustDiscard > 0 && (
          <span className="text-xs text-red-400">
            Must discard {validActions.mustDiscard} card
            {validActions.mustDiscard > 1 ? "s" : ""}
          </span>
        )}
        <span className="text-[10px] text-emerald-400">
          Engine Mode
        </span>
      </div>

      <GameTable />
    </div>
  );
}
