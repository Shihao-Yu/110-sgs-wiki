/**
 * WEI008 典韦 (Dian Wei) — 古之恶来
 *
 * 强袭 (Assault / Qiangxi): During your play phase (once per turn), you may
 * either discard a weapon card or lose 1 HP to deal 1 damage to a character
 * within your attack range.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const qiangxi: SkillPlugin = {
  id: 'skill_qiangxi',
  name: '强袭',
  generalId: 'general_dianwei' as GeneralId,
  type: 'active',
  description:
    '出牌阶段限一次，你可以失去1点体力或弃置一张武器牌，对你攻击范围内的一名角色造成1点伤害。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    // Once per turn: check if already used this turn
    if (ctx.player.marks['qiangxi_used'] === 1) return false;
    // Must have HP > 1 or a weapon to discard
    const hasWeapon = ctx.player.equipment.weapon != null;
    const canLoseHp = ctx.player.hp > 1;
    if (!hasWeapon && !canLoseHp) return false;
    // Must have a valid target
    return ctx.game.players.some(
      p => p.id !== ctx.player.id && p.alive,
    );
  },

  activate(ctx) {
    ctx.player.marks['qiangxi_used'] = 1;

    // Prefer discarding weapon over losing HP
    const weapon = ctx.player.equipment.weapon;
    if (weapon) {
      ctx.player.equipment.weapon = null;
      ctx.game.discardPile.push(weapon);
    } else {
      // Lose 1 HP
      ctx.player.hp -= 1;
    }

    // Deal 1 damage to first available target (AI/UI would select)
    const target = ctx.game.players.find(
      p => p.id !== ctx.player.id && p.alive,
    );
    if (target) {
      ctx.dealDamage(ctx.player, target, 1);
    }
  },
};

export const wei008Skills: SkillPlugin[] = [qiangxi];
