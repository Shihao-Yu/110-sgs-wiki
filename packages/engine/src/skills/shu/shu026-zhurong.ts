/**
 * SHU026 祝融 (Zhu Rong)
 *
 * 巨象 (Juxiang / Giant Elephant): Lock skill. 南蛮入侵 has no effect on you,
 * and when it resolves you obtain the card.
 *
 * 烈刃 (Lieren / Fierce Blade): After dealing damage with 杀, you may duel
 * the target for a card exchange.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU026 = 'SHU026' as GeneralId;

export const juxiang: SkillPlugin = {
  id: 'juxiang',
  name: '巨象',
  generalId: SHU026,
  type: 'lock',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const lieren: SkillPlugin = {
  id: 'lieren',
  name: '烈刃',
  generalId: SHU026,
  type: 'passive',
  description: '待补充',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu026Skills: SkillPlugin[] = [juxiang, lieren];
