import { beforeEach, describe, expect, it } from 'vitest';
import type { Card, CardId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { TargetSelector } from '../target/target-selector.js';
import { CardManager } from './card-manager.js';

function makePlayer(id: string, seat: number): PlayerState {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    seat,
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

function makeGame(players: PlayerState[]): GameState {
  return {
    players,
    drawPile: [],
    discardPile: [],
    currentPlayerIndex: 0,
    currentPhase: 'play',
    turnCount: 1,
    activeEffects: [],
    gameOver: false,
    winnerFaction: null,
  };
}

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card_01' as CardId,
    name: '杀',
    type: 'basic',
    suit: 'spade',
    number: 7,
    description: '',
    ...overrides,
  };
}

function makeTrick(name: string, id: string): Card {
  return makeCard({
    id: id as CardId,
    name,
    type: 'trick',
    subtype: 'instantTrick',
  });
}

function makeWeapon(name: string, range: number, id: string): Card {
  return makeCard({
    id: id as CardId,
    name,
    type: 'equipment',
    subtype: 'weapon',
    range,
  });
}

describe('CardManager', () => {
  let manager: CardManager;
  let selector: TargetSelector;
  let p1: PlayerState;
  let p2: PlayerState;
  let p3: PlayerState;
  let game: GameState;

  beforeEach(() => {
    manager = new CardManager();
    selector = new TargetSelector();
    p1 = makePlayer('p1', 0);
    p2 = makePlayer('p2', 1);
    p3 = makePlayer('p3', 2);
    game = makeGame([p1, p2, p3]);
  });

  it('playing 杀 damages a target who cannot play 闪', () => {
    const slash = makeCard({ id: 'slash' as CardId, name: '杀' });
    p1.handCards = [slash];

    manager.playCard(game, p1, slash, [p2]);

    expect(p2.hp).toBe(3);
    expect(p1.handCards).toEqual([]);
    expect(game.discardPile).toContain(slash);
  });

  it('playing 杀 consumes 闪 when the target has one', () => {
    const slash = makeCard({ id: 'slash' as CardId, name: '杀' });
    const dodge = makeCard({ id: 'shan' as CardId, name: '闪' });
    p1.handCards = [slash];
    p2.handCards = [dodge];

    manager.playCard(game, p1, slash, [p2]);

    expect(p2.hp).toBe(4);
    expect(p2.handCards).toEqual([]);
    expect(game.discardPile).toContain(slash);
    expect(game.discardPile).toContain(dodge);
  });

  it('playing 桃 recovers 1 HP', () => {
    const peach = makeCard({
      id: 'peach' as CardId,
      name: '桃',
      suit: 'heart',
    });
    p1.hp = 2;
    p1.handCards = [peach];

    manager.playCard(game, p1, peach);

    expect(p1.hp).toBe(3);
    expect(game.discardPile).toContain(peach);
  });

  it('酒 increases the next 杀 damage this turn', () => {
    const wine = makeCard({
      id: 'wine' as CardId,
      name: '酒',
      suit: 'diamond',
    });
    const slash = makeCard({ id: 'slash' as CardId, name: '杀' });
    p1.handCards = [wine, slash];

    manager.playCard(game, p1, wine);
    manager.playCard(game, p1, slash, [p2]);

    expect(p2.hp).toBe(2);
    expect(game.activeEffects).toEqual([]);
  });

  it('酒 can save a dying player like 桃', () => {
    const wine = makeCard({
      id: 'wine' as CardId,
      name: '酒',
      suit: 'diamond',
    });
    p1.handCards = [wine];
    p2.hp = 0;
    game.currentPhase = 'end';

    manager.playCard(game, p1, wine, [p2]);

    expect(p2.hp).toBe(1);
    expect(game.discardPile).toContain(wine);
  });

  it('equipping a weapon changes attack range and replaces the old weapon', () => {
    const oldWeapon = makeWeapon('青釭剑', 2, 'weapon-old');
    const newWeapon = makeWeapon('麒麟弓', 5, 'weapon-new');
    p1.equipment.weapon = oldWeapon;
    p1.handCards = [newWeapon];

    manager.playCard(game, p1, newWeapon);

    expect(p1.equipment.weapon).toBe(newWeapon);
    expect(game.discardPile).toContain(oldWeapon);
    expect(selector.getAttackRange(p1)).toBe(5);
  });

  it('无中生有 draws 2 cards', () => {
    const wuzhong = makeTrick('无中生有', 'wuzhong');
    const drawOne = makeCard({ id: 'draw-1' as CardId, name: '桃' });
    const drawTwo = makeCard({ id: 'draw-2' as CardId, name: '闪' });
    const drawThree = makeCard({ id: 'draw-3' as CardId, name: '杀' });
    p1.handCards = [wuzhong];
    game.drawPile = [drawOne, drawTwo, drawThree];

    manager.playCard(game, p1, wuzhong);

    expect(p1.handCards).toEqual([drawOne, drawTwo]);
    expect(game.drawPile).toEqual([drawThree]);
    expect(game.discardPile).toContain(wuzhong);
  });

  it('过河拆桥 discards a card from the target', () => {
    const guohe = makeTrick('过河拆桥', 'guohe');
    const targetCard = makeCard({ id: 'target-card' as CardId, name: '桃' });
    p1.handCards = [guohe];
    p2.handCards = [targetCard];

    manager.playCard(game, p1, guohe, [p2]);

    expect(p2.handCards).toEqual([]);
    expect(game.discardPile).toContain(guohe);
    expect(game.discardPile).toContain(targetCard);
  });

  it('顺手牵羊 takes a card from a target within distance 1', () => {
    const shunshou = makeTrick('顺手牵羊', 'shunshou');
    const targetCard = makeCard({ id: 'target-card' as CardId, name: '闪' });
    p1.handCards = [shunshou];
    p2.handCards = [targetCard];

    manager.playCard(game, p1, shunshou, [p2]);

    expect(p1.handCards).toEqual([targetCard]);
    expect(p2.handCards).toEqual([]);
    expect(game.discardPile).toContain(shunshou);
  });

  it('limits 杀 to one use per turn without 诸葛连弩', () => {
    const slashOne = makeCard({ id: 'slash-1' as CardId, name: '杀' });
    const slashTwo = makeCard({ id: 'slash-2' as CardId, name: '杀' });
    p1.handCards = [slashOne, slashTwo];

    manager.playCard(game, p1, slashOne, [p2]);

    expect(() => manager.playCard(game, p1, slashTwo, [p2])).toThrow(
      'Only one 杀 can be played per turn without 诸葛连弩',
    );
    expect(p1.handCards).toContain(slashTwo);
  });

  it('诸葛连弩 removes the once-per-turn 杀 limit', () => {
    const crossbow = makeWeapon('诸葛连弩', 1, 'crossbow');
    const slashOne = makeCard({ id: 'slash-1' as CardId, name: '杀' });
    const slashTwo = makeCard({ id: 'slash-2' as CardId, name: '杀' });
    p1.equipment.weapon = crossbow;
    p1.handCards = [slashOne, slashTwo];

    manager.playCard(game, p1, slashOne, [p2]);
    manager.playCard(game, p1, slashTwo, [p2]);

    expect(p2.hp).toBe(2);
  });
});
