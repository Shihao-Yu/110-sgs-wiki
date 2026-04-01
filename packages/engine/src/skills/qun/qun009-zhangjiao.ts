/**
 * QUN009 张角 (Zhang Jiao) — 天公将军
 *
 * 雷击 (Lightning Strike / Leiji): After using/playing a 闪, deal 2 thunder damage
 * to a target based on judgment.
 * 鬼道 (Ghost Way / Guidao): Change any judgment result by playing a black hand card.
 * 黄天 (Yellow Sky / Huangtian): Lord skill — QUN players may give you a 闪 or 闪电.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN009 = 'QUN009' as GeneralId;

export const leiji: SkillPlugin = {
  id: 'qun_leiji',
  name: '雷击',
  generalId: QUN009,
  type: 'passive',
  description: '当你使用或打出一张【闪】后，可令一名角色进行判定，若为黑桃，你对其造成2点雷电伤害。',
  triggers: ['response'],
  canActivate: () => false,
  activate() { /* Awaiting judgment sub-event system */ },
};

export const guidao: SkillPlugin = {
  id: 'qun_guidao',
  name: '鬼道',
  generalId: QUN009,
  type: 'passive',
  description: '在一名角色的判定牌生效前，你可以用一张黑色牌替换之。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting judgment sub-event system */ },
};

export const huangtian: SkillPlugin = {
  id: 'qun_huangtian',
  name: '黄天',
  generalId: QUN009,
  type: 'active',
  description: '主公技，群雄角色可在出牌阶段交给你一张【闪】或【闪电】。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting lord mechanic infrastructure */ },
};

export const qun009Skills: SkillPlugin[] = [leiji, guidao, huangtian];
