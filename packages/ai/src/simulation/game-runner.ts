/**
 * GameRunner — runs a single simulated Sanguosha game to completion.
 *
 * Uses AIPlayer for all player decisions.  Simplified game loop:
 *   setup generals -> play turns -> until victory condition or turn limit.
 */

import type { Card, CardId, Faction, GeneralId } from '@sgs/data';
import type { GameState, PlayerState, PlayerId } from '@sgs/engine';
import { AIPlayer } from '../generals/ai-player.js';

// ---------------------------------------------------------------------------
// Seeded PRNG — simple xorshift128 for reproducibility
// ---------------------------------------------------------------------------

export class SeededRandom {
  private s: [number, number, number, number];

  constructor(seed: number) {
    // Initialise state from a single seed via splitmix32
    let s = seed | 0;
    const sm = (): number => {
      s = (s + 0x9e3779b9) | 0;
      let t = s ^ (s >>> 16);
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ (t >>> 15);
      t = Math.imul(t, 0x735a2d97);
      t = t ^ (t >>> 15);
      return t >>> 0;
    };
    this.s = [sm(), sm(), sm(), sm()];
  }

  /** Returns a float in [0, 1). */
  next(): number {
    const s = this.s;
    const t = s[1]! << 9;
    let r = s[0]! * 5;
    r = ((r << 7) | (r >>> 25)) * 9;

    s[2]! ^ s[0]!; // intentional side-effect-free xor — actual mutations below
    s[3] ^= s[1]!;
    s[1] ^= s[2]!;
    s[0] ^= s[3]!;

    s[2] ^= t;
    s[3] = (s[3]! << 11) | (s[3]! >>> 21);

    return (r >>> 0) / 4294967296;
  }

  /** Returns an integer in [0, max). */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Fisher-Yates shuffle using this PRNG. */
  shuffle<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      const tmp = array[i]!;
      array[i] = array[j]!;
      array[j] = tmp;
    }
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACTIONS: Faction[] = ['WEI', 'SHU', 'WU', 'QUN'];

const DEFAULT_GENERAL_POOL: string[] = [
  'caocao', 'simayi', 'xiahoudun', 'zhangliao', 'xuchu', 'guojia', 'zhenji',
  'liubei', 'guanyu', 'zhangfei', 'zhugeliang', 'zhaoyun', 'machao', 'huangyueying',
  'sunquan', 'zhouyu', 'lvmeng', 'luxun', 'ganning', 'huanggai', 'daqiao', 'sunshangxiang',
  'lvbu', 'diaochan', 'huatuo', 'yuanshao', 'yanliangwenchou', 'pangde', 'jiaxu',
];

const MAX_TURN_LIMIT = 50;

// ---------------------------------------------------------------------------
// Simplified deck: a fixed set of common Sanguosha cards
// ---------------------------------------------------------------------------

interface CardTemplate {
  name: string;
  type: 'basic' | 'trick' | 'equipment';
  subtype?: 'instantTrick' | 'delayedTrick' | 'weapon' | 'armor';
  count: number;
}

const DECK_TEMPLATES: CardTemplate[] = [
  { name: '杀', type: 'basic', count: 30 },
  { name: '闪', type: 'basic', count: 15 },
  { name: '桃', type: 'basic', count: 8 },
  { name: '无中生有', type: 'trick', subtype: 'instantTrick', count: 4 },
  { name: '过河拆桥', type: 'trick', subtype: 'instantTrick', count: 6 },
  { name: '顺手牵羊', type: 'trick', subtype: 'instantTrick', count: 5 },
  { name: '决斗', type: 'trick', subtype: 'instantTrick', count: 3 },
  { name: '南蛮入侵', type: 'trick', subtype: 'instantTrick', count: 3 },
  { name: '万箭齐发', type: 'trick', subtype: 'instantTrick', count: 1 },
  { name: '桃园结义', type: 'trick', subtype: 'instantTrick', count: 1 },
  { name: '无懈可击', type: 'trick', subtype: 'instantTrick', count: 4 },
  { name: '乐不思蜀', type: 'trick', subtype: 'delayedTrick', count: 3 },
  { name: '兵粮寸断', type: 'trick', subtype: 'delayedTrick', count: 2 },
  { name: '酒', type: 'basic', count: 5 },
];

const SUITS = ['spade', 'heart', 'club', 'diamond'] as const;

function buildDeck(rng: SeededRandom): Card[] {
  const cards: Card[] = [];
  let cardIdx = 0;

  for (const tpl of DECK_TEMPLATES) {
    for (let i = 0; i < tpl.count; i++) {
      cards.push({
        id: `sim_card_${cardIdx++}` as CardId,
        name: tpl.name,
        type: tpl.type,
        subtype: tpl.subtype,
        suit: SUITS[cardIdx % 4]!,
        number: (cardIdx % 13) + 1,
        description: '',
      });
    }
  }

  rng.shuffle(cards);
  return cards;
}

// ---------------------------------------------------------------------------
// Per-player tracking for simulation stats
// ---------------------------------------------------------------------------

export interface PlayerSimTracking {
  generalId: string;
  faction: Faction;
  damageDealt: number;
  damageReceived: number;
  cardsDrawn: number;
  survivalTurn: number;
  won: boolean;
}

// ---------------------------------------------------------------------------
// GameRunner result
// ---------------------------------------------------------------------------

export interface GameRunResult {
  winnerFaction: Faction;
  totalTurns: number;
  playerStats: PlayerSimTracking[];
}

// ---------------------------------------------------------------------------
// GameRunner
// ---------------------------------------------------------------------------

export class GameRunner {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Run a single simulated game.
   *
   * @param playerCount  Number of players (4, 6, or 8)
   * @param generalPool  General IDs to draw from (defaults to the 29 core generals)
   */
  run(playerCount: 4 | 6 | 8, generalPool?: string[]): GameRunResult {
    const pool = generalPool && generalPool.length >= playerCount
      ? [...generalPool]
      : [...DEFAULT_GENERAL_POOL];

    // Pick generals
    this.rng.shuffle(pool);
    const selectedGenerals = pool.slice(0, playerCount);

    // Assign factions round-robin for simplicity
    const players: PlayerState[] = selectedGenerals.map((gid, i) => {
      const faction = FACTIONS[i % FACTIONS.length]!;
      return this.createPlayer(`p${i}`, gid as GeneralId, faction, i);
    });

    // Create AI controllers
    const ais: AIPlayer[] = selectedGenerals.map((gid) => new AIPlayer(gid));

    // Build deck
    const drawPile = buildDeck(this.rng);
    const discardPile: Card[] = [];

    // Initial state
    const game: GameState = {
      players,
      drawPile,
      discardPile,
      currentPlayerIndex: 0,
      currentPhase: 'play',
      turnCount: 0,
      activeEffects: [],
      gameOver: false,
      winnerFaction: null,
    };

    // Per-player tracking
    const tracking: PlayerSimTracking[] = players.map((p, i) => ({
      generalId: selectedGenerals[i]!,
      faction: p.faction!,
      damageDealt: 0,
      damageReceived: 0,
      cardsDrawn: 0,
      survivalTurn: 0,
      won: false,
    }));

    // Initial draw: each player draws 4 cards
    for (let i = 0; i < playerCount; i++) {
      const drawn = this.drawCards(game, 4);
      players[i]!.handCards.push(...drawn);
      tracking[i]!.cardsDrawn += drawn.length;
    }

    // --------------- Main game loop ---------------
    while (!game.gameOver && game.turnCount < MAX_TURN_LIMIT) {
      game.turnCount++;

      for (let seat = 0; seat < playerCount; seat++) {
        const player = players[seat]!;
        const ai = ais[seat]!;
        const track = tracking[seat]!;

        if (!player.alive) continue;

        // Draw phase: draw 2 cards
        const drawn = this.drawCards(game, 2);
        player.handCards.push(...drawn);
        track.cardsDrawn += drawn.length;

        // Play phase: AI decides actions
        game.currentPlayerIndex = seat;
        game.currentPhase = 'play';

        const actions = ai.decideTurn(game, player);
        for (const action of actions) {
          if (action.type === 'pass') break;
          if (action.type !== 'play' || !action.card) continue;

          // Remove card from hand
          const cardIdx = player.handCards.findIndex((c) => c.id === action.card!.id);
          if (cardIdx === -1) continue;
          player.handCards.splice(cardIdx, 1);

          // Resolve card effect
          if (action.card.name === '杀' && action.targetId) {
            this.resolveSlash(game, player, action.targetId, action.card, ais, tracking);
          } else if (action.card.name === '决斗' && action.targetId) {
            this.resolveDuel(game, player, action.targetId, ais, tracking);
          } else if (action.card.name === '桃') {
            // Heal self
            if (player.hp < player.maxHp) player.hp++;
          } else if (action.card.name === '南蛮入侵') {
            this.resolveAoE(game, player, '杀', ais, tracking);
          } else if (action.card.name === '万箭齐发') {
            this.resolveAoE(game, player, '闪', ais, tracking);
          }

          // Discard played card
          game.discardPile.push(action.card);

          // Check victory after each action
          if (this.checkVictory(game)) break;
        }

        if (game.gameOver) break;

        // Discard phase: discard down to HP
        game.currentPhase = 'discard';
        const excess = player.handCards.length - Math.max(player.hp, 0);
        if (excess > 0) {
          const discardDecision = ai.evaluateDiscard(game, player, excess);
          for (const card of discardDecision.cards) {
            const idx = player.handCards.findIndex((c) => c.id === card.id);
            if (idx !== -1) {
              player.handCards.splice(idx, 1);
              game.discardPile.push(card);
            }
          }
        }

        // Record survival turn for alive players
        if (player.alive) {
          track.survivalTurn = game.turnCount;
        }
      }
    }

    // If no faction won within turn limit, pick faction with most surviving HP
    if (!game.gameOver) {
      const factionHp: Record<string, number> = {};
      for (const p of players) {
        if (p.alive && p.faction) {
          factionHp[p.faction] = (factionHp[p.faction] ?? 0) + p.hp;
        }
      }
      let bestFaction: Faction = FACTIONS[0]!;
      let bestHp = -1;
      for (const [f, hp] of Object.entries(factionHp)) {
        if (hp > bestHp) {
          bestHp = hp;
          bestFaction = f as Faction;
        }
      }
      game.winnerFaction = bestFaction;
      game.gameOver = true;
    }

    // Mark winners
    const winFaction = game.winnerFaction!;
    for (const track of tracking) {
      track.won = track.faction === winFaction;
    }

    return {
      winnerFaction: winFaction,
      totalTurns: game.turnCount,
      playerStats: tracking,
    };
  }

  // -----------------------------------------------------------------------
  // Card resolution helpers
  // -----------------------------------------------------------------------

  private resolveSlash(
    game: GameState,
    attacker: PlayerState,
    targetId: PlayerId,
    _card: Card,
    ais: AIPlayer[],
    tracking: PlayerSimTracking[],
  ): void {
    const targetIdx = game.players.findIndex((p) => p.id === targetId);
    const target = game.players[targetIdx];
    if (!target || !target.alive) return;

    const targetAi = ais[targetIdx]!;
    const response = targetAi.evaluateResponse(game, target, '闪');

    if (response.respond && response.card) {
      // Dodge: remove 闪 from hand
      const dodgeIdx = target.handCards.findIndex((c) => c.id === response.card!.id);
      if (dodgeIdx !== -1) {
        target.handCards.splice(dodgeIdx, 1);
        game.discardPile.push(response.card);
        return;
      }
    }

    // Hit: deal 1 damage
    this.dealDamage(game, attacker, target, 1, ais, tracking);
  }

  private resolveDuel(
    game: GameState,
    challenger: PlayerState,
    targetId: PlayerId,
    ais: AIPlayer[],
    tracking: PlayerSimTracking[],
  ): void {
    const targetIdx = game.players.findIndex((p) => p.id === targetId);
    const target = game.players[targetIdx];
    if (!target || !target.alive) return;

    const challengerIdx = game.players.findIndex((p) => p.id === challenger.id);
    const targetAi = ais[targetIdx]!;
    const challengerAi = ais[challengerIdx]!;

    // Each player alternately plays 杀; target goes first
    let turn: 'target' | 'challenger' = 'target';
    for (let rounds = 0; rounds < 20; rounds++) {
      const current = turn === 'target' ? target : challenger;
      const ai = turn === 'target' ? targetAi : challengerAi;
      const resp = ai.evaluateResponse(game, current, '杀');

      if (resp.respond && resp.card) {
        const idx = current.handCards.findIndex((c) => c.id === resp.card!.id);
        if (idx !== -1) {
          current.handCards.splice(idx, 1);
          game.discardPile.push(resp.card);
          turn = turn === 'target' ? 'challenger' : 'target';
          continue;
        }
      }

      // Cannot respond: loser takes 1 damage
      const loser = current;
      const winner = current === target ? challenger : target;
      this.dealDamage(game, winner, loser, 1, ais, tracking);
      return;
    }
  }

  private resolveAoE(
    game: GameState,
    source: PlayerState,
    responseType: string,
    ais: AIPlayer[],
    tracking: PlayerSimTracking[],
  ): void {
    for (let i = 0; i < game.players.length; i++) {
      const target = game.players[i]!;
      if (!target.alive || target.id === source.id) continue;

      const ai = ais[i]!;
      const response = ai.evaluateResponse(game, target, responseType);

      if (response.respond && response.card) {
        const idx = target.handCards.findIndex((c) => c.id === response.card!.id);
        if (idx !== -1) {
          target.handCards.splice(idx, 1);
          game.discardPile.push(response.card);
          continue;
        }
      }

      // Failed to respond: take 1 damage
      this.dealDamage(game, source, target, 1, ais, tracking);
    }
  }

  private dealDamage(
    game: GameState,
    source: PlayerState,
    target: PlayerState,
    amount: number,
    ais: AIPlayer[],
    tracking: PlayerSimTracking[],
  ): void {
    target.hp -= amount;

    const sourceIdx = game.players.findIndex((p) => p.id === source.id);
    const targetIdx = game.players.findIndex((p) => p.id === target.id);
    if (sourceIdx !== -1) tracking[sourceIdx]!.damageDealt += amount;
    if (targetIdx !== -1) tracking[targetIdx]!.damageReceived += amount;

    // Dying: try to save with 桃
    if (target.hp <= 0) {
      const targetAi = ais[targetIdx]!;
      const peachResp = targetAi.evaluateResponse(game, target, '桃');
      if (peachResp.respond && peachResp.card) {
        const peachIdx = target.handCards.findIndex((c) => c.id === peachResp.card!.id);
        if (peachIdx !== -1) {
          target.handCards.splice(peachIdx, 1);
          game.discardPile.push(peachResp.card);
          target.hp = 1;
          return;
        }
      }
      // Death
      target.alive = false;
      target.hp = 0;
      tracking[targetIdx]!.survivalTurn = game.turnCount;
    }
  }

  // -----------------------------------------------------------------------
  // Victory condition
  // -----------------------------------------------------------------------

  private checkVictory(game: GameState): boolean {
    // Count alive factions
    const aliveFactions = new Set<Faction>();
    for (const p of game.players) {
      if (p.alive && p.faction) aliveFactions.add(p.faction);
    }

    if (aliveFactions.size <= 1 && aliveFactions.size > 0) {
      game.gameOver = true;
      game.winnerFaction = [...aliveFactions][0]!;
      return true;
    }

    // Check if only one player alive
    const alivePlayers = game.players.filter((p) => p.alive);
    if (alivePlayers.length <= 1) {
      game.gameOver = true;
      game.winnerFaction = alivePlayers[0]?.faction ?? 'WEI';
      return true;
    }

    return false;
  }

  // -----------------------------------------------------------------------
  // Utility
  // -----------------------------------------------------------------------

  private drawCards(game: GameState, count: number): Card[] {
    const result: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (game.drawPile.length === 0) {
        // Recycle discard pile
        if (game.discardPile.length === 0) break;
        game.drawPile.push(...game.discardPile);
        game.discardPile.length = 0;
        this.rng.shuffle(game.drawPile);
      }
      const card = game.drawPile.pop();
      if (card) result.push(card);
    }
    return result;
  }

  private createPlayer(
    id: string,
    generalId: GeneralId,
    faction: Faction,
    seat: number,
  ): PlayerState {
    // Use default HP of 4 for simplicity; generals with known profiles
    // use profile aggression but we don't have General data loaded here.
    return {
      id: id as PlayerId,
      name: generalId as string,
      seat,
      mainGeneral: { generalId, revealed: true },
      deputyGeneral: null,
      hp: 4,
      maxHp: 4,
      handCards: [],
      equipment: {
        weapon: null,
        armor: null,
        defensiveHorse: null,
        offensiveHorse: null,
        treasure: null,
      },
      judgmentArea: [],
      faction,
      alive: true,
      skills: [],
      marks: {},
    };
  }
}
