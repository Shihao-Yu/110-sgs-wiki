/**
 * WEI&WU074 文鸯 (Wen Yang) — 骁勇金衔
 *
 * Dual-faction general: WEI primary, WU secondary.
 * Skills pending implementation.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_wei_074' as GeneralId;

export const DUAL_FACTION: { primary: Faction; secondary: Faction } = {
  primary: 'WEI',
  secondary: 'WU',
};

export const wenyangPlaceholder: SkillPlugin = {
  id: 'special_wei_wu_074_placeholder',
  name: '文鸯技能',
  generalId: GENERAL_ID,
  type: 'passive',
  description: '双势力武将（魏/吴）。待实现文鸯技能。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const weiWu074Skills: SkillPlugin[] = [wenyangPlaceholder];
