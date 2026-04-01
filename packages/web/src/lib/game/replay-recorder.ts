/**
 * ReplayRecorder — captures every action during a sandbox game and outputs
 * a ReplayData-compatible JSON that can be fed into the /replay viewer.
 *
 * Usage:
 *   const recorder = new ReplayRecorder(players);
 *   recorder.beginTurn(playerId, turnNumber);
 *   recorder.recordAction({ type: "drawCards", player: "p0", count: 2 });
 *   recorder.recordAction({ type: "playCard", card: "杀", targets: ["p1"] });
 *   ...
 *   const replay = recorder.finalise("WEI", "All enemies eliminated");
 *
 * The output matches ReplayData from @/lib/replay/types exactly.
 */

import type { Faction } from "@/lib/game/store";

/* ------------------------------------------------------------------ */
/*  Mirror the replay types without importing from @sgs/data so we     */
/*  avoid any build-time coupling.  These are structurally identical    */
/*  to ReplayData / ReplayAction / etc. in lib/replay/types.ts.        */
/* ------------------------------------------------------------------ */

export interface RecordedPlayer {
  id: string;
  name: string;
  seat: number;
  mainGeneral: string;
  deputyGeneral: string;
  faction: Faction;
}

export type RecordedAction =
  | { type: "playCard"; card: string; targets: string[] }
  | { type: "useSkill"; skill: string; targets: string[] }
  | { type: "response"; card: string; to: string }
  | { type: "damage"; from: string; to: string; amount: number }
  | { type: "death"; player: string }
  | { type: "drawCards"; player: string; count: number }
  | { type: "discard"; player: string; cards: string[] };

interface RecordedTurn {
  turnNumber: number;
  player: string;
  actions: RecordedAction[];
}

export interface RecordedReplay {
  version: string;
  players: {
    id: string;
    name: string;
    seat: number;
    generals: { main: string; deputy: string };
    faction: string;
  }[];
  turns: RecordedTurn[];
  result: { winner: string; reason: string };
}

/* ------------------------------------------------------------------ */
/*  ReplayRecorder                                                     */
/* ------------------------------------------------------------------ */

export class ReplayRecorder {
  private players: RecordedPlayer[];
  private turns: RecordedTurn[] = [];
  private currentTurn: RecordedTurn | null = null;
  private startedAt: number;

  constructor(players: RecordedPlayer[]) {
    this.players = players.map((p) => ({ ...p }));
    this.startedAt = Date.now();
  }

  /* -- Turn lifecycle ----------------------------------------------- */

  /** Start recording a new turn. */
  beginTurn(playerId: string, turnNumber: number): void {
    // Flush the previous turn if open
    this.flushCurrentTurn();

    this.currentTurn = {
      turnNumber,
      player: playerId,
      actions: [],
    };
  }

  /** Record a single action in the current turn. */
  recordAction(action: RecordedAction): void {
    if (!this.currentTurn) {
      // Auto-start turn 0 for the first player if beginTurn was not called
      this.currentTurn = {
        turnNumber: 0,
        player: this.extractPlayerFromAction(action),
        actions: [],
      };
    }
    this.currentTurn.actions.push(action);
  }

  /** Convenience: record a drawCards action. */
  recordDraw(playerId: string, count: number): void {
    this.recordAction({ type: "drawCards", player: playerId, count });
  }

  /** Convenience: record a playCard action. */
  recordPlayCard(cardName: string, targets: string[]): void {
    this.recordAction({ type: "playCard", card: cardName, targets });
  }

  /** Convenience: record damage. */
  recordDamage(from: string, to: string, amount: number): void {
    this.recordAction({ type: "damage", from, to, amount });
  }

  /** Convenience: record a death. */
  recordDeath(playerId: string): void {
    this.recordAction({ type: "death", player: playerId });
  }

  /** Convenience: record discard. */
  recordDiscard(playerId: string, cardNames: string[]): void {
    this.recordAction({ type: "discard", player: playerId, cards: cardNames });
  }

  /* -- Finalise ----------------------------------------------------- */

  /**
   * Produce the final ReplayData object.
   * Call this when the game ends.
   */
  finalise(winnerFaction: string, reason: string): RecordedReplay {
    this.flushCurrentTurn();

    return {
      version: "1.0.0",
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        seat: p.seat,
        generals: { main: p.mainGeneral, deputy: p.deputyGeneral },
        faction: p.faction,
      })),
      turns: this.turns,
      result: {
        winner: winnerFaction || "Unknown",
        reason: reason || "Game ended",
      },
    };
  }

  /* -- Export helpers ------------------------------------------------ */

  /** Serialise the replay as a JSON string. */
  toJSON(winnerFaction: string, reason: string): string {
    return JSON.stringify(this.finalise(winnerFaction, reason), null, 2);
  }

  /** Trigger a browser download of the replay JSON. */
  downloadJSON(winnerFaction: string, reason: string): void {
    const json = this.toJSON(winnerFaction, reason);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sgs-replay-${new Date(this.startedAt).toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Get the number of recorded turns so far. */
  get turnCount(): number {
    return this.turns.length + (this.currentTurn ? 1 : 0);
  }

  /** Get the total number of recorded actions. */
  get actionCount(): number {
    let count = this.turns.reduce((s, t) => s + t.actions.length, 0);
    if (this.currentTurn) count += this.currentTurn.actions.length;
    return count;
  }

  /* -- Private ------------------------------------------------------ */

  private flushCurrentTurn(): void {
    if (this.currentTurn && this.currentTurn.actions.length > 0) {
      this.turns.push(this.currentTurn);
    }
    this.currentTurn = null;
  }

  private extractPlayerFromAction(action: RecordedAction): string {
    switch (action.type) {
      case "drawCards":
      case "death":
      case "discard":
        return action.player;
      case "playCard":
        return this.players[0]?.id ?? "unknown";
      case "useSkill":
        return this.players[0]?.id ?? "unknown";
      case "response":
        return this.players[0]?.id ?? "unknown";
      case "damage":
        return action.from;
    }
  }
}
