# 武将评级 (General Rating) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 5-tier visitor voting rating system (夯/顶级/人上人/npc/拉完了) for each general — detail page lets users vote, list page filters by current top tier.

**Architecture:** Pure-function `ratings.ts` module + extension methods on existing `entityStore`. Storage uses Upstash Redis: one aggregate key `ratings:all` for counts (read-modify-write), plus per-day append-only event logs `ratings:log:YYYY-MM-DD` for future analyses. List/detail pages read aggregates SSR-side; client component handles optimistic vote with localStorage.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Tailwind, `@upstash/redis`, `@upstash/ratelimit`.

**Reference docs:**
- Spec: `docs/superpowers/specs/2026-05-21-general-rating-design.md`
- Spec-challenge: `docs/superpowers/reviews/2026-05-21-general-rating-challenge.md`

**File map:**

New (4 files):
- `packages/web/src/lib/ratings.ts` — types + `topTier()` pure function
- `packages/web/src/lib/ratings.test.ts` — unit tests
- `packages/web/src/app/api/ratings/[id]/route.ts` — POST handler
- `packages/web/src/app/api/ratings/[id]/route.test.ts` — smoke test
- `packages/web/src/components/RatingPanel.tsx` — detail page client component
- `packages/web/src/app/generals/components/RatingFilter.tsx` — list page filter

Modified:
- `packages/web/src/lib/entity-store.ts` — add `getRatings()` + `updateRating()`
- `packages/web/src/lib/entity-store.test.ts` — add ratings tests
- `packages/web/src/lib/ratelimit.ts` — add `ratingsLimiter()`
- `packages/web/src/lib/revalidate-map.ts` — add `rating` mutation type
- `packages/web/src/lib/revalidate-map.test.ts` — add cases
- `packages/web/src/app/generals/page.tsx` — load ratings, pass `topTier`
- `packages/web/src/app/generals/components/GeneralListClient.tsx` — add `ratingFilter` state, predicate
- `packages/web/src/app/generals/[id]/page.tsx` — read rating, mount `RatingPanel`

---

## Task 1: `ratings.ts` types and `topTier()` helper

**Files:**
- Create: `packages/web/src/lib/ratings.ts`
- Test: `packages/web/src/lib/ratings.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/web/src/lib/ratings.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run packages/web/src/lib/ratings.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ratings.ts`**

Create `packages/web/src/lib/ratings.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run packages/web/src/lib/ratings.test.ts`

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/ratings.ts packages/web/src/lib/ratings.test.ts
git commit -m "feat(ratings): tier types + topTier helper

Pure module — no KV access, no React imports. Tier order encodes
'high → low' so topTier ties resolve to the higher tier."
```

---

## Task 2: Extend `entityStore` with `getRatings()` and `updateRating()`

**Files:**
- Modify: `packages/web/src/lib/entity-store.ts`
- Modify: `packages/web/src/lib/entity-store.test.ts`

- [ ] **Step 1: Extend the Redis mock with `lpush`**

In `packages/web/src/lib/entity-store.test.ts`, locate the existing `vi.mock("@upstash/redis", ...)` block at the top. Add an `lpush` method to the mocked class:

```typescript
async lpush(key: string, value: unknown) {
  const existing = mem.get(key);
  const list: string[] = existing ? JSON.parse(existing) : [];
  list.unshift(String(value));
  mem.set(key, JSON.stringify(list));
  return list.length;
}
```

(The mock stores the list as a JSON-stringified array of stringified entries — matching how `@upstash/redis` accepts string members.)

- [ ] **Step 2: Add failing tests for `getRatings` / `updateRating`**

Append a new top-level `describe` block at the end of `packages/web/src/lib/entity-store.test.ts`:

```typescript
import { RATING_TIERS, type GeneralRating } from "./ratings.js";

describe("entityStore ratings", () => {
  it("getRatings returns {} when KV has no value", async () => {
    const r = await entityStore.getRatings();
    expect(r).toEqual({});
  });

  it("getRatings returns {} when Redis throws", async () => {
    throwOnGet = true;
    const r = await entityStore.getRatings();
    expect(r).toEqual({});
  });

  it("updateRating creates a new rating record on first vote", async () => {
    await entityStore.updateRating("g1", null, "人上人", "iphash-abc");
    const all = await entityStore.getRatings();
    expect(all["g1"].counts["人上人"]).toBe(1);
    expect(all["g1"].counts["夯"]).toBe(0);
    expect(all["g1"].total).toBe(1);
  });

  it("updateRating with from = old tier decrements old, increments new", async () => {
    await entityStore.updateRating("g1", null, "npc", "h1");
    await entityStore.updateRating("g1", "npc", "顶级", "h1");
    const all = await entityStore.getRatings();
    expect(all["g1"].counts["npc"]).toBe(0);
    expect(all["g1"].counts["顶级"]).toBe(1);
    expect(all["g1"].total).toBe(1);
  });

  it("updateRating never decrements below zero", async () => {
    // from is set but counts[from] is already 0 (e.g., localStorage drift)
    await entityStore.updateRating("g1", "夯", "顶级", "h1");
    const all = await entityStore.getRatings();
    expect(all["g1"].counts["夯"]).toBe(0);
    expect(all["g1"].counts["顶级"]).toBe(1);
    expect(all["g1"].total).toBe(1);
  });

  it("updateRating appends to ratings:log:<today>", async () => {
    await entityStore.updateRating("g1", null, "夯", "iphash-xyz");
    const today = new Date().toISOString().slice(0, 10);
    const logRaw = mem.get(`ratings:log:${today}`);
    expect(logRaw).toBeTruthy();
    const list = JSON.parse(logRaw!) as string[];
    expect(list).toHaveLength(1);
    const entry = JSON.parse(list[0]) as { generalId: string; from: string | null; to: string; ipHash: string };
    expect(entry.generalId).toBe("g1");
    expect(entry.from).toBeNull();
    expect(entry.to).toBe("夯");
    expect(entry.ipHash).toBe("iphash-xyz");
  });

  it("updateRating throws when Redis is not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.KV_REST_API_URL;
    __resetForTests();
    await expect(entityStore.updateRating("g1", null, "夯", "h")).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm vitest run packages/web/src/lib/entity-store.test.ts`

Expected: FAIL — `entityStore.getRatings is not a function` and `entityStore.updateRating is not a function`.

- [ ] **Step 4: Implement in `entity-store.ts`**

In `packages/web/src/lib/entity-store.ts`:

(a) Add imports at the top:

```typescript
import { emptyRating, isRatingTier, type GeneralRating, type RatingsAll, type RatingTier, type VoteEvent } from "./ratings.js";
```

(b) Add to the `KEY` constant block:

```typescript
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
```

(c) Append two new methods inside the `entityStore` object literal, after `deleteFaq`:

```typescript
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

  /**
   * Read-modify-write the aggregate ratings:all key for one general,
   * then best-effort append a VoteEvent to ratings:log:<today>.
   *
   * `from` is the visitor's previous tier (decremented if present); `to` is
   * the new tier (incremented). Counters never go below zero. Throws when
   * Redis is not configured.
   */
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
      const event: VoteEvent = {
        generalId,
        from,
        to,
        ts: cur.updatedAt,
        ipHash,
      };
      const today = cur.updatedAt.slice(0, 10);
      await r.lpush(KEY.ratingsLog(today), JSON.stringify(event));
    } catch (err) {
      console.warn("[entityStore] Failed to append rating log event (non-fatal)", err);
    }

    return cur;
  },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run packages/web/src/lib/entity-store.test.ts`

Expected: PASS (existing tests + 7 new ones).

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/lib/entity-store.ts packages/web/src/lib/entity-store.test.ts
git commit -m "feat(ratings): entityStore getRatings + updateRating

Aggregate read-modify-write on ratings:all; best-effort LPUSH to
ratings:log:<today> for future analyses (v1 reads never consume the
log). Counters clamp at zero so localStorage drift can't go negative."
```

---

## Task 3: Add `ratingsLimiter()` to ratelimit module

**Files:**
- Modify: `packages/web/src/lib/ratelimit.ts`

- [ ] **Step 1: Add the limiter export**

Append to `packages/web/src/lib/ratelimit.ts`, alongside `sessionWriteLimiter` etc:

```typescript
let _ratingsLimiter: Ratelimit | null = null;

export function ratingsLimiter(): Ratelimit | null {
  if (_ratingsLimiter) return _ratingsLimiter;
  const r = redis();
  if (!r) return null;
  _ratingsLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, "1 m"),  // 10 votes / minute / IP
    prefix: "ratelimit:ratings",
  });
  return _ratingsLimiter;
}
```

- [ ] **Step 2: Run build/typecheck**

Run: `pnpm -C packages/web exec tsc --noEmit`

Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/lib/ratelimit.ts
git commit -m "feat(ratings): ratingsLimiter — 10 votes/min/IP

Matches existing sessionWriteLimiter style. Generous limit since
each user only votes 1–2 times per session normally."
```

---

## Task 4: Extend `revalidate-map.ts` for rating mutations

**Files:**
- Modify: `packages/web/src/lib/revalidate-map.ts`
- Modify: `packages/web/src/lib/revalidate-map.test.ts`

- [ ] **Step 1: Add failing test**

Append a `describe` block in `packages/web/src/lib/revalidate-map.test.ts`:

```typescript
import { pathsToRevalidate } from "./revalidate-map.js";

describe("pathsToRevalidate — rating", () => {
  it("revalidates list page and the specific general detail page", () => {
    const paths = pathsToRevalidate({ type: "rating", id: "g1" });
    expect(paths.sort()).toEqual(["/generals", "/generals/g1"].sort());
  });
});
```

(If the test file already imports `pathsToRevalidate`, drop the duplicate import.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/web/src/lib/revalidate-map.test.ts`

Expected: FAIL — `type "rating"` is not in the `Mutation` union.

- [ ] **Step 3: Extend the `Mutation` type and switch**

In `packages/web/src/lib/revalidate-map.ts`:

```typescript
import type { General, Skill, FAQ } from "@sgs/data";

export type Mutation =
  | { type: "general"; id: string; oldValue?: General; newValue?: General }
  | { type: "skill"; id: string; oldValue?: Skill; newValue?: Skill }
  | { type: "faq"; id: string; oldValue?: FAQ; newValue?: FAQ }
  | { type: "rating"; id: string };

export function pathsToRevalidate(m: Mutation): string[] {
  const out = new Set<string>();
  switch (m.type) {
    case "general": {
      out.add("/generals");
      out.add(`/generals/${m.id}`);
      break;
    }
    case "skill": {
      out.add("/generals");
      const oldIds = m.oldValue?.generalIds ?? [];
      const newIds = m.newValue?.generalIds ?? [];
      for (const gid of [...oldIds, ...newIds]) out.add(`/generals/${gid}`);
      break;
    }
    case "faq": {
      out.add("/faq");
      const oldRel = m.oldValue?.relatedGeneralIds ?? [];
      const newRel = m.newValue?.relatedGeneralIds ?? [];
      for (const gid of [...oldRel, ...newRel]) out.add(`/generals/${gid}`);
      break;
    }
    case "rating": {
      out.add("/generals");
      out.add(`/generals/${m.id}`);
      break;
    }
  }
  return Array.from(out);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run packages/web/src/lib/revalidate-map.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/revalidate-map.ts packages/web/src/lib/revalidate-map.test.ts
git commit -m "feat(ratings): pathsToRevalidate handles rating mutation"
```

---

## Task 5: `POST /api/ratings/[id]` route handler

**Files:**
- Create: `packages/web/src/app/api/ratings/[id]/route.ts`

- [ ] **Step 1: Create the route**

Create `packages/web/src/app/api/ratings/[id]/route.ts`:

```typescript
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";
import { clientIp, ratingsLimiter } from "@/lib/ratelimit";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import { isRatingTier, topTier, type RatingTier } from "@/lib/ratings";
import type { GeneralId } from "@sgs/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VoteBody {
  from?: RatingTier | null;
  to?: RatingTier;
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 12);
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const limiter = ratingsLimiter();
  if (limiter) {
    const ip = clientIp(req);
    const { success, reset } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "rate-limited", retryAfter: reset },
        { status: 429 },
      );
    }
  }

  const general = await entityStore.getGeneral(id as GeneralId);
  if (!general) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as VoteBody | null;
  if (!body || !isRatingTier(body.to)) {
    return NextResponse.json({ error: "invalid-tier", field: "to" }, { status: 400 });
  }
  const from = body.from ?? null;
  if (from !== null && !isRatingTier(from)) {
    return NextResponse.json({ error: "invalid-tier", field: "from" }, { status: 400 });
  }

  let updated;
  try {
    updated = await entityStore.updateRating(id, from, body.to, hashIp(clientIp(req)));
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  for (const p of pathsToRevalidate({ type: "rating", id })) {
    try { revalidatePath(p); } catch { /* best-effort */ }
  }

  const res = NextResponse.json({
    ok: true,
    counts: updated.counts,
    total: updated.total,
    topTier: topTier(updated),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
```

- [ ] **Step 2: Build / typecheck**

Run: `pnpm -C packages/web exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/app/api/ratings/[id]/route.ts
git commit -m "feat(ratings): POST /api/ratings/[id]

Validates tier, checks general exists, applies rate-limit per IP,
hashes IP for the event log, revalidates list + detail paths."
```

---

## Task 6: Smoke test for the rating API route

**Files:**
- Create: `packages/web/src/app/api/ratings/[id]/route.test.ts`

- [ ] **Step 1: Write the smoke test**

Create `packages/web/src/app/api/ratings/[id]/route.test.ts`:

```typescript
import { describe, expect, it, beforeEach, vi } from "vitest";

const mem = new Map<string, string>();
const revalidated: string[] = [];

vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => { revalidated.push(p); },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(k: string) { const v = mem.get(k); return v ? JSON.parse(v) : null; }
    async set(k: string, v: unknown) { mem.set(k, JSON.stringify(v)); }
    async del(k: string) { mem.delete(k); }
    async mget(...keys: string[]) {
      return keys.map((k) => { const v = mem.get(k); return v ? JSON.parse(v) : null; });
    }
    async lpush(key: string, value: unknown) {
      const existing = mem.get(key);
      const list: string[] = existing ? JSON.parse(existing) : [];
      list.unshift(String(value));
      mem.set(key, JSON.stringify(list));
      return list.length;
    }
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() { return {}; }
    static fixedWindow() { return {}; }
    async limit() { return { success: true, reset: Date.now() + 60_000 }; }
  },
}));

beforeEach(() => {
  mem.clear();
  revalidated.length = 0;
  process.env.UPSTASH_REDIS_REST_URL = "https://example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
});

// Seed a general into the mocked KV so getGeneral returns non-null.
async function seedGeneral(id: string) {
  mem.set(`general:${id}`, JSON.stringify({
    id, name: "Test", title: "", faction: "WEI", hp: 4, maxHp: 4,
    gender: "male", skills: [], image: "", pack: "p",
  }));
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ratings/g1", {
    method: "POST",
    headers: { "x-forwarded-for": "127.0.0.1", "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("POST /api/ratings/[id]", () => {
  it("400 on missing/invalid `to`", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    const res = await POST(makeRequest({ to: "not-a-tier" }), { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(400);
  });

  it("404 when general does not exist", async () => {
    const { POST } = await import("./route.js");
    const res = await POST(makeRequest({ to: "夯" }), { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("200 + updates aggregate + appends log on first vote", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    const res = await POST(makeRequest({ to: "顶级" }), { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.counts["顶级"]).toBe(1);
    expect(body.total).toBe(1);
    expect(body.topTier).toBe("顶级");
    // Log was written
    const today = new Date().toISOString().slice(0, 10);
    const log = mem.get(`ratings:log:${today}`);
    expect(log).toBeTruthy();
  });

  it("revalidates /generals and /generals/<id>", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    await POST(makeRequest({ to: "夯" }), { params: Promise.resolve({ id: "g1" }) });
    expect(revalidated).toContain("/generals");
    expect(revalidated).toContain("/generals/g1");
  });

  it("400 on invalid `from`", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    const res = await POST(makeRequest({ from: "bogus", to: "夯" }), { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(400);
  });

  it("decrements old tier when `from` provided", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    await POST(makeRequest({ to: "npc" }), { params: Promise.resolve({ id: "g1" }) });
    const res = await POST(makeRequest({ from: "npc", to: "夯" }), { params: Promise.resolve({ id: "g1" }) });
    const body = await res.json();
    expect(body.counts["npc"]).toBe(0);
    expect(body.counts["夯"]).toBe(1);
    expect(body.total).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm vitest run packages/web/src/app/api/ratings/`

Expected: PASS, 6 tests.

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/app/api/ratings/[id]/route.test.ts
git commit -m "test(ratings): smoke test for POST /api/ratings/[id]"
```

---

## Task 7: `RatingPanel` detail-page component

**Files:**
- Create: `packages/web/src/components/RatingPanel.tsx`

- [ ] **Step 1: Implement the component**

Create `packages/web/src/components/RatingPanel.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { RATING_TIERS, topTier, type GeneralRating, type RatingTier } from "@/lib/ratings";

interface RatingPanelProps {
  generalId: string;
  initialRating: GeneralRating | null;
}

const STORAGE_KEY = (id: string) => `vote:${id}`;

export default function RatingPanel({ generalId, initialRating }: RatingPanelProps) {
  const [rating, setRating] = useState<GeneralRating | null>(initialRating);
  const [myVote, setMyVote] = useState<RatingTier | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore "my vote" from localStorage after mount (SSR safe).
  useEffect(() => {
    const v = window.localStorage.getItem(STORAGE_KEY(generalId));
    if (v && (RATING_TIERS as readonly string[]).includes(v)) {
      setMyVote(v as RatingTier);
    }
  }, [generalId]);

  const mode = topTier(rating);
  const total = rating?.total ?? 0;

  async function vote(to: RatingTier) {
    if (pending || to === myVote) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ratings/${encodeURIComponent(generalId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: myVote, to }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { counts: GeneralRating["counts"]; total: number };
      setRating({
        counts: body.counts,
        total: body.total,
        updatedAt: new Date().toISOString(),
      });
      setMyVote(to);
      window.localStorage.setItem(STORAGE_KEY(generalId), to);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title">评级</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {total === 0
            ? "暂无评级，来投一票"
            : `目前 ${total} 票最多投：${mode}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {RATING_TIERS.map((tier) => {
          const isMode = tier === mode;
          const isMine = tier === myVote;
          const base = "rounded-lg border px-3 py-2 text-xs font-semibold transition-all sm:px-2.5 sm:py-1";
          const selected = "border-brand/50 bg-brand/10 text-brand shadow-sm dark:border-brand/60 dark:bg-brand/20 dark:text-red-300";
          const unselected = "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600";
          const mine = isMine ? "ring-2 ring-brand/60" : "";
          return (
            <button
              key={tier}
              type="button"
              disabled={pending}
              onClick={() => vote(tier)}
              className={`${base} ${isMode ? selected : unselected} ${mine}`}
            >
              {tier}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">点击投票，可随时改</p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500">投票失败：{error}</p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm -C packages/web exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/RatingPanel.tsx
git commit -m "feat(ratings): RatingPanel detail-page component

Optimistic update + localStorage vote memory + brand-ring 'my vote'
marker. Honest label 'X 票最多投' instead of statistical '众数'."
```

---

## Task 8: Mount `RatingPanel` on the detail page

**Files:**
- Modify: `packages/web/src/app/generals/[id]/page.tsx`

- [ ] **Step 1: Import and load rating**

Near the top of the file, add the import next to `entityStore`:

```typescript
import RatingPanel from "@/components/RatingPanel";
```

Inside `GeneralDetailPage`, after the existing `const allGenerals = ...` line and before `const radarScores`:

```typescript
  const ratings = await entityStore.getRatings();
  const rating = ratings[general.id as unknown as string] ?? null;
```

- [ ] **Step 2: Mount the panel**

In the JSX, insert a new section just before the `{/* General FAQ section */}` block (so it sits below skills + OCR but above FAQ):

```tsx
      {/* Visitor rating */}
      <section className="mt-10">
        <RatingPanel
          generalId={general.id as unknown as string}
          initialRating={rating}
        />
      </section>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm -C packages/web exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/app/generals/[id]/page.tsx
git commit -m "feat(ratings): mount RatingPanel on /generals/[id]

Sits between skills section and FAQ, matching detail-page rhythm."
```

---

## Task 9: `RatingFilter` list-page filter component

**Files:**
- Create: `packages/web/src/app/generals/components/RatingFilter.tsx`

- [ ] **Step 1: Implement the component**

Create `packages/web/src/app/generals/components/RatingFilter.tsx`:

```typescript
"use client";

import { RATING_TIERS, type RatingTier } from "@/lib/ratings";

export type RatingFilterValue = "all" | "unrated" | RatingTier;

const OPTIONS: { value: RatingFilterValue; label: string }[] = [
  { value: "all", label: "全部" },
  ...RATING_TIERS.map((t) => ({ value: t, label: t })),
  { value: "unrated", label: "未评级" },
];

type RatingFilterProps = {
  selected: RatingFilterValue;
  onChange: (value: RatingFilterValue) => void;
};

export default function RatingFilter({ selected, onChange }: RatingFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        评级:
      </span>
      <div className="flex flex-wrap gap-1">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all sm:px-2.5 sm:py-1 ${
              selected === value
                ? "border-brand/50 bg-brand/10 text-brand shadow-sm dark:border-brand/60 dark:bg-brand/20 dark:text-red-300"
                : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

Note: structurally mirrors `HpFilter.tsx` (label + button row, single-select via a single `selected` value). Adds `flex-wrap` on outer + inner to handle the extra button count gracefully on narrow viewports.

- [ ] **Step 2: Typecheck**

Run: `pnpm -C packages/web exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/app/generals/components/RatingFilter.tsx
git commit -m "feat(ratings): RatingFilter list-page control

Single-select 全部/夯/顶级/人上人/npc/拉完了/未评级 — mirrors
HpFilter button-row style; flex-wrap for 7 options on mobile."
```

---

## Task 10: Wire `RatingFilter` into `GeneralListClient`

**Files:**
- Modify: `packages/web/src/app/generals/components/GeneralListClient.tsx`

- [ ] **Step 1: Extend `GeneralEntry` and props**

In the imports section near the top:

```typescript
import type { RatingTier } from "@/lib/ratings";
import RatingFilter, { type RatingFilterValue } from "./RatingFilter";
```

Update `GeneralEntry`:

```typescript
export type GeneralEntry = {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  hp: number;
  image: string;
  skillNames: string[];
  topTier: RatingTier | null;
};
```

- [ ] **Step 2: Add `ratingFilter` state**

Inside the component, near the existing `useState` calls:

```typescript
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>("all");
```

- [ ] **Step 3: Apply the predicate**

In the `useMemo` that computes `filtered`, insert a rating filter step between the HP filter and the search filter:

```typescript
    // Rating filter
    if (ratingFilter === "unrated") {
      result = result.filter((g) => g.topTier === null);
    } else if (ratingFilter !== "all") {
      result = result.filter((g) => g.topTier === ratingFilter);
    }
```

And include `ratingFilter` in the `useMemo` deps array:

```typescript
  }, [generals, factions, hpFilter, ratingFilter, search, sortKey]);
```

- [ ] **Step 4: Mount the filter in the toolbar**

In the toolbar JSX, add `<RatingFilter />` next to `SortSelect`:

```tsx
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <HpFilter onChange={setHpFilter} selected={hpFilter} />
              <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
              <RatingFilter onChange={setRatingFilter} selected={ratingFilter} />
              <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
              <SortSelect onChange={setSortKey} value={sortKey} />
            </div>
```

- [ ] **Step 5: Reset rating filter in "clear all" button**

In the "清除所有筛选" button's onClick:

```tsx
            onClick={() => {
              setSearch("");
              setFactions(new Set());
              setHpFilter(0);
              setRatingFilter("all");
            }}
```

- [ ] **Step 6: Update "已筛选" count text**

Modify the result-count line to include rating filter:

```tsx
            共 {filtered.length} 名武将
            {factions.size > 0 || hpFilter > 0 || ratingFilter !== "all" || search.trim()
              ? `（已筛选，共 ${generals.length} 名）`
              : ""}
```

- [ ] **Step 7: Typecheck**

Run: `pnpm -C packages/web exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/web/src/app/generals/components/GeneralListClient.tsx
git commit -m "feat(ratings): list page filter by current top tier

GeneralEntry gains topTier; toolbar mounts RatingFilter between
HpFilter and SortSelect. Cards themselves unchanged — visitor sees
the filter but no per-card rating badge."
```

---

## Task 11: Load ratings in `/generals/page.tsx` and pass `topTier`

**Files:**
- Modify: `packages/web/src/app/generals/page.tsx`

- [ ] **Step 1: Load ratings + compute topTier per general**

Replace the existing body of `GeneralsPage`:

```typescript
export default async function GeneralsPage() {
  const [generals, skills, ratings] = await Promise.all([
    entityStore.getGenerals(),
    entityStore.getSkills(),
    entityStore.getRatings(),
  ]);

  const skillNameMap = new Map(skills.map((s) => [s.id, s.name]));

  const entries: GeneralEntry[] = generals.map((g) => ({
    id: g.id,
    name: g.name,
    title: g.title,
    faction: g.faction,
    hp: g.hp,
    image: g.image,
    skillNames: (g.skills as unknown as string[])
      .map((sid) => skillNameMap.get(sid as unknown as typeof skills[number]["id"]))
      .filter((n): n is string => n != null),
    topTier: topTier(ratings[g.id as unknown as string] ?? null),
  }));

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">武将</span>
        <h1 className="section-title mt-3">武将图鉴</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          浏览全部 {entries.length} 名国战武将，按势力、体力筛选，或搜索武将名、称号与技能名。
        </p>
      </header>

      <GeneralListClient generals={entries} />
    </div>
  );
}
```

Add the import near the top:

```typescript
import { topTier } from "@/lib/ratings";
```

- [ ] **Step 2: Typecheck**

Run: `pnpm -C packages/web exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Run all tests**

Run: `pnpm test`

Expected: PASS (all existing + new ratings + entity-store + revalidate-map + API smoke tests).

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/app/generals/page.tsx
git commit -m "feat(ratings): wire SSR ratings load into /generals

Promise.all gains getRatings(); each GeneralEntry carries
topTier — list-client predicate uses it."
```

---

## Task 12: Manual QA + final commit

**Files:** N/A (verification only)

- [ ] **Step 1: Start dev server**

Run: `pnpm -C packages/web dev`

Open browser to `http://localhost:3000/generals`.

- [ ] **Step 2: Verify list page**

Check:
- Toolbar shows the new "评级:" row between HP filter and Sort dropdown.
- Selecting "未评级" filters the list (likely shows most/all generals on a fresh DB).
- Selecting a specific tier shows only generals whose topTier matches (initially empty until votes happen).
- "清除所有筛选" resets the rating filter back to "全部".
- Cards themselves show no rating badge / no text / no color change.

- [ ] **Step 3: Verify detail page voting**

Open `http://localhost:3000/generals/<some-id>`.

Check:
- "评级" section appears between skills and FAQ.
- Initially shows "暂无评级，来投一票".
- Click "夯" → button highlights, ring appears around it, header changes to "目前 1 票最多投：夯".
- Refresh page → state persists (server-side read of `ratings:all`).
- localStorage `vote:<id>` is set to the chosen tier (DevTools).
- Click "顶级" → "夯" loses brand styling, "顶级" gets ring + selected style, header updates to "目前 1 票最多投：顶级", and `counts["夯"]` goes back to 0 (verify in DevTools network response).
- Click the same tier again → button is disabled (no-op).

- [ ] **Step 4: Verify rate-limit + error path**

In DevTools network tab, fire ~12 votes in rapid succession. Expect HTTP 429 on the 11th request and a "投票失败" toast in the panel.

- [ ] **Step 5: Mobile viewport check**

In DevTools responsive mode (iPhone 12 size, 390 × 844):
- Rating filter row wraps gracefully (7 buttons may take 2 lines — that's fine).
- RatingPanel buttons wrap to two rows if needed.
- No horizontal scroll on either page.

- [ ] **Step 6: Verify KV unavailable degrades cleanly**

Temporarily comment out `UPSTASH_REDIS_REST_URL` from `.env.local`, restart dev server.

Check:
- `/generals` still renders (all generals show as "未评级" if filtered).
- `/generals/<id>` still renders; clicking a tier shows "投票失败" toast.

Restore env, restart.

- [ ] **Step 7: Run full test suite one more time**

Run: `pnpm test && pnpm -C packages/web exec tsc --noEmit`

Expected: all PASS.

- [ ] **Step 8: (Optional) Lint**

Run: `pnpm lint`

Expected: no new lint errors. Fix any introduced by this change.

- [ ] **Step 9: Commit any QA fixes (if needed)**

If steps 2–6 surfaced issues, fix and commit each fix separately. Otherwise no commit needed for this task.

---

## Test Plan Summary

| Layer | Coverage |
|------|---------|
| Pure helpers (`topTier`, tier constants) | Unit tests in `ratings.test.ts` (Task 1) |
| KV adapter (`getRatings`, `updateRating`, log) | Unit tests in `entity-store.test.ts` (Task 2) |
| Path map (`rating` mutation type) | Unit test in `revalidate-map.test.ts` (Task 4) |
| API route (POST, error paths, revalidate, log) | Smoke test in `route.test.ts` (Task 6) |
| Components (RatingPanel, RatingFilter) | Manual QA (Task 12) — matches existing project pattern (`HpFilter`, `GeneralListClient` are untested today) |
| Page integration (list / detail) | Manual QA (Task 12) |

## Out of Scope (per spec)

- Admin override / curation
- Vote distribution histogram, weighted average, confidence intervals
- Card-level rating badge or color
- Sort by rating
- Admin view of raw counts / log events (added later if/when needed)
- User identity / accounts
- Distributed lock for concurrent writes (3–5 votes/general makes this irrelevant)
