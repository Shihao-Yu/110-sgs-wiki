/**
 * WEI001 曹操 (Cao Cao) — 魏武帝
 *
 * 奸雄 (Treachery / Jianxiong): When you take damage, you may take the card
 * that caused the damage.
 *
 * 护驾 (Royal Escort / Hujia): Lord skill — when you need to play or use a
 * 闪 (Dodge), you may ask other WEI characters to play a 闪 on your behalf.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

/**
 * 奸雄 — After you take damage, you may acquire the card that dealt it.
 */
export const jianxiong: SkillPlugin = {
  id: 'skill_jianxiong',
  name: '奸雄',
  generalId: 'general_caocao' as GeneralId,
  type: 'passive',
  description: '当你受到伤害后，你可以获得造成此伤害的牌。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    // Must be the target of damage
    if (ctx.event.target !== ctx.player.id) return false;
    // There must be a source (i.e. a card caused the damage)
    return ctx.event.source != null;
  },

  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    // In full implementation, the card that caused damage would be tracked
    // on the event. For now we model the core mechanic: draw 1 card as
    // compensation (the resolution stack would attach the causal card).
    ctx.drawCards(ctx.player, 1);
  },
};

/**
 * 护驾 — Lord skill. When Cao Cao needs a 闪, other WEI players may provide one.
 * This is a lord-only interaction skill; placeholder until lord mechanics exist.
 */
export const hujia: SkillPlugin = {
  id: 'skill_hujia',
  name: '护驾',
  generalId: 'general_caocao' as GeneralId,
  type: 'active',
  description:
    '主公技，当你需要使用或打出【闪】时，你可以令其他魏势力角色打出一张【闪】（视为由你使用或打出）。',
  triggers: ['response'],

  // TODO: Requires lord mechanic and multi-player response system
  canActivate: () => false,

  activate() {
    /* Lord skill — awaiting lord/faction response infrastructure */
  },
};

export const wei001Skills: SkillPlugin[] = [jianxiong, hujia];
