/**
 * QUN014 贾诩(SP) (Jia Xu SP) — placeholder
 *
 * 乱武 (Chaos / Luanwu): Each other player must slash their nearest neighbor or lose 1 HP.
 * 帷幕 (Curtain / Weimu): Immune to black trick cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN014 = 'QUN014' as GeneralId;

export const luanwu: SkillPlugin = {
  id: 'qun_luanwu',
  name: '乱武',
  generalId: QUN014,
  type: 'active',
  description: '限定技，出牌阶段，每名其他角色须对距离最近的角色使用一张【杀】，否则失去1点体力。',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;
    return ctx.event.player === ctx.player.id && (ctx.player.marks['luanwu_used'] ?? 0) === 0;
  },
  activate(ctx) {
    ctx.player.marks['luanwu_used'] = 1;
    // Simplified: each other player loses 1 HP
    for (const p of ctx.game.players) {
      if (p.alive && p.id !== ctx.player.id) {
        p.hp -= 1;
      }
    }
  },
};

export const qun014Skills: SkillPlugin[] = [luanwu];
