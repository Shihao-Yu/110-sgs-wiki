/**
 * SHU025 孟获 (Meng Huo)
 *
 * 祸首 (Huoshou / Chief Culprit): Lock skill. 南蛮入侵 has no effect on you.
 * 再起 (Zaiqi / Rise Again): During draw phase, you may forgo drawing to
 * instead flip cards equal to your lost HP; recover 1 HP for each heart revealed.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU025 = 'SHU025' as GeneralId;

export const huoshou: SkillPlugin = {
  id: 'huoshou',
  name: '祸首',
  generalId: SHU025,
  type: 'lock',
  description: '南蛮入侵 has no effect on you.',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const zaiqi: SkillPlugin = {
  id: 'zaiqi',
  name: '再起',
  generalId: SHU025,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu025Skills: SkillPlugin[] = [huoshou, zaiqi];
