/**
 * useGameController — React hook bridging GameController to Zustand store.
 *
 * Syncs engine state into the Zustand store on each action so that all
 * existing UI components (GameTable, HandCards, SkillPanel, etc.) continue
 * to work without modification.
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
/*  Hook return type                                                   */
/* ------------------------------------------------------------------ */

export interface UseGameControllerReturn {
  /** Whether a game is currently active (initGame has been called). */
  isActive: boolean;

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

  /** End the current player's turn. */
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
  const [validActions, setValidActions] = useState<ValidActions | null>(null);

  /* -- Sync engine snapshot → Zustand store ------------------------ */

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

  /* -- Action dispatchers ------------------------------------------ */

  const initGame = useCallback(
    (config: GameConfig) => {
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
    const snapshot = controller.endTurn();
    syncToStore(snapshot);
  }, [controller, syncToStore]);

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
