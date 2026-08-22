import { describe, it, expect } from 'vitest';
import generalsData from '../generals.json';
import skillsData from '../skills.json';
import tokensData from '../tokens.json';
import packCardsData from '../pack-cards.json';

interface General {
  id: string;
  name: string;
  faction: string;
  skills: string[];
  image: string;
  pack: string;
  subfaction?: string;
  parentGeneralId?: string;
  isAmbitionist?: boolean;
  [key: string]: unknown;
}

interface Token {
  id: string;
  name: string;
  image: string;
  category: string;
  ownerGeneralId?: string;
  [key: string]: unknown;
}

interface PackCard {
  id: string;
  name: string;
  suit: string;
  number: number;
  image: string;
}

const generals = generalsData as General[];
const skills = skillsData as unknown[];
const tokens = tokensData as Token[];
const packCards = packCardsData as PackCard[];

const VALID_FACTIONS = new Set(['WEI', 'SHU', 'WU', 'QUN', 'JIN']);

describe('generals.json', () => {
  it('has 395 entries', () => {
    expect(generals).toHaveLength(395);
  });

  it('every general has id, name, faction, image and pack', () => {
    for (const g of generals) {
      expect(g.id, `general missing id: ${JSON.stringify(g)}`).toBeTruthy();
      expect(g.name, `general missing name: ${g.id}`).toBeTruthy();
      expect(g.faction, `general missing faction: ${g.id}`).toBeTruthy();
      expect(g.image, `general missing image: ${g.id}`).toBeTruthy();
      expect(g.pack, `general missing pack: ${g.id}`).toBe('群狼环鼎');
    }
  });

  it('has no duplicate IDs', () => {
    const ids = generals.map((g) => g.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('every faction and subfaction is a known code', () => {
    for (const g of generals) {
      expect(VALID_FACTIONS.has(g.faction), `${g.id} bad faction ${g.faction}`).toBe(true);
      // 两条 subfaction 断言都要放进守卫里：全部 395 条中只有 16 条带 subfaction，
      // 无条件跑 `expect(undefined).not.toBe(<非空字符串>)` 对其余 379 条恒真，
      // 写着「每个武将副势力≠主势力」却只验证了 4%，是误导。
      if (g.subfaction) {
        expect(VALID_FACTIONS.has(g.subfaction), `${g.id} bad subfaction ${g.subfaction}`).toBe(true);
        expect(g.subfaction, `${g.id} subfaction equals faction`).not.toBe(g.faction);
      }
    }
  });

  it('carries no skill data in this pack', () => {
    for (const g of generals) {
      expect(g.skills, `general ${g.id} should have empty skills`).toEqual([]);
    }
  });

  it('every image path points under generals/', () => {
    for (const g of generals) {
      expect(g.image.startsWith('generals/'), `${g.id} bad image path ${g.image}`).toBe(true);
      expect(g.image.endsWith('.webp') || g.image.endsWith('.png'), `${g.id} bad ext`).toBe(true);
    }
  });

  it('has exactly 3 ambitionist, 10 eunuch members and 16 dual-faction generals', () => {
    expect(generals.filter((g) => g.isAmbitionist)).toHaveLength(3);
    expect(generals.filter((g) => g.parentGeneralId)).toHaveLength(10);
    // 这条计数是上面那个 `if (g.subfaction)` 守卫的配套保险：没有它，
    // 万一哪天 subfaction 数据整体丢失，被守卫包住的两条断言会全部跳过而测试照样绿。
    expect(generals.filter((g) => g.subfaction)).toHaveLength(16);
  });

  it('every parentGeneralId resolves to an existing general', () => {
    const ids = new Set(generals.map((g) => g.id));
    for (const g of generals) {
      if (!g.parentGeneralId) continue;
      expect(ids.has(g.parentGeneralId), `${g.id} orphan parent ${g.parentGeneralId}`).toBe(true);
    }
  });
});

describe('skills.json', () => {
  it('is empty — this pack ships images only', () => {
    expect(skills).toHaveLength(0);
  });
});

describe('tokens.json', () => {
  it('has no duplicate IDs', () => {
    const ids = tokens.map((t) => t.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate token IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('every token has a known category', () => {
    for (const t of tokens) {
      expect(['skill', 'module', 'misc']).toContain(t.category);
    }
  });

  it('every ownerGeneralId resolves to an existing general', () => {
    const ids = new Set(generals.map((g) => g.id));
    const orphans = tokens
      .filter((t) => t.ownerGeneralId && !ids.has(t.ownerGeneralId))
      .map((t) => `${t.name} -> ${t.ownerGeneralId}`);
    expect(orphans, `orphan token owners:\n${orphans.join('\n')}`).toHaveLength(0);
  });

  it('module tokens all belong to the 大攻车 module', () => {
    for (const t of tokens) {
      if (t.category !== 'module') continue;
      expect((t as { module?: string }).module, `${t.name} missing module`).toBe('大攻车');
    }
  });
});

describe('pack-cards.json', () => {
  const VALID_SUITS = new Set(['spade', 'heart', 'club', 'diamond']);

  it('has 19 entries', () => {
    expect(packCards).toHaveLength(19);
  });

  it('has no duplicate IDs', () => {
    const ids = packCards.map((c) => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate pack-card IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('every card has a real suit and a number in 1..13', () => {
    for (const c of packCards) {
      expect(VALID_SUITS.has(c.suit), `${c.name} bad suit ${c.suit}`).toBe(true);
      expect(Number.isInteger(c.number), `${c.name} non-integer number`).toBe(true);
      expect(c.number >= 1 && c.number <= 13, `${c.name} number out of range: ${c.number}`).toBe(true);
    }
  });

  it('every image path points under cards/ and is a webp', () => {
    for (const c of packCards) {
      expect(c.image.startsWith('cards/'), `${c.id} bad image path ${c.image}`).toBe(true);
      expect(c.image.endsWith('.webp'), `${c.id} not a webp: ${c.image}`).toBe(true);
    }
  });

  it('carries no fabricated type/description/subtype fields', () => {
    // 这些字段在只看文件名的前提下无从得知，本包刻意不写。
    // 若将来有人逐张核对了卡面再补，届时同步更新这条断言。
    for (const c of packCards) {
      const keys = Object.keys(c).sort();
      expect(keys, `${c.id} unexpected fields`).toEqual(['id', 'image', 'name', 'number', 'suit']);
    }
  });
});
