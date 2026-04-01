import type { Faction, GeneralId } from '@sgs/data';
import type { PlayerState } from '../state/player.js';
import type { KingdomWarManager } from './kingdom-war-manager.js';

/**
 * A canonical pair for the 珠联璧合 (Perfect Match) mechanic.
 *
 * When a player's main and deputy generals form a known pair and both are
 * revealed, the player receives a one-time bonus (typically draw 2 cards).
 */
export interface PerfectMatchPair {
  generalA: GeneralId;
  generalB: GeneralId;
}

export interface PerfectMatchBonus {
  type: 'draw';
  amount: number;
}

/**
 * Manages the 珠联璧合 (Perfect Match) mechanic for Kingdom War.
 *
 * Official rules: when both a player's main and deputy generals are revealed,
 * if they form a recognised pair the player draws 2 cards as a one-time bonus.
 */
export class PerfectMatchManager {
  /** Canonical pairs stored as a set of "idA|idB" keys (sorted). */
  private readonly pairSet = new Set<string>();
  /** Track which players have already claimed their bonus. */
  private readonly claimedPlayers = new Set<string>();

  constructor(private readonly kwManager: KingdomWarManager) {
    this.registerOfficialPairs();
  }

  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------

  /**
   * Returns `true` when the player's main + deputy generals form a known
   * perfect-match pair **and** both generals have been revealed.
   */
  checkPerfectMatch(player: PlayerState): boolean {
    const mainId = player.mainGeneral?.generalId;
    const deputyId = player.deputyGeneral?.generalId;

    if (!mainId || !deputyId) {
      return false;
    }

    if (!player.mainGeneral?.revealed || !player.deputyGeneral?.revealed) {
      return false;
    }

    return this.isPair(mainId, deputyId);
  }

  /**
   * Returns the bonus the player should receive, or `null` if the pair does
   * not qualify (not a pair, not both revealed, or already claimed).
   */
  getPerfectMatchBonus(player: PlayerState): PerfectMatchBonus | null {
    if (!this.checkPerfectMatch(player)) {
      return null;
    }

    if (this.claimedPlayers.has(player.id)) {
      return null;
    }

    return { type: 'draw', amount: 2 };
  }

  /**
   * Mark the bonus as claimed so it cannot be collected twice.
   */
  claimBonus(player: PlayerState): void {
    this.claimedPlayers.add(player.id);
  }

  /**
   * Whether two generals form a canonical pair (order-independent).
   */
  isPair(a: GeneralId, b: GeneralId): boolean {
    return this.pairSet.has(this.pairKey(a, b));
  }

  /**
   * All registered pair entries (for inspection / serialization).
   */
  getAllPairs(): PerfectMatchPair[] {
    return [...this.pairSet].map((key) => {
      const [generalA, generalB] = key.split('|') as [string, string];
      return {
        generalA: generalA as GeneralId,
        generalB: generalB as GeneralId,
      };
    });
  }

  /**
   * Register an additional pair at runtime (e.g. from expansion packs).
   */
  registerPair(a: GeneralId, b: GeneralId): void {
    this.pairSet.add(this.pairKey(a, b));
  }

  // -------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------

  /** Deterministic key — alphabetically sorted so (a,b) === (b,a). */
  private pairKey(a: GeneralId, b: GeneralId): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  /**
   * Register the 16 canonical 珠联璧合 pairs from official Kingdom War rules.
   *
   * Sources: official Sanguosha Kingdom War rulebook & FAQ.
   */
  private registerOfficialPairs(): void {
    const pairs: [string, string][] = [
      // --- SHU 蜀 ---
      ['liubei', 'guanyu'],         // 刘备 + 关羽
      ['liubei', 'zhangfei'],       // 刘备 + 张飞
      ['guanyu', 'zhangfei'],       // 关羽 + 张飞 (桃园三结义)
      ['zhuge_liang', 'huang_yueying'], // 诸葛亮 + 黄月英
      ['liubei', 'zhuge_liang'],    // 刘备 + 诸葛亮

      // --- WEI 魏 ---
      ['caocao', 'xuchu'],          // 曹操 + 许褚
      ['caocao', 'dianwei'],        // 曹操 + 典韦
      ['caocao', 'guojia'],         // 曹操 + 郭嘉

      // --- WU 吴 ---
      ['zhouyu', 'xiaoqiao'],       // 周瑜 + 小乔
      ['sunce', 'daqiao'],          // 孙策 + 大乔
      ['sunquan', 'zhouyu'],        // 孙权 + 周瑜

      // --- QUN 群 ---
      ['lvbu', 'diaochan'],         // 吕布 + 貂蝉

      // --- Cross-faction ---
      ['guanyu', 'caocao'],         // 关羽 + 曹操 (降汉不降曹)
      ['zhuge_liang', 'zhouyu'],    // 诸葛亮 + 周瑜

      // --- Additional official pairs ---
      ['sunce', 'zhouyu'],          // 孙策 + 周瑜
      ['liubei', 'sun_shangxiang'], // 刘备 + 孙尚香
    ];

    for (const [a, b] of pairs) {
      this.registerPair(a as GeneralId, b as GeneralId);
    }
  }
}
