/**
 * SHU045 关银屏 (Guan Yinping)
 *
 * 秀色 (Xiuse / Beauty): Placeholder.
 * 血祭 (Xueji / Blood Sacrifice): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU045 = 'SHU045' as GeneralId;

export const xiuse: SkillPlugin = {
  id: 'xiuse',
  name: '秀色',
  generalId: SHU045,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const xueji: SkillPlugin = {
  id: 'xueji',
  name: '血祭',
  generalId: SHU045,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu045Skills: SkillPlugin[] = [xiuse, xueji];
