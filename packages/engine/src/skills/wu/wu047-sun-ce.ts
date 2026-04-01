/**
 * WU047 孙策 — 激昂 (Jiang / Fierce Spirit)
 * Passive skill. When you use or play a red card during your turn (杀 or
 * 决斗), you may draw 1 card.
 *
 * 魂殇 (Hunshang / Soul Wound)
 * Awakening skill. When your HP reaches 1, you gain 英姿 (Yingzi) and
 * 魂姿 (Hunzi) — effectively drawing +1 during draw phase.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU047_GENERAL_ID = 'WU047' as GeneralId;

export const jiang: SkillPlugin = {
  id: 'jiang',
  name: '激昂',
  generalId: WU047_GENERAL_ID,
  type: 'passive',
  description: 'When you use a red Slash or Duel, draw 1 card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const card = ctx.event.card;
    return (
      (card.suit === 'heart' || card.suit === 'diamond') &&
      (card.name === 'Slash' || card.name === '杀' || card.name === 'Duel' || card.name === '决斗')
    );
  },
  activate(ctx) {
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};

export const hunshang: SkillPlugin = {
  id: 'hunshang',
  name: '魂殇',
  generalId: WU047_GENERAL_ID,
  type: 'awakening',
  description: 'When HP = 1, gain Yingzi and Hunzi (draw +1 during draw phase).',
  triggers: ['loseHp'],
  canActivate(ctx) {
    if (ctx.event.type !== 'loseHp') return false;
    return (
      ctx.player.hp <= 1 &&
      (ctx.player.marks['hunshang_awakened'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['hunshang_awakened'] = 1;
    // Gain passive draw bonus (simplified: immediately draw 1)
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
