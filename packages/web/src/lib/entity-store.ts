import type { General, Skill, FAQ, GeneralId, SkillId, FAQId } from "@sgs/data";
import { Redis } from "@upstash/redis";
import { markFallbackUsed } from "./fallback-flag";
import { emptyRating, isRatingTier, type GeneralRating, type RatingsAll, type RatingTier, type VoteEvent } from "./ratings";

import generalsSeed from "../../../data/src/generals.json" with { type: "json" };
import skillsSeed from "../../../data/src/skills.json" with { type: "json" };
import faqsSeed from "../../../data/src/faq.json" with { type: "json" };

// Vercel's Upstash Marketplace integration auto-injects KV_REST_API_URL /
// KV_REST_API_TOKEN (legacy Vercel KV naming). Standard Upstash convention is
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Accept both.
function redisUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
}
function redisToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
}

let _redis: Redis | null = null;
function redis(): Redis | null {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) return null;
  if (!_redis) {
    _redis = new Redis({ url, token });
  }
  return _redis;
}

/** Test-only: reset the singleton so env mutations between tests take effect. */
export function __resetForTests(): void {
  _redis = null;
}

const KEY = {
  general: (id: string) => `general:${id}`,
  generalsIndex: "generals:index",
  skill: (id: string) => `skill:${id}`,
  skillsIndex: "skills:index",
  skillsByGeneral: (gid: string) => `skills:by-general:${gid}`,
  faq: (id: string) => `faq:${id}`,
  faqsIndex: "faqs:index",
  ratings: "ratings:all",
  ratingsLog: (yyyymmdd: string) => `ratings:log:${yyyymmdd}`,
};

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Redis timeout after ${ms}ms (${label})`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readWithFallback<T>(
  redisRead: () => Promise<T>,
  jsonFallback: () => T,
  label: string,
): Promise<T> {
  const r = redis();
  if (!r) {
    markFallbackUsed();
    return jsonFallback();
  }
  try {
    return await withTimeout(redisRead(), 3000, label);
  } catch (err) {
    console.warn(`[entityStore] Redis read failed for ${label}; falling back to bundled JSON`, err);
    markFallbackUsed();
    return jsonFallback();
  }
}

async function getJsonArray<T>(r: Redis, indexKey: string, valueKey: (id: string) => string): Promise<T[]> {
  const ids = (await r.get<string[]>(indexKey)) ?? [];
  if (ids.length === 0) return [];
  const values = await r.mget<(T | null)[]>(...ids.map(valueKey));
  return values.filter((v): v is T => v != null);
}

async function updateIndex(r: Redis, indexKey: string, mutator: (cur: string[]) => string[]): Promise<void> {
  const cur = (await r.get<string[]>(indexKey)) ?? [];
  const next = mutator(cur);
  await r.set(indexKey, next);
}

export const entityStore = {
  // ---- Reads ----
  async getGeneral(id: GeneralId): Promise<General | null> {
    return readWithFallback(
      async () => (await redis()!.get<General>(KEY.general(id))) ?? null,
      () => (generalsSeed as unknown as General[]).find((g) => g.id === id) ?? null,
      `general:${id}`,
    );
  },
  async getGenerals(): Promise<General[]> {
    return readWithFallback(
      () => getJsonArray<General>(redis()!, KEY.generalsIndex, KEY.general),
      () => generalsSeed as unknown as General[],
      "generals",
    );
  },
  async getSkill(id: SkillId): Promise<Skill | null> {
    return readWithFallback(
      async () => (await redis()!.get<Skill>(KEY.skill(id))) ?? null,
      () => (skillsSeed as unknown as Skill[]).find((s) => s.id === id) ?? null,
      `skill:${id}`,
    );
  },
  async getSkills(): Promise<Skill[]> {
    return readWithFallback(
      () => getJsonArray<Skill>(redis()!, KEY.skillsIndex, KEY.skill),
      () => skillsSeed as unknown as Skill[],
      "skills",
    );
  },
  async getSkillsByGeneral(generalId: GeneralId): Promise<Skill[]> {
    return readWithFallback(
      async () => {
        const r = redis()!;
        const ids = (await r.get<string[]>(KEY.skillsByGeneral(generalId))) ?? [];
        if (ids.length === 0) return [];
        const skills = await r.mget<(Skill | null)[]>(...ids.map(KEY.skill));
        return skills.filter((s): s is Skill => s != null);
      },
      () => (skillsSeed as unknown as Skill[]).filter((s) => s.generalIds?.includes(generalId)),
      `skills-by-general:${generalId}`,
    );
  },
  async getFaq(id: FAQId): Promise<FAQ | null> {
    return readWithFallback(
      async () => (await redis()!.get<FAQ>(KEY.faq(id))) ?? null,
      () => (faqsSeed as unknown as FAQ[]).find((f) => f.id === id) ?? null,
      `faq:${id}`,
    );
  },
  async getFaqs(): Promise<FAQ[]> {
    return readWithFallback(
      () => getJsonArray<FAQ>(redis()!, KEY.faqsIndex, KEY.faq),
      () => faqsSeed as unknown as FAQ[],
      "faqs",
    );
  },

  // ---- Writes (no fallback; throw on failure) ----
  async putGeneral(id: GeneralId, value: General): Promise<void> {
    const r = redis();
    if (!r) throw new Error("Redis not configured");
    await r.set(KEY.general(id), value);
    await updateIndex(r, KEY.generalsIndex, (cur) => (cur.includes(id) ? cur : [...cur, id]));
  },
  async putSkill(id: SkillId, value: Skill): Promise<void> {
    const r = redis();
    if (!r) throw new Error("Redis not configured");
    const old = await r.get<Skill>(KEY.skill(id));
    const oldGenIds = new Set(old?.generalIds ?? []);
    const newGenIds = new Set(value.generalIds ?? []);
    await r.set(KEY.skill(id), value);
    // Maintain skills:index
    await updateIndex(r, KEY.skillsIndex, (cur) => (cur.includes(id) ? cur : [...cur, id]));
    for (const gid of oldGenIds) {
      if (!newGenIds.has(gid)) {
        await updateIndex(r, KEY.skillsByGeneral(gid), (cur) => cur.filter((sid) => sid !== id));
      }
    }
    for (const gid of newGenIds) {
      if (!oldGenIds.has(gid)) {
        await updateIndex(r, KEY.skillsByGeneral(gid), (cur) => (cur.includes(id) ? cur : [...cur, id]));
      }
    }
  },
  async putFaq(id: FAQId, value: FAQ): Promise<void> {
    const r = redis();
    if (!r) throw new Error("Redis not configured");
    await r.set(KEY.faq(id), value);
    await updateIndex(r, KEY.faqsIndex, (cur) => (cur.includes(id) ? cur : [...cur, id]));
  },
  async deleteFaq(id: FAQId): Promise<void> {
    const r = redis();
    if (!r) throw new Error("Redis not configured");
    await r.del(KEY.faq(id));
    await updateIndex(r, KEY.faqsIndex, (cur) => cur.filter((x) => x !== id));
  },

  // ---- Ratings ----
  async getRatings(): Promise<RatingsAll> {
    const r = redis();
    if (!r) return {};
    try {
      const v = await withTimeout(r.get<RatingsAll>(KEY.ratings), 3000, "ratings:all");
      return v ?? {};
    } catch (err) {
      console.warn("[entityStore] Redis read failed for ratings; returning empty map", err);
      return {};
    }
  },

  async updateRating(generalId: string, from: RatingTier | null, to: RatingTier, ipHash: string): Promise<GeneralRating> {
    const r = redis();
    if (!r) throw new Error("Redis not configured");
    if (!isRatingTier(to)) throw new Error(`Invalid 'to' tier: ${to}`);
    if (from !== null && !isRatingTier(from)) throw new Error(`Invalid 'from' tier: ${from}`);

    const all = (await r.get<RatingsAll>(KEY.ratings)) ?? {};
    const cur = all[generalId] ?? emptyRating();
    if (from && cur.counts[from] > 0) cur.counts[from] -= 1;
    cur.counts[to] += 1;
    cur.total = Object.values(cur.counts).reduce((a, b) => a + b, 0);
    cur.updatedAt = new Date().toISOString();
    all[generalId] = cur;
    await r.set(KEY.ratings, all);

    // Best-effort event log; never blocks the main aggregate write.
    try {
      const event: VoteEvent = { generalId, from, to, ts: cur.updatedAt, ipHash };
      const today = cur.updatedAt.slice(0, 10);
      await r.lpush(KEY.ratingsLog(today), JSON.stringify(event));
    } catch (err) {
      console.warn("[entityStore] Failed to append rating log event (non-fatal)", err);
    }

    return cur;
  },
};
