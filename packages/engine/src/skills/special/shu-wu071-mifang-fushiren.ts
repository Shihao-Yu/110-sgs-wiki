/**
 * SHU&WU071 糜芳&傅士仁 (Mi Fang & Fu Shi Ren) — 进退维谷
 *
 * Dual-faction general: SHU primary, WU secondary.
 * Paired general (two characters on one card).
 * Skills pending implementation.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_shu_071' as GeneralId;

export const DUAL_FACTION: { primary: Faction; secondary: Faction } = {
  primary: 'SHU',
  secondary: 'WU',
};

export const mifangFushirenPlaceholder: SkillPlugin = {
  id: 'special_shu_wu_071_placeholder',
  name: '糜芳傅士仁技能',
  generalId: GENERAL_ID,
  type: 'passive',
  description: '双势力武将（蜀/吴）。待实现糜芳&傅士仁技能。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const shuWu071Skills: SkillPlugin[] = [mifangFushirenPlaceholder];
