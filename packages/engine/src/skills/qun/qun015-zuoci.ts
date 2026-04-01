/**
 * QUN015 左慈 (Zuo Ci) — 迷之仙人
 *
 * 化身 (Incarnation / Huashen): At game start pick 2 generals; at each
 * phase start may switch to one of them for their skills.
 * 新生 (Rebirth / Xinsheng): When taking damage, draw a new general card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN015 = 'QUN015' as GeneralId;

export const huashen: SkillPlugin = {
  id: 'qun_huashen',
  name: '化身',
  generalId: QUN015,
  type: 'active',
  description: '游戏开始前，你获得两张武将牌作为化身牌。准备阶段开始时，你可以变更化身。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Complex multi-general mechanic — awaiting infrastructure */ },
};

export const xinsheng: SkillPlugin = {
  id: 'qun_xinsheng',
  name: '新生',
  generalId: QUN015,
  type: 'passive',
  description: '当你受到1点伤害后，你可以获得一张新的化身牌。',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Depends on huashen infrastructure */ },
};

export const qun015Skills: SkillPlugin[] = [huashen, xinsheng];
