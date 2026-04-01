/**
 * useGameController — React hook bridging GameController to Zustand store.
 *
 * Syncs engine state into the Zustand store on each action so that all
 * existing UI components (GameTable, HandCards, SkillPanel, etc.) continue
 * to work without modification.
 *
 * After the human player ends their turn, the hook auto-executes AI turns
 * for every other alive player using setTimeout pacing so actions are
 * visible in the UI rather than instant.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "../store";
import { GameController } from "../game-controller";
import type { GameConfig, ValidActions } from "../game-controller";
import type { GameTableState } from "../store";

/* ------------------------------------------------------------------ */
/*  Singleton controller instance                                      */
/* ------------------------------------------------------------------ */

let _controller: GameController | null = null;

function getController(): GameController {
  if (!_controller) {
    _controller = new GameController();
  }
  return _controller;
}

/* ------------------------------------------------------------------ */
/*  Pacing constants                                                   */
/* ------------------------------------------------------------------ */

/** Delay before an AI player's turn starts (ms). */
const AI_TURN_START_DELAY = 600;
/** Delay between individual AI actions within a turn (ms). */
const AI_ACTION_DELAY = 500;
/** Delay after the last AI action before ending the turn (ms). */
const AI_TURN_END_DELAY = 400;

/* ------------------------------------------------------------------ */
/*  Hook return type                                                   */
/* ------------------------------------------------------------------ */

export interface UseGameControllerReturn {
  /** Whether a game is currently active (initGame has been called). */
  isActive: boolean;

  /** Whether AI players are currently executing turns. */
  aiThinking: boolean;

  /** Initialise a new game with the given configuration. */
  initGame: (config: GameConfig) => void;

  /** Start the current player's turn (advance through phases to play). */
  startTurn: () => void;

  /** Play a card from hand, optionally with targets. */
  playCard: (cardId: string, targetIds?: string[]) => void;

  /** Activate a skill, optionally with targets. */
  activateSkill: (skillId: string, targetIds?: string[]) => void;

  /** Respond to an active response prompt. */
  respondToPrompt: (accepted: boolean, cardId?: string) => void;

  /** End the current player's turn (triggers AI turns for remaining players). */
  endTurn: () => void;

  /** What the current player can do right now. */
  validActions: ValidActions | null;

  /** Get valid targets for a card (for target selection UI). */
  getTargetsForCard: (cardId: string) => {
    validTargetIds: string[];
    minTargets: number;
    maxTargets: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Hook implementation                                                */
/* ------------------------------------------------------------------ */

export function useGameController(): UseGameControllerReturn {
  const controller = useRef(getController()).current;
  const setGameState = useGameStore((s) => s.setGameState);
  const [isActive, setIsActive] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [validActions, setValidActions] = useState<ValidActions | null>(null);

  /** Ref to track whether AI loop should be cancelled (e.g. new game). */
  const aiCancelRef = useRef(0);

  /* -- Sync engine snapshot -> Zustand store ------------------------ */

  const syncToStore = useCallback(
    (snapshot: GameTableState) => {
      setGameState(snapshot);
    },
    [setGameState],
  );

  /* -- Subscribe to controller state changes ----------------------- */

  useEffect(() => {
    const unsub = controller.subscribe((snapshot) => {
      syncToStore(snapshot);
      // Refresh valid actions after every state change
      try {
        setValidActions(controller.getValidActions());
      } catch {
        setValidActions(null);
      }
    });
    return unsub;
  }, [controller, syncToStore]);

  /* -- Run AI turns for all non-human players ---------------------- */

  const runAITurns = useCallback(
    async (generation: number) => {
      // Loop: keep executing AI turns until it's the human's turn again
      // or the game ends.  The loop terminates via explicit breaks below.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // Check cancellation
        if (aiCancelRef.current !== generation) return;
        if (controller.isGameOver()) break;
        if (controller.isHumanPlayer(controller.getCurrentPlayerIndex())) break;

        const playerName = controller.getCurrentPlayerName();

        // Signal AI thinking for this player
        setGameState({
          aiThinking: true,
          aiCurrentPlayer: playerName,
          aiCurrentAction: "thinking...",
        });

        // Start this AI player's turn (advances through phases to play)
        const turnSnap = controller.startTurn();
        syncToStore(turnSnap);

        // Small pause so the user sees the turn start
        await delay(AI_TURN_START_DELAY);
        if (aiCancelRef.current !== generation) return;

        // Get AI decisions
        const actions = controller.getAIActions();

        // Execute each action with visible pacing
        for (const action of actions) {
          if (aiCancelRef.current !== generation) return;
          if (controller.isGameOver()) break;

          if (action.type === "pass") {
            setGameState({ aiCurrentAction: `${playerName} passes` });
            await delay(AI_ACTION_DELAY);
            break;
          }

          // Execute the action
          const { description } = controller.executeAIAction(action);
          setGameState({ aiCurrentAction: description });

          // Pause between actions for visual feedback
          await delay(AI_ACTION_DELAY);
        }

        if (aiCancelRef.current !== generation) return;
        if (controller.isGameOver()) break;

        // End this AI player's turn (advances to next player)
        await delay(AI_TURN_END_DELAY);
        if (aiCancelRef.current !== generation) return;

        const endSnap = controller.endTurn();
        syncToStore(endSnap);

        try {
          setValidActions(controller.getValidActions());
        } catch {
          setValidActions(null);
        }
      }

      // AI turns complete — clear thinking state
      setAiThinking(false);
      setGameState({
        aiThinking: false,
        aiCurrentPlayer: null,
        aiCurrentAction: null,
      });

      // Refresh valid actions for the (now current) human player
      try {
        setValidActions(controller.getValidActions());
      } catch {
        setValidActions(null);
      }
    },
    [controller, syncToStore, setGameState],
  );

  /* -- Action dispatchers ------------------------------------------ */

  const initGame = useCallback(
    (config: GameConfig) => {
      // Cancel any running AI loop
      aiCancelRef.current++;
      setAiThinking(false);

      const snapshot = controller.initGame(config);
      syncToStore(snapshot);
      setIsActive(true);
      try {
        setValidActions(controller.getValidActions());
      } catch {
        setValidActions(null);
      }
    },
    [controller, syncToStore],
  );

  const startTurn = useCallback(() => {
    const snapshot = controller.startTurn();
    syncToStore(snapshot);
  }, [controller, syncToStore]);

  const playCard = useCallback(
    (cardId: string, targetIds: string[] = []) => {
      try {
        const snapshot = controller.playCard(cardId, targetIds);
        syncToStore(snapshot);
      } catch (err) {
        // Surface the error for the caller but still sync the latest state
        const latest = controller.getSnapshot();
        if (latest) syncToStore(latest);
        console.warn("[GameController] playCard error:", err);
      }
    },
    [controller, syncToStore],
  );

  const activateSkill = useCallback(
    (skillId: string, targetIds: string[] = []) => {
      try {
        const snapshot = controller.activateSkill(skillId, targetIds);
        syncToStore(snapshot);
      } catch (err) {
        const latest = controller.getSnapshot();
        if (latest) syncToStore(latest);
        console.warn("[GameController] activateSkill error:", err);
      }
    },
    [controller, syncToStore],
  );

  const respondToPrompt = useCallback(
    (accepted: boolean, cardId?: string) => {
      try {
        const snapshot = controller.respondToPrompt(accepted, cardId);
        syncToStore(snapshot);
      } catch (err) {
        const latest = controller.getSnapshot();
        if (latest) syncToStore(latest);
        console.warn("[GameController] respondToPrompt error:", err);
      }
    },
    [controller, syncToStore],
  );

  const endTurn = useCallback(() => {
    // End the human player's turn
    const snapshot = controller.endTurn();
    syncToStore(snapshot);

    // If the next player is not human, start the AI turn loop
    if (
      !controller.isGameOver() &&
      !controller.isHumanPlayer(controller.getCurrentPlayerIndex())
    ) {
      setAiThinking(true);
      setGameState({
        aiThinking: true,
        aiCurrentPlayer: null,
        aiCurrentAction: null,
      });
      const gen = ++aiCancelRef.current;
      // Use setTimeout to avoid blocking the render cycle
      setTimeout(() => runAITurns(gen), AI_TURN_START_DELAY);
    } else {
      try {
        setValidActions(controller.getValidActions());
      } catch {
        setValidActions(null);
      }
    }
  }, [controller, syncToStore, setGameState, runAITurns]);

  const getTargetsForCard = useCallback(
    (cardId: string) => {
      try {
        return controller.getTargetsForCard(cardId);
      } catch {
        return { validTargetIds: [], minTargets: 0, maxTargets: 0 };
      }
    },
    [controller],
  );

  return {
    isActive,
    aiThinking,
    initGame,
    startTurn,
    playCard,
    activateSkill,
    respondToPrompt,
    endTurn,
    validActions,
    getTargetsForCard,
  };
}

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
