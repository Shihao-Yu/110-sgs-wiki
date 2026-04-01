/**
 * SHU030 糜夫人 (Mi Furen / Lady Mi)
 *
 * 存嗣 (Cunsi / Preserve Heir): Limited skill. During play phase, choose
 * a male character — they acquire 勇决.
 *
 * 闭月 (Guixiu / Returning Grace): When your main general is flipped
 * face-down, draw 2 cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU030 = 'SHU030' as GeneralId;

export const cunsi: SkillPlugin = {
  id: 'cunsi',
  name: '存嗣',
  generalId: SHU030,
  type: 'limited',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const guixiu: SkillPlugin = {
  id: 'guixiu',
  name: '闺秀',
  generalId: SHU030,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu030Skills: SkillPlugin[] = [cunsi, guixiu];
