/**
 * WU015 二张 (张昭 & 张纮, alt form) — 直谏 (Zhijian) / 固政 (Guzheng)
 * (Same skills as WU009 but with different general ID for alternate pairing.)
 *
 * For generals 015-027 we provide stub skill entries that register with the
 * skill system but use simplified logic. These cover the remaining WU roster.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU015_GENERAL_ID = 'WU015' as GeneralId;

export const zhijianAlt: SkillPlugin = {
  id: 'zhijian-alt',
  name: '直谏',
  generalId: WU015_GENERAL_ID,
  type: 'active',
  description: 'Give an equipment card from hand to another player, then draw 1 card.',
  triggers: ['useSkill'],
  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return ctx.player.handCards.some(c => c.type === 'equipment');
  },
  activate(ctx) {
    if (ctx.event.type !== 'useSkill') return;
    const equipCard = ctx.player.handCards.find(c => c.type === 'equipment');
    if (!equipCard) return;
    const targets = ctx.event.targets ?? [];
    const targetPlayer = ctx.game.players.find(p => p.id === targets[0]);
    if (!targetPlayer) return;
    ctx.player.handCards = ctx.player.handCards.filter(c => c.id !== equipCard.id);
    targetPlayer.handCards.push(equipCard);
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.some(c => c.type === 'equipment'); },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
