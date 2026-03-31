import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PhaseType } from '../state/types.js';
import { EventEmitter, type PhaseCallback } from './event-emitter.js';

/** Ordered list of phases in a standard turn. */
const PHASE_ORDER: readonly PhaseType[] = [
  'prepare',
  'judgment',
  'draw',
  'play',
  'discard',
  'end',
] as const;

/**
 * Manages the 6-phase turn system for Sanguosha.
 *
 * Each turn progresses through: Prepare -> Judgment -> Draw -> Play -> Discard -> End.
 * Skills can hook into phase boundaries via onPhaseStart / onPhaseEnd,
 * skip phases, or insert extra phases.
 */
export class PhaseManager {
  private emitter = new EventEmitter();
  private skippedPhases = new Map<string, Set<PhaseType>>();
  private extraPhases = new Map<string, { phase: PhaseType; after: PhaseType }[]>();

  /** Register a callback that fires when a phase starts. */
  onPhaseStart(phase: PhaseType, callback: PhaseCallback): void {
    this.emitter.on(`phase:${phase}:start`, callback);
  }

  /** Register a callback that fires when a phase ends. */
  onPhaseEnd(phase: PhaseType, callback: PhaseCallback): void {
    this.emitter.on(`phase:${phase}:end`, callback);
  }

  /** Remove a previously registered start callback. */
  offPhaseStart(phase: PhaseType, callback: PhaseCallback): void {
    this.emitter.off(`phase:${phase}:start`, callback);
  }

  /** Remove a previously registered end callback. */
  offPhaseEnd(phase: PhaseType, callback: PhaseCallback): void {
    this.emitter.off(`phase:${phase}:end`, callback);
  }

  /** Mark a phase to be skipped for a player during their next turn. */
  skipPhase(player: PlayerState, phase: PhaseType): void {
    const set = this.skippedPhases.get(player.id);
    if (set) {
      set.add(phase);
    } else {
      this.skippedPhases.set(player.id, new Set([phase]));
    }
  }

  /** Insert an extra phase after a specified phase for a player's next turn. */
  addExtraPhase(player: PlayerState, phase: PhaseType, after: PhaseType): void {
    const list = this.extraPhases.get(player.id);
    const entry = { phase, after };
    if (list) {
      list.push(entry);
    } else {
      this.extraPhases.set(player.id, [entry]);
    }
  }

  /** Build the effective phase list for a player, applying skips and extra phases. */
  buildPhaseList(player: PlayerState): PhaseType[] {
    const skips = this.skippedPhases.get(player.id);
    const extras = this.extraPhases.get(player.id);

    const phases: PhaseType[] = [];
    for (const phase of PHASE_ORDER) {
      if (skips?.has(phase)) continue;
      phases.push(phase);
      if (extras) {
        for (const extra of extras) {
          if (extra.after === phase) {
            phases.push(extra.phase);
          }
        }
      }
    }
    return phases;
  }

  /** Execute a single phase: fire start event, update state, fire end event. */
  executePhase(game: GameState, player: PlayerState, phase: PhaseType): void {
    game.currentPhase = phase;
    const ctx = { game, player, phase };
    this.emitter.emit(`phase:${phase}:start`, ctx);
    this.emitter.emit(`phase:${phase}:end`, ctx);
  }

  /** Execute a full turn for a player, progressing through all applicable phases. */
  executeTurn(game: GameState, player: PlayerState): void {
    const phases = this.buildPhaseList(player);

    for (const phase of phases) {
      this.executePhase(game, player, phase);
    }

    // Clear per-turn skip/extra state after the turn completes
    this.skippedPhases.delete(player.id);
    this.extraPhases.delete(player.id);
  }

  /** Remove all registered event listeners. */
  removeAllListeners(): void {
    this.emitter.removeAll();
  }
}

export { PHASE_ORDER };
