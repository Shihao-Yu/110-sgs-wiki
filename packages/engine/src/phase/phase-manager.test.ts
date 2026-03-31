import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId, PhaseType } from '../state/types.js';
import { PhaseManager, PHASE_ORDER } from './phase-manager.js';

function makePlayer(id = 'p1'): PlayerState {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    seat: 0,
    mainGeneral: null,
    deputyGeneral: null,
    hp: 4,
    maxHp: 4,
    handCards: [],
    equipment: {
      weapon: null,
      armor: null,
      defensiveHorse: null,
      offensiveHorse: null,
      treasure: null,
    },
    judgmentArea: [],
    faction: null,
    alive: true,
    skills: [],
    marks: {},
  };
}

function makeGame(player: PlayerState): GameState {
  return {
    players: [player],
    drawPile: [],
    discardPile: [],
    currentPlayerIndex: 0,
    currentPhase: 'prepare',
    turnCount: 1,
    activeEffects: [],
    gameOver: false,
    winnerFaction: null,
  };
}

describe('PhaseManager', () => {
  let pm: PhaseManager;
  let player: PlayerState;
  let game: GameState;

  beforeEach(() => {
    pm = new PhaseManager();
    player = makePlayer();
    game = makeGame(player);
  });

  it('executes all 6 phases in correct order during a full turn', () => {
    const executed: PhaseType[] = [];
    for (const phase of PHASE_ORDER) {
      pm.onPhaseStart(phase, (ctx) => {
        executed.push(ctx.phase);
      });
    }

    pm.executeTurn(game, player);

    expect(executed).toEqual([
      'prepare',
      'judgment',
      'draw',
      'play',
      'discard',
      'end',
    ]);
  });

  it('skips a phase when skipPhase is called', () => {
    const executed: PhaseType[] = [];
    for (const phase of PHASE_ORDER) {
      pm.onPhaseStart(phase, (ctx) => {
        executed.push(ctx.phase);
      });
    }

    pm.skipPhase(player, 'draw');
    pm.executeTurn(game, player);

    expect(executed).toEqual([
      'prepare',
      'judgment',
      'play',
      'discard',
      'end',
    ]);
    expect(executed).not.toContain('draw');
  });

  it('inserts an extra phase after a specified phase', () => {
    const executed: PhaseType[] = [];
    for (const phase of PHASE_ORDER) {
      pm.onPhaseStart(phase, (ctx) => {
        executed.push(ctx.phase);
      });
    }

    pm.addExtraPhase(player, 'play', 'play');
    pm.executeTurn(game, player);

    expect(executed).toEqual([
      'prepare',
      'judgment',
      'draw',
      'play',
      'play',
      'discard',
      'end',
    ]);
  });

  it('fires both start and end events for each phase', () => {
    const events: string[] = [];
    pm.onPhaseStart('draw', () => events.push('draw:start'));
    pm.onPhaseEnd('draw', () => events.push('draw:end'));

    pm.executePhase(game, player, 'draw');

    expect(events).toEqual(['draw:start', 'draw:end']);
  });

  it('updates game.currentPhase as each phase executes', () => {
    const phases: PhaseType[] = [];
    for (const phase of PHASE_ORDER) {
      pm.onPhaseStart(phase, (ctx) => {
        phases.push(ctx.game.currentPhase);
      });
    }

    pm.executeTurn(game, player);

    expect(phases).toEqual(PHASE_ORDER);
  });

  it('clears skip/extra state after the turn completes', () => {
    pm.skipPhase(player, 'draw');
    pm.addExtraPhase(player, 'play', 'play');

    // First turn: modified
    const first: PhaseType[] = [];
    for (const phase of PHASE_ORDER) {
      pm.onPhaseStart(phase, (ctx) => first.push(ctx.phase));
    }
    pm.executeTurn(game, player);
    expect(first).not.toContain('draw');

    // Second turn: back to normal
    const second: PhaseType[] = [];
    pm.removeAllListeners();
    for (const phase of PHASE_ORDER) {
      pm.onPhaseStart(phase, (ctx) => second.push(ctx.phase));
    }
    pm.executeTurn(game, player);
    expect(second).toEqual(PHASE_ORDER);
  });

  it('supports multiple skips simultaneously', () => {
    const executed: PhaseType[] = [];
    for (const phase of PHASE_ORDER) {
      pm.onPhaseStart(phase, (ctx) => executed.push(ctx.phase));
    }

    pm.skipPhase(player, 'judgment');
    pm.skipPhase(player, 'draw');
    pm.executeTurn(game, player);

    expect(executed).toEqual(['prepare', 'play', 'discard', 'end']);
  });

  it('handles skip and extra phase on the same turn', () => {
    const executed: PhaseType[] = [];
    for (const phase of PHASE_ORDER) {
      pm.onPhaseStart(phase, (ctx) => executed.push(ctx.phase));
    }

    pm.skipPhase(player, 'draw');
    pm.addExtraPhase(player, 'play', 'judgment');
    pm.executeTurn(game, player);

    // draw skipped, extra play after judgment
    expect(executed).toEqual([
      'prepare',
      'judgment',
      'play',
      'play',
      'discard',
      'end',
    ]);
  });
});
