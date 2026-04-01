/**
 * QUN013 马腾 (Ma Teng) — 西凉雄狮
 *
 * 马术 (Horsemanship / Mashu): -1 attack distance.
 * 义从 (Righteous Cavalry / Yicong): Lord skill — QUN heroes may use extra 杀 for you.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN013 = 'QUN013' as GeneralId;

export const mashuMateng: SkillPlugin = {
  id: 'qun_mashu_mateng',
  name: '马术',
  generalId: QUN013,
  type: 'passive',
  description: '锁定技，你计算与其他角色的距离时始终-1。',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'prepare') return false;
    return ctx.event.player === ctx.player.id;
  },
  activate(ctx) {
    const existing = ctx.game.activeEffects.find(
      e => e.name === 'mashu_mateng' && e.sourcePlayerId === ctx.player.id,
    );
    if (existing) return;
    ctx.game.activeEffects.push({
      id: `mashu_mateng_${ctx.player.id}`,
      name: 'mashu_mateng',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'permanent',
      properties: { distanceReduction: 1 },
    });
  },
};

export const qun013Skills: SkillPlugin[] = [mashuMateng];
