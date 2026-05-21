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
    const t = RATING_TIERS[i] as RatingTier;
    if (rating.counts[t] > bestCount) {
      best = t;
      bestCount = rating.counts[t];
    }
  }
  return bestCount > 0 ? best : null;
}

/** Numeric score per tier, higher = better. Used for weighted-average rating. */
const TIER_SCORES: Record<RatingTier, number> = {
  "夯": 5,
  "顶级": 4,
  "人上人": 3,
  "npc": 2,
  "拉完了": 1,
};

/** Weighted-average score in [1, 5], or null when no votes exist. */
export function averageScore(rating: GeneralRating | null): number | null {
  if (!rating || rating.total === 0) return null;
  let sum = 0;
  for (const t of RATING_TIERS) sum += TIER_SCORES[t] * rating.counts[t];
  return sum / rating.total;
}

/**
 * Returns the tier whose score is closest to the weighted-average rating.
 * On ties (e.g., avg lands exactly between two tiers), prefers the higher tier.
 * Returns null when no votes exist.
 */
export function averageTier(rating: GeneralRating | null): RatingTier | null {
  const avg = averageScore(rating);
  if (avg === null) return null;
  let best: RatingTier = RATING_TIERS[0];
  let bestDiff = Math.abs(TIER_SCORES[best] - avg);
  for (let i = 1; i < RATING_TIERS.length; i++) {
    const t = RATING_TIERS[i] as RatingTier;
    const d = Math.abs(TIER_SCORES[t] - avg);
    if (d < bestDiff) {
      best = t;
      bestDiff = d;
    }
  }
  return best;
}
