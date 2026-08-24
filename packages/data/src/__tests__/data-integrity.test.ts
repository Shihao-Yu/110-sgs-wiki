import { describe, it, expect } from 'vitest';
import generalsData from '../generals.json';
import skillsData from '../skills.json';
import tokensData from '../tokens.json';
import packCardsData from '../pack-cards.json';
import { getGeneralPackVersion } from '../types/general.js';

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

interface Skill {
  id: string;
  name: string;
  generalIds?: string[];
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
const skills = skillsData as Skill[];
const tokens = tokensData as Token[];
const packCards = packCardsData as PackCard[];

const VALID_FACTIONS = new Set(['WEI', 'SHU', 'WU', 'QUN', 'JIN']);

// 国战（旧包）与群狼环鼎（新包）现已合并共存于同一份 generals.json，版本判定
// 统一走 getGeneralPackVersion（见 types/general.ts），这里不再自行散写 id
// 前缀比较。
const qlhdGenerals = generals.filter((g) => getGeneralPackVersion(g.id) === 'qlhd');
const guozhanGenerals = generals.filter((g) => getGeneralPackVersion(g.id) === 'guozhan');

describe('generals.json', () => {
  it('has 736 entries: 341 guozhan + 395 qlhd', () => {
    expect(generals).toHaveLength(736);
    expect(guozhanGenerals).toHaveLength(341);
    expect(qlhdGenerals).toHaveLength(395);
  });

  it('every general has id, name, faction, image and pack', () => {
    for (const g of generals) {
      expect(g.id, `general missing id: ${JSON.stringify(g)}`).toBeTruthy();
      expect(g.name, `general missing name: ${g.id}`).toBeTruthy();
      expect(g.faction, `general missing faction: ${g.id}`).toBeTruthy();
      expect(g.image, `general missing image: ${g.id}`).toBeTruthy();
      expect(g.pack, `general missing pack: ${g.id}`).toBeTruthy();
    }
  });

  it('has no duplicate IDs', () => {
    const ids = generals.map((g) => g.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('qlhd ids are all prefixed general_qlhd_; guozhan ids never are', () => {
    for (const g of qlhdGenerals) {
      expect(g.id.startsWith('general_qlhd_'), `qlhd general missing prefix: ${g.id}`).toBe(true);
    }
    for (const g of guozhanGenerals) {
      expect(g.id.startsWith('general_qlhd_'), `guozhan general unexpectedly prefixed: ${g.id}`).toBe(false);
    }
  });

  it('every faction and subfaction is a known code', () => {
    for (const g of generals) {
      expect(VALID_FACTIONS.has(g.faction), `${g.id} bad faction ${g.faction}`).toBe(true);
      // 两条 subfaction 断言都要放进守卫里：只有一部分武将带 subfaction，
      // 无条件跑 `expect(undefined).not.toBe(<非空字符串>)` 对没有 subfaction
      // 的武将恒真，写着「每个武将副势力≠主势力」却没有真正验证到它们，是误导。
      if (g.subfaction) {
        expect(VALID_FACTIONS.has(g.subfaction), `${g.id} bad subfaction ${g.subfaction}`).toBe(true);
        expect(g.subfaction, `${g.id} subfaction equals faction`).not.toBe(g.faction);
      }
    }
  });

  it('every image path is valid for its pack version', () => {
    for (const g of qlhdGenerals) {
      expect(
        g.image.startsWith('generals/') && !g.image.startsWith('generals/guozhan/'),
        `${g.id} qlhd image should sit directly under generals/: ${g.image}`,
      ).toBe(true);
      expect(g.image.endsWith('.webp'), `${g.id} qlhd image not webp: ${g.image}`).toBe(true);
    }
    for (const g of guozhanGenerals) {
      expect(
        g.image.startsWith('generals/guozhan/'),
        `${g.id} guozhan image should sit under generals/guozhan/: ${g.image}`,
      ).toBe(true);
      expect(g.image.endsWith('.webp'), `${g.id} guozhan image not webp: ${g.image}`).toBe(true);
    }
  });

  it('qlhd pack has exactly 3 ambitionist, 10 eunuch members and 16 dual-faction generals', () => {
    expect(qlhdGenerals.filter((g) => g.isAmbitionist)).toHaveLength(3);
    expect(qlhdGenerals.filter((g) => g.parentGeneralId)).toHaveLength(10);
    expect(qlhdGenerals.filter((g) => g.subfaction)).toHaveLength(16);
  });

  it('qlhd pack: skills are always empty and pack label is always 群狼环鼎', () => {
    for (const g of qlhdGenerals) {
      expect(g.skills, `qlhd general ${g.id} should have empty skills`).toEqual([]);
      expect(g.pack, `qlhd general ${g.id} pack mismatch`).toBe('群狼环鼎');
    }
  });

  it('guozhan pack: skills are not required to be empty (6 generals carry a real, non-placeholder skill)', () => {
    const skillNameById = new Map(skills.map((s) => [s.id, s.name]));
    const withRealSkill = guozhanGenerals.filter((g) =>
      g.skills.some((sid) => skillNameById.get(sid) !== '未知'),
    );
    expect(withRealSkill).toHaveLength(6);
  });

  it('guozhan pack: pack field takes several known values, not a single one', () => {
    const packValues = new Set(guozhanGenerals.map((g) => g.pack));
    expect(packValues).toEqual(new Set(['国战', '标准版', '山', '林', '火', '风']));
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
  it('has 442 entries', () => {
    expect(skills).toHaveLength(442);
  });

  it('every general skill reference resolves to a real skill', () => {
    const skillIds = new Set(skills.map((s) => s.id));
    for (const g of generals) {
      for (const sid of g.skills) {
        expect(skillIds.has(sid), `${g.id} references unknown skill ${sid}`).toBe(true);
      }
    }
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
