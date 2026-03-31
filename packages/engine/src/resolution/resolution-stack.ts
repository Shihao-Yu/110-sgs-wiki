/**
 * LIFO resolution stack for nested event/trigger resolution in Sanguosha.
 *
 * When playing a card triggers a skill which triggers another response,
 * all events are resolved in Last-In-First-Out order.
 */

import type { GameState } from '../state/game.js';
import type { PlayerId } from '../state/types.js';
import type { GameEvent, Response, ResponseOption, ResponseWindow } from './types.js';

/** Callback invoked when an event resolves. May push new events onto the stack. */
export type ResolveHandler = (event: GameEvent, stack: ResolutionStack, game: GameState) => void;

export class ResolutionStack {
  private stack: GameEvent[] = [];
  private pendingWindow: ResponseWindow | null = null;
  private resolveHandler: ResolveHandler | null = null;

  /** Register a handler called when each event resolves. */
  onResolve(handler: ResolveHandler): void {
    this.resolveHandler = handler;
  }

  /** Push an event onto the top of the stack. */
  push(event: GameEvent): void {
    this.stack.push(event);
  }

  /** Resolve the top event on the stack. Returns the resolved event, or undefined if empty/blocked. */
  resolve(game: GameState): GameEvent | undefined {
    if (this.pendingWindow) {
      return undefined; // blocked — waiting for a response
    }
    const event = this.stack.pop();
    if (!event) return undefined;

    if (this.resolveHandler) {
      this.resolveHandler(event, this, game);
    }
    return event;
  }

  /** Resolve all events on the stack until empty or blocked by a response window. */
  resolveAll(game: GameState): GameEvent[] {
    const resolved: GameEvent[] = [];
    let event: GameEvent | undefined;
    while ((event = this.resolve(game)) !== undefined) {
      resolved.push(event);
    }
    return resolved;
  }

  /** Whether the stack has no pending events. */
  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  /** Peek at the top event without removing it. */
  peek(): GameEvent | undefined {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined;
  }

  /** The number of events currently on the stack. */
  get size(): number {
    return this.stack.length;
  }

  /**
   * Open a response window — pauses resolution until the player responds.
   * E.g., "play 闪 to dodge?" or "play 桃 to save?"
   */
  openResponseWindow(player: PlayerId, event: GameEvent, options: ResponseOption[]): void {
    this.pendingWindow = { player, event, options, response: null };
  }

  /** Submit a player's response to the current response window, resuming resolution. */
  submitResponse(player: PlayerId, response: Response): void {
    if (!this.pendingWindow) {
      throw new Error('No response window is open');
    }
    if (this.pendingWindow.player !== player) {
      throw new Error(
        `Response window is for player ${this.pendingWindow.player}, not ${player}`,
      );
    }

    // Push the response as an event so it resolves in stack order
    this.push({
      type: 'response',
      player,
      card: response.card,
      accepted: response.accepted,
    });

    this.pendingWindow = null;
  }

  /** Whether a response window is currently open. */
  get isWaitingForResponse(): boolean {
    return this.pendingWindow !== null;
  }

  /** Get the current pending response window, if any. */
  get currentWindow(): Readonly<ResponseWindow> | null {
    return this.pendingWindow;
  }
}
