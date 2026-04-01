/**
 * QSanguosha replay parser.
 *
 * Parses .qsgs replay files (JSON format) into typed ReplayData.
 * Validates structure and provides clear errors for malformed replays.
 */

import type { Faction } from '@sgs/data';
import type { ReplayAction, ReplayData, ReplayPlayer, ReplayTurn } from './types';

const VALID_FACTIONS: ReadonlySet<string> = new Set<string>([
  'WEI', 'SHU', 'WU', 'QUN', 'JIN',
]);

const VALID_ACTION_TYPES: ReadonlySet<string> = new Set<string>([
  'playCard', 'useSkill', 'response', 'damage', 'death', 'drawCards', 'discard',
]);

export class ReplayParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReplayParseError';
  }
}

export class ReplayParser {
  /** Parse a JSON string or Buffer into ReplayData. */
  parse(data: string | Buffer): ReplayData {
    const text = typeof data === 'string' ? data : data.toString('utf-8');

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ReplayParseError('Invalid JSON');
    }

    return this.validate(raw);
  }

  /** Read and parse a replay file (server-only). */
  static async fromFile(path: string): Promise<ReplayData> {
    // webpack-ignore: this method is server-only and should not be bundled for the client
    const fs = await import(/* webpackIgnore: true */ 'fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    return new ReplayParser().parse(content);
  }

  private validate(raw: unknown): ReplayData {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new ReplayParseError('Replay must be a JSON object');
    }

    const obj = raw as Record<string, unknown>;

    const version = this.requireString(obj, 'version');
    const players = this.validatePlayers(obj['players']);
    const turns = this.validateTurns(obj['turns']);
    const result = this.validateResult(obj['result']);

    return { version, players, turns, result };
  }

  private validatePlayers(raw: unknown): ReplayPlayer[] {
    if (!Array.isArray(raw)) {
      throw new ReplayParseError('players must be an array');
    }
    if (raw.length < 2) {
      throw new ReplayParseError('Replay must have at least 2 players');
    }

    const seenSeats = new Set<number>();
    const seenIds = new Set<string>();

    return raw.map((p, i) => {
      if (typeof p !== 'object' || p === null) {
        throw new ReplayParseError(`players[${i}] must be an object`);
      }

      const player = p as Record<string, unknown>;
      const id = this.requireString(player, 'id', `players[${i}]`);
      const name = this.requireString(player, 'name', `players[${i}]`);
      const seat = this.requireNumber(player, 'seat', `players[${i}]`);
      const faction = this.requireString(player, 'faction', `players[${i}]`);
      const generals = this.validateGenerals(player['generals'], `players[${i}]`);

      if (seenIds.has(id)) {
        throw new ReplayParseError(`Duplicate player id: ${id}`);
      }
      seenIds.add(id);

      if (seenSeats.has(seat)) {
        throw new ReplayParseError(`Duplicate seat number: ${seat}`);
      }
      seenSeats.add(seat);

      if (!VALID_FACTIONS.has(faction)) {
        throw new ReplayParseError(
          `players[${i}].faction must be one of ${[...VALID_FACTIONS].join(', ')}`,
        );
      }

      return { id, name, seat, generals, faction: faction as Faction };
    });
  }

  private validateGenerals(
    raw: unknown,
    ctx: string,
  ): { main: string; deputy: string } {
    if (typeof raw !== 'object' || raw === null) {
      throw new ReplayParseError(`${ctx}.generals must be an object`);
    }

    const g = raw as Record<string, unknown>;
    return {
      main: this.requireString(g, 'main', `${ctx}.generals`),
      deputy: this.requireString(g, 'deputy', `${ctx}.generals`),
    };
  }

  private validateTurns(raw: unknown): ReplayTurn[] {
    if (!Array.isArray(raw)) {
      throw new ReplayParseError('turns must be an array');
    }

    return raw.map((t, i) => {
      if (typeof t !== 'object' || t === null) {
        throw new ReplayParseError(`turns[${i}] must be an object`);
      }

      const turn = t as Record<string, unknown>;
      const turnNumber = this.requireNumber(turn, 'turnNumber', `turns[${i}]`);
      const player = this.requireString(turn, 'player', `turns[${i}]`);
      const actions = this.validateActions(turn['actions'], `turns[${i}]`);

      return { turnNumber, player, actions };
    });
  }

  private validateActions(raw: unknown, ctx: string): ReplayAction[] {
    if (!Array.isArray(raw)) {
      throw new ReplayParseError(`${ctx}.actions must be an array`);
    }

    return raw.map((a, i) => {
      if (typeof a !== 'object' || a === null) {
        throw new ReplayParseError(`${ctx}.actions[${i}] must be an object`);
      }

      const action = a as Record<string, unknown>;
      const type = this.requireString(action, 'type', `${ctx}.actions[${i}]`);

      if (!VALID_ACTION_TYPES.has(type)) {
        throw new ReplayParseError(
          `${ctx}.actions[${i}].type "${type}" is not a valid action type`,
        );
      }

      return this.validateAction(action, type, `${ctx}.actions[${i}]`);
    });
  }

  private validateAction(
    action: Record<string, unknown>,
    type: string,
    ctx: string,
  ): ReplayAction {
    switch (type) {
      case 'playCard':
        return {
          type: 'playCard',
          card: this.requireString(action, 'card', ctx),
          targets: this.requireStringArray(action, 'targets', ctx),
        };
      case 'useSkill':
        return {
          type: 'useSkill',
          skill: this.requireString(action, 'skill', ctx),
          targets: this.requireStringArray(action, 'targets', ctx),
        };
      case 'response':
        return {
          type: 'response',
          card: this.requireString(action, 'card', ctx),
          to: this.requireString(action, 'to', ctx),
        };
      case 'damage':
        return {
          type: 'damage',
          from: this.requireString(action, 'from', ctx),
          to: this.requireString(action, 'to', ctx),
          amount: this.requireNumber(action, 'amount', ctx),
        };
      case 'death':
        return {
          type: 'death',
          player: this.requireString(action, 'player', ctx),
        };
      case 'drawCards':
        return {
          type: 'drawCards',
          player: this.requireString(action, 'player', ctx),
          count: this.requireNumber(action, 'count', ctx),
        };
      case 'discard':
        return {
          type: 'discard',
          player: this.requireString(action, 'player', ctx),
          cards: this.requireStringArray(action, 'cards', ctx),
        };
      default:
        throw new ReplayParseError(`Unknown action type: ${type}`);
    }
  }

  private validateResult(raw: unknown): { winner: string; reason: string } {
    if (typeof raw !== 'object' || raw === null) {
      throw new ReplayParseError('result must be an object');
    }

    const r = raw as Record<string, unknown>;
    return {
      winner: this.requireString(r, 'winner', 'result'),
      reason: this.requireString(r, 'reason', 'result'),
    };
  }

  private requireString(
    obj: Record<string, unknown>,
    key: string,
    ctx = '',
  ): string {
    const val = obj[key];
    if (typeof val !== 'string') {
      const path = ctx ? `${ctx}.${key}` : key;
      throw new ReplayParseError(`${path} must be a string`);
    }
    return val;
  }

  private requireNumber(
    obj: Record<string, unknown>,
    key: string,
    ctx = '',
  ): number {
    const val = obj[key];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      const path = ctx ? `${ctx}.${key}` : key;
      throw new ReplayParseError(`${path} must be a number`);
    }
    return val;
  }

  private requireStringArray(
    obj: Record<string, unknown>,
    key: string,
    ctx = '',
  ): string[] {
    const val = obj[key];
    const path = ctx ? `${ctx}.${key}` : key;
    if (!Array.isArray(val)) {
      throw new ReplayParseError(`${path} must be an array`);
    }
    for (let i = 0; i < val.length; i++) {
      if (typeof val[i] !== 'string') {
        throw new ReplayParseError(`${path}[${i}] must be a string`);
      }
    }
    return val as string[];
  }
}
