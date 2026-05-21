/**
 * Visitor-rating types + pure helpers for the 5-tier voting system.
 *
 * Storage and KV access live in entity-store.ts; this file is pure.
 */

export const RATING_TIERS = ["夯", "顶级", "人上人", "npc", "拉完了"] as const;
export type RatingTier = typeof RATING_TIERS[number];

export function isRatingTier(v: unknown): v is RatingTier {
  return typeof v === "string" && (RATING_TIERS as readonly string[]).includes(v);
}

export interface GeneralRating {
  counts: Record<RatingTier, number>;
  total: number;
  updatedAt: string;
}

export interface VoteEvent {
  generalId: string;
  from: RatingTier | null;
  to: RatingTier;
  ts: string;
  ipHash: string;
}

export type RatingsAll = Record<string, GeneralRating>;

export function emptyRating(): GeneralRating {
  const counts = Object.fromEntries(RATING_TIERS.map((t) => [t, 0])) as Record<RatingTier, number>;
  return { counts, total: 0, updatedAt: new Date(0).toISOString() };
}

/**
 * Returns the tier with the most votes. Ties resolved by RATING_TIERS order
 * (higher tier wins). Returns null when no votes exist.
 */
export function topTier(rating: GeneralRating | null): RatingTier | null {
  if (!rating || rating.total === 0) return null;
  let best: RatingTier = RATING_TIERS[0];
  let bestCount = rating.counts[best];
  for (let i = 1; i < RATING_TIERS.length; i++) {
    const t = RATING_TIERS[i];
    if (rating.counts[t] > bestCount) {
      best = t;
      bestCount = rating.counts[t];
    }
  }
  return bestCount > 0 ? best : null;
}
