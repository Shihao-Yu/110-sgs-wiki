/**
 * QUN&SHU072 刘琦 (Liu Qi) — 炽焰不惧
 *
 * Dual-faction general: QUN primary, SHU secondary.
 * Skills pending implementation.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_qun_072' as GeneralId;

export const DUAL_FACTION: { primary: Faction; secondary: Faction } = {
  primary: 'QUN',
  secondary: 'SHU',
};

export const liuqiPlaceholder: SkillPlugin = {
  id: 'special_qun_shu_072_placeholder',
  name: '刘琦技能',
  generalId: GENERAL_ID,
  type: 'passive',
  description: '双势力武将（群/蜀）。待实现刘琦技能。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qunShu072Skills: SkillPlugin[] = [liuqiPlaceholder];
