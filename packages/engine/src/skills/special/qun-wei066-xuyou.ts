/**
 * QUN&WEI066 许攸 (Xu You) — 逆转官渡
 *
 * Dual-faction general: QUN primary, WEI secondary.
 * Skills pending implementation.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_qun_066' as GeneralId;

export const DUAL_FACTION: { primary: Faction; secondary: Faction } = {
  primary: 'QUN',
  secondary: 'WEI',
};

export const xuyouPlaceholder: SkillPlugin = {
  id: 'special_qun_wei_066_placeholder',
  name: '许攸技能',
  generalId: GENERAL_ID,
  type: 'passive',
  description: '双势力武将（群/魏）。待实现许攸技能。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qunWei066Skills: SkillPlugin[] = [xuyouPlaceholder];
