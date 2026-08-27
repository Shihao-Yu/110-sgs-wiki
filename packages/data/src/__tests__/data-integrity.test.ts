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
  ownerGeneralId?: string;
}

const generals = generalsData as General[];
const skills = skillsData as Skill[];
const tokens = tokensData as Token[];
const packCards = packCardsData as PackCard[];

const VALID_FACTIONS = new Set(['WEI', 'SHU', 'WU', 'QUN', 'JIN']);

describe('generals.json', () => {
  it('has 395 entries, all from the 群狼环鼎 pack', () => {
    expect(generals).toHaveLength(395);
    // 旧国战包已整体移除；id 前缀保留是为了将来并入其他包时不必重编号。
    for (const g of generals) {
      expect(g.id.startsWith('general_qlhd_'), `unexpected id: ${g.id}`).toBe(true);
      expect(g.pack, `${g.id} pack mismatch`).toBe('群狼环鼎');
    }
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

  it('every image sits directly under generals/ and is a webp', () => {
    for (const g of generals) {
      expect(
        g.image.startsWith('generals/') && !g.image.startsWith('generals/guozhan/'),
        `${g.id} image should sit directly under generals/: ${g.image}`,
      ).toBe(true);
      expect(g.image.endsWith('.webp'), `${g.id} image not webp: ${g.image}`).toBe(true);
    }
  });

  it('has exactly 3 ambitionist, 10 eunuch members and 16 dual-faction generals', () => {
    expect(generals.filter((g) => g.isAmbitionist)).toHaveLength(3);
    expect(generals.filter((g) => g.parentGeneralId)).toHaveLength(10);
    expect(generals.filter((g) => g.subfaction)).toHaveLength(16);
  });

  it('skills are always empty — the pack ships art only, no skill text', () => {
    for (const g of generals) {
      expect(g.skills, `${g.id} should have empty skills`).toEqual([]);
    }
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
  // 这 442 条来自已移除的国战包，现无任何武将引用它们，属惰性数据。
  // 保留是为了将来若补录群狼环鼎技能文本时有现成结构可用。
  it('has 442 entries and none of them are referenced by a general', () => {
    expect(skills).toHaveLength(442);
    const referenced = new Set(generals.flatMap((g) => g.skills));
    expect(referenced.size).toBe(0);
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

  it('only 福利卡 is left without an owner', () => {
    // 福利卡卡面署名条只写「福利卡」，效果面向「第一个死亡的角色」，与具体
    // 武将无关 —— 这是解图后的结论，不是漏填。其余 43 张都必须有归属。
    const unowned = tokens.filter((t) => !t.ownerGeneralId).map((t) => t.name);
    expect(unowned).toEqual(['福利卡']);
  });

  it('all 14 大攻车 cards belong to 张奋', () => {
    const zhangFen = generals.find((g) => g.name === '张奋');
    expect(zhangFen, '张奋 missing from generals.json').toBeDefined();
    const siege = tokens.filter((t) => t.category === 'module');
    expect(siege).toHaveLength(14);
    for (const t of siege) {
      expect((t as { module?: string }).module, `${t.name} missing module`).toBe('大攻车');
      expect(t.ownerGeneralId, `${t.name} not linked to 张奋`).toBe(zhangFen!.id);
    }
  });

  it('all 6 签 cards belong to 周群', () => {
    const zhouQun = generals.find((g) => g.name === '周群');
    expect(zhouQun, '周群 missing from generals.json').toBeDefined();
    const lots = tokens.filter((t) => t.name.endsWith('签'));
    expect(lots.map((t) => t.name).sort()).toEqual(
      ['上上签', '上签', '下下签', '下签', '中签', '命运签'].sort(),
    );
    for (const t of lots) {
      expect(t.ownerGeneralId, `${t.name} not linked to 周群`).toBe(zhouQun!.id);
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
    // type/description/subtype 在只看文件名的前提下无从得知，本包刻意不写。
    // ownerGeneralId 是例外：它有独立证据——武将技能文本里以【牌名】点名。
    const ALLOWED = ['id', 'image', 'name', 'number', 'ownerGeneralId', 'suit'];
    for (const c of packCards) {
      for (const k of Object.keys(c)) {
        expect(ALLOWED, `${c.id} unexpected field ${k}`).toContain(k);
      }
    }
  });

  it('16 cards are exclusive to 6 generals; the rest are generic', () => {
    // 归属依据见 scripts/qlhd/link-pack-cards.py。
    // 调虎离山刻意不归属：文聘与吴景的技能都只是把别的牌"当【调虎离山】使用"。
    const owned = packCards.filter((c) => c.ownerGeneralId);
    expect(owned).toHaveLength(16);
    expect(new Set(owned.map((c) => c.ownerGeneralId!)).size).toBe(6);
    expect(packCards.filter((c) => c.name === '调虎离山').every((c) => !c.ownerGeneralId)).toBe(true);
  });

  it('蒲元 owns all five 铸刃 weapons — one per suit, plus 天雷刃', () => {
    const puYuan = generals.find((g) => g.name === '蒲元');
    expect(puYuan).toBeDefined();
    const his = packCards.filter((c) => c.ownerGeneralId === puYuan!.id);
    expect(his.map((c) => c.name).sort()).toEqual(
      ['天雷刃', '水波剑', '混毒弯匕', '烈淬刃', '红缎枪'].sort(),
    );
    // 铸刃换的是"与弃置牌花色相同的装备"，故四把常规刃恰好四花色各一。
    const regular = his.filter((c) => c.name !== '天雷刃');
    expect(new Set(regular.map((c) => c.suit)).size).toBe(4);
  });

  it('every ownerGeneralId resolves to an existing general', () => {
    const ids = new Set(generals.map((g) => g.id));
    for (const c of packCards) {
      if (!c.ownerGeneralId) continue;
      expect(ids.has(c.ownerGeneralId), `${c.name} orphan owner ${c.ownerGeneralId}`).toBe(true);
    }
  });
});
