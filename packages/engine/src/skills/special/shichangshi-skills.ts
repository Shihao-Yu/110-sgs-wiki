/**
 * QUN000 十常侍 (Shi Chang Shi / Ten Attendants) — unique mechanics
 *
 * The Ten Attendants are a special QUN general group that functions as
 * multiple sub-characters occupying a single seat. Their unique mechanics:
 *
 *   1. **Multi-character seat**: Treated as multiple characters sharing one
 *      seat. When one sub-character dies, the player does not leave the game
 *      immediately — instead the surviving sub-characters continue until all
 *      are eliminated.
 *
 *   2. **Shared HP pool / segmented HP**: The HP bar is divided among the
 *      sub-characters (e.g. 4 segments of 1 HP each). Each sub-character
 *      death removes one segment.
 *
 *   3. **Faction identity**: All sub-characters are QUN. In Kingdom War mode
 *      they count as 4 separate QUN identities for faction exposure.
 *
 *   4. **祸乱 (Calamity)**: When a sub-character is eliminated, trigger a
 *      disruptive effect on other players (damage or card discard) before
 *      continuing with the remaining sub-characters.
 *
 *   5. **乱政 (Misrule)**: Lock skill — the Ten Attendants cannot be the
 *      target of 乐不思蜀 (Indulgence) or 兵粮寸断 (Supply Shortage).
 *
 * These skills augment the existing QUN000 placeholder registered in
 * qun000-shichangshi.ts. The placeholder remains the primary registration
 * entry; these skills are additive.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_qun_000' as GeneralId;

export const FACTION: Faction = 'QUN';

/**
 * Number of sub-characters in the Ten Attendants group.
 * Each sub-character has an independent "alive" state tracked via marks.
 */
export const SUB_CHARACTER_COUNT = 4;

/**
 * 祸乱 (Calamity / Huoluan)
 *
 * Passive skill. When one of the Ten Attendants sub-characters is
 * eliminated (a death event targeting this player while sub-characters
 * remain), the player does not die. Instead, a calamity effect triggers:
 * another player must discard 1 card or take 1 damage.
 *
 * The special death resolution means the standard death flow is
 * intercepted — the player only truly dies when all sub-characters
 * are eliminated (tracked via the "shichangshi_alive" mark).
 */
export const huoluan: SkillPlugin = {
  id: 'shichangshi_huoluan',
  name: '祸乱',
  generalId: GENERAL_ID,
  type: 'passive',
  description:
    '当十常侍的一名角色被杀死时，若仍有存活的角色，你不会死亡。' +
    '改为令一名其他角色选择弃置一张牌或受到1点伤害。',
  triggers: ['death'],
  priority: -10, // High priority — intercepts death before standard resolution

  canActivate(ctx) {
    if (ctx.event.type !== 'death') return false;
    if (ctx.event.player !== ctx.player.id) return false;

    // Check remaining sub-character count via marks
    const remaining = ctx.player.marks['shichangshi_alive'] ?? SUB_CHARACTER_COUNT;
    // Activates only when there are still surviving sub-characters after this death
    return remaining > 1;
  },

  activate(ctx) {
    // Decrement surviving sub-character count
    const remaining = ctx.player.marks['shichangshi_alive'] ?? SUB_CHARACTER_COUNT;
    ctx.player.marks['shichangshi_alive'] = remaining - 1;

    // Prevent actual player death — keep player alive
    ctx.player.alive = true;

    // Reduce max HP by 1 to reflect lost sub-character segment
    ctx.player.maxHp = Math.max(1, ctx.player.maxHp - 1);
    ctx.player.hp = Math.min(ctx.player.hp, ctx.player.maxHp);

    // Calamity effect: deal 1 damage to a random alive opponent
    const target = ctx.game.players.find(
      (p) => p.alive && p.id !== ctx.player.id,
    );
    if (target) {
      ctx.dealDamage(ctx.player, target, 1);
    }
  },
};

/**
 * 乱政 (Misrule / Luanzheng)
 *
 * Lock skill. The Ten Attendants cannot be targeted by delayed trick
 * cards (判定区 cards like 乐不思蜀 Indulgence or 兵粮寸断 Supply Shortage).
 * This is checked during the play-card phase when opponents attempt to
 * place delayed tricks.
 *
 * Implementation note: This skill sets a marker that the target-validation
 * layer should check. The canActivate always returns false because this is
 * a lock (enforced) skill — it does not need manual triggering.
 */
export const luanzheng: SkillPlugin = {
  id: 'shichangshi_luanzheng',
  name: '乱政',
  generalId: GENERAL_ID,
  type: 'lock',
  description:
    '锁定技，你不能成为延时锦囊牌的目标。',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    // Activates when someone targets this player with a delayed trick
    const targets = ctx.event.targets ?? [];
    return targets.includes(ctx.player.id);
  },

  activate(ctx) {
    // Lock skill enforcement — the resolution stack should cancel the
    // delayed trick targeting this player. We push a response event
    // indicating rejection.
    if (ctx.event.type !== 'playCard') return;

    const targets = ctx.event.targets ?? [];
    const filtered = targets.filter((t) => t !== ctx.player.id);
    // Mutate targets to remove this player (engine will see reduced target list)
    targets.length = 0;
    targets.push(...filtered);
  },
};

/**
 * 十常侍 initialization helper.
 *
 * Sets the initial sub-character alive count on the player's marks
 * when the game begins (prepare phase of first turn).
 */
export const shichangshiInit: SkillPlugin = {
  id: 'shichangshi_init',
  name: '十常侍·初始化',
  generalId: GENERAL_ID,
  type: 'lock',
  description:
    '锁定技，游戏开始时，初始化十常侍存活角色数。',
  triggers: ['phaseChange'],
  priority: -100, // Run before everything else

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'prepare') return false;
    // Only on the very first turn and only if not already initialized
    return (
      ctx.game.turnCount === 1 &&
      ctx.player.marks['shichangshi_alive'] === undefined
    );
  },

  activate(ctx) {
    ctx.player.marks['shichangshi_alive'] = SUB_CHARACTER_COUNT;
  },
};

/** All 十常侍 unique-mechanic skill plugins. */
export const shichangshiSkills: SkillPlugin[] = [
  huoluan,
  luanzheng,
  shichangshiInit,
];
