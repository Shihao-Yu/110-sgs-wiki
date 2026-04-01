/**
 * QUN&WU051 士燮 (Shi Xie) — 雄长一州
 *
 * Dual-faction general: QUN primary, WU secondary.
 * Skills pending implementation.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_qun_051' as GeneralId;

export const DUAL_FACTION: { primary: Faction; secondary: Faction } = {
  primary: 'QUN',
  secondary: 'WU',
};

export const shixiePlaceholder: SkillPlugin = {
  id: 'special_qun_wu_051_placeholder',
  name: '士燮技能',
  generalId: GENERAL_ID,
  type: 'passive',
  description: '双势力武将（群/吴）。待实现士燮技能。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qunWu051Skills: SkillPlugin[] = [shixiePlaceholder];
