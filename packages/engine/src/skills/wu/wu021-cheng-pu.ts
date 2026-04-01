/**
 * WU021 程普 — 疠火 (Lihuo / Plague Fire)
 * Lock skill. When your 杀 (fire attribute) kills a target, you lose 1 HP.
 * Your 杀 can be used as fire 杀.
 *
 * 醇醪 (Chunlao / Mellow Wine)
 * Active skill. When you have no hand cards, place a card from draw pile
 * face-down as "wine". When someone would die, flip a wine to save them.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU021_GENERAL_ID = 'WU021' as GeneralId;

export const lihuo: SkillPlugin = {
  id: 'lihuo',
  name: '疠火',
  generalId: WU021_GENERAL_ID,
  type: 'lock',
  description: 'Your 杀 can be fire 杀. When your fire 杀 kills, lose 1 HP.',
  triggers: ['death'],
  canActivate(ctx) {
    if (ctx.event.type !== 'death') return false;
    return ctx.event.killer === ctx.player.id;
  },
  activate(ctx) {
    ctx.player.hp -= 1;
    if (ctx.player.hp <= 0) {
      ctx.player.alive = false;
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};

export const chunlao: SkillPlugin = {
  id: 'chunlao',
  name: '醇醪',
  generalId: WU021_GENERAL_ID,
  type: 'active',
  description: 'Store wine cards. When someone would die, consume one to save them.',
  triggers: ['useSkill'],
  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return ctx.player.handCards.length === 0;
  },
  activate(ctx) {
    ctx.player.marks['chunlao_wine'] = (ctx.player.marks['chunlao_wine'] ?? 0) + 1;
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length === 0; },
    selectTargets() { return []; },
  },
};
