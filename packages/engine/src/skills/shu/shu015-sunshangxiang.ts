/**
 * SHU015 孙尚香 (Sun Shangxiang)
 *
 * 结姻 (Jieyin / Marriage): Active skill during play phase.
 * 枭姬 (Xiaoji / Valiant): When you lose an equipment card, draw 2 cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU015 = 'SHU015' as GeneralId;

export const jieyin_shu: SkillPlugin = {
  id: 'jieyin_shu',
  name: '结姻',
  generalId: SHU015,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const xiaoji_shu: SkillPlugin = {
  id: 'xiaoji_shu',
  name: '枭姬',
  generalId: SHU015,
  type: 'passive',
  description: '待补充',
  triggers: ['discardCards'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu015Skills: SkillPlugin[] = [jieyin_shu, xiaoji_shu];
