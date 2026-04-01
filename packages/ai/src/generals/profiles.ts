/**
 * Per-general AI profiles — behavioural overrides that tune BaseAI
 * decisions for each of the 30 core Sanguosha generals.
 *
 * Each profile declares:
 *  - aggressiveness  (0-1): bias toward attacking vs conserving
 *  - cardValueOverrides: per-card-name score adjustments
 *  - targetStrategy: how to pick targets (weakest | strongest | mostCards | leastCards)
 *  - responseThresholds: when to spend defensive cards
 *  - discardPriority: extra discard preferences
 *  - notes: human-readable description of the general's AI personality
 */

import type { GeneralId } from '@sgs/data';

// ---------------------------------------------------------------------------
// Profile Types
// ---------------------------------------------------------------------------

/** Target selection strategy. */
export type TargetStrategy =
  | 'weakest'
  | 'strongest'
  | 'mostCards'
  | 'leastCards';

/** Per-general AI overrides layered on top of BaseAI. */
export interface GeneralProfile {
  generalId: GeneralId;
  /** 0 = very conservative, 1 = hyper-aggressive. */
  aggressiveness: number;
  /** Card-name -> score delta applied on top of BaseAI card values. */
  cardValueOverrides: Record<string, number>;
  /** How to rank candidate targets. */
  targetStrategy: TargetStrategy;
  /** HP ratio threshold below which to use 闪; 1 = always dodge, 0 = never. */
  dodgeThreshold: number;
  /** HP ratio threshold below which to use 桃; 1 = always heal, 0 = only when dying. */
  peachThreshold: number;
  /** Card names deprioritised during discard (keep these longer). */
  discardProtect: string[];
  /** Human-readable description of the AI style. */
  notes: string;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function profile(
  id: string,
  overrides: Omit<GeneralProfile, 'generalId'>,
): [GeneralId, GeneralProfile] {
  const generalId = id as GeneralId;
  return [generalId, { generalId, ...overrides }];
}

// ---------------------------------------------------------------------------
// Default baseline — used as fallback when a general has no explicit profile.
// ---------------------------------------------------------------------------

export const DEFAULT_PROFILE: Omit<GeneralProfile, 'generalId'> = {
  aggressiveness: 0.5,
  cardValueOverrides: {},
  targetStrategy: 'weakest',
  dodgeThreshold: 1.0,
  peachThreshold: 0.5,
  discardProtect: [],
  notes: 'Default balanced AI — no general-specific tuning.',
};

// ---------------------------------------------------------------------------
// 30 Core General Profiles
// ---------------------------------------------------------------------------

export const GENERAL_PROFILES: ReadonlyMap<GeneralId, GeneralProfile> = new Map([
  // ===== WEI =====

  profile('caocao', {
    aggressiveness: 0.8,
    cardValueOverrides: { '杀': 2, '决斗': 2, '南蛮入侵': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.6,
    peachThreshold: 0.4,
    discardProtect: ['杀', '决斗'],
    notes: '奸雄 — prioritise acquiring damage cards; aggressive targeting to trigger card gain.',
  }),

  profile('simayi', {
    aggressiveness: 0.4,
    cardValueOverrides: { '闪': 2, '无懈可击': 2, '顺手牵羊': 3 },
    targetStrategy: 'mostCards',
    dodgeThreshold: 0.5,
    peachThreshold: 0.5,
    discardProtect: ['无懈可击', '顺手牵羊'],
    notes: '反馈 — take cards from damage source; prefer players with many cards to maximise value.',
  }),

  profile('xiahoudun', {
    aggressiveness: 0.7,
    cardValueOverrides: { '杀': 1, '决斗': 1 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.4,
    peachThreshold: 0.3,
    discardProtect: ['杀'],
    notes: '刚烈 — willingly take damage to punish the source; low dodge threshold.',
  }),

  profile('zhangliao', {
    aggressiveness: 0.7,
    cardValueOverrides: { '顺手牵羊': 2, '过河拆桥': 2 },
    targetStrategy: 'mostCards',
    dodgeThreshold: 0.9,
    peachThreshold: 0.5,
    discardProtect: ['顺手牵羊', '过河拆桥'],
    notes: '突袭 — strip cards from opponents; target card-rich players.',
  }),

  profile('xuchu', {
    aggressiveness: 0.9,
    cardValueOverrides: { '杀': 3, '酒': 3, '决斗': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.3,
    peachThreshold: 0.3,
    discardProtect: ['杀', '酒'],
    notes: '裸衣 — maximise burst; value 杀 and 酒 for big damage turns.',
  }),

  profile('guojia', {
    aggressiveness: 0.3,
    cardValueOverrides: { '无懈可击': 2, '闪电': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.5,
    peachThreshold: 0.4,
    discardProtect: ['无懈可击'],
    notes: '天妒/遗计 — profit from judgment and damage; moderate aggression for card advantage.',
  }),

  profile('zhenji', {
    aggressiveness: 0.5,
    cardValueOverrides: { '闪': -2, '无懈可击': 1 },
    targetStrategy: 'weakest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.5,
    discardProtect: [],
    notes: '倾国 — 闪 doubles as attacks; standard card values but unlimited attack potential with 闪.',
  }),

  // ===== SHU =====

  profile('liubei', {
    aggressiveness: 0.3,
    cardValueOverrides: { '桃': 2, '无中生有': 2, '五谷丰登': 2, '桃园结义': 3 },
    targetStrategy: 'weakest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.7,
    discardProtect: ['桃', '桃园结义'],
    notes: '仁德 — team support; give cards to allies; conservative play to accumulate hand for distribution.',
  }),

  profile('guanyu', {
    aggressiveness: 0.8,
    cardValueOverrides: { '杀': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.8,
    peachThreshold: 0.5,
    discardProtect: ['杀'],
    notes: '武圣 — red cards are 杀; aggressively attack to exploit limitless red-card slashes.',
  }),

  profile('zhangfei', {
    aggressiveness: 1.0,
    cardValueOverrides: { '杀': 3, '酒': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.5,
    peachThreshold: 0.3,
    discardProtect: ['杀', '酒'],
    notes: '咆哮 — unlimited attacks per turn; maximum aggression, spam every 杀 in hand.',
  }),

  profile('zhugeliang', {
    aggressiveness: 0.2,
    cardValueOverrides: { '无懈可击': 3, '闪': 2, '桃': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.8,
    discardProtect: ['无懈可击', '闪', '桃'],
    notes: '空城/观星 — conserve hand to enable 空城; keep defensive cards; very conservative play.',
  }),

  profile('zhaoyun', {
    aggressiveness: 0.6,
    cardValueOverrides: { '杀': 1, '闪': 1 },
    targetStrategy: 'weakest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.5,
    discardProtect: [],
    notes: '龙胆 — 杀/闪 interchangeable; flexible attack and defense, balanced play.',
  }),

  profile('machao', {
    aggressiveness: 0.8,
    cardValueOverrides: { '杀': 2, '过河拆桥': 2, '顺手牵羊': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.7,
    peachThreshold: 0.4,
    discardProtect: ['杀'],
    notes: '马术/铁骑 — extended range aggression; treat range as non-issue, press attacks.',
  }),

  profile('huangyueying', {
    aggressiveness: 0.5,
    cardValueOverrides: { '无中生有': 3, '过河拆桥': 2, '顺手牵羊': 2 },
    targetStrategy: 'mostCards',
    dodgeThreshold: 1.0,
    peachThreshold: 0.5,
    discardProtect: ['无中生有', '过河拆桥'],
    notes: '集智 — trick cards trigger draw; value trick cards highly for card engine.',
  }),

  // ===== WU =====

  profile('sunquan', {
    aggressiveness: 0.5,
    cardValueOverrides: {},
    targetStrategy: 'weakest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.5,
    discardProtect: [],
    notes: '制衡 — swap bad cards for new ones; balanced play with hand quality optimisation.',
  }),

  profile('zhouyu', {
    aggressiveness: 0.7,
    cardValueOverrides: { '决斗': 2, '火': 3, '南蛮入侵': 1 },
    targetStrategy: 'strongest',
    dodgeThreshold: 0.8,
    peachThreshold: 0.5,
    discardProtect: ['决斗'],
    notes: '英姿/反间 — draw advantage and disrupt strongest threat via 反间.',
  }),

  profile('lvmeng', {
    aggressiveness: 0.5,
    cardValueOverrides: { '顺手牵羊': 2, '过河拆桥': 2 },
    targetStrategy: 'mostCards',
    dodgeThreshold: 0.9,
    peachThreshold: 0.5,
    discardProtect: ['顺手牵羊', '过河拆桥'],
    notes: '克己 — skip play phase to draw more; value control cards for stripping.',
  }),

  profile('luxun', {
    aggressiveness: 0.4,
    cardValueOverrides: { '无懈可击': 2, '闪': 1 },
    targetStrategy: 'weakest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.6,
    discardProtect: ['无懈可击'],
    notes: '谦逊/连营 — cannot be targeted by certain tricks; conservative, card-advantage oriented.',
  }),

  profile('ganning', {
    aggressiveness: 0.7,
    cardValueOverrides: { '过河拆桥': 3, '顺手牵羊': 3 },
    targetStrategy: 'mostCards',
    dodgeThreshold: 0.8,
    peachThreshold: 0.5,
    discardProtect: ['过河拆桥', '顺手牵羊'],
    notes: '奇袭 — any black card becomes 过河拆桥; aggressively strip opponent resources.',
  }),

  profile('huanggai', {
    aggressiveness: 0.8,
    cardValueOverrides: { '桃': 3, '杀': 1, '酒': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.5,
    peachThreshold: 0.9,
    discardProtect: ['桃', '酒'],
    notes: '苦肉 — lose HP to draw; keep 桃 for self-healing cycle, aggressive card engine.',
  }),

  profile('daqiao', {
    aggressiveness: 0.5,
    cardValueOverrides: { '乐不思蜀': 3, '兵粮寸断': 2 },
    targetStrategy: 'strongest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.5,
    discardProtect: ['乐不思蜀'],
    notes: '国色 — diamond cards become 乐不思蜀; lock down strongest threats.',
  }),

  profile('sunshangxiang', {
    aggressiveness: 0.7,
    cardValueOverrides: { '杀': 1 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.8,
    peachThreshold: 0.5,
    discardProtect: [],
    notes: '结姻/枭姬 — equipment cycling for draw; moderately aggressive, equip-centric play.',
  }),

  // ===== QUN =====

  profile('lvbu', {
    aggressiveness: 1.0,
    cardValueOverrides: { '杀': 3, '决斗': 3, '酒': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.4,
    peachThreshold: 0.3,
    discardProtect: ['杀', '决斗', '酒'],
    notes: '无双 — force double dodges on every 杀; maximum aggression, opponent must 2x 闪.',
  }),

  profile('diaochan', {
    aggressiveness: 0.6,
    cardValueOverrides: { '决斗': 3 },
    targetStrategy: 'strongest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.5,
    discardProtect: ['决斗'],
    notes: '离间/闭月 — pit enemies against each other; target strongest to trigger 决斗.',
  }),

  profile('huatuo', {
    aggressiveness: 0.2,
    cardValueOverrides: { '桃': 3, '闪': 1 },
    targetStrategy: 'weakest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.9,
    discardProtect: ['桃'],
    notes: '青囊/急救 — primary healer; extremely conservative, preserve 桃 and red cards for healing.',
  }),

  profile('lvbu_sp', {
    aggressiveness: 0.9,
    cardValueOverrides: { '杀': 3, '决斗': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.5,
    peachThreshold: 0.3,
    discardProtect: ['杀'],
    notes: 'SP吕布 — aggressive variant; same double-dodge pressure.',
  }),

  profile('yuanshao', {
    aggressiveness: 0.7,
    cardValueOverrides: { '万箭齐发': 3, '杀': 1 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.8,
    peachThreshold: 0.5,
    discardProtect: ['万箭齐发'],
    notes: '乱击 — pair cards for AoE; value 万箭齐发 and pair-able hand size.',
  }),

  profile('yanliangwenchou', {
    aggressiveness: 0.8,
    cardValueOverrides: { '杀': 2, '决斗': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.7,
    peachThreshold: 0.4,
    discardProtect: ['杀', '决斗'],
    notes: '双雄 — draw from damage; aggressive to trigger draws.',
  }),

  profile('pangde', {
    aggressiveness: 0.9,
    cardValueOverrides: { '杀': 2 },
    targetStrategy: 'weakest',
    dodgeThreshold: 0.5,
    peachThreshold: 0.3,
    discardProtect: ['杀'],
    notes: '马术/猛进 — aggressive melee; press range advantage hard.',
  }),

  profile('jiaxu', {
    aggressiveness: 0.4,
    cardValueOverrides: { '无懈可击': 3, '闪': 1 },
    targetStrategy: 'strongest',
    dodgeThreshold: 1.0,
    peachThreshold: 0.6,
    discardProtect: ['无懈可击'],
    notes: '完杀/乱武 — strategic disruption; conservative but deploy mass damage at key moments.',
  }),
]);

// ---------------------------------------------------------------------------
// Lookup Helper
// ---------------------------------------------------------------------------

/**
 * Get the AI profile for a general, falling back to DEFAULT_PROFILE.
 */
export function getProfile(generalId: GeneralId): GeneralProfile {
  const found = GENERAL_PROFILES.get(generalId);
  if (found) return found;
  return { generalId, ...DEFAULT_PROFILE };
}
