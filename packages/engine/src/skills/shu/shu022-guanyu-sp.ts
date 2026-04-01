/**
 * SHU022 关羽·SP (Guan Yu — SP)
 *
 * 武圣 (Wusheng) SP variant.
 * 义绝 (Yijue / Righteous Severance): During play phase, discard 1 card
 * and choose another player. They must show 1 hand card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU022 = 'SHU022' as GeneralId;

export const wusheng_sp: SkillPlugin = {
  id: 'wusheng_sp',
  name: '武圣',
  generalId: SHU022,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const yijue: SkillPlugin = {
  id: 'yijue',
  name: '义绝',
  generalId: SHU022,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu022Skills: SkillPlugin[] = [wusheng_sp, yijue];
