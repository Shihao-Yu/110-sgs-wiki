import { describe, it, expect } from 'vitest';
import type { Card, CardType, CardSubtype, Suit } from './types/card.js';
import cards from './cards.json';

const validSuits: Suit[] = ['spade', 'heart', 'club', 'diamond'];
const validTypes: CardType[] = ['basic', 'trick', 'equipment'];
const validSubtypes: CardSubtype[] = [
  'weapon', 'armor', 'defensiveHorse', 'offensiveHorse', 'treasure',
  'instantTrick', 'delayedTrick',
];

describe('cards.json', () => {
  it('should have cards', () => {
    expect(cards.length).toBeGreaterThan(100);
  });

  it('should have unique IDs', () => {
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every card has required fields', () => {
    for (const card of cards) {
      expect(card.id).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(validTypes).toContain(card.type);
      expect(validSuits).toContain(card.suit);
      expect(card.number).toBeGreaterThanOrEqual(1);
      expect(card.number).toBeLessThanOrEqual(13);
      expect(card.description).toBeTruthy();
    }
  });

  it('trick cards have valid subtypes', () => {
    const tricks = cards.filter((c) => c.type === 'trick');
    expect(tricks.length).toBeGreaterThan(0);
    for (const card of tricks) {
      expect(['instantTrick', 'delayedTrick']).toContain(card.subtype);
    }
  });

  it('equipment cards have valid subtypes', () => {
    const equips = cards.filter((c) => c.type === 'equipment');
    expect(equips.length).toBeGreaterThan(0);
    for (const card of equips) {
      expect(['weapon', 'armor', 'defensiveHorse', 'offensiveHorse', 'treasure'])
        .toContain(card.subtype);
    }
  });

  it('weapons have range', () => {
    const weapons = cards.filter((c) => c.subtype === 'weapon');
    expect(weapons.length).toBeGreaterThan(0);
    for (const card of weapons) {
      expect((card as Card).range).toBeGreaterThanOrEqual(1);
    }
  });

  it('all card types from task are represented', () => {
    const names = new Set(cards.map((c) => c.name));

    // Basic cards
    expect(names.has('杀')).toBe(true);
    expect(names.has('闪')).toBe(true);
    expect(names.has('桃')).toBe(true);
    expect(names.has('酒')).toBe(true);

    // Instant tricks
    expect(names.has('无中生有')).toBe(true);
    expect(names.has('过河拆桥')).toBe(true);
    expect(names.has('顺手牵羊')).toBe(true);
    expect(names.has('决斗')).toBe(true);
    expect(names.has('借刀杀人')).toBe(true);
    expect(names.has('火攻')).toBe(true);
    expect(names.has('铁索连环')).toBe(true);
    expect(names.has('知己知彼')).toBe(true);
    expect(names.has('以逸待劳')).toBe(true);
    expect(names.has('远交近攻')).toBe(true);
    expect(names.has('调虎离山')).toBe(true);
    expect(names.has('敕令')).toBe(true);
    expect(names.has('南蛮入侵')).toBe(true);
    expect(names.has('万箭齐发')).toBe(true);
    expect(names.has('桃园结义')).toBe(true);
    expect(names.has('五谷丰登')).toBe(true);

    // Delayed tricks
    expect(names.has('乐不思蜀')).toBe(true);
    expect(names.has('兵粮寸断')).toBe(true);
    expect(names.has('闪电')).toBe(true);

    // Weapons
    expect(names.has('诸葛连弩')).toBe(true);
    expect(names.has('青釭剑')).toBe(true);
    expect(names.has('丈八蛇矛')).toBe(true);
    expect(names.has('贯石斧')).toBe(true);
    expect(names.has('方天画戟')).toBe(true);
    expect(names.has('麒麟弓')).toBe(true);
    expect(names.has('古锭刀')).toBe(true);
    expect(names.has('朱雀羽扇')).toBe(true);
    expect(names.has('银月枪')).toBe(true);
    expect(names.has('雌雄双股剑')).toBe(true);

    // Armor
    expect(names.has('八卦阵')).toBe(true);
    expect(names.has('仁王盾')).toBe(true);
    expect(names.has('藤甲')).toBe(true);
    expect(names.has('白银狮子')).toBe(true);

    // Horses
    expect(names.has('的卢')).toBe(true);
    expect(names.has('爪黄飞电')).toBe(true);
    expect(names.has('绝影')).toBe(true);
    expect(names.has('赤兔')).toBe(true);
    expect(names.has('紫骍')).toBe(true);
    expect(names.has('骅骝')).toBe(true);
    expect(names.has('大宛')).toBe(true);

    // Treasures
    expect(names.has('木牛流马')).toBe(true);
    expect(names.has('玉玺')).toBe(true);
  });

  it('has correct card counts by type', () => {
    const basic = cards.filter((c) => c.type === 'basic');
    const trick = cards.filter((c) => c.type === 'trick');
    const equip = cards.filter((c) => c.type === 'equipment');

    expect(basic.length).toBe(82);
    expect(trick.length).toBe(40);
    expect(equip.length).toBe(24);
  });

  it('has correct slash variant counts', () => {
    const sha = cards.filter((c) => c.name === '杀');
    const huosha = cards.filter((c) => c.name === '火杀');
    const leisha = cards.filter((c) => c.name === '雷杀');

    expect(sha.length).toBe(30);
    expect(huosha.length).toBe(5);
    expect(leisha.length).toBe(9);
  });

  it('杀 cards span all four suits', () => {
    const sha = cards.filter((c) => c.name === '杀');
    const suits = new Set(sha.map((c) => c.suit));
    expect(suits.size).toBe(4);
  });
});
