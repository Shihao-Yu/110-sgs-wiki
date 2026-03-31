import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PhaseType } from '../state/types.js';

/** Context passed to every phase event callback. */
export interface PhaseContext {
  game: GameState;
  player: PlayerState;
  phase: PhaseType;
}

export type PhaseCallback = (ctx: PhaseContext) => void;

type EventName = `phase:${PhaseType}:${'start' | 'end'}`;

/**
 * Simple typed event emitter for phase lifecycle events.
 * Events follow the pattern: `phase:<phaseType>:<start|end>`
 */
export class EventEmitter {
  private listeners = new Map<EventName, PhaseCallback[]>();

  on(event: EventName, callback: PhaseCallback): void {
    const list = this.listeners.get(event);
    if (list) {
      list.push(callback);
    } else {
      this.listeners.set(event, [callback]);
    }
  }

  off(event: EventName, callback: PhaseCallback): void {
    const list = this.listeners.get(event);
    if (!list) return;
    const idx = list.indexOf(callback);
    if (idx !== -1) list.splice(idx, 1);
  }

  emit(event: EventName, ctx: PhaseContext): void {
    const list = this.listeners.get(event);
    if (!list) return;
    for (const cb of list) {
      cb(ctx);
    }
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
