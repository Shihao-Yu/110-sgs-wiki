/**
 * AITurnExecutor — browser-side AI decision engine for the sandbox.
 *
 * This module adapts AI strategy logic for the browser without importing
 * from @sgs/ai (which depends on @sgs/engine/@sgs/data runtime types).
 * Instead it re-implements a simplified decision loop using the
 * GameController's own types.
 *
 * The executor produces an ordered list of AIAction items for a single
 * AI turn.  The caller (GameController) is responsible for executing
 * each action with pacing so the UI can visualise what happened.
 */

/* ================================================================== */
/*  Types — mirror what GameController uses internally                 */
/* ================================================================== */

interface Card {
  id: string;
  name: string;
  type: "basic" | "trick" | "equipment";
  subtype?: string;
  suit: "spade" | "heart" | "club" | "diamond";
  number: number;
  description: string;
  range?: number;
}

interface EquipmentSlots {
  weapon: Card | null;
  armor: Card | null;
  defensiveHorse: Card | null;
  offensiveHorse: Card | null;
  treasure: Card | null;
}

interface PlayerState {
  id: string;
  name: string;
  seat: number;
  hp: number;
  maxHp: number;
  handCards: Card[];
  equipment: EquipmentSlots;
  alive: boolean;
}

interface GameState {
  players: PlayerState[];
  drawPile: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  currentPhase: string;
  turnCount: number;
  gameOver: boolean;
}

/* ================================================================== */
/*  AI Action — what the controller should execute for the AI          */
/* ================================================================== */

export type AIActionType = "play" | "skill" | "equip" | "pass";

export interface AIAction {
  type: AIActionType;
  cardId?: string;
  cardName?: string;
  targetIds: string[];
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const SLASH_NAMES = new Set(["杀", "火杀", "雷杀"]);
const SELF_TARGET_TRICKS = new Set(["无中生有", "桃园结义", "五谷丰登"]);
const AOE_TRICKS = new Set(["南蛮入侵", "万箭齐发"]);

/* ================================================================== */
/*  Distance / Targeting — mirror game-controller.ts helpers           */
/* ================================================================== */

function getDistance(
  game: GameState,
  from: PlayerState,
  to: PlayerState,
): number {
  if (from.id === to.id) return 0;
  const alive = game.players
    .filter((p) => p.alive)
    .sort((a, b) => a.seat - b.seat);
  const fromIdx = alive.findIndex((p) => p.id === from.id);
  const toIdx = alive.findIndex((p) => p.id === to.id);
  if (fromIdx === -1 || toIdx === -1) return Infinity;
  const n = alive.length;
  const cw = (toIdx - fromIdx + n) % n;
  const ccw = (fromIdx - toIdx + n) % n;
  let dist = Math.min(cw, ccw);
  if (to.equipment.defensiveHorse) dist += 1;
  if (from.equipment.offensiveHorse) dist -= 1;
  return Math.max(dist, 1);
}

function getAttackRange(player: PlayerState): number {
  return player.equipment.weapon?.range ?? 1;
}

function getAttackTargets(
  game: GameState,
  attacker: PlayerState,
): PlayerState[] {
  const range = getAttackRange(attacker);
  return game.players.filter(
    (p) =>
      p.alive && p.id !== attacker.id && getDistance(game, attacker, p) <= range,
  );
}

/** Pick the weakest alive enemy (lowest HP, then fewest hand cards). */
function pickWeakestTarget(
  game: GameState,
  player: PlayerState,
  candidates?: PlayerState[],
): PlayerState | null {
  const pool =
    candidates ??
    game.players.filter((p) => p.alive && p.id !== player.id);
  if (pool.length === 0) return null;
  return pool.reduce((best, cur) =>
    cur.hp < best.hp ||
    (cur.hp === best.hp && cur.handCards.length < best.handCards.length)
      ? cur
      : best,
  );
}

/* ================================================================== */
/*  Card value scoring (simplified BaseAI / profiles)                  */
/* ================================================================== */

const BASE_CARD_VALUES: Record<string, number> = {
  桃: 9,
  闪: 7,
  无懈可击: 7,
  杀: 4,
  火杀: 4,
  雷杀: 4,
  酒: 6,
  无中生有: 8,
  过河拆桥: 6,
  顺手牵羊: 6,
  决斗: 5,
  南蛮入侵: 5,
  万箭齐发: 5,
  桃园结义: 6,
  五谷丰登: 5,
  乐不思蜀: 6,
  兵粮寸断: 5,
  闪电: 3,
};

/** Score a card contextually (used by discard logic in future iterations). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cardValue(card: Card, player: PlayerState): number {
  let score = BASE_CARD_VALUES[card.name] ?? 3;
  const hpRatio = player.hp / player.maxHp;
  if (hpRatio <= 0.5) {
    if (card.name === "桃") score += 3;
    if (card.name === "闪") score += 2;
  }
  if (card.type === "equipment") {
    const slot = card.subtype as keyof EquipmentSlots | undefined;
    if (slot && slot in player.equipment && player.equipment[slot] === null) {
      score += 2;
    }
  }
  return score;
}

/* ================================================================== */
/*  AITurnExecutor                                                     */
/* ================================================================== */

export class AITurnExecutor {
  /**
   * Decide a sequence of actions for one AI turn.
   *
   * The decision loop:
   *  1. Equip any equipment cards (always beneficial).
   *  2. Play 无中生有 (draw 2 — always good).
   *  3. Play one 杀 at the weakest reachable target.
   *  4. Play one offensive trick (过河拆桥, 顺手牵羊, 决斗, AoE) if sensible.
   *  5. Use 桃 if HP < maxHP.
   *  6. Pass.
   */
  static decide(game: GameState, playerIndex: number): AIAction[] {
    const player = game.players[playerIndex];
    if (!player || !player.alive) return [{ type: "pass", targetIds: [] }];

    const actions: AIAction[] = [];
    const usedCardIds = new Set<string>();

    // Helper: mark a card used and push an action
    const use = (
      card: Card,
      type: AIActionType,
      targetIds: string[] = [],
    ) => {
      usedCardIds.add(card.id);
      actions.push({ type, cardId: card.id, cardName: card.name, targetIds });
    };

    // Remaining hand (not yet consumed)
    const hand = () => player.handCards.filter((c) => !usedCardIds.has(c.id));

    // --- 1. Equipment ---
    for (const card of hand()) {
      if (card.type === "equipment") {
        use(card, "equip");
      }
    }

    // --- 2. 无中生有 (self-targeting draw trick) ---
    for (const card of hand()) {
      if (card.name === "无中生有") {
        use(card, "play");
        break; // only play one
      }
    }

    // --- 3. One 杀 at weakest reachable target ---
    const hasCrossbow =
      player.equipment.weapon?.name === "诸葛连弩" ||
      hand().some(
        (c) => c.type === "equipment" && c.name === "诸葛连弩",
      );
    let slashesPlayed = 0;
    const maxSlashes = hasCrossbow ? 3 : 1; // cap at 3 even with crossbow to keep turns short

    for (const card of hand()) {
      if (!SLASH_NAMES.has(card.name)) continue;
      if (slashesPlayed >= maxSlashes) break;
      const targets = getAttackTargets(game, player);
      const target = pickWeakestTarget(game, player, targets);
      if (target) {
        use(card, "play", [target.id]);
        slashesPlayed++;
      }
    }

    // --- 4. One offensive trick ---
    for (const card of hand()) {
      if (card.type !== "trick") continue;
      if (card.subtype === "delayedTrick") continue;
      if (card.name === "无中生有") continue; // already handled
      if (card.name === "无懈可击") continue; // reactive only
      if (card.name === "闪") continue; // not a trick but just in case

      if (SELF_TARGET_TRICKS.has(card.name)) {
        // 桃园结义 / 五谷丰登 — play without target
        use(card, "play");
        break;
      }

      if (AOE_TRICKS.has(card.name)) {
        // 南蛮入侵 / 万箭齐发 — play without target
        use(card, "play");
        break;
      }

      // Targeted tricks (过河拆桥, 顺手牵羊, 决斗, etc.)
      const enemies = game.players.filter(
        (p) => p.alive && p.id !== player.id,
      );

      if (card.name === "顺手牵羊") {
        // Must be distance 1
        const close = enemies.filter(
          (p) => getDistance(game, player, p) <= 1,
        );
        const target = pickWeakestTarget(game, player, close);
        if (target) {
          use(card, "play", [target.id]);
          break;
        }
        continue;
      }

      // Generic targeted trick
      const target = pickWeakestTarget(game, player, enemies);
      if (target) {
        use(card, "play", [target.id]);
        break;
      }
    }

    // --- 5. 桃 if hurt ---
    if (player.hp < player.maxHp) {
      for (const card of hand()) {
        if (card.name === "桃") {
          use(card, "play");
          break;
        }
      }
    }

    // --- 6. Pass (always ends the action list) ---
    actions.push({ type: "pass", targetIds: [] });

    return actions;
  }
}
