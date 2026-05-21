import { describe, expect, it } from "vitest";
import { RATING_TIERS, emptyRating, topTier, type GeneralRating } from "./ratings.js";

function rating(counts: Partial<Record<typeof RATING_TIERS[number], number>>): GeneralRating {
  const full = Object.fromEntries(RATING_TIERS.map((t) => [t, counts[t] ?? 0])) as GeneralRating["counts"];
  const total = Object.values(full).reduce((a, b) => a + b, 0);
  return { counts: full, total, updatedAt: "2026-05-21T00:00:00Z" };
}

describe("RATING_TIERS", () => {
  it("orders tiers from highest to lowest", () => {
    expect(RATING_TIERS).toEqual(["夯", "顶级", "人上人", "npc", "拉完了"]);
  });
});

describe("emptyRating", () => {
  it("initializes all counters to 0 and total to 0", () => {
    const r = emptyRating();
    expect(r.total).toBe(0);
    for (const t of RATING_TIERS) expect(r.counts[t]).toBe(0);
  });
});

describe("topTier", () => {
  it("returns null when no rating exists", () => {
    expect(topTier(null)).toBeNull();
  });

  it("returns null when total is 0", () => {
    expect(topTier(rating({}))).toBeNull();
  });

  it("returns the only voted tier", () => {
    expect(topTier(rating({ 人上人: 3 }))).toBe("人上人");
  });

  it("returns the tier with the most votes", () => {
    expect(topTier(rating({ 夯: 1, 人上人: 3, npc: 2 }))).toBe("人上人");
  });

  it("on tie, prefers the higher tier (earlier in RATING_TIERS)", () => {
    expect(topTier(rating({ 顶级: 2, npc: 2 }))).toBe("顶级");
    expect(topTier(rating({ 夯: 1, 拉完了: 1 }))).toBe("夯");
  });
});
