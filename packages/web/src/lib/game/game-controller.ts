/**
 * GameController — connects the visual sandbox to the game engine.
 *
 * Implements a self-contained game loop using the same rules as @sgs/engine
 * (PhaseManager, TargetSelector, DeckManager, ResolutionStack, etc.) so the
 * web package can run a full game without a build-time dependency on the
 * engine package.  This keeps the build pipeline clean (the existing web
 * build only ever used `import type` from @sgs/data; runtime logic lives
 * here).
 *
 * The engine types below mirror @sgs/engine and @sgs/data exactly.
 */

import type {
  GameCard,
  SkillData,
  PlayerSlotData,
  Faction as UIFaction,
  PhaseType as UIPhaseType,
  ResponsePrompt,
  GameTableState,
} from "./store";

/* ================================================================== */
/*  Engine-compatible types (mirrors @sgs/data & @sgs/engine)          */
/* ================================================================== */

type CardType = "basic" | "trick" | "equipment";
type CardSubtype =
  | "weapon"
  | "armor"
  | "defensiveHorse"
  | "offensiveHorse"
  | "treasure"
  | "instantTrick"
  | "delayedTrick";
type Suit = "spade" | "heart" | "club" | "diamond";

interface Card {
  id: string;
  name: string;
  type: CardType;
  subtype?: CardSubtype;
  suit: Suit;
  number: number;
  description: string;
  range?: number;
}

interface GeneralSlot {
  generalId: string;
  revealed: boolean;
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
  mainGeneral: GeneralSlot | null;
  deputyGeneral: GeneralSlot | null;
  hp: number;
  maxHp: number;
  handCards: Card[];
  equipment: EquipmentSlots;
  judgmentArea: Card[];
  faction: string | null;
  alive: boolean;
  skills: string[];
  marks: Record<string, number>;
}

interface ActiveEffect {
  id: string;
  name: string;
  sourcePlayerId: string;
  targetPlayerIds: string[];
  duration: "turn" | "phase" | "permanent";
  properties: Record<string, string | number | boolean>;
}

interface GameState {
  players: PlayerState[];
  drawPile: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  currentPhase: PhaseType;
  turnCount: number;
  activeEffects: ActiveEffect[];
  gameOver: boolean;
  winnerFaction: string | null;
}

type PhaseType = "prepare" | "judgment" | "draw" | "play" | "discard" | "end";

/* Phase order is consumed inline by startTurn(). */

/* ================================================================== */
/*  Minimal TargetSelector (mirrors engine/src/target/target-selector) */
/* ================================================================== */

function getDistance(game: GameState, from: PlayerState, to: PlayerState): number {
  if (from.id === to.id) return 0;
  const alive = game.players.filter((p) => p.alive).sort((a, b) => a.seat - b.seat);
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
  const weapon = player.equipment.weapon;
  return weapon?.range ?? 1;
}

function getAttackTargets(game: GameState, attacker: PlayerState): PlayerState[] {
  const range = getAttackRange(attacker);
  return game.players.filter(
    (p) => p.alive && p.id !== attacker.id && getDistance(game, attacker, p) <= range,
  );
}

function getTrickTargets(game: GameState, player: PlayerState): PlayerState[] {
  return game.players.filter((p) => p.alive && p.id !== player.id);
}

/* ================================================================== */
/*  Minimal DeckManager (mirrors engine/src/deck/deck-manager)         */
/* ================================================================== */

function fisherYatesShuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i]!;
    array[i] = array[j]!;
    array[j] = tmp;
  }
}

/* ================================================================== */
/*  Response window (mirrors engine/src/resolution)                    */
/* ================================================================== */

interface ResponseWindow {
  playerId: string;
  cardName: string;
  message: string;
  options: string[];
}

/* ================================================================== */
/*  Public configuration & return types                                */
/* ================================================================== */

export interface GameConfig {
  playerCount: number;
  deck: Card[];
  humanPlayerIndex?: number;
}

export interface ValidActions {
  playableCardIds: string[];
  activatableSkillIds: string[];
  canEndPhase: boolean;
  mustDiscard: number;
}

export type StateChangeCallback = (snapshot: GameTableState) => void;

/* ================================================================== */
/*  Slash card set                                                     */
/* ================================================================== */

const SLASH_NAMES = new Set(["杀", "火杀", "雷杀"]);
const RED_SUITS = new Set<Suit>(["heart", "diamond"]);

/* ================================================================== */
/*  GameController                                                     */
/* ================================================================== */

export class GameController {
  private game: GameState | null = null;
  private humanIndex = 0;
  private pendingWindow: ResponseWindow | null = null;
  private slashesThisTurn = 0;
  private onChange: StateChangeCallback | null = null;

  /* -- Subscription ----------------------------------------------- */

  subscribe(cb: StateChangeCallback): () => void {
    this.onChange = cb;
    return () => {
      if (this.onChange === cb) this.onChange = null;
    };
  }

  /* ================================================================ */
  /*  initGame                                                         */
  /* ================================================================ */

  initGame(config: GameConfig): GameTableState {
    const count = Math.max(4, Math.min(8, config.playerCount));
    this.humanIndex = config.humanPlayerIndex ?? 0;
    this.slashesThisTurn = 0;
    this.pendingWindow = null;

    const players: PlayerState[] = Array.from({ length: count }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i + 1}`,
      seat: i,
      mainGeneral: null,
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
      faction: null,
      alive: true,
      skills: [],
      marks: {},
    }));

    const drawPile = config.deck.map((c) => ({ ...c }));
    fisherYatesShuffle(drawPile);

    this.game = {
      players,
      drawPile,
      discardPile: [],
      currentPlayerIndex: 0,
      currentPhase: "prepare",
      turnCount: 1,
      activeEffects: [],
      gameOver: false,
      winnerFaction: null,
    };

    // Deal initial hands: 4 cards each
    for (const player of this.game.players) {
      player.handCards.push(...this.game.drawPile.splice(0, 4));
    }

    const snap = this.buildSnapshot();
    this.notify(snap);
    return snap;
  }

  /* ================================================================ */
  /*  startTurn                                                        */
  /* ================================================================ */

  startTurn(): GameTableState {
    const game = this.requireGame();
    const player = game.players[game.currentPlayerIndex];
    if (!player || !player.alive) {
      return this.advanceToNextAlive();
    }

    this.slashesThisTurn = 0;

    // Prepare phase
    game.currentPhase = "prepare";

    // Judgment phase (resolve pending delayed tricks)
    game.currentPhase = "judgment";

    // Draw phase: draw 2 cards
    game.currentPhase = "draw";
    this.drawCards(player, 2);

    // Stop at play phase — hand control to the human
    game.currentPhase = "play";

    const snap = this.buildSnapshot();
    this.notify(snap);
    return snap;
  }

  /* ================================================================ */
  /*  playCard                                                         */
  /* ================================================================ */

  playCard(cardId: string, targetIds: string[]): GameTableState {
    const game = this.requireGame();
    const player = this.currentPlayer();
    const cardIdx = player.handCards.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) throw new Error(`Card ${cardId} not in hand`);
    const card = player.handCards[cardIdx]!;

    const targets = targetIds
      .map((tid) => game.players.find((p) => p.id === tid))
      .filter((p): p is PlayerState => p != null && p.alive);

    // Remove from hand
    player.handCards.splice(cardIdx, 1);

    // Resolve by card type
    if (card.type === "equipment") {
      this.resolveEquip(game, player, card);
    } else if (SLASH_NAMES.has(card.name)) {
      this.resolveSlash(game, player, card, targets);
    } else if (card.name === "桃") {
      this.resolvePeach(game, player);
      game.discardPile.push(card);
    } else if (card.name === "酒") {
      this.resolveWine(game, player, card);
    } else if (card.name === "闪") {
      // Should not be actively played; put back
      player.handCards.splice(cardIdx, 0, card);
      throw new Error("闪 cannot be played actively");
    } else if (card.type === "trick") {
      this.resolveTrick(game, player, card, targets);
    } else {
      game.discardPile.push(card);
    }

    this.checkVictory(game);
    const snap = this.buildSnapshot();
    this.notify(snap);
    return snap;
  }

  /* ================================================================ */
  /*  activateSkill                                                    */
  /* ================================================================ */

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activateSkill(skillId: string, targetIds: string[]): GameTableState {
    this.requireGame();
    const player = this.currentPlayer();

    if (!player.skills.includes(skillId)) {
      throw new Error(`Skill ${skillId} not available`);
    }

    // Skill resolution is a no-op in the sandbox until skill plugins are
    // registered; the engine's SkillRegistry would fire the plugin here.
    // targetIds will be consumed when skill plugins handle targeting.

    const snap = this.buildSnapshot();
    this.notify(snap);
    return snap;
  }

  /* ================================================================ */
  /*  respondToPrompt                                                  */
  /* ================================================================ */

  respondToPrompt(accepted: boolean, cardId?: string): GameTableState {
    const game = this.requireGame();
    if (!this.pendingWindow) throw new Error("No pending response window");

    if (accepted && cardId) {
      // Find and remove the response card from the responding player
      for (const p of game.players) {
        const idx = p.handCards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          const [card] = p.handCards.splice(idx, 1);
          if (card) game.discardPile.push(card);
          break;
        }
      }
    }

    // If declined a dodge response, deal 1 damage to the target
    if (!accepted && this.pendingWindow.cardName === "闪") {
      // The target is whoever the window was for
      const target = game.players.find(
        (p) => p.id === this.pendingWindow!.playerId,
      );
      if (target && target.alive) {
        target.hp -= 1;
        if (target.hp <= 0) {
          // Dying — check for peach saves (simplified: just mark dead)
          target.alive = false;
        }
      }
    }

    this.pendingWindow = null;
    this.checkVictory(game);
    const snap = this.buildSnapshot();
    this.notify(snap);
    return snap;
  }

  /* ================================================================ */
  /*  endTurn                                                          */
  /* ================================================================ */

  endTurn(): GameTableState {
    const game = this.requireGame();
    const player = this.currentPlayer();

    // Discard phase: discard down to current HP
    game.currentPhase = "discard";
    const excess = player.handCards.length - Math.max(player.hp, 0);
    if (excess > 0) {
      const discarded = player.handCards.splice(-excess, excess);
      game.discardPile.push(...discarded);
    }

    // End phase
    game.currentPhase = "end";

    // Clean turn-scoped effects
    game.activeEffects = game.activeEffects.filter((e) => e.duration !== "turn");

    return this.advanceToNextAlive();
  }

  /* ================================================================ */
  /*  getValidActions                                                  */
  /* ================================================================ */

  getValidActions(): ValidActions {
    const game = this.requireGame();
    const player = this.currentPlayer();
    const playableCardIds: string[] = [];
    const activatableSkillIds: string[] = [];

    if (game.currentPhase === "play" && player.alive && !this.pendingWindow) {
      for (const card of player.handCards) {
        if (this.canPlayCard(game, player, card)) {
          playableCardIds.push(card.id);
        }
      }
      for (const sid of player.skills) {
        activatableSkillIds.push(sid);
      }
    }

    return {
      playableCardIds,
      activatableSkillIds,
      canEndPhase: game.currentPhase === "play" && !this.pendingWindow,
      mustDiscard: Math.max(0, player.handCards.length - Math.max(player.hp, 0)),
    };
  }

  /* ================================================================ */
  /*  getTargetsForCard                                                */
  /* ================================================================ */

  getTargetsForCard(
    cardId: string,
  ): { validTargetIds: string[]; minTargets: number; maxTargets: number } {
    const game = this.requireGame();
    const player = this.currentPlayer();
    const card = player.handCards.find((c) => c.id === cardId);
    if (!card) return { validTargetIds: [], minTargets: 0, maxTargets: 0 };

    if (SLASH_NAMES.has(card.name)) {
      return {
        validTargetIds: getAttackTargets(game, player).map((t) => t.id),
        minTargets: 1,
        maxTargets: 1,
      };
    }

    if (card.type === "trick") {
      if (card.name === "无中生有" || card.name === "桃园结义" || card.name === "五谷丰登") {
        return { validTargetIds: [], minTargets: 0, maxTargets: 0 };
      }
      if (card.name === "南蛮入侵" || card.name === "万箭齐发") {
        return { validTargetIds: [], minTargets: 0, maxTargets: 0 };
      }
      if (card.name === "顺手牵羊") {
        const targets = game.players.filter(
          (p) => p.alive && p.id !== player.id && getDistance(game, player, p) <= 1,
        );
        return { validTargetIds: targets.map((t) => t.id), minTargets: 1, maxTargets: 1 };
      }
      const targets = getTrickTargets(game, player);
      return { validTargetIds: targets.map((t) => t.id), minTargets: 1, maxTargets: 1 };
    }

    return { validTargetIds: [], minTargets: 0, maxTargets: 0 };
  }

  /* ================================================================ */
  /*  Accessors                                                        */
  /* ================================================================ */

  getSnapshot(): GameTableState | null {
    if (!this.game) return null;
    return this.buildSnapshot();
  }

  /* ================================================================ */
  /*  Private — card resolution                                        */
  /* ================================================================ */

  private resolveEquip(game: GameState, player: PlayerState, card: Card): void {
    const slot = card.subtype as keyof EquipmentSlots | undefined;
    if (!slot || !(slot in player.equipment)) {
      game.discardPile.push(card);
      return;
    }
    const replaced = player.equipment[slot];
    if (replaced) game.discardPile.push(replaced);
    player.equipment[slot] = card;
  }

  private resolveSlash(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    const hasCrossbow = player.equipment.weapon?.name === "诸葛连弩";
    if (!hasCrossbow && this.slashesThisTurn >= 1) {
      // Put card back
      player.handCards.push(card);
      throw new Error("Only one 杀 per turn without 诸葛连弩");
    }
    this.slashesThisTurn += 1;

    // Wine bonus
    let bonus = 0;
    const wineEffect = game.activeEffects.find(
      (e) => e.name === "酒" && e.sourcePlayerId === player.id,
    );
    if (wineEffect) {
      bonus = Number(wineEffect.properties["damageBonus"]) || 0;
      game.activeEffects = game.activeEffects.filter((e) => e !== wineEffect);
    }

    for (const target of targets) {
      // Renwang Shield: blocks black-suit slashes
      if (
        target.equipment.armor?.name === "仁王盾" &&
        (card.suit === "spade" || card.suit === "club")
      ) {
        continue;
      }

      // Check for dodge in target's hand (auto-resolve for AI players)
      const dodgeIdx = target.handCards.findIndex((c) => c.name === "闪");

      if (target.id === game.players[this.humanIndex]?.id) {
        // Human player — open response window
        this.pendingWindow = {
          playerId: target.id,
          cardName: "闪",
          message: "是否使用闪?",
          options: ["使用闪", "不使用"],
        };
        game.discardPile.push(card);
        return; // Pause resolution until response
      }

      // AI auto-dodge
      if (dodgeIdx !== -1) {
        const dodge = target.handCards.splice(dodgeIdx, 1)[0]!;
        game.discardPile.push(dodge);
        continue;
      }

      // Bagua armor auto-judge
      if (target.equipment.armor?.name === "八卦阵") {
        const judged = game.drawPile.shift();
        if (judged) {
          game.discardPile.push(judged);
          if (RED_SUITS.has(judged.suit)) continue; // Dodged
        }
      }

      // Deal damage
      let dmg = 1 + bonus;

      // Tengja armor
      if (target.equipment.armor?.name === "藤甲") {
        if (card.name === "杀") {
          dmg = 0;
        } else if (card.name === "火杀") {
          dmg += 1;
        }
      }
      // White silver lion
      if (target.equipment.armor?.name === "白银狮子" && dmg > 1) {
        dmg = 1;
      }

      if (dmg > 0) {
        target.hp -= dmg;
        if (target.hp <= 0) target.alive = false;
      }
    }

    game.discardPile.push(card);
  }

  private resolvePeach(game: GameState, player: PlayerState): void {
    if (player.hp < player.maxHp) {
      player.hp = Math.min(player.hp + 1, player.maxHp);
    }
  }

  private resolveWine(game: GameState, player: PlayerState, card: Card): void {
    game.activeEffects.push({
      id: `${player.id}:wine:${game.turnCount}`,
      name: "酒",
      sourcePlayerId: player.id,
      targetPlayerIds: [player.id],
      duration: "turn",
      properties: { damageBonus: 1 },
    });
    game.discardPile.push(card);
  }

  private resolveTrick(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    switch (card.name) {
      case "无中生有":
        this.drawCards(player, 2);
        break;
      case "过河拆桥": {
        const target = targets[0];
        if (target) {
          const taken = this.takeFirstCard(target);
          if (taken) game.discardPile.push(taken);
        }
        break;
      }
      case "顺手牵羊": {
        const target = targets[0];
        if (target) {
          const taken = this.takeFirstCard(target);
          if (taken) player.handCards.push(taken);
        }
        break;
      }
      case "南蛮入侵":
        for (const p of game.players) {
          if (!p.alive || p.id === player.id) continue;
          const sha = p.handCards.findIndex((c) => SLASH_NAMES.has(c.name));
          if (sha !== -1) {
            const used = p.handCards.splice(sha, 1)[0]!;
            game.discardPile.push(used);
          } else {
            p.hp -= 1;
            if (p.hp <= 0) p.alive = false;
          }
        }
        break;
      case "万箭齐发":
        for (const p of game.players) {
          if (!p.alive || p.id === player.id) continue;
          const shan = p.handCards.findIndex((c) => c.name === "闪");
          if (shan !== -1) {
            const used = p.handCards.splice(shan, 1)[0]!;
            game.discardPile.push(used);
          } else {
            p.hp -= 1;
            if (p.hp <= 0) p.alive = false;
          }
        }
        break;
      case "桃园结义":
        for (const p of game.players) {
          if (p.alive && p.hp < p.maxHp) {
            p.hp = Math.min(p.hp + 1, p.maxHp);
          }
        }
        break;
      case "决斗": {
        const target = targets[0];
        if (target) {
          // Simplified duel: target loses 1 HP
          target.hp -= 1;
          if (target.hp <= 0) target.alive = false;
        }
        break;
      }
      default:
        // Unsupported tricks are just discarded
        break;
    }
    game.discardPile.push(card);
  }

  /* ================================================================ */
  /*  Private — helpers                                                */
  /* ================================================================ */

  private requireGame(): GameState {
    if (!this.game) throw new Error("Game not initialised");
    return this.game;
  }

  private currentPlayer(): PlayerState {
    const game = this.requireGame();
    const p = game.players[game.currentPlayerIndex];
    if (!p) throw new Error("No current player");
    return p;
  }

  private drawCards(player: PlayerState, count: number): void {
    const game = this.requireGame();
    const cards = game.drawPile.splice(0, count);
    player.handCards.push(...cards);

    // Recycle discard if draw pile runs out
    if (game.drawPile.length === 0 && game.discardPile.length > 0) {
      game.drawPile.push(...game.discardPile);
      game.discardPile.length = 0;
      fisherYatesShuffle(game.drawPile);
    }
  }

  private takeFirstCard(player: PlayerState): Card | null {
    if (player.handCards.length > 0) {
      return player.handCards.splice(0, 1)[0] ?? null;
    }
    const slots: (keyof EquipmentSlots)[] = [
      "weapon", "armor", "defensiveHorse", "offensiveHorse", "treasure",
    ];
    for (const slot of slots) {
      const card = player.equipment[slot];
      if (card) {
        player.equipment[slot] = null;
        return card;
      }
    }
    return null;
  }

  private advanceToNextAlive(): GameTableState {
    const game = this.requireGame();
    const alive = game.players.filter((p) => p.alive);
    if (alive.length === 0) {
      game.gameOver = true;
      const snap = this.buildSnapshot();
      this.notify(snap);
      return snap;
    }

    const curSeat = game.players[game.currentPlayerIndex]?.seat ?? 0;
    const sorted = [...alive].sort((a, b) => a.seat - b.seat);
    const next = sorted.find((p) => p.seat > curSeat) ?? sorted[0]!;
    game.currentPlayerIndex = game.players.findIndex((p) => p.id === next.id);
    if (game.currentPlayerIndex < 0) game.currentPlayerIndex = 0;
    game.turnCount += 1;

    return this.startTurn();
  }

  private canPlayCard(game: GameState, player: PlayerState, card: Card): boolean {
    if (card.type === "equipment") return true;
    if (card.name === "桃") return player.hp < player.maxHp;
    if (card.name === "闪") return false;
    if (SLASH_NAMES.has(card.name)) {
      if (game.currentPhase !== "play") return false;
      const hasCrossbow = player.equipment.weapon?.name === "诸葛连弩";
      if (!hasCrossbow && this.slashesThisTurn >= 1) return false;
      return getAttackTargets(game, player).length > 0;
    }
    return game.currentPhase === "play";
  }

  private checkVictory(game: GameState): void {
    const alive = game.players.filter((p) => p.alive);
    if (alive.length <= 1) {
      game.gameOver = true;
      game.winnerFaction = alive[0]?.faction ?? null;
    }

    // KW victory: all alive share same revealed faction
    const factions = new Set(alive.map((p) => p.faction).filter(Boolean));
    if (factions.size === 1 && alive.every((p) => p.faction !== null)) {
      game.gameOver = true;
      game.winnerFaction = [...factions][0] ?? null;
    }
  }

  private notify(snap: GameTableState): void {
    if (this.onChange) this.onChange(snap);
  }

  /* ================================================================ */
  /*  Snapshot builder: internal GameState -> Zustand GameTableState   */
  /* ================================================================ */

  buildSnapshot(): GameTableState {
    const game = this.requireGame();
    const human = game.players[this.humanIndex];

    const players: PlayerSlotData[] = game.players.map((p) => ({
      id: p.id,
      name: p.name,
      seat: p.seat,
      mainGeneral: p.mainGeneral?.revealed ? p.mainGeneral.generalId : null,
      deputyGeneral: p.deputyGeneral?.revealed ? p.deputyGeneral.generalId : null,
      hp: p.hp,
      maxHp: p.maxHp,
      handCardCount: p.handCards.length,
      equipment: {
        weapon: p.equipment.weapon?.name ?? null,
        armor: p.equipment.armor?.name ?? null,
        defensiveHorse: p.equipment.defensiveHorse?.name ?? null,
        offensiveHorse: p.equipment.offensiveHorse?.name ?? null,
        treasure: p.equipment.treasure?.name ?? null,
      },
      faction: (p.faction as UIFaction) ?? null,
      alive: p.alive,
    }));

    const hand: GameCard[] = human
      ? human.handCards.map((c) => ({
          id: c.id,
          name: c.name,
          suit: c.suit as GameCard["suit"],
          number: c.number,
          category: (c.type === "basic" ? "basic" : c.type === "trick" ? "trick" : "equipment") as GameCard["category"],
        }))
      : [];

    const skills: SkillData[] = human
      ? human.skills.map((sid) => ({
          id: sid,
          name: sid,
          description: "",
          enabled: true,
        }))
      : [];

    let responsePrompt: ResponsePrompt | null = null;
    if (this.pendingWindow) {
      responsePrompt = {
        promptId: `rp-${Date.now()}`,
        message: this.pendingWindow.message,
        cardName: this.pendingWindow.cardName,
      };
    }

    return {
      players,
      drawPileCount: game.drawPile.length,
      discardPileCount: game.discardPile.length,
      currentPlayerIndex: game.currentPlayerIndex,
      currentPhase: game.currentPhase as UIPhaseType,
      turnCount: game.turnCount,
      gameOver: game.gameOver,
      hand,
      selectedCardIds: [],
      skills,
      currentAction: null,
      targetSelection: null,
      responsePrompt,
    };
  }
}
