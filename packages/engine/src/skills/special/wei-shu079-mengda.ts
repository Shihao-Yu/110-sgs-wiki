/**
 * WEI&SHU079 孟达 (Meng Da) — 据国向己
 *
 * Dual-faction general: WEI primary, SHU secondary.
 * Skills pending implementation.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_wei_079' as GeneralId;

export const DUAL_FACTION: { primary: Faction; secondary: Faction } = {
  primary: 'WEI',
  secondary: 'SHU',
};

export const mengdaPlaceholder: SkillPlugin = {
  id: 'special_wei_shu_079_placeholder',
  name: '孟达技能',
  generalId: GENERAL_ID,
  type: 'passive',
  description: '双势力武将（魏/蜀）。待实现孟达技能。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const weiShu079Skills: SkillPlugin[] = [mengdaPlaceholder];
