/**
 * SHU034 张翼 (Zhang Yi)
 *
 * 直言 (Zhiyan / Straightforward): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const zhiyan: SkillPlugin = {
  id: 'zhiyan',
  name: '直言',
  generalId: 'SHU034' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu034Skills: SkillPlugin[] = [zhiyan];
