import type { Card, Suit } from '@sgs/data';
import { DamageManager } from '../damage/damage-manager.js';
import { ResolutionStack } from '../resolution/resolution-stack.js';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import { TargetSelector } from '../target/target-selector.js';
import type { EquipmentSlot } from './types.js';

const EQUIPMENT_ORDER: readonly EquipmentSlot[] = [
  'weapon',
  'armor',
  'defensiveHorse',
  'offensiveHorse',
  'treasure',
];

const SLASH_CARD_NAMES = new Set(['杀', '火杀', '雷杀']);
const RED_SUITS = new Set<Suit>(['heart', 'diamond']);
const BLACK_SUITS = new Set<Suit>(['spade', 'club']);

const SLASH_TURN_MARK = '__card_manager_slash_turn';
const SLASH_COUNT_MARK = '__card_manager_slash_count';
const WINE_TURN_MARK = '__card_manager_wine_turn';
const WINE_BONUS_MARK = '__card_manager_wine_bonus';

export class CardManager {
  readonly stack: ResolutionStack;
  readonly targetSelector: TargetSelector;
  readonly damageManager: DamageManager;

  constructor(
    stack = new ResolutionStack(),
    targetSelector = new TargetSelector(),
    damageManager = new DamageManager(stack),
  ) {
    this.stack = stack;
    this.targetSelector = targetSelector;
    this.damageManager = damageManager;
  }

  playCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[] = [],
  ): void {
    this.playOrUseCard(game, player, card, targets, true);
  }

  useCard(game: GameState, player: PlayerState, card: Card): void;
  useCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets?: PlayerState[],
  ): void;
  useCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[] = [],
  ): void {
    this.playOrUseCard(game, player, card, targets, false);
  }

  discardCard(game: GameState, player: PlayerState, card: Card): void {
    this.detachCard(player, card);
    game.discardPile.push(card);
    this.stack.push({
      type: 'discardCards',
      player: player.id,
      cards: [card],
    });
  }

  equipCard(game: GameState, player: PlayerState, card: Card): void {
    const slot = this.getEquipmentSlot(card);
    this.detachCard(player, card);

    const replaced = this.unequipCard(game, player, slot);
    if (replaced) {
      game.discardPile.push(replaced);
      this.stack.push({
        type: 'discardCards',
        player: player.id,
        cards: [replaced],
      });
    }

    player.equipment[slot] = card;
  }

  unequipCard(_game: GameState, player: PlayerState, slot: EquipmentSlot): Card | null {
    const equipped = player.equipment[slot];
    if (!equipped) {
      return null;
    }

    player.equipment[slot] = null;
    return equipped;
  }

  drawCards(game: GameState, player: PlayerState, count: number): Card[] {
    const drawn = game.drawPile.splice(0, count);
    if (drawn.length > 0) {
      player.handCards.push(...drawn);
    }

    this.stack.push({
      type: 'drawCards',
      player: player.id,
      count: drawn.length,
    });

    return drawn;
  }

  private playOrUseCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
    fromHand: boolean,
  ): void {
    this.validateCardUse(game, player, card, targets);

    if (fromHand && !this.removeCardById(player.handCards, card.id)) {
      throw new Error(`Card ${card.id} is not in ${player.name}'s hand`);
    }

    this.stack.push({
      type: 'playCard',
      player: player.id,
      card,
      targets: targets.map((target) => target.id),
    });

    if (card.type === 'equipment') {
      this.equipCard(game, player, card);
      return;
    }

    this.resolveCard(game, player, card, targets);
    this.discardCard(game, player, card);
  }

  private validateCardUse(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    if (!player.alive) {
      throw new Error(`${player.name} cannot use cards while dead`);
    }

    switch (card.type) {
      case 'basic':
        this.validateBasicCard(game, player, card, targets);
        return;
      case 'trick':
        this.validateTrickCard(game, player, card, targets);
        return;
      case 'equipment':
        if (targets.length > 0) {
          throw new Error('Equipment cards do not take targets');
        }
        this.getEquipmentSlot(card);
        return;
      default:
        throw new Error(`Unsupported card type: ${(card as { type: string }).type}`);
    }
  }

  private validateBasicCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    if (this.isSlash(card)) {
      if (game.currentPhase !== 'play') {
        throw new Error('杀 can only be played during the play phase');
      }
      if (targets.length === 0) {
        throw new Error('杀 requires at least one target');
      }
      if (!this.hasCrossbowEquipped(player) && this.getSlashCountForTurn(game, player) >= 1) {
        throw new Error('Only one 杀 can be played per turn without 诸葛连弩');
      }
      for (const target of targets) {
        if (!this.targetSelector.isValidTarget(game, player, target, card)) {
          throw new Error(`${target.name} is not a valid target for ${card.name}`);
        }
      }
      return;
    }

    switch (card.name) {
      case '闪':
        if (game.currentPhase === 'play') {
          throw new Error('闪 cannot be actively played during the play phase');
        }
        return;
      case '桃':
        this.validatePeachUse(game, player, targets);
        return;
      case '酒':
        this.validateWineUse(game, player, targets);
        return;
      default:
        throw new Error(`Unsupported basic card: ${card.name}`);
    }
  }

  private validatePeachUse(
    game: GameState,
    player: PlayerState,
    targets: PlayerState[],
  ): void {
    if (targets.length > 1) {
      throw new Error('桃 accepts at most one target');
    }

    const target = targets[0];
    if (target && target.hp <= 0) {
      if (!target.alive) {
        throw new Error('桃 cannot save a dead player');
      }
      return;
    }

    if (game.currentPhase !== 'play') {
      throw new Error('桃 can only be used outside the play phase to save a dying player');
    }
    if (target && target.id !== player.id) {
      throw new Error('桃 can only target self during the play phase');
    }
    if (player.hp >= player.maxHp) {
      throw new Error('桃 can only be used while wounded');
    }
  }

  private validateWineUse(
    game: GameState,
    player: PlayerState,
    targets: PlayerState[],
  ): void {
    if (targets.length > 1) {
      throw new Error('酒 accepts at most one target');
    }

    const target = targets[0];
    if (target && target.hp <= 0) {
      if (!target.alive) {
        throw new Error('酒 cannot save a dead player');
      }
      return;
    }

    if (game.currentPhase !== 'play') {
      throw new Error('酒 can only be used in the play phase unless saving a dying player');
    }
    if (target && target.id !== player.id) {
      throw new Error('酒 only targets the user unless saving a dying player');
    }
  }

  private validateTrickCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    switch (card.name) {
      case '无中生有':
        if (targets.length > 0) {
          throw new Error('无中生有 does not target players');
        }
        return;
      case '过河拆桥': {
        const target = this.getSingleOtherTarget(player, targets, card.name);
        if (this.getAvailableCards(target).length === 0) {
          throw new Error('过河拆桥 requires the target to have a card');
        }
        return;
      }
      case '顺手牵羊': {
        const target = this.getSingleOtherTarget(player, targets, card.name);
        if (this.getAvailableCards(target).length === 0) {
          throw new Error('顺手牵羊 requires the target to have a card');
        }
        if (this.targetSelector.getDistance(game, player, target) > 1) {
          throw new Error('顺手牵羊 requires the target to be within distance 1');
        }
        return;
      }
      default:
        throw new Error(`Unsupported trick card: ${card.name}`);
    }
  }

  private resolveCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    if (card.type === 'basic') {
      this.resolveBasicCard(game, player, card, targets);
      return;
    }

    if (card.type === 'trick') {
      this.resolveTrickCard(game, player, card, targets);
      return;
    }

    throw new Error(`Unsupported playable card type: ${card.type}`);
  }

  private resolveBasicCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    if (this.isSlash(card)) {
      this.resolveSlash(game, player, card, targets);
      return;
    }

    switch (card.name) {
      case '闪':
        return;
      case '桃':
        this.resolvePeach(game, player, targets);
        return;
      case '酒':
        this.resolveWine(game, player, targets);
        return;
      default:
        throw new Error(`Unsupported basic card: ${card.name}`);
    }
  }

  private resolveSlash(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    this.recordSlashUse(game, player);
    const wineBonus = this.consumeWineBonus(game, player);

    for (const target of targets) {
      if (this.isRenwangShieldProtected(target, card)) {
        this.stack.push({
          type: 'response',
          player: target.id,
          accepted: true,
        });
        continue;
      }

      if (this.tryUseDodge(game, target)) {
        continue;
      }

      let damage = 1 + wineBonus;
      damage = this.applyArmorDamageModifiers(target, card, damage);

      if (damage <= 0) {
        continue;
      }

      this.damageManager.dealDamage(game, {
        source: player.id,
        target: target.id,
        amount: damage,
        element: this.getSlashElement(card),
        card,
      });
    }
  }

  private resolvePeach(
    game: GameState,
    player: PlayerState,
    targets: PlayerState[],
  ): void {
    const target = targets[0];
    if (target && target.hp <= 0) {
      this.damageManager.recover(game, target, 1);
      return;
    }

    this.damageManager.recover(game, player, 1);
  }

  private resolveWine(
    game: GameState,
    player: PlayerState,
    targets: PlayerState[],
  ): void {
    const target = targets[0];
    if (target && target.hp <= 0) {
      this.damageManager.recover(game, target, 1);
      return;
    }

    player.marks[WINE_TURN_MARK] = game.turnCount;
    player.marks[WINE_BONUS_MARK] = 1;

    game.activeEffects = game.activeEffects.filter(
      (effect) => !(effect.name === '酒' && effect.sourcePlayerId === player.id),
    );
    game.activeEffects.push({
      id: `${player.id}:wine:${game.turnCount}`,
      name: '酒',
      sourcePlayerId: player.id,
      targetPlayerIds: [player.id],
      duration: 'turn',
      properties: {
        damageBonus: 1,
        turn: game.turnCount,
      },
    });
  }

  private resolveTrickCard(
    game: GameState,
    player: PlayerState,
    card: Card,
    targets: PlayerState[],
  ): void {
    switch (card.name) {
      case '无中生有':
        this.drawCards(game, player, 2);
        return;
      case '过河拆桥':
        this.resolveDismantle(game, player, targets[0]!);
        return;
      case '顺手牵羊':
        this.resolveSnatch(player, targets[0]!);
        return;
      default:
        throw new Error(`Unsupported trick card: ${card.name}`);
    }
  }

  private resolveDismantle(
    game: GameState,
    player: PlayerState,
    target: PlayerState,
  ): void {
    const removed = this.takeFirstAvailableCard(target);
    if (removed) {
      this.discardCard(game, target, removed);
      return;
    }

    this.stack.push({
      type: 'response',
      player: player.id,
      accepted: false,
    });
  }

  private resolveSnatch(player: PlayerState, target: PlayerState): void {
    const removed = this.takeFirstAvailableCard(target);
    if (removed) {
      player.handCards.push(removed);
    }
  }

  private tryUseDodge(game: GameState, target: PlayerState): boolean {
    const dodge = target.handCards.find((card) => card.name === '闪');
    if (dodge) {
      this.discardCard(game, target, dodge);
      this.stack.push({
        type: 'response',
        player: target.id,
        card: dodge,
        accepted: true,
      });
      return true;
    }

    if (this.tryBaguaDodge(game, target)) {
      this.stack.push({
        type: 'response',
        player: target.id,
        accepted: true,
      });
      return true;
    }

    this.stack.push({
      type: 'response',
      player: target.id,
      accepted: false,
    });
    return false;
  }

  private tryBaguaDodge(game: GameState, target: PlayerState): boolean {
    const armor = target.equipment.armor;
    if (!armor || armor.name !== '八卦阵') {
      return false;
    }

    const judged = game.drawPile.shift();
    if (!judged) {
      return false;
    }

    game.discardPile.push(judged);
    return RED_SUITS.has(judged.suit);
  }

  private applyArmorDamageModifiers(target: PlayerState, card: Card, damage: number): number {
    const armor = target.equipment.armor?.name;
    if (!armor) {
      return damage;
    }

    if (armor === '白银狮子' && damage > 1) {
      return 1;
    }

    if (armor === '藤甲') {
      if (card.name === '杀') {
        return 0;
      }
      if (card.name === '火杀') {
        return damage + 1;
      }
    }

    return damage;
  }

  private isRenwangShieldProtected(target: PlayerState, card: Card): boolean {
    return (
      target.equipment.armor?.name === '仁王盾'
      && this.isSlash(card)
      && BLACK_SUITS.has(card.suit)
    );
  }

  private hasCrossbowEquipped(player: PlayerState): boolean {
    return player.equipment.weapon?.name === '诸葛连弩';
  }

  private getSlashCountForTurn(game: GameState, player: PlayerState): number {
    if (player.marks[SLASH_TURN_MARK] !== game.turnCount) {
      return 0;
    }

    return player.marks[SLASH_COUNT_MARK] ?? 0;
  }

  private recordSlashUse(game: GameState, player: PlayerState): void {
    if (player.marks[SLASH_TURN_MARK] !== game.turnCount) {
      player.marks[SLASH_TURN_MARK] = game.turnCount;
      player.marks[SLASH_COUNT_MARK] = 1;
      return;
    }

    player.marks[SLASH_COUNT_MARK] = (player.marks[SLASH_COUNT_MARK] ?? 0) + 1;
  }

  private consumeWineBonus(game: GameState, player: PlayerState): number {
    if (player.marks[WINE_TURN_MARK] !== game.turnCount) {
      this.clearWineEffect(game, player);
      return 0;
    }

    const bonus = player.marks[WINE_BONUS_MARK] ?? 0;
    player.marks[WINE_TURN_MARK] = 0;
    player.marks[WINE_BONUS_MARK] = 0;
    this.clearWineEffect(game, player);
    return bonus;
  }

  private clearWineEffect(game: GameState, player: PlayerState): void {
    game.activeEffects = game.activeEffects.filter(
      (effect) => !(effect.name === '酒' && effect.sourcePlayerId === player.id),
    );
  }

  private getSingleOtherTarget(
    player: PlayerState,
    targets: PlayerState[],
    cardName: string,
  ): PlayerState {
    if (targets.length !== 1) {
      throw new Error(`${cardName} requires exactly one target`);
    }

    const target = targets[0]!;
    if (!target.alive) {
      throw new Error(`${cardName} cannot target dead players`);
    }
    if (target.id === player.id) {
      throw new Error(`${cardName} cannot target self`);
    }

    return target;
  }

  private getEquipmentSlot(card: Card): EquipmentSlot {
    if (card.type !== 'equipment') {
      throw new Error(`${card.name} is not an equipment card`);
    }
    if (
      card.subtype !== 'weapon'
      && card.subtype !== 'armor'
      && card.subtype !== 'defensiveHorse'
      && card.subtype !== 'offensiveHorse'
      && card.subtype !== 'treasure'
    ) {
      throw new Error(`${card.name} is missing a valid equipment subtype`);
    }

    return card.subtype;
  }

  private getSlashElement(card: Card): 'fire' | 'thunder' | undefined {
    if (card.name === '火杀') {
      return 'fire';
    }
    if (card.name === '雷杀') {
      return 'thunder';
    }
    return undefined;
  }

  private isSlash(card: Card): boolean {
    return SLASH_CARD_NAMES.has(card.name);
  }

  private getAvailableCards(player: PlayerState): Card[] {
    const equipmentCards = EQUIPMENT_ORDER
      .map((slot) => player.equipment[slot])
      .filter((card): card is Card => card !== null);

    return [...player.handCards, ...equipmentCards, ...player.judgmentArea];
  }

  private takeFirstAvailableCard(player: PlayerState): Card | null {
    const available = this.getAvailableCards(player)[0];
    if (!available) {
      return null;
    }

    this.detachCard(player, available);
    return available;
  }

  private detachCard(player: PlayerState, card: Card): boolean {
    if (this.removeCardById(player.handCards, card.id)) {
      return true;
    }

    for (const slot of EQUIPMENT_ORDER) {
      if (player.equipment[slot]?.id === card.id) {
        player.equipment[slot] = null;
        return true;
      }
    }

    return this.removeCardById(player.judgmentArea, card.id);
  }

  private removeCardById(cards: Card[], cardId: Card['id']): boolean {
    const index = cards.findIndex((entry) => entry.id === cardId);
    if (index === -1) {
      return false;
    }

    cards.splice(index, 1);
    return true;
  }
}
