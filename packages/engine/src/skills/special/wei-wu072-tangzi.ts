/**
 * WEI&WU072 唐咨 (Tang Zi) — 绘船制图
 *
 * Dual-faction general: WEI primary, WU secondary.
 * Skills pending implementation.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_wei_072' as GeneralId;

export const DUAL_FACTION: { primary: Faction; secondary: Faction } = {
  primary: 'WEI',
  secondary: 'WU',
};

export const tangziPlaceholder: SkillPlugin = {
  id: 'special_wei_wu_072_placeholder',
  name: '唐咨技能',
  generalId: GENERAL_ID,
  type: 'passive',
  description: '双势力武将（魏/吴）。待实现唐咨技能。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const weiWu072Skills: SkillPlugin[] = [tangziPlaceholder];
