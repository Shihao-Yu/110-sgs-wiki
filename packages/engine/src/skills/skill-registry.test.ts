import type { Card, CardId, GeneralId, SkillId } from '@sgs/data';
import { describe, expect, it } from 'vitest';
import { EventEmitter } from '../phase/event-emitter.js';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { createSkillContext } from './skill-context.js';
import { SkillRegistry } from './skill-registry.js';
import type { SkillPlugin } from './types.js';

function makeCard(id: string, name = 'Slash'): Card {
  return {
    id: id as CardId,
    name,
    type: 'basic',
    suit: 'spade',
    number: 7,
    description: `${name} description`,
  };
}

function makePlayer(
  id = 'p1',
  options: {
    mainGeneralId?: string;
    deputyGeneralId?: string;
    skills?: string[];
  } = {},
): PlayerState {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    seat: 0,
    mainGeneral: options.mainGeneralId
      ? {
          generalId: options.mainGeneralId as GeneralId,
          revealed: true,
        }
      : null,
    deputyGeneral: options.deputyGeneralId
      ? {
          generalId: options.deputyGeneralId as GeneralId,
          revealed: true,
        }
      : null,
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
    skills: (options.skills ?? []).map(skill => skill as SkillId),
    marks: {},
  };
}

function makeGame(players: PlayerState[]): GameState {
  return {
    players,
    drawPile: [makeCard('draw-1'), makeCard('draw-2'), makeCard('draw-3')],
    discardPile: [],
    currentPlayerIndex: 0,
    currentPhase: 'prepare',
    turnCount: 1,
    activeEffects: [],
    gameOver: false,
    winnerFaction: null,
  };
}

function makeSkill(overrides: Partial<SkillPlugin> & Pick<SkillPlugin, 'id' | 'generalId'>): SkillPlugin {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    generalId: overrides.generalId,
    type: overrides.type ?? 'passive',
    description: overrides.description ?? `${overrides.id} description`,
    triggers: overrides.triggers ?? ['drawCards'],
    priority: overrides.priority,
    canActivate: overrides.canActivate ?? (() => true),
    activate: overrides.activate ?? (() => {}),
    ai: overrides.ai,
  };
}

describe('SkillRegistry', () => {
  it('registers a skill and triggers it for a matching event', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'general-a',
      skills: ['skill-a'],
    });
    const game = makeGame([player]);
    const registry = new SkillRegistry();
    const activations: string[] = [];

    registry.register(
      makeSkill({
        id: 'skill-a',
        generalId: 'general-a' as GeneralId,
        triggers: ['drawCards'],
        activate: (ctx) => {
          activations.push(`${ctx.player.id}:${ctx.event.type}`);
        },
      }),
    );

    registry.triggerEvent(
      createSkillContext({
        game,
        player,
        event: {
          type: 'drawCards',
          player: player.id,
          count: 2,
        },
      }),
    );

    expect(activations).toEqual(['p1:drawCards']);
  });

  it('returns event listeners in priority order', () => {
    const registry = new SkillRegistry();

    registry.register(
      makeSkill({
        id: 'skill-normal',
        generalId: 'general-a' as GeneralId,
        priority: 0,
      }),
    );
    registry.register(
      makeSkill({
        id: 'skill-first',
        generalId: 'general-a' as GeneralId,
        priority: -2,
      }),
    );
    registry.register(
      makeSkill({
        id: 'skill-last',
        generalId: 'general-a' as GeneralId,
        priority: 10,
      }),
    );

    expect(registry.getSkillsForEvent('drawCards').map(skill => skill.id)).toEqual([
      'skill-first',
      'skill-normal',
      'skill-last',
    ]);
  });

  it('skips activation when canActivate returns false', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'general-a',
      skills: ['skill-a'],
    });
    const game = makeGame([player]);
    const registry = new SkillRegistry();
    let activated = false;

    registry.register(
      makeSkill({
        id: 'skill-a',
        generalId: 'general-a' as GeneralId,
        canActivate: () => false,
        activate: () => {
          activated = true;
        },
      }),
    );

    registry.triggerEvent(
      createSkillContext({
        game,
        player,
        event: {
          type: 'drawCards',
          player: player.id,
          count: 1,
        },
      }),
    );

    expect(activated).toBe(false);
  });

  it('triggers multiple player skills on the same event in priority order', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'general-a',
      deputyGeneralId: 'general-b',
      skills: ['skill-a', 'skill-b'],
    });
    const game = makeGame([player]);
    const registry = new SkillRegistry();
    const order: string[] = [];

    registry.register(
      makeSkill({
        id: 'skill-a',
        generalId: 'general-a' as GeneralId,
        priority: 4,
        activate: () => {
          order.push('skill-a');
        },
      }),
    );
    registry.register(
      makeSkill({
        id: 'skill-b',
        generalId: 'general-b' as GeneralId,
        priority: -1,
        activate: () => {
          order.push('skill-b');
        },
      }),
    );

    registry.triggerEvent(
      createSkillContext({
        game,
        player,
        event: {
          type: 'drawCards',
          player: player.id,
          count: 1,
        },
      }),
    );

    expect(order).toEqual(['skill-b', 'skill-a']);
  });

  it('exposes AI hints for callers to evaluate activation and target selection', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'general-ai',
      skills: ['skill-ai'],
    });
    const target = makePlayer('p2');
    const game = makeGame([player, target]);
    const ctx = createSkillContext({
      game,
      player,
      event: {
        type: 'damage',
        source: target.id,
        target: player.id,
        amount: 1,
      },
    });

    const skill = makeSkill({
      id: 'skill-ai',
      generalId: 'general-ai' as GeneralId,
      triggers: ['damage'],
      ai: {
        shouldActivate: ({ player: currentPlayer, event }) =>
          event.type === 'damage' && event.target === currentPlayer.id,
        selectTargets: (_ctx, candidates) => candidates.slice(0, 1),
      },
    });

    expect(skill.ai?.shouldActivate(ctx)).toBe(true);
    expect(skill.ai?.selectTargets(ctx, ['p2', 'p3'])).toEqual(['p2']);
  });

  it('bridges phase emitter events into phaseChange skill triggers', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'general-phase',
      skills: ['skill-phase'],
    });
    const game = makeGame([player]);
    const registry = new SkillRegistry();
    const emitter = new EventEmitter();
    const phases: string[] = [];

    registry.register(
      makeSkill({
        id: 'skill-phase',
        generalId: 'general-phase' as GeneralId,
        triggers: ['phaseChange'],
        activate: (ctx) => {
          if (ctx.event.type === 'phaseChange') {
            phases.push(ctx.event.phase);
          }
        },
      }),
    );

    const unbind = registry.bindPhaseEvents(emitter);

    emitter.emit('phase:draw:start', {
      game,
      player,
      phase: 'draw',
    });

    unbind();

    emitter.emit('phase:play:start', {
      game,
      player,
      phase: 'play',
    });

    expect(phases).toEqual(['draw']);
  });
});
