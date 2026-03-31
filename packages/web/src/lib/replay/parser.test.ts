import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ReplayParser, ReplayParseError } from './parser.js';
import type { ReplayData } from './types.js';

function makeSampleReplay(): ReplayData {
  return {
    version: '1.0.0',
    players: [
      { id: 'p1', name: 'A', seat: 0, generals: { main: 'cao-cao', deputy: 'dian-wei' }, faction: 'WEI' },
      { id: 'p2', name: 'B', seat: 1, generals: { main: 'liu-bei', deputy: 'guan-yu' }, faction: 'SHU' },
    ],
    turns: [
      {
        turnNumber: 1,
        player: 'p1',
        actions: [
          { type: 'drawCards', player: 'p1', count: 2 },
          { type: 'playCard', card: 'slash', targets: ['p2'] },
        ],
      },
    ],
    result: { winner: 'WEI', reason: 'All enemies eliminated' },
  };
}

describe('ReplayParser', () => {
  const parser = new ReplayParser();

  describe('parse', () => {
    it('parses a valid minimal replay', () => {
      const data = makeSampleReplay();
      const result = parser.parse(JSON.stringify(data));

      expect(result.version).toBe('1.0.0');
      expect(result.players).toHaveLength(2);
      expect(result.turns).toHaveLength(1);
      expect(result.result.winner).toBe('WEI');
    });

    it('parses from Buffer', () => {
      const data = makeSampleReplay();
      const buf = Buffer.from(JSON.stringify(data), 'utf-8');
      const result = parser.parse(buf);

      expect(result.version).toBe('1.0.0');
      expect(result.players).toHaveLength(2);
    });

    it('parses the sample 4-player replay file', () => {
      const samplePath = resolve(__dirname, '../../../../../replays/sample-4player.json');
      const content = readFileSync(samplePath, 'utf-8');
      const result = parser.parse(content);

      expect(result.version).toBe('1.0.0');
      expect(result.players).toHaveLength(4);
      expect(result.turns).toHaveLength(7);
      expect(result.result.winner).toBe('SHU-WU');

      // Verify player details
      expect(result.players[0]).toEqual({
        id: 'p1',
        name: 'Player1',
        seat: 0,
        generals: { main: 'cao-cao', deputy: 'dian-wei' },
        faction: 'WEI',
      });

      // Verify all four factions present
      const factions = result.players.map((p) => p.faction);
      expect(factions).toEqual(['WEI', 'SHU', 'WU', 'QUN']);
    });
  });

  describe('player validation', () => {
    it('rejects duplicate player ids', () => {
      const data = makeSampleReplay();
      data.players[1].id = 'p1';
      expect(() => parser.parse(JSON.stringify(data))).toThrow('Duplicate player id');
    });

    it('rejects duplicate seat numbers', () => {
      const data = makeSampleReplay();
      data.players[1].seat = 0;
      expect(() => parser.parse(JSON.stringify(data))).toThrow('Duplicate seat number');
    });

    it('rejects invalid faction', () => {
      const raw = makeSampleReplay() as unknown as Record<string, unknown>;
      const players = raw['players'] as Record<string, unknown>[];
      players[0]['faction'] = 'INVALID';
      expect(() => parser.parse(JSON.stringify(raw))).toThrow('faction must be one of');
    });

    it('rejects fewer than 2 players', () => {
      const data = makeSampleReplay();
      data.players = [data.players[0]];
      expect(() => parser.parse(JSON.stringify(data))).toThrow('at least 2 players');
    });

    it('rejects missing generals', () => {
      const raw = makeSampleReplay() as unknown as Record<string, unknown>;
      const players = raw['players'] as Record<string, unknown>[];
      delete players[0]['generals'];
      expect(() => parser.parse(JSON.stringify(raw))).toThrow('generals must be an object');
    });
  });

  describe('action validation', () => {
    it('parses all action types', () => {
      const data = makeSampleReplay();
      data.turns = [
        {
          turnNumber: 1,
          player: 'p1',
          actions: [
            { type: 'drawCards', player: 'p1', count: 2 },
            { type: 'playCard', card: 'slash', targets: ['p2'] },
            { type: 'useSkill', skill: 'jian-xiong', targets: [] },
            { type: 'response', card: 'dodge', to: 'slash' },
            { type: 'damage', from: 'p1', to: 'p2', amount: 1 },
            { type: 'death', player: 'p2' },
            { type: 'discard', player: 'p1', cards: ['peach'] },
          ],
        },
      ];

      const result = parser.parse(JSON.stringify(data));
      const actions = result.turns[0].actions;

      expect(actions).toHaveLength(7);
      expect(actions[0]).toEqual({ type: 'drawCards', player: 'p1', count: 2 });
      expect(actions[1]).toEqual({ type: 'playCard', card: 'slash', targets: ['p2'] });
      expect(actions[2]).toEqual({ type: 'useSkill', skill: 'jian-xiong', targets: [] });
      expect(actions[3]).toEqual({ type: 'response', card: 'dodge', to: 'slash' });
      expect(actions[4]).toEqual({ type: 'damage', from: 'p1', to: 'p2', amount: 1 });
      expect(actions[5]).toEqual({ type: 'death', player: 'p2' });
      expect(actions[6]).toEqual({ type: 'discard', player: 'p1', cards: ['peach'] });
    });

    it('rejects unknown action type', () => {
      const data = makeSampleReplay();
      data.turns[0].actions = [
        { type: 'teleport' } as never,
      ];
      expect(() => parser.parse(JSON.stringify(data))).toThrow('not a valid action type');
    });

    it('rejects action with missing required field', () => {
      const data = makeSampleReplay();
      data.turns[0].actions = [
        { type: 'damage', from: 'p1', to: 'p2' } as never,
      ];
      expect(() => parser.parse(JSON.stringify(data))).toThrow('amount must be a number');
    });
  });

  describe('error handling', () => {
    it('throws ReplayParseError for invalid JSON', () => {
      expect(() => parser.parse('not json')).toThrow(ReplayParseError);
      expect(() => parser.parse('not json')).toThrow('Invalid JSON');
    });

    it('throws for non-object root', () => {
      expect(() => parser.parse('"just a string"')).toThrow('must be a JSON object');
      expect(() => parser.parse('[]')).toThrow('must be a JSON object');
      expect(() => parser.parse('null')).toThrow('must be a JSON object');
    });

    it('throws for missing version', () => {
      expect(() => parser.parse('{"players":[],"turns":[],"result":{}}')).toThrow(
        'version must be a string',
      );
    });

    it('throws for missing result fields', () => {
      const data = makeSampleReplay();
      (data.result as Record<string, unknown>)['winner'] = 42;
      expect(() => parser.parse(JSON.stringify(data))).toThrow('result.winner must be a string');
    });

    it('throws for non-array turns', () => {
      const raw = { ...makeSampleReplay(), turns: 'not-array' };
      expect(() => parser.parse(JSON.stringify(raw))).toThrow('turns must be an array');
    });
  });

  describe('turn structure', () => {
    it('preserves turn order and numbering', () => {
      const data = makeSampleReplay();
      data.turns = [
        { turnNumber: 1, player: 'p1', actions: [] },
        { turnNumber: 2, player: 'p2', actions: [] },
        { turnNumber: 3, player: 'p1', actions: [] },
      ];

      const result = parser.parse(JSON.stringify(data));
      expect(result.turns.map((t) => t.turnNumber)).toEqual([1, 2, 3]);
      expect(result.turns.map((t) => t.player)).toEqual(['p1', 'p2', 'p1']);
    });

    it('handles empty actions array', () => {
      const data = makeSampleReplay();
      data.turns = [{ turnNumber: 1, player: 'p1', actions: [] }];

      const result = parser.parse(JSON.stringify(data));
      expect(result.turns[0].actions).toEqual([]);
    });
  });
});
