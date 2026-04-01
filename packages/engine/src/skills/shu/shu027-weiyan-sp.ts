/**
 * SHU027 魏延·SP (Wei Yan — SP)
 *
 * 狂骨 (Kuanggu) SP variant.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const kuanggu_sp: SkillPlugin = {
  id: 'kuanggu_sp',
  name: '狂骨',
  generalId: 'SHU027' as GeneralId,
  type: 'lock',
  description: '待补充',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu027Skills: SkillPlugin[] = [kuanggu_sp];
