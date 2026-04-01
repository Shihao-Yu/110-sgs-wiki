/**
 * Emperor generals — lord-only skills for the 4 faction emperors.
 *
 * In Sanguosha's standard (role) mode, the lord player picks from
 * emperor generals who possess a special "lord skill" (主公技).
 * Lord skills allow the lord to request assistance from same-faction
 * players at the table.
 *
 * Emperor generals and their lord skills:
 *
 *   EM001 刘备 (Liu Bei)  — 激将 (Rally / Jijiang)
 *     Other SHU players may play 杀 (Strike) on your behalf when you
 *     need to play or use a 杀.
 *
 *   EM002 张角 (Zhang Jiao) — 黄天 (Yellow Sky / Huangtian)
 *     Other QUN players may give you 闪 (Dodge) or 闪电 (Lightning)
 *     cards during their play phase to assist with judgment manipulation.
 *
 *   EM003 孙权 (Sun Quan) — 救援 (Rescue / Jiuyuan)
 *     When you are dying, other WU players may play 桃 (Peach) to
 *     save you. The peach recovers 1 additional HP (total 2 HP recovery).
 *
 *   EM004 曹操 (Cao Cao) — 护驾 (Royal Guard / Hujia)
 *     When you need to play a 闪 (Dodge), other WEI players may play
 *     a 闪 on your behalf.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillContext, SkillPlugin } from '../types.js';
import type { PlayerState } from '../../state/player.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const EM001_ID = 'general_em_001' as GeneralId; // 刘备
const EM002_ID = 'general_em_002' as GeneralId; // 张角
const EM003_ID = 'general_em_003' as GeneralId; // 孙权
const EM004_ID = 'general_em_004' as GeneralId; // 曹操

/** Map of emperor general IDs to their faction. */
export const EMPEROR_FACTIONS: Record<string, Faction> = {
  [EM001_ID]: 'SHU',
  [EM002_ID]: 'QUN',
  [EM003_ID]: 'WU',
  [EM004_ID]: 'WEI',
};

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Find all alive players of a given faction other than the lord.
 * Used by lord skills to identify eligible responders.
 */
function findFactionAllies(
  ctx: SkillContext,
  faction: Faction,
): PlayerState[] {
  return ctx.game.players.filter(
    (p) => p.alive && p.id !== ctx.player.id && p.faction === faction,
  );
}

/**
 * Check whether the current player is acting as the lord
 * (seat 0 by convention in standard role mode).
 */
function isLord(player: PlayerState): boolean {
  return player.seat === 0;
}

/* ------------------------------------------------------------------ */
/*  EM001 刘备 — 激将 (Rally / Jijiang)                                */
/* ------------------------------------------------------------------ */

/**
 * 激将 (Rally / Jijiang)
 *
 * Lord skill (主公技). When Liu Bei needs to play or use a 杀 (Strike),
 * he may ask other SHU-faction players to play a 杀 on his behalf.
 * Each SHU player, in seat order, may choose to respond with a 杀.
 * If any SHU player plays a 杀, it is treated as if Liu Bei played it.
 *
 * Trigger: When the lord needs to play a 杀 (during play phase or
 * when a skill/card effect demands a 杀 response).
 */
export const jijiang: SkillPlugin = {
  id: 'emperor_jijiang',
  name: '激将',
  generalId: EM001_ID,
  type: 'active',
  description:
    '主公技，当你需要使用或打出【杀】时，你可以令其他蜀势力角色依次选择是否打出一张【杀】。',
  triggers: ['playCard', 'response'],

  canActivate(ctx) {
    if (!isLord(ctx.player)) return false;
    if (!ctx.player.alive) return false;

    // Must have at least one alive SHU ally
    const allies = findFactionAllies(ctx, 'SHU');
    if (allies.length === 0) return false;

    // Trigger on play phase (can use 杀 via allies) or response window
    if (ctx.event.type === 'phaseChange') {
      return ctx.event.phase === 'play';
    }
    if (ctx.event.type === 'response') {
      // Response window where a 杀 is needed
      return !ctx.event.accepted;
    }

    return false;
  },

  activate(ctx) {
    const allies = findFactionAllies(ctx, 'SHU');
    // Ask each SHU ally in order if they will play a 杀
    for (const ally of allies) {
      // Check if ally has any cards (simplified — full impl would check for 杀 specifically)
      if (ally.handCards.length > 0) {
        // Consume the first card from the responding ally as the 杀
        const card = ally.handCards.shift();
        if (card) {
          ctx.game.discardPile.push(card);
          // Mark the response as accepted — Liu Bei "played" a 杀 via ally
          return;
        }
      }
    }
  },
};

/* ------------------------------------------------------------------ */
/*  EM002 张角 — 黄天 (Yellow Sky / Huangtian)                         */
/* ------------------------------------------------------------------ */

/**
 * 黄天 (Yellow Sky / Huangtian)
 *
 * Lord skill (主公技). During any QUN player's play phase, that player
 * may give Zhang Jiao one 闪 (Dodge) or 闪电 (Lightning) card per turn.
 * This helps Zhang Jiao fuel his 鬼道 (Guidao) judgment-replacement skill
 * and 雷击 (Leiji) lightning-strike skill.
 *
 * Trigger: When a QUN ally enters their play phase.
 */
export const huangtian: SkillPlugin = {
  id: 'emperor_huangtian',
  name: '黄天',
  generalId: EM002_ID,
  type: 'active',
  description:
    '主公技，其他群雄角色的出牌阶段限一次，其可以交给你一张【闪】或【闪电】。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (!isLord(ctx.player)) return false;
    if (!ctx.player.alive) return false;
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;

    // Must have at least one alive QUN ally with hand cards
    const allies = findFactionAllies(ctx, 'QUN');
    return allies.some((a) => a.handCards.length > 0);
  },

  activate(ctx) {
    const allies = findFactionAllies(ctx, 'QUN');
    // Each QUN ally may give one card (simplified — full impl would filter for 闪/闪电)
    for (const ally of allies) {
      if (ally.handCards.length > 0) {
        const card = ally.handCards.shift();
        if (card) {
          ctx.player.handCards.push(card);
          // Limit one card per ally per turn — break after first successful give
          break;
        }
      }
    }
  },
};

/* ------------------------------------------------------------------ */
/*  EM003 孙权 — 救援 (Rescue / Jiuyuan)                               */
/* ------------------------------------------------------------------ */

/**
 * 救援 (Rescue / Jiuyuan)
 *
 * Lord skill (主公技). When Sun Quan is dying (HP <= 0), other WU-faction
 * players may play 桃 (Peach) to save him. When a WU player's peach
 * saves Sun Quan through this skill, it recovers 1 additional HP
 * (so the peach effectively heals 2 HP instead of 1).
 *
 * Trigger: When the lord enters a dying state (damage event reducing
 * HP to 0 or below).
 */
export const jiuyuan: SkillPlugin = {
  id: 'emperor_jiuyuan',
  name: '救援',
  generalId: EM003_ID,
  type: 'passive',
  description:
    '主公技·锁定技，当你处于濒死状态时，其他吴势力角色对你使用【桃】的回复值+1。',
  triggers: ['recover'],

  canActivate(ctx) {
    if (!isLord(ctx.player)) return false;
    if (ctx.event.type !== 'recover') return false;
    if (ctx.event.target !== ctx.player.id) return false;

    // Only activates when the lord is dying (HP <= 0)
    if (ctx.player.hp > 0) return false;

    // Must have at least one alive WU ally
    const allies = findFactionAllies(ctx, 'WU');
    return allies.length > 0;
  },

  activate(ctx) {
    if (ctx.event.type !== 'recover') return;

    // Bonus: +1 recovery from WU ally's peach
    ctx.player.hp += 1;
  },
};

/* ------------------------------------------------------------------ */
/*  EM004 曹操 — 护驾 (Royal Guard / Hujia)                            */
/* ------------------------------------------------------------------ */

/**
 * 护驾 (Royal Guard / Hujia)
 *
 * Lord skill (主公技). When Cao Cao needs to play a 闪 (Dodge) — e.g.
 * when targeted by a 杀 (Strike) — he may ask other WEI-faction players
 * to play a 闪 on his behalf. Each WEI player, in seat order, may choose
 * to respond. If any WEI player plays a 闪, it counts as Cao Cao's dodge.
 *
 * Trigger: When the lord needs a 闪 in response to an attack.
 */
export const hujia: SkillPlugin = {
  id: 'emperor_hujia',
  name: '护驾',
  generalId: EM004_ID,
  type: 'active',
  description:
    '主公技，当你需要使用或打出【闪】时，你可以令其他魏势力角色依次选择是否打出一张【闪】。',
  triggers: ['response'],

  canActivate(ctx) {
    if (!isLord(ctx.player)) return false;
    if (!ctx.player.alive) return false;

    // Trigger on a response event where a 闪 is needed
    if (ctx.event.type !== 'response') return false;
    if (ctx.event.accepted) return false;

    // Must have at least one alive WEI ally with cards
    const allies = findFactionAllies(ctx, 'WEI');
    return allies.some((a) => a.handCards.length > 0);
  },

  activate(ctx) {
    const allies = findFactionAllies(ctx, 'WEI');
    // Ask each WEI ally in seat order if they will play a 闪
    for (const ally of allies) {
      if (ally.handCards.length > 0) {
        const card = ally.handCards.shift();
        if (card) {
          ctx.game.discardPile.push(card);
          // The dodge is successfully provided by the WEI ally
          return;
        }
      }
    }
  },
};

/* ------------------------------------------------------------------ */
/*  Exports                                                           */
/* ------------------------------------------------------------------ */

/** All emperor general lord-skill plugins. */
export const emperorSkills: SkillPlugin[] = [
  jijiang,
  huangtian,
  jiuyuan,
  hujia,
];
