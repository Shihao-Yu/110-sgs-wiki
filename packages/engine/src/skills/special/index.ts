/**
 * Special generals skill registry — dual-faction and unique-mechanic generals.
 *
 * Dual-faction generals belong to two factions simultaneously in Kingdom War
 * mode. Their primary faction is the one listed first in the card ID encoding
 * (e.g. QUN&SHU → primary QUN, secondary SHU).
 *
 * QUN000 十常侍 is a special multi-character general with unique seat mechanics.
 *
 * Registers all special skills with the central SkillRegistry.
 */

import type { SkillRegistry } from '../skill-registry.js';
import type { SkillPlugin } from '../types.js';

// Dual-faction generals
import { qunShu072Skills } from './qun-shu072-liuqi.js';
import { qunWei066Skills } from './qun-wei066-xuyou.js';
import { qunWu051Skills } from './qun-wu051-shixie.js';
import { shuWu071Skills } from './shu-wu071-mifang-fushiren.js';
import { weiShu079Skills } from './wei-shu079-mengda.js';
import { weiWu072Skills } from './wei-wu072-tangzi.js';
import { weiWu074Skills } from './wei-wu074-wenyang.js';

// Special mechanics
import { qun000Skills } from './qun000-shichangshi.js';

// Re-export individual skill arrays for direct access
export { qunShu072Skills } from './qun-shu072-liuqi.js';
export { qunWei066Skills } from './qun-wei066-xuyou.js';
export { qunWu051Skills } from './qun-wu051-shixie.js';
export { shuWu071Skills } from './shu-wu071-mifang-fushiren.js';
export { weiShu079Skills } from './wei-shu079-mengda.js';
export { weiWu072Skills } from './wei-wu072-tangzi.js';
export { weiWu074Skills } from './wei-wu074-wenyang.js';
export { qun000Skills } from './qun000-shichangshi.js';

// Re-export faction metadata
export { DUAL_FACTION as LIUQI_FACTIONS } from './qun-shu072-liuqi.js';
export { DUAL_FACTION as XUYOU_FACTIONS } from './qun-wei066-xuyou.js';
export { DUAL_FACTION as SHIXIE_FACTIONS } from './qun-wu051-shixie.js';
export { DUAL_FACTION as MIFANG_FUSHIREN_FACTIONS } from './shu-wu071-mifang-fushiren.js';
export { DUAL_FACTION as MENGDA_FACTIONS } from './wei-shu079-mengda.js';
export { DUAL_FACTION as TANGZI_FACTIONS } from './wei-wu072-tangzi.js';
export { DUAL_FACTION as WENYANG_FACTIONS } from './wei-wu074-wenyang.js';
export { IS_MULTI_CHARACTER as SHICHANGSHI_MULTI_CHARACTER } from './qun000-shichangshi.js';

/** All special general skill plugins (dual-faction + unique mechanic). */
export const specialSkills: readonly SkillPlugin[] = [
  // Dual-faction generals
  // QUN&SHU072 刘琦
  ...qunShu072Skills,
  // QUN&WEI066 许攸
  ...qunWei066Skills,
  // QUN&WU051 士燮
  ...qunWu051Skills,
  // SHU&WU071 糜芳&傅士仁
  ...shuWu071Skills,
  // WEI&SHU079 孟达
  ...weiShu079Skills,
  // WEI&WU072 唐咨
  ...weiWu072Skills,
  // WEI&WU074 文鸯
  ...weiWu074Skills,
  // Special mechanics
  // QUN000 十常侍
  ...qun000Skills,
];

/** Register all special general skills into a SkillRegistry instance. */
export function registerSpecialSkills(registry: SkillRegistry): void {
  for (const skill of specialSkills) {
    registry.register(skill);
  }
}
