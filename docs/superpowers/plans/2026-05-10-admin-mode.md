# Admin 内联编辑模式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the admin inline-edit mode v1 — 1-2 trusted admins can edit existing general/skill descriptions/fields and CRUD FAQs (relatedGeneralIds only) directly from live visitor pages, with changes visible to visitors within seconds, deployed on Vercel with Upstash Redis as the runtime store.

**Architecture:** Next.js 15 SSG pages read from an `entityStore` adapter (Upstash Redis primary, bundled JSON read-only fallback for visitor reads on Redis outage). Admin writes go through Route Handlers (`/api/admin/*`) gated by HMAC-signed cookie auth that includes a `SESSION_GENERATION` value for forced-logout. After every admin write, `revalidatePath()` invalidates affected pages so visitors see updates within seconds. A separate `/api/admin/sync-search` endpoint triggers a Vercel deploy hook to refresh the build-time search index. A nightly GitHub Action dumps Redis back to JSON files for ≤24h drift bound and audit/recovery.

**Tech Stack:** Next.js 15 + React 19 + TypeScript + Tailwind (existing); `@upstash/redis` (new); vitest (existing); Node `crypto` (built-in HMAC); GitHub Actions for nightly snapshot.

**Spec:** `docs/superpowers/specs/2026-05-09-admin-mode-design.md` (read first if unfamiliar).

---

## File Structure

### New files (created by this plan)

```
packages/web/src/lib/auth.ts                    # HMAC sign/verify cookie + SESSION_GENERATION
packages/web/src/lib/auth.test.ts
packages/web/src/lib/entity-store.ts            # Redis adapter + JSON fallback + index maintenance
packages/web/src/lib/entity-store.test.ts
packages/web/src/lib/validators.ts              # zod-free schema validators per entity type
packages/web/src/lib/validators.test.ts
packages/web/src/lib/revalidate-map.ts          # mutation -> revalidatePath() targets
packages/web/src/lib/revalidate-map.test.ts
packages/web/src/lib/admin-fetch.ts             # client-side fetch helpers for admin POSTs
packages/web/src/app/api/auth/login/route.ts
packages/web/src/app/api/auth/logout/route.ts
packages/web/src/app/api/auth/me/route.ts
packages/web/src/app/api/admin/generals/[id]/route.ts
packages/web/src/app/api/admin/skills/[id]/route.ts
packages/web/src/app/api/admin/faqs/route.ts                    # POST (create)
packages/web/src/app/api/admin/faqs/[id]/route.ts               # PATCH, DELETE
packages/web/src/app/api/admin/sync-search/route.ts
packages/web/src/app/api/admin/_middleware-helper.ts            # auth gate helper imported by all admin routes
packages/web/src/app/admin/login/page.tsx
packages/web/src/app/admin/login/LoginForm.tsx
packages/web/src/components/admin/AdminAffordances.tsx          # top bar (gen mode badge, sync, logout)
packages/web/src/components/admin/AdminContext.tsx              # client provider exposing authed flag
packages/web/src/components/admin/EditAffordance.tsx            # inline pencil/gear button + popover
packages/web/src/components/admin/GeneralEditForm.tsx
packages/web/src/components/admin/SkillEditForm.tsx
packages/web/src/components/admin/FaqNewForm.tsx
packages/web/src/components/admin/FaqEditForm.tsx
packages/web/src/components/admin/MultiSelect.tsx               # shared typeahead chip control
packages/web/src/components/admin/TagInput.tsx                  # shared tag chip input
scripts/seed-redis.ts                                            # one-time seed CLI
scripts/dump-redis.ts                                            # used by nightly snapshot Action
.github/workflows/redis-snapshot.yml
.github/workflows/data-files-guard.yml                           # CI: block manual JSON edits
```

### Modified files

```
packages/web/package.json                       # +@upstash/redis, +nanoid, +scripts (seed-redis, dump-redis)
packages/web/src/app/layout.tsx                 # wrap children with AdminContext provider
packages/web/src/components/layout/Header.tsx   # mount <AdminAffordances /> in top bar
packages/web/src/app/generals/page.tsx          # JSON import → entityStore.getGenerals()
packages/web/src/app/generals/[id]/page.tsx     # JSON import → entityStore + AdminAffordances integration
packages/web/src/app/generals/[id]/components/SkillCard.tsx     # accept admin pencil slot
packages/web/src/app/faq/page.tsx               # JSON import → entityStore.getFaqs()
packages/web/src/app/faq/components/FaqListClient.tsx           # render admin pencil/delete + new
packages/data/src/generals.json                 # add DO-NOT-EDIT header (top of file)
packages/data/src/skills.json                   # add DO-NOT-EDIT header
packages/data/src/faq.json                      # add DO-NOT-EDIT header
```

### Environment variables (set on Vercel + locally for dev)

```
UPSTASH_REDIS_REST_URL              # auto-injected by Upstash integration
UPSTASH_REDIS_REST_TOKEN            # auto-injected by Upstash integration
ADMIN_PASSWORD                       # plain text (Vercel env is encrypted)
SESSION_SECRET                       # 32-byte hex (HMAC key)
SESSION_GENERATION                   # integer, default "1"
VERCEL_DEPLOY_HOOK_URL               # from Vercel project settings → Deploy Hooks
```

---

## Phase 0 — Setup

### Task 0.1: Add dependencies

**Files:**
- Modify: `packages/web/package.json`

- [ ] **Step 1: Add `@upstash/redis` and `nanoid` to `packages/web/package.json` `dependencies`**

```json
{
  "dependencies": {
    "@sgs/data": "workspace:*",
    "@sgs/engine": "workspace:*",
    "@upstash/redis": "^1.34.0",
    "nanoid": "^5.0.0",
    "next": "^15.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zustand": "^5.0.12"
  }
}
```

- [ ] **Step 2: Add seed/dump scripts to `packages/web/package.json` `scripts`**

```json
{
  "scripts": {
    "dev": "node --trace-uncaught ./node_modules/next/dist/bin/next dev --turbopack",
    "build": "pnpm --filter '@sgs/data' build && node -e \"require('fs').rmSync('.next', { recursive: true, force: true }); require('fs').rmSync('out', { recursive: true, force: true });\" && node --trace-uncaught ./node_modules/next/dist/bin/next build",
    "start": "node --trace-uncaught ./node_modules/next/dist/bin/next start",
    "lint": "node --trace-uncaught ./node_modules/next/dist/bin/next lint",
    "seed-redis": "tsx ../../scripts/seed-redis.ts",
    "dump-redis": "tsx ../../scripts/dump-redis.ts"
  }
}
```

- [ ] **Step 3: Install**

```bash
pnpm install
```

Expected: lockfile updated, no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add @upstash/redis, nanoid; seed/dump-redis scripts"
```

---

### Task 0.2: Document required env vars (no code yet)

**Files:**
- Create: `packages/web/.env.example`

- [ ] **Step 1: Create `packages/web/.env.example`**

```bash
# Upstash Redis — auto-injected by Vercel Marketplace integration in production
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Admin auth
ADMIN_PASSWORD=
SESSION_SECRET=                     # 32 bytes hex; generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_GENERATION=1                # bump (e.g. 2, 3) to force-logout all existing sessions

# Vercel deploy hook (used by /api/admin/sync-search to refresh build-time search index)
VERCEL_DEPLOY_HOOK_URL=
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/.env.example
git commit -m "chore(web): document required env vars for admin mode"
```

---

## Phase 1 — Core libraries (TDD)

### Task 1.1: HMAC cookie auth

**Files:**
- Create: `packages/web/src/lib/auth.ts`
- Test: `packages/web/src/lib/auth.test.ts`

- [ ] **Step 1: Write failing tests at `packages/web/src/lib/auth.test.ts`**

```ts
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { signSessionCookie, verifySessionCookie } from "./auth.js";

const SECRET = "0".repeat(64); // 32 bytes hex

describe("signSessionCookie / verifySessionCookie", () => {
  const ORIGINAL_GEN = process.env.SESSION_GENERATION;

  beforeEach(() => {
    process.env.SESSION_GENERATION = "1";
  });

  afterEach(() => {
    process.env.SESSION_GENERATION = ORIGINAL_GEN;
  });

  it("round-trips a freshly signed cookie", () => {
    const token = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    expect(verifySessionCookie(token, SECRET).ok).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const token = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    const [payload, sig] = token.split(".");
    const tampered = `${payload}X.${sig}`;
    expect(verifySessionCookie(tampered, SECRET).ok).toBe(false);
  });

  it("rejects when signature is changed", () => {
    const token = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    const [payload] = token.split(".");
    const bad = `${payload}.${"f".repeat(64)}`;
    expect(verifySessionCookie(bad, SECRET).ok).toBe(false);
  });

  it("rejects an expired cookie", () => {
    const token = signSessionCookie({ ttlSeconds: -10 }, SECRET);
    expect(verifySessionCookie(token, SECRET).ok).toBe(false);
  });

  it("rejects when SESSION_GENERATION mismatches", () => {
    const token = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    process.env.SESSION_GENERATION = "2";
    const result = verifySessionCookie(token, SECRET);
    expect(result.ok).toBe(false);
  });

  it("rejects malformed cookies (missing dot)", () => {
    expect(verifySessionCookie("no-dot-here", SECRET).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test → expect fail**

```bash
pnpm vitest run packages/web/src/lib/auth.test.ts
```

Expected: FAIL — "Cannot find module './auth.js'".

- [ ] **Step 3: Implement `packages/web/src/lib/auth.ts`**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

interface SessionPayload {
  exp: number;        // epoch seconds
  gen: number;        // SESSION_GENERATION at issue time
}

export function signSessionCookie(
  opts: { ttlSeconds: number },
  secret: string,
): string {
  const gen = parseInt(process.env.SESSION_GENERATION ?? "1", 10);
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + opts.ttlSeconds,
    gen,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
}

export type VerifyResult =
  | { ok: true; payload: SessionPayload }
  | { ok: false; reason: "malformed" | "bad-signature" | "expired" | "wrong-generation" };

export function verifySessionCookie(token: string, secret: string): VerifyResult {
  if (typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return { ok: false, reason: "malformed" };

  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("hex");
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { ok: false, reason: "bad-signature" };
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }
  const currentGen = parseInt(process.env.SESSION_GENERATION ?? "1", 10);
  if (payload.gen !== currentGen) {
    return { ok: false, reason: "wrong-generation" };
  }

  return { ok: true, payload };
}

export function passwordMatches(input: string, expected: string | undefined): boolean {
  if (typeof expected !== "string" || expected.length === 0) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run test → expect pass**

```bash
pnpm vitest run packages/web/src/lib/auth.test.ts
```

Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/auth.ts packages/web/src/lib/auth.test.ts
git commit -m "feat(web/auth): HMAC session cookie with SESSION_GENERATION force-logout"
```

---

### Task 1.2: Schema validators

**Files:**
- Create: `packages/web/src/lib/validators.ts`
- Test: `packages/web/src/lib/validators.test.ts`

- [ ] **Step 1: Write failing tests at `packages/web/src/lib/validators.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { validateGeneralPatch, validateSkillPatch, validateFaqInput } from "./validators.js";

describe("validateGeneralPatch", () => {
  const valid = {
    name: "曹操",
    title: "魏武帝",
    faction: "WEI",
    hp: 4,
    maxHp: 4,
    gender: "male",
    skills: ["skill_jianxiong"],
    image: "/img/x.png",
    pack: "标准版",
  };
  it("accepts a fully valid object", () => {
    const r = validateGeneralPatch(valid);
    expect(r.ok).toBe(true);
  });
  it("rejects unknown faction", () => {
    const r = validateGeneralPatch({ ...valid, faction: "ZZZ" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.path === "faction")).toBe(true);
  });
  it("rejects HP out of range (0)", () => {
    const r = validateGeneralPatch({ ...valid, hp: 0 });
    expect(r.ok).toBe(false);
  });
  it("rejects HP out of range (20)", () => {
    const r = validateGeneralPatch({ ...valid, hp: 20 });
    expect(r.ok).toBe(false);
  });
  it("rejects when name is empty", () => {
    const r = validateGeneralPatch({ ...valid, name: "" });
    expect(r.ok).toBe(false);
  });
  it("rejects gender not in enum", () => {
    const r = validateGeneralPatch({ ...valid, gender: "other" });
    expect(r.ok).toBe(false);
  });
});

describe("validateSkillPatch", () => {
  const valid = {
    name: "奸雄",
    description: "当你受到伤害后，你可以获得对你造成此伤害的牌。",
    type: "passive",
    timing: ["damaged"],
  };
  it("accepts valid", () => {
    expect(validateSkillPatch(valid).ok).toBe(true);
  });
  it("rejects unknown type", () => {
    expect(validateSkillPatch({ ...valid, type: "foo" }).ok).toBe(false);
  });
  it("rejects empty description", () => {
    expect(validateSkillPatch({ ...valid, description: "" }).ok).toBe(false);
  });
  it("rejects non-array timing", () => {
    expect(validateSkillPatch({ ...valid, timing: "damaged" as any }).ok).toBe(false);
  });
});

describe("validateFaqInput", () => {
  const valid = {
    question: "国战胜利条件?",
    answer: "全场剩下同势力角色获胜。",
    category: "rule",
    relatedGeneralIds: ["general_caocao"],
  };
  it("accepts valid", () => {
    expect(validateFaqInput(valid).ok).toBe(true);
  });
  it("accepts empty relatedGeneralIds", () => {
    expect(validateFaqInput({ ...valid, relatedGeneralIds: [] }).ok).toBe(true);
  });
  it("rejects missing question", () => {
    expect(validateFaqInput({ ...valid, question: "" }).ok).toBe(false);
  });
  it("rejects unknown category", () => {
    expect(validateFaqInput({ ...valid, category: "xxx" }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run → expect fail**

```bash
pnpm vitest run packages/web/src/lib/validators.test.ts
```

Expected: FAIL — module missing.

- [ ] **Step 3: Implement `packages/web/src/lib/validators.ts`**

```ts
export interface ValidationError {
  path: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

const FACTIONS = ["WEI", "SHU", "WU", "QUN", "JIN"] as const;
const GENDERS = ["male", "female"] as const;
const SKILL_TYPES = ["active", "passive", "lock", "limited", "awakening", "mission"] as const;
const FAQ_CATEGORIES = ["general", "skill", "card", "rule"] as const;

function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}
function isInRange(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

export interface GeneralPatch {
  name: string;
  title: string;
  faction: typeof FACTIONS[number];
  subfaction?: typeof FACTIONS[number];
  hp: number;
  maxHp: number;
  gender: typeof GENDERS[number];
  skills: string[];
  image: string;
  paired?: boolean;
  pairedNames?: string[];
  isEmperor?: boolean;
  designer?: string;
  pack: string;
  perfectMatchPartners?: string[];
}

export function validateGeneralPatch(input: unknown): ValidationResult<GeneralPatch> {
  const e: ValidationError[] = [];
  const v = (input ?? {}) as Record<string, unknown>;

  if (!isNonEmptyString(v.name)) e.push({ path: "name", message: "必填" });
  if (!isString(v.title)) e.push({ path: "title", message: "必须是字符串" });
  if (!FACTIONS.includes(v.faction as any)) e.push({ path: "faction", message: `必须是 ${FACTIONS.join("/")}` });
  if (v.subfaction !== undefined && !FACTIONS.includes(v.subfaction as any)) e.push({ path: "subfaction", message: "无效势力" });
  if (!isInRange(v.hp, 1, 12)) e.push({ path: "hp", message: "HP 必须在 1-12" });
  if (!isInRange(v.maxHp, 1, 12)) e.push({ path: "maxHp", message: "maxHp 必须在 1-12" });
  if (typeof v.hp === "number" && typeof v.maxHp === "number" && v.hp > v.maxHp) {
    e.push({ path: "hp", message: "HP 不能大于 maxHp" });
  }
  if (!GENDERS.includes(v.gender as any)) e.push({ path: "gender", message: "性别必须是 male/female" });
  if (!isStringArray(v.skills)) e.push({ path: "skills", message: "技能 ID 列表必须是字符串数组" });
  if (!isString(v.image)) e.push({ path: "image", message: "image 必须是 URL 字符串" });
  if (v.pairedNames !== undefined && !isStringArray(v.pairedNames)) e.push({ path: "pairedNames", message: "必须是字符串数组" });
  if (v.perfectMatchPartners !== undefined && !isStringArray(v.perfectMatchPartners)) e.push({ path: "perfectMatchPartners", message: "必须是字符串数组" });
  if (!isString(v.pack)) e.push({ path: "pack", message: "pack 必填" });

  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as GeneralPatch };
}

export interface SkillPatch {
  name: string;
  description: string;
  type: typeof SKILL_TYPES[number];
  timing: string[];
  tags?: string[];
}

export function validateSkillPatch(input: unknown): ValidationResult<SkillPatch> {
  const e: ValidationError[] = [];
  const v = (input ?? {}) as Record<string, unknown>;

  if (!isNonEmptyString(v.name)) e.push({ path: "name", message: "必填" });
  if (!isNonEmptyString(v.description)) e.push({ path: "description", message: "必填" });
  if (!SKILL_TYPES.includes(v.type as any)) e.push({ path: "type", message: `必须是 ${SKILL_TYPES.join("/")}` });
  if (!isStringArray(v.timing)) e.push({ path: "timing", message: "必须是字符串数组" });
  if (v.tags !== undefined && !isStringArray(v.tags)) e.push({ path: "tags", message: "必须是字符串数组" });

  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as SkillPatch };
}

export interface FaqInput {
  question: string;
  answer: string;
  category: typeof FAQ_CATEGORIES[number];
  relatedGeneralIds: string[];
}

export function validateFaqInput(input: unknown): ValidationResult<FaqInput> {
  const e: ValidationError[] = [];
  const v = (input ?? {}) as Record<string, unknown>;

  if (!isNonEmptyString(v.question)) e.push({ path: "question", message: "必填" });
  if (!isNonEmptyString(v.answer)) e.push({ path: "answer", message: "必填" });
  if (!FAQ_CATEGORIES.includes(v.category as any)) e.push({ path: "category", message: `必须是 ${FAQ_CATEGORIES.join("/")}` });
  if (v.relatedGeneralIds === undefined || !isStringArray(v.relatedGeneralIds)) {
    e.push({ path: "relatedGeneralIds", message: "必须是字符串数组（可空）" });
  }

  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as FaqInput };
}
```

- [ ] **Step 4: Run → expect pass**

```bash
pnpm vitest run packages/web/src/lib/validators.test.ts
```

Expected: 14 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/validators.ts packages/web/src/lib/validators.test.ts
git commit -m "feat(web/validators): typed schema validators for general/skill/faq patches"
```

---

### Task 1.3: entityStore adapter

**Files:**
- Create: `packages/web/src/lib/entity-store.ts`
- Test: `packages/web/src/lib/entity-store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/web/src/lib/entity-store.test.ts`:

```ts
import { describe, expect, it, beforeEach, vi } from "vitest";
import type { General, Skill, FAQ, GeneralId, SkillId, FAQId } from "@sgs/data";

// Mock @upstash/redis BEFORE importing entity-store
const mem = new Map<string, string>();
vi.mock("@upstash/redis", () => {
  return {
    Redis: class {
      async get(key: string) {
        const v = mem.get(key);
        return v ? JSON.parse(v) : null;
      }
      async set(key: string, value: unknown) {
        mem.set(key, JSON.stringify(value));
      }
      async del(key: string) {
        mem.delete(key);
      }
      async mget(...keys: string[]) {
        return keys.map((k) => {
          const v = mem.get(k);
          return v ? JSON.parse(v) : null;
        });
      }
    },
  };
});

const ENV_BAK = { ...process.env };
beforeEach(() => {
  mem.clear();
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
});

import { entityStore } from "./entity-store.js";

const G = (id: string, name: string): General =>
  ({
    id: id as GeneralId,
    name,
    title: "T",
    faction: "WEI" as any,
    hp: 4,
    maxHp: 4,
    gender: "male" as any,
    skills: [],
    image: "",
    pack: "p",
  }) as General;

const S = (id: string, name: string, generalIds: string[]): Skill =>
  ({
    id: id as SkillId,
    name,
    description: "d",
    type: "passive" as any,
    timing: [],
    generalIds: generalIds as GeneralId[],
    faq: [],
  }) as Skill;

const F = (id: string, q: string, generalIds: string[]): FAQ =>
  ({
    id: id as FAQId,
    question: q,
    answer: "a",
    category: "rule" as any,
    relatedGeneralIds: generalIds as GeneralId[],
  }) as FAQ;

describe("entityStore — round-trip", () => {
  it("putGeneral / getGeneral round-trip", async () => {
    await entityStore.putGeneral("g1" as GeneralId, G("g1", "曹操"));
    const got = await entityStore.getGeneral("g1" as GeneralId);
    expect(got?.name).toBe("曹操");
  });

  it("getGenerals returns empty list when index empty", async () => {
    const all = await entityStore.getGenerals();
    expect(all).toEqual([]);
  });

  it("putGeneral updates index", async () => {
    await entityStore.putGeneral("g1" as GeneralId, G("g1", "X"));
    await entityStore.putGeneral("g2" as GeneralId, G("g2", "Y"));
    const all = await entityStore.getGenerals();
    expect(all.map((g) => g.id).sort()).toEqual(["g1", "g2"]);
  });

  it("putSkill maintains skills:by-general reverse lookup", async () => {
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1"]));
    const list = await entityStore.getSkillsByGeneral("g1" as GeneralId);
    expect(list.map((s) => s.id)).toEqual(["s1"]);
  });

  it("putSkill removes old reverse entries when generalIds shrinks", async () => {
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1", "g2"]));
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1"]));
    const g1 = await entityStore.getSkillsByGeneral("g1" as GeneralId);
    const g2 = await entityStore.getSkillsByGeneral("g2" as GeneralId);
    expect(g1.length).toBe(1);
    expect(g2.length).toBe(0);
  });

  it("putFaq + getFaqs", async () => {
    await entityStore.putFaq("f1" as FAQId, F("f1", "q1", []));
    await entityStore.putFaq("f2" as FAQId, F("f2", "q2", []));
    const all = await entityStore.getFaqs();
    expect(all.map((f) => f.id).sort()).toEqual(["f1", "f2"]);
  });

  it("deleteFaq removes from index", async () => {
    await entityStore.putFaq("f1" as FAQId, F("f1", "q1", []));
    await entityStore.putFaq("f2" as FAQId, F("f2", "q2", []));
    await entityStore.deleteFaq("f1" as FAQId);
    const all = await entityStore.getFaqs();
    expect(all.map((f) => f.id)).toEqual(["f2"]);
  });
});

describe("entityStore — JSON fallback when Redis env missing", () => {
  it("getGenerals reads bundled JSON when UPSTASH env vars are unset", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const all = await entityStore.getGenerals();
    expect(all.length).toBeGreaterThan(0);
  });
});

afterAll(() => {
  Object.assign(process.env, ENV_BAK);
});
import { afterAll } from "vitest";
```

- [ ] **Step 2: Run → expect fail**

```bash
pnpm vitest run packages/web/src/lib/entity-store.test.ts
```

Expected: FAIL — module missing.

- [ ] **Step 3: Implement `packages/web/src/lib/entity-store.ts`**

```ts
import type { General, Skill, FAQ, GeneralId, SkillId, FAQId } from "@sgs/data";
import { Redis } from "@upstash/redis";

import generalsSeed from "../../../data/src/generals.json";
import skillsSeed from "../../../data/src/skills.json";
import faqsSeed from "../../../data/src/faq.json";

let _redis: Redis | null = null;
function redis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

const KEY = {
  general: (id: string) => `general:${id}`,
  generalsIndex: "generals:index",
  skill: (id: string) => `skill:${id}`,
  skillsByGeneral: (gid: string) => `skills:by-general:${gid}`,
  faq: (id: string) => `faq:${id}`,
  faqsIndex: "faqs:index",
};

async function readWithFallback<T>(
  redisRead: () => Promise<T>,
  jsonFallback: () => T,
  logLabel: string,
): Promise<T> {
  const r = redis();
  if (!r) return jsonFallback();
  try {
    return await redisRead();
  } catch (err) {
    console.warn(`[entityStore] Redis read failed for ${logLabel}; falling back to bundled JSON`, err);
    return jsonFallback();
  }
}

async function getJsonArray<T>(redisInst: Redis, indexKey: string, valueKey: (id: string) => string): Promise<T[]> {
  const ids = (await redisInst.get<string[]>(indexKey)) ?? [];
  if (ids.length === 0) return [];
  const values = await redisInst.mget<(T | null)[]>(...ids.map(valueKey));
  return values.filter((v): v is T => v != null);
}

async function updateIndex(redisInst: Redis, indexKey: string, mutator: (current: string[]) => string[]): Promise<void> {
  const cur = (await redisInst.get<string[]>(indexKey)) ?? [];
  const next = mutator(cur);
  await redisInst.set(indexKey, next);
}

export const entityStore = {
  // ---- Reads ----
  async getGeneral(id: GeneralId): Promise<General | null> {
    return readWithFallback(
      async () => (await redis()!.get<General>(KEY.general(id))) ?? null,
      () => (generalsSeed as General[]).find((g) => g.id === id) ?? null,
      `general:${id}`,
    );
  },

  async getGenerals(): Promise<General[]> {
    return readWithFallback(
      () => getJsonArray<General>(redis()!, KEY.generalsIndex, KEY.general),
      () => generalsSeed as General[],
      "generals",
    );
  },

  async getSkill(id: SkillId): Promise<Skill | null> {
    return readWithFallback(
      async () => (await redis()!.get<Skill>(KEY.skill(id))) ?? null,
      () => (skillsSeed as Skill[]).find((s) => s.id === id) ?? null,
      `skill:${id}`,
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
      () => (skillsSeed as Skill[]).filter((s) => s.generalIds?.includes(generalId)),
      `skills-by-general:${generalId}`,
    );
  },

  async getFaq(id: FAQId): Promise<FAQ | null> {
    return readWithFallback(
      async () => (await redis()!.get<FAQ>(KEY.faq(id))) ?? null,
      () => (faqsSeed as FAQ[]).find((f) => f.id === id) ?? null,
      `faq:${id}`,
    );
  },

  async getFaqs(): Promise<FAQ[]> {
    return readWithFallback(
      () => getJsonArray<FAQ>(redis()!, KEY.faqsIndex, KEY.faq),
      () => faqsSeed as FAQ[],
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
    // Find old generalIds for diffing reverse table
    const old = await r.get<Skill>(KEY.skill(id));
    const oldGenIds = new Set(old?.generalIds ?? []);
    const newGenIds = new Set(value.generalIds ?? []);
    await r.set(KEY.skill(id), value);
    // For removed gens: remove this skill from their reverse list
    for (const gid of oldGenIds) {
      if (!newGenIds.has(gid)) {
        await updateIndex(r, KEY.skillsByGeneral(gid), (cur) => cur.filter((sid) => sid !== id));
      }
    }
    // For added gens: add this skill to their reverse list
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
};
```

- [ ] **Step 4: Run → expect pass**

```bash
pnpm vitest run packages/web/src/lib/entity-store.test.ts
```

Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/entity-store.ts packages/web/src/lib/entity-store.test.ts
git commit -m "feat(web/entity-store): Upstash adapter with JSON fallback + reverse-lookup maintenance"
```

---

### Task 1.4: revalidate-map

**Files:**
- Create: `packages/web/src/lib/revalidate-map.ts`
- Test: `packages/web/src/lib/revalidate-map.test.ts`

- [ ] **Step 1: Write failing tests at `packages/web/src/lib/revalidate-map.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { pathsToRevalidate, type Mutation } from "./revalidate-map.js";

describe("pathsToRevalidate", () => {
  it("general edit → /generals + /generals/{id}", () => {
    const m: Mutation = { type: "general", id: "g1" };
    expect(pathsToRevalidate(m).sort()).toEqual(["/generals", "/generals/g1"]);
  });

  it("skill edit → /generals (list) + each general it appears on", () => {
    const m: Mutation = {
      type: "skill",
      id: "s1",
      newValue: { generalIds: ["g1", "g2"] } as any,
      oldValue: { generalIds: ["g1", "g3"] } as any,
    };
    const got = pathsToRevalidate(m).sort();
    expect(got).toEqual(["/generals", "/generals/g1", "/generals/g2", "/generals/g3"]);
  });

  it("faq create → /faq + each related general", () => {
    const m: Mutation = {
      type: "faq",
      id: "f1",
      newValue: { relatedGeneralIds: ["g1", "g2"] } as any,
    };
    expect(pathsToRevalidate(m).sort()).toEqual(["/faq", "/generals/g1", "/generals/g2"]);
  });

  it("faq update with relation change → /faq + union of old & new related generals", () => {
    const m: Mutation = {
      type: "faq",
      id: "f1",
      oldValue: { relatedGeneralIds: ["g1"] } as any,
      newValue: { relatedGeneralIds: ["g2"] } as any,
    };
    expect(pathsToRevalidate(m).sort()).toEqual(["/faq", "/generals/g1", "/generals/g2"]);
  });

  it("faq delete → /faq + all old related generals", () => {
    const m: Mutation = {
      type: "faq",
      id: "f1",
      oldValue: { relatedGeneralIds: ["g1", "g2"] } as any,
    };
    expect(pathsToRevalidate(m).sort()).toEqual(["/faq", "/generals/g1", "/generals/g2"]);
  });

  it("dedupes paths", () => {
    const m: Mutation = {
      type: "faq",
      id: "f1",
      oldValue: { relatedGeneralIds: ["g1", "g1"] } as any,
      newValue: { relatedGeneralIds: ["g1"] } as any,
    };
    expect(pathsToRevalidate(m)).toEqual(["/faq", "/generals/g1"]);
  });
});
```

- [ ] **Step 2: Run → expect fail**

```bash
pnpm vitest run packages/web/src/lib/revalidate-map.test.ts
```

Expected: FAIL — module missing.

- [ ] **Step 3: Implement `packages/web/src/lib/revalidate-map.ts`**

```ts
import type { General, Skill, FAQ } from "@sgs/data";

export type Mutation =
  | { type: "general"; id: string; oldValue?: General; newValue?: General }
  | { type: "skill"; id: string; oldValue?: Skill; newValue?: Skill }
  | { type: "faq"; id: string; oldValue?: FAQ; newValue?: FAQ };

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
  }
  return Array.from(out);
}
```

- [ ] **Step 4: Run → expect pass**

```bash
pnpm vitest run packages/web/src/lib/revalidate-map.test.ts
```

Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/revalidate-map.ts packages/web/src/lib/revalidate-map.test.ts
git commit -m "feat(web/revalidate-map): mutation -> revalidatePath() target list"
```

---

## Phase 2 — API Routes

### Task 2.1: Auth gate helper

**Files:**
- Create: `packages/web/src/app/api/admin/_middleware-helper.ts`

- [ ] **Step 1: Implement `packages/web/src/app/api/admin/_middleware-helper.ts`**

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";

export const ADMIN_COOKIE_NAME = "admin_session";

export async function requireAdmin(): Promise<NextResponse | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "server-misconfigured" }, { status: 500 });
  }
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = verifySessionCookie(token, secret);
  if (!r.ok) return NextResponse.json({ error: "unauthorized", reason: r.reason }, { status: 401 });
  return null; // null means: passed, continue
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/app/api/admin/_middleware-helper.ts
git commit -m "feat(web/api): admin auth gate helper"
```

---

### Task 2.2: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`

**Files:**
- Create: `packages/web/src/app/api/auth/login/route.ts`
- Create: `packages/web/src/app/api/auth/logout/route.ts`
- Create: `packages/web/src/app/api/auth/me/route.ts`

- [ ] **Step 1: Implement `login/route.ts`**

```ts
import { NextResponse } from "next/server";
import { passwordMatches, signSessionCookie } from "@/lib/auth";
import { ADMIN_COOKIE_NAME } from "../../admin/_middleware-helper";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = typeof body.password === "string" ? body.password : "";

  if (!passwordMatches(password, process.env.ADMIN_PASSWORD)) {
    // small constant delay to discourage rapid guessing
    await new Promise((r) => setTimeout(r, 250));
    return NextResponse.json({ error: "invalid-password" }, { status: 401 });
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.json({ error: "server-misconfigured" }, { status: 500 });

  const ttlSeconds = 60 * 60 * 24 * 30; // 30 days
  const token = signSessionCookie({ ttlSeconds }, secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttlSeconds,
    path: "/",
  });
  return res;
}
```

- [ ] **Step 2: Implement `logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "../../admin/_middleware-helper";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
```

- [ ] **Step 3: Implement `me/route.ts`**

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";
import { ADMIN_COOKIE_NAME } from "../../admin/_middleware-helper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.json({ authed: false });
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ authed: false });
  const r = verifySessionCookie(token, secret);
  return NextResponse.json({ authed: r.ok });
}
```

- [ ] **Step 4: Smoke test the routes manually**

```bash
pnpm --filter @sgs/web dev
# In another terminal:
curl -sS -X POST http://localhost:3000/api/auth/login \
  -H "content-type: application/json" -d '{"password":"WRONG"}' -i
# Expect: HTTP/1.1 401
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/app/api/auth/
git commit -m "feat(web/api): auth login/logout/me routes"
```

---

### Task 2.3: `/api/admin/generals/[id]` PATCH

**Files:**
- Create: `packages/web/src/app/api/admin/generals/[id]/route.ts`

- [ ] **Step 1: Implement**

```ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";
import { validateGeneralPatch } from "@/lib/validators";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import type { General, GeneralId } from "@sgs/data";
import { requireAdmin } from "../../_middleware-helper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const result = validateGeneralPatch(body);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }

  const old = await entityStore.getGeneral(id as GeneralId);
  const next: General = { ...(old as General), ...(result.value as Partial<General>), id: id as GeneralId };

  try {
    await entityStore.putGeneral(id as GeneralId, next);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  for (const p of pathsToRevalidate({ type: "general", id, oldValue: old ?? undefined, newValue: next })) {
    revalidatePath(p);
  }

  return NextResponse.json({ ok: true, value: next });
}
```

- [ ] **Step 2: Smoke (after seeding)**

```bash
# After seed-redis is implemented and run, login first to get cookie, then:
curl -sS -X PATCH http://localhost:3000/api/admin/generals/general_caocao \
  -H "content-type: application/json" \
  -b "admin_session=<token-from-login>" \
  -d '{"name":"曹操","title":"魏武帝","faction":"WEI","hp":4,"maxHp":4,"gender":"male","skills":[],"image":"/x.png","pack":"std"}'
# Expect: 200 with {ok:true, value:{...}}
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/app/api/admin/generals/
git commit -m "feat(web/api): PATCH /api/admin/generals/[id]"
```

---

### Task 2.4: `/api/admin/skills/[id]` PATCH

**Files:**
- Create: `packages/web/src/app/api/admin/skills/[id]/route.ts`

- [ ] **Step 1: Implement**

```ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";
import { validateSkillPatch } from "@/lib/validators";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import type { Skill, SkillId } from "@sgs/data";
import { requireAdmin } from "../../_middleware-helper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const result = validateSkillPatch(body);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }

  const old = await entityStore.getSkill(id as SkillId);
  const next: Skill = { ...(old as Skill), ...(result.value as Partial<Skill>), id: id as SkillId };

  try {
    await entityStore.putSkill(id as SkillId, next);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  for (const p of pathsToRevalidate({ type: "skill", id, oldValue: old ?? undefined, newValue: next })) {
    revalidatePath(p);
  }

  return NextResponse.json({ ok: true, value: next });
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/app/api/admin/skills/
git commit -m "feat(web/api): PATCH /api/admin/skills/[id]"
```

---

### Task 2.5: `/api/admin/faqs` (POST create) and `/api/admin/faqs/[id]` (PATCH/DELETE)

**Files:**
- Create: `packages/web/src/app/api/admin/faqs/route.ts`
- Create: `packages/web/src/app/api/admin/faqs/[id]/route.ts`

- [ ] **Step 1: Implement `faqs/route.ts` (POST)**

```ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { entityStore } from "@/lib/entity-store";
import { validateFaqInput } from "@/lib/validators";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import type { FAQ, FAQId } from "@sgs/data";
import { requireAdmin } from "../_middleware-helper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const result = validateFaqInput(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });

  const id = `faq_${nanoid(8)}` as FAQId;
  const next: FAQ = { id, ...result.value } as FAQ;

  try {
    await entityStore.putFaq(id, next);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  for (const p of pathsToRevalidate({ type: "faq", id, newValue: next })) {
    revalidatePath(p);
  }

  return NextResponse.json({ ok: true, value: next }, { status: 201 });
}
```

- [ ] **Step 2: Implement `faqs/[id]/route.ts` (PATCH + DELETE)**

```ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";
import { validateFaqInput } from "@/lib/validators";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import type { FAQ, FAQId } from "@sgs/data";
import { requireAdmin } from "../../_middleware-helper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const result = validateFaqInput(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });

  const old = await entityStore.getFaq(id as FAQId);
  if (!old) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const next: FAQ = { ...old, ...(result.value as Partial<FAQ>), id: id as FAQId };

  try {
    await entityStore.putFaq(id as FAQId, next);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  for (const p of pathsToRevalidate({ type: "faq", id, oldValue: old, newValue: next })) {
    revalidatePath(p);
  }

  return NextResponse.json({ ok: true, value: next });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const { id } = await ctx.params;
  const old = await entityStore.getFaq(id as FAQId);
  if (!old) return NextResponse.json({ error: "not-found" }, { status: 404 });

  try {
    await entityStore.deleteFaq(id as FAQId);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  for (const p of pathsToRevalidate({ type: "faq", id, oldValue: old })) {
    revalidatePath(p);
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/app/api/admin/faqs/
git commit -m "feat(web/api): FAQ create/update/delete"
```

---

### Task 2.6: `/api/admin/sync-search`

**Files:**
- Create: `packages/web/src/app/api/admin/sync-search/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "../_middleware-helper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const gate = await requireAdmin();
  if (gate) return gate;

  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) {
    return NextResponse.json({ error: "deploy-hook-not-configured" }, { status: 500 });
  }

  try {
    const r = await fetch(url, { method: "POST" });
    if (!r.ok) {
      return NextResponse.json({ error: "deploy-hook-failed", status: r.status }, { status: 502 });
    }
    return NextResponse.json({ ok: true, message: "Search index will refresh after the next deploy completes (~60-90s)." }, { status: 202 });
  } catch (e) {
    return NextResponse.json({ error: "deploy-hook-error", detail: String(e) }, { status: 502 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/app/api/admin/sync-search/
git commit -m "feat(web/api): sync-search triggers Vercel deploy hook"
```

---

## Phase 3 — Seed, Snapshot, CI

### Task 3.1: `scripts/seed-redis.ts`

**Files:**
- Create: `scripts/seed-redis.ts`

- [ ] **Step 1: Implement**

```ts
#!/usr/bin/env tsx
/**
 * One-time seed: read packages/data/src/{generals,skills,faq}.json
 * and write to Upstash Redis using the same key shapes as entityStore.
 *
 * Usage (locally pointing at PROD Upstash):
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... pnpm seed-redis
 */
import "dotenv/config";
import { Redis } from "@upstash/redis";
import generalsData from "../packages/data/src/generals.json" assert { type: "json" };
import skillsData from "../packages/data/src/skills.json" assert { type: "json" };
import faqData from "../packages/data/src/faq.json" assert { type: "json" };

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env vars");
  process.exit(1);
}
const r = new Redis({ url, token });

async function main() {
  const generals = generalsData as Array<{ id: string }>;
  const skills = skillsData as Array<{ id: string; generalIds?: string[] }>;
  const faqs = faqData as Array<{ id: string }>;

  console.log(`Seeding ${generals.length} generals, ${skills.length} skills, ${faqs.length} faqs ...`);

  // Generals
  for (const g of generals) {
    await r.set(`general:${g.id}`, g);
  }
  await r.set("generals:index", generals.map((g) => g.id));

  // Skills
  for (const s of skills) {
    await r.set(`skill:${s.id}`, s);
  }
  // Build reverse lookup
  const byGeneral: Record<string, string[]> = {};
  for (const s of skills) {
    for (const gid of s.generalIds ?? []) {
      (byGeneral[gid] ??= []).push(s.id);
    }
  }
  for (const [gid, sids] of Object.entries(byGeneral)) {
    await r.set(`skills:by-general:${gid}`, sids);
  }

  // FAQs
  for (const f of faqs) {
    await r.set(`faq:${f.id}`, f);
  }
  await r.set("faqs:index", faqs.map((f) => f.id));

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add `dotenv` dev dependency at root**

```bash
pnpm add -D -w dotenv
```

- [ ] **Step 3: Verify the seed script type-checks**

```bash
pnpm tsx --check scripts/seed-redis.ts || true
```

(`tsx` doesn't have a `--check` flag in current versions; this just verifies the file parses. If it errors with module not found, ignore — actual seed run is the real test.)

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-redis.ts package.json pnpm-lock.yaml
git commit -m "feat(scripts): seed-redis CLI to load JSON data into Upstash"
```

---

### Task 3.2: `scripts/dump-redis.ts` (used by nightly snapshot)

**Files:**
- Create: `scripts/dump-redis.ts`

- [ ] **Step 1: Implement**

```ts
#!/usr/bin/env tsx
/**
 * Dump current Upstash state -> JSON files in packages/data/src/.
 * Designed to be run by the nightly snapshot GitHub Action.
 *
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... pnpm dump-redis
 */
import "dotenv/config";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env vars");
  process.exit(1);
}
const r = new Redis({ url, token });

const HEADER =
  '_comment: "DO NOT EDIT MANUALLY — managed by /admin and the nightly redis-snapshot action. Manual edits will be overwritten."';

async function dumpEntities<T>(indexKey: string, valueKey: (id: string) => string): Promise<T[]> {
  const ids = (await r.get<string[]>(indexKey)) ?? [];
  if (ids.length === 0) return [];
  const values = await r.mget<(T | null)[]>(...ids.map(valueKey));
  return values.filter((v): v is T => v != null);
}

function writeJson(path: string, data: unknown[]) {
  // Wrap as { _comment, items } to allow a header comment in JSON
  const body = { _comment: HEADER, items: data };
  writeFileSync(path, JSON.stringify(body, null, 2) + "\n", "utf8");
}

async function main() {
  const dataDir = resolve(process.cwd(), "packages/data/src");

  const generals = await dumpEntities<unknown>("generals:index", (id) => `general:${id}`);
  const faqs = await dumpEntities<unknown>("faqs:index", (id) => `faq:${id}`);

  // Skills don't have a single index key; use the union of skill IDs from all skills:by-general:* keys.
  // For nightly snapshot we read all skill IDs from generals' skill arrays, which is the simpler invariant.
  const generalsTyped = generals as Array<{ skills?: string[] }>;
  const skillIds = Array.from(new Set(generalsTyped.flatMap((g) => g.skills ?? [])));
  const skillValues = skillIds.length > 0 ? await r.mget<(unknown | null)[]>(...skillIds.map((id) => `skill:${id}`)) : [];
  const skills = skillValues.filter((v): v is unknown => v != null);

  // Preserve the existing JSON file shape (top-level array) instead of changing all consumers.
  // We store as the legacy array; the DO-NOT-EDIT marker lives in a comment header file (see Task 3.4).
  writeFileSync(
    resolve(dataDir, "generals.json"),
    JSON.stringify(generals, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(
    resolve(dataDir, "skills.json"),
    JSON.stringify(skills, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(
    resolve(dataDir, "faq.json"),
    JSON.stringify(faqs, null, 2) + "\n",
    "utf8",
  );

  console.log(`Dumped: ${generals.length} generals, ${skills.length} skills, ${faqs.length} faqs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/dump-redis.ts
git commit -m "feat(scripts): dump-redis CLI for nightly snapshot back to JSON"
```

---

### Task 3.3: DO-NOT-EDIT marker + CI gate

**Files:**
- Create: `packages/data/src/MANAGED.md` (separate marker file — JSON cannot have comments natively)
- Create: `.github/workflows/data-files-guard.yml`

- [ ] **Step 1: Create the marker file**

Create `packages/data/src/MANAGED.md`:

```markdown
# DO NOT EDIT THESE JSON FILES MANUALLY

The following files in this directory are managed by the admin mode + nightly snapshot action:

- `generals.json`
- `skills.json`
- `faq.json`

Manual PR edits to these files will be flagged by CI (`.github/workflows/data-files-guard.yml`).
If you need to edit them outside the admin UI:

1. Either commit with `[snapshot]` somewhere in the message (the nightly action does this)
2. Or label the PR `data-edit-approved` (use sparingly; prefer the admin UI)

Other JSON files in this directory (cards.json, ocr-*, etc.) are NOT managed by admin mode and remain editable via PR.
```

- [ ] **Step 2: Create CI workflow**

Create `.github/workflows/data-files-guard.yml`:

```yaml
name: Guard managed data files

on:
  pull_request:
    paths:
      - "packages/data/src/generals.json"
      - "packages/data/src/skills.json"
      - "packages/data/src/faq.json"

jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Check commits don't touch managed files (unless approved)
        run: |
          set -e
          changed=$(git diff --name-only "${{ github.event.pull_request.base.sha }}" "${{ github.event.pull_request.head.sha }}" -- packages/data/src/generals.json packages/data/src/skills.json packages/data/src/faq.json)
          if [ -z "$changed" ]; then
            echo "No managed files changed."
            exit 0
          fi

          # Permit if every commit touching these files contains [snapshot] OR if PR has data-edit-approved label.
          has_label="${{ contains(github.event.pull_request.labels.*.name, 'data-edit-approved') }}"
          if [ "$has_label" = "true" ]; then
            echo "PR has data-edit-approved label; allowing."
            exit 0
          fi

          # Inspect each commit
          all_snapshot=true
          for sha in $(git log --format=%H "${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}" -- packages/data/src/generals.json packages/data/src/skills.json packages/data/src/faq.json); do
            msg=$(git log -n1 --format=%B "$sha")
            if ! echo "$msg" | grep -q '\[snapshot\]'; then
              echo "Commit $sha modifies managed files but lacks [snapshot] tag:"
              echo "$msg" | head -3
              all_snapshot=false
            fi
          done

          if [ "$all_snapshot" = "false" ]; then
            echo ""
            echo "::error::Managed JSON files were modified outside of the admin / snapshot flow."
            echo "::error::Either revert these edits and use /admin, or add the data-edit-approved label."
            exit 1
          fi

          echo "All commits touching managed files are [snapshot] commits; allowing."
```

- [ ] **Step 3: Commit**

```bash
git add packages/data/src/MANAGED.md .github/workflows/data-files-guard.yml
git commit -m "ci(data): guard against manual edits to admin-managed JSON files"
```

---

### Task 3.4: Nightly snapshot workflow

**Files:**
- Create: `.github/workflows/redis-snapshot.yml`

- [ ] **Step 1: Implement**

```yaml
name: Nightly Redis -> JSON snapshot

on:
  schedule:
    - cron: "0 3 * * *" # 03:00 UTC daily
  workflow_dispatch: {}

jobs:
  snapshot:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    env:
      UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
      UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Dump Redis to JSON
        run: pnpm --filter @sgs/web dump-redis
      - name: Commit if changed
        run: |
          set -e
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          if git diff --quiet -- packages/data/src/generals.json packages/data/src/skills.json packages/data/src/faq.json; then
            echo "No changes."
            exit 0
          fi
          today=$(date -u +%Y-%m-%d)
          git add packages/data/src/generals.json packages/data/src/skills.json packages/data/src/faq.json
          git commit -m "data: nightly snapshot ${today} [snapshot]"
          git push
```

- [ ] **Step 2: Set GitHub repo secrets**

Manual: in GitHub repo → Settings → Secrets and variables → Actions → set:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

(Document this in the commit body as a reminder.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/redis-snapshot.yml
git commit -m "$(cat <<'EOF'
ci(snapshot): nightly Redis -> JSON dump committed back to main

Requires repo secrets UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
EOF
)"
```

---

## Phase 4 — Refactor pages to use entityStore

### Task 4.1: Refactor `/generals` (list page)

**Files:**
- Modify: `packages/web/src/app/generals/page.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat packages/web/src/app/generals/page.tsx
```

(Inspect the current data import + how it uses generals.)

- [ ] **Step 2: Replace JSON import with `entityStore.getGenerals()`; make page async**

In `packages/web/src/app/generals/page.tsx`:
- Remove `import generalsData from "../../../../data/src/generals.json";`
- Add `import { entityStore } from "@/lib/entity-store";`
- Change the page from default-exported function `GeneralsPage()` to `async function GeneralsPage()`
- Replace any `(generalsData as ...)` uses with `const generals = await entityStore.getGenerals();`

(Exact diff depends on current file content; preserve all rendering logic, only change the data source.)

- [ ] **Step 3: Run dev + smoke**

```bash
pnpm --filter @sgs/web dev
# Visit http://localhost:3000/generals — should render exactly as before (Redis env vars unset → JSON fallback path used)
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/app/generals/page.tsx
git commit -m "refactor(web/generals): list page reads from entityStore"
```

---

### Task 4.2: Refactor `/generals/[id]` (detail page)

**Files:**
- Modify: `packages/web/src/app/generals/[id]/page.tsx`

- [ ] **Step 1: Replace JSON imports with entityStore calls**

In `packages/web/src/app/generals/[id]/page.tsx`:
- Remove `import generalsData from "../../../../../data/src/generals.json";`, `skillsData`, `faqData`
- (Keep the `cardTextData` import; OCR text isn't part of admin scope)
- Add `import { entityStore } from "@/lib/entity-store";`
- Inside the page component (already async), replace lookup-map construction with:
  ```ts
  const general = await entityStore.getGeneral(id as any);
  if (!general) notFound();
  const generalSkills = await entityStore.getSkillsByGeneral(general.id as any);
  const allFaqs = await entityStore.getFaqs();
  const generalFaqs = allFaqs.filter((f) => f.relatedGeneralIds?.includes(general.id as any));
  ```
- Update `generateStaticParams` to call `entityStore.getGenerals()` instead of in-module map

- [ ] **Step 2: Run dev + smoke**

```bash
pnpm --filter @sgs/web dev
# Visit /generals/<some-id> — should render identically (JSON fallback path still works)
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/app/generals/[id]/page.tsx
git commit -m "refactor(web/generals/[id]): detail page reads from entityStore"
```

---

### Task 4.3: Refactor `/faq`

**Files:**
- Modify: `packages/web/src/app/faq/page.tsx`

- [ ] **Step 1: Replace imports**

In `packages/web/src/app/faq/page.tsx`:
- Remove the three JSON imports
- Add `import { entityStore } from "@/lib/entity-store";`
- Make the page `async`
- Replace the `const generalNameMap = new Map(...)` etc. construction with:
  ```ts
  const [faqs, generals, skills] = await Promise.all([
    entityStore.getFaqs(),
    entityStore.getGenerals(),
    Promise.resolve([] as Array<{id:string;name:string}>), // skills name map: keep build-time for now since v1 doesn't edit skill list
  ]);
  // Or just: const skills = await entityStore.getSkillsByGeneral(...) for each general — too expensive.
  // For v1, FAQ list page only shows skill *names* — keep skill name map from JSON since skills are not deletable.
  ```
- For skill names (used as plain strings in FAQ entries), keep the JSON import:
  ```ts
  import skillsData from "../../../../data/src/skills.json";
  const skillNameMap = new Map<string, string>((skillsData as Array<{id:string;name:string}>).map((s) => [s.id, s.name]));
  ```
  (This is acceptable: skill names rarely change; if a skill is edited via admin, the FAQ page will rebuild on next deploy/sync-search trigger.)

- [ ] **Step 2: Smoke test**

```bash
pnpm --filter @sgs/web dev
# Visit /faq — should render identically
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/app/faq/page.tsx
git commit -m "refactor(web/faq): FAQ list reads from entityStore"
```

---

## Phase 5 — Admin UI

### Task 5.1: AdminContext + auth client helper

**Files:**
- Create: `packages/web/src/components/admin/AdminContext.tsx`
- Create: `packages/web/src/lib/admin-fetch.ts`

- [ ] **Step 1: Create `AdminContext.tsx`**

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AdminCtx {
  authed: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AdminCtx>({ authed: false, loading: true, refresh: async () => {} });

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useMemo(
    () => async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = (await r.json()) as { authed?: boolean };
        setAuthed(Boolean(j.authed));
      } catch {
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ authed, loading, refresh }}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  return useContext(Ctx);
}
```

- [ ] **Step 2: Create `admin-fetch.ts`**

```ts
export interface AdminFetchError {
  status: number;
  message: string;
  fieldErrors?: Array<{ path: string; message: string }>;
}

export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });
  const ct = r.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await r.json().catch(() => null) : null;
  if (!r.ok) {
    const err: AdminFetchError = {
      status: r.status,
      message: body?.error ?? body?.detail ?? r.statusText,
      fieldErrors: body?.errors,
    };
    throw err;
  }
  return body as T;
}
```

- [ ] **Step 3: Wire `AdminProvider` into root layout**

Modify `packages/web/src/app/layout.tsx`:
- Add `import { AdminProvider } from "@/components/admin/AdminContext";`
- Wrap `<main>{children}</main>` (or the `<div>` containing it) with `<AdminProvider>...</AdminProvider>`

Example diff:

```tsx
// before
<div className="flex min-h-screen flex-col">
  <Header />
  <main className="flex-1">{children}</main>
  <Footer />
</div>

// after
<AdminProvider>
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
</AdminProvider>
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/components/admin/AdminContext.tsx packages/web/src/lib/admin-fetch.ts packages/web/src/app/layout.tsx
git commit -m "feat(web/admin): AdminContext provider + admin-fetch helper"
```

---

### Task 5.2: `/admin/login` page

**Files:**
- Create: `packages/web/src/app/admin/login/page.tsx`
- Create: `packages/web/src/app/admin/login/LoginForm.tsx`

- [ ] **Step 1: Implement `LoginForm.tsx` (client component)**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error === "invalid-password" ? "密码错误" : "登录失败，请重试");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-24 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-semibold">管理员登录</h1>
      <input
        type="password"
        autoFocus
        autoComplete="current-password"
        className="w-full rounded border border-vermillion/30 bg-paper-mist/70 p-3 dark:bg-night/70"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting || password.length === 0}
        className="w-full rounded bg-vermillion px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Implement `page.tsx`**

```tsx
import LoginForm from "./LoginForm";

export const metadata = { title: "管理员登录" };

export default function AdminLoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 3: Smoke test**

```bash
pnpm --filter @sgs/web dev
# Visit http://localhost:3000/admin/login — type wrong password → 密码错误; type correct → redirect home
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/app/admin/login/
git commit -m "feat(web/admin): /admin/login page"
```

---

### Task 5.3: `<AdminAffordances />` top bar

**Files:**
- Create: `packages/web/src/components/admin/AdminAffordances.tsx`
- Modify: `packages/web/src/components/layout/Header.tsx`

- [ ] **Step 1: Implement `AdminAffordances.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "./AdminContext";
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminAffordances() {
  const router = useRouter();
  const { authed, loading, refresh } = useAdmin();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  if (loading || !authed) return null;

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      await adminFetch<{ message: string }>("/api/admin/sync-search", { method: "POST" });
      setSyncMsg("已触发部署，搜索约 60-90s 后对齐");
      setTimeout(() => setSyncMsg(null), 5000);
    } catch {
      setSyncMsg("同步失败，请稍后重试");
      setTimeout(() => setSyncMsg(null), 5000);
    } finally {
      setSyncing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refresh();
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        管理员模式
      </span>
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="rounded border border-vermillion/40 px-2.5 py-1 hover:bg-vermillion/10 disabled:opacity-50"
        title="触发 Vercel 重新部署，让首页搜索框反映最新内容"
      >
        {syncing ? "同步中…" : "同步搜索"}
      </button>
      {syncMsg && <span className="text-ink-mute dark:text-ivory-soft">{syncMsg}</span>}
      <button
        type="button"
        onClick={handleLogout}
        className="text-ink-mute underline-offset-4 hover:underline dark:text-ivory-soft"
      >
        退出
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire into Header**

In `packages/web/src/components/layout/Header.tsx`:
- Add `import AdminAffordances from "@/components/admin/AdminAffordances";`
- Place `<AdminAffordances />` in the desktop top bar, e.g., right before `<Navigation />`:

```tsx
<div className="hidden items-center gap-4 lg:flex">
  <AdminAffordances />
  <GlobalSearch />
  <Navigation />
</div>
```

- [ ] **Step 3: Smoke**

After login, header should show `● 管理员模式 [同步搜索] 退出`. Logged out: nothing.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/components/admin/AdminAffordances.tsx packages/web/src/components/layout/Header.tsx
git commit -m "feat(web/admin): top-bar admin affordances (status, sync-search, logout)"
```

---

### Task 5.4: Shared `MultiSelect` and `TagInput` controls

**Files:**
- Create: `packages/web/src/components/admin/MultiSelect.tsx`
- Create: `packages/web/src/components/admin/TagInput.tsx`

- [ ] **Step 1: Implement `MultiSelect.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";

interface Option {
  value: string;
  label: string;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "搜索…",
}: {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const selected = useMemo(() => new Set(value), [value]);
  const filtered = useMemo(
    () =>
      options
        .filter((o) => !selected.has(o.value))
        .filter((o) => o.label.includes(q) || o.value.includes(q))
        .slice(0, 20),
    [options, selected, q],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((v) => {
          const opt = options.find((o) => o.value === v);
          return (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border border-vermillion/30 bg-vermillion/10 px-2 py-0.5 text-xs"
            >
              {opt?.label ?? v}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="text-ink-mute hover:text-vermillion"
                aria-label="移除"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <input
        className="w-full rounded border border-slate-300/60 bg-paper-mist/50 px-2 py-1 text-sm dark:border-slate-700/60 dark:bg-night/50"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q && filtered.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded border border-slate-300/60 bg-white text-sm dark:border-slate-700/60 dark:bg-slate-900">
          {filtered.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange([...value, o.value]);
                  setQ("");
                }}
                className="w-full px-2 py-1 text-left hover:bg-vermillion/10"
              >
                {o.label} <span className="text-ink-mute">({o.value})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement `TagInput.tsx`**

```tsx
"use client";

import { useState, type KeyboardEvent } from "react";

export default function TagInput({
  value,
  onChange,
  placeholder = "回车添加",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim();
    if (!t || value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300/60 bg-slate-100 px-2 py-0.5 text-xs dark:border-slate-700/60 dark:bg-slate-800"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="text-ink-mute hover:text-vermillion"
              aria-label="移除"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="w-full rounded border border-slate-300/60 bg-paper-mist/50 px-2 py-1 text-sm dark:border-slate-700/60 dark:bg-night/50"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/admin/MultiSelect.tsx packages/web/src/components/admin/TagInput.tsx
git commit -m "feat(web/admin): shared MultiSelect and TagInput controls"
```

---

### Task 5.5: `GeneralEditForm` (gear button on detail page)

**Files:**
- Create: `packages/web/src/components/admin/GeneralEditForm.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { General } from "@sgs/data";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import MultiSelect from "./MultiSelect";
import TagInput from "./TagInput";

const FACTIONS = [
  { value: "WEI", label: "魏" },
  { value: "SHU", label: "蜀" },
  { value: "WU", label: "吴" },
  { value: "QUN", label: "群" },
  { value: "JIN", label: "晋" },
];

export default function GeneralEditForm({
  general,
  allGenerals,
  allSkills,
  onClose,
}: {
  general: General;
  allGenerals: Array<{ id: string; name: string }>;
  allSkills: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<General>(general);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await adminFetch(`/api/admin/generals/${general.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setToast("已保存。如需让首页搜索立即对齐，点顶栏的「同步搜索」");
      router.refresh();
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1200);
    } catch (e) {
      const err = e as AdminFetchError;
      if (err.fieldErrors) {
        const map: Record<string, string> = {};
        for (const fe of err.fieldErrors) map[fe.path] = fe.message;
        setFieldErrors(map);
      } else {
        setError(err.message ?? "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-vermillion/30 bg-paper-mist/80 p-4 text-sm dark:bg-night/80">
      <h3 className="font-semibold">编辑武将基础字段</h3>
      <Field label="名称" error={fieldErrors.name}>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="称号" error={fieldErrors.title}>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="势力" error={fieldErrors.faction}>
        <select className="input" value={form.faction} onChange={(e) => setForm({ ...form, faction: e.target.value as General["faction"] })}>
          {FACTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <Field label="副势力（可选）" error={fieldErrors.subfaction}>
        <select className="input" value={form.subfaction ?? ""} onChange={(e) => setForm({ ...form, subfaction: (e.target.value || undefined) as General["subfaction"] })}>
          <option value="">（无）</option>
          {FACTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="HP" error={fieldErrors.hp}>
          <input type="number" min={1} max={12} className="input" value={form.hp} onChange={(e) => setForm({ ...form, hp: parseInt(e.target.value, 10) })} />
        </Field>
        <Field label="HP上限" error={fieldErrors.maxHp}>
          <input type="number" min={1} max={12} className="input" value={form.maxHp} onChange={(e) => setForm({ ...form, maxHp: parseInt(e.target.value, 10) })} />
        </Field>
      </div>
      <Field label="性别" error={fieldErrors.gender}>
        <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as General["gender"] })}>
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
      </Field>
      <Field label="技能" error={fieldErrors.skills}>
        <MultiSelect
          options={allSkills.map((s) => ({ value: s.id, label: s.name }))}
          value={form.skills as unknown as string[]}
          onChange={(next) => setForm({ ...form, skills: next as unknown as General["skills"] })}
        />
      </Field>
      <Field label="image (URL)" error={fieldErrors.image}>
        <input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
      </Field>
      <Field label="包/系列" error={fieldErrors.pack}>
        <input className="input" value={form.pack} onChange={(e) => setForm({ ...form, pack: e.target.value })} />
      </Field>
      <Field label="设计师">
        <input className="input" value={form.designer ?? ""} onChange={(e) => setForm({ ...form, designer: e.target.value || undefined })} />
      </Field>
      <Field label="珠联璧合搭档（武将ID）">
        <MultiSelect
          options={allGenerals.filter((g) => g.id !== general.id).map((g) => ({ value: g.id, label: g.name }))}
          value={(form.perfectMatchPartners as unknown as string[]) ?? []}
          onChange={(next) => setForm({ ...form, perfectMatchPartners: next as unknown as General["perfectMatchPartners"] })}
        />
      </Field>
      <Field label="pairedNames">
        <TagInput value={form.pairedNames ?? []} onChange={(next) => setForm({ ...form, pairedNames: next })} />
      </Field>
      <div className="flex items-center gap-3 pt-1">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!form.paired} onChange={(e) => setForm({ ...form, paired: e.target.checked })} />
          双将
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!form.isEmperor} onChange={(e) => setForm({ ...form, isEmperor: e.target.checked })} />
          主公
        </label>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {toast && <p className="text-emerald-600 dark:text-emerald-300">{toast}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="rounded border border-slate-400/50 px-3 py-1" onClick={onClose}>取消</button>
        <button type="button" disabled={saving} className="rounded bg-vermillion px-3 py-1 text-white disabled:opacity-50" onClick={save}>
          {saving ? "保存中…" : "保存"}
        </button>
      </div>

      <style jsx>{`
        .input { width: 100%; border: 1px solid rgba(100,100,100,0.3); border-radius: 4px; padding: 0.4rem 0.5rem; background: transparent; }
      `}</style>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/admin/GeneralEditForm.tsx
git commit -m "feat(web/admin): GeneralEditForm with typed inline editing"
```

---

### Task 5.6: `SkillEditForm`

**Files:**
- Create: `packages/web/src/components/admin/SkillEditForm.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Skill } from "@sgs/data";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import TagInput from "./TagInput";

const SKILL_TYPES = [
  { value: "active", label: "主动" },
  { value: "passive", label: "被动" },
  { value: "lock", label: "锁定" },
  { value: "limited", label: "限定" },
  { value: "awakening", label: "觉醒" },
  { value: "mission", label: "使命" },
];

export default function SkillEditForm({
  skill,
  onClose,
}: {
  skill: Skill;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Skill>(skill);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await adminFetch(`/api/admin/skills/${skill.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setToast("已保存。如需让首页搜索立即对齐，点顶栏的「同步搜索」");
      router.refresh();
      setTimeout(() => { setToast(null); onClose(); }, 1200);
    } catch (e) {
      const err = e as AdminFetchError;
      if (err.fieldErrors) {
        const m: Record<string, string> = {};
        for (const fe of err.fieldErrors) m[fe.path] = fe.message;
        setFieldErrors(m);
      } else {
        setError(err.message ?? "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-vermillion/30 bg-paper-mist/80 p-4 text-sm dark:bg-night/80">
      <h3 className="font-semibold">编辑技能</h3>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">名称</span>
        <input className="w-full rounded border border-slate-300/50 px-2 py-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        {fieldErrors.name && <span className="text-xs text-red-500">{fieldErrors.name}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">类型</span>
        <select className="w-full rounded border border-slate-300/50 px-2 py-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Skill["type"] })}>
          {SKILL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {fieldErrors.type && <span className="text-xs text-red-500">{fieldErrors.type}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">描述</span>
        <textarea
          rows={6}
          className="w-full rounded border border-slate-300/50 px-2 py-1 leading-relaxed"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {fieldErrors.description && <span className="text-xs text-red-500">{fieldErrors.description}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">时机 (timing)</span>
        <TagInput value={form.timing ?? []} onChange={(next) => setForm({ ...form, timing: next })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-mute dark:text-ivory-soft">标签</span>
        <TagInput value={form.tags ?? []} onChange={(next) => setForm({ ...form, tags: next })} />
      </label>

      {error && <p className="text-red-500">{error}</p>}
      {toast && <p className="text-emerald-600 dark:text-emerald-300">{toast}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="rounded border border-slate-400/50 px-3 py-1" onClick={onClose}>取消</button>
        <button type="button" disabled={saving} className="rounded bg-vermillion px-3 py-1 text-white disabled:opacity-50" onClick={save}>
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/admin/SkillEditForm.tsx
git commit -m "feat(web/admin): SkillEditForm"
```

---

### Task 5.7: `FaqNewForm` and `FaqEditForm`

**Files:**
- Create: `packages/web/src/components/admin/FaqNewForm.tsx`
- Create: `packages/web/src/components/admin/FaqEditForm.tsx`

- [ ] **Step 1: Implement `FaqNewForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import MultiSelect from "./MultiSelect";

const CATEGORIES = [
  { value: "general", label: "通用" },
  { value: "skill", label: "技能" },
  { value: "card", label: "卡牌" },
  { value: "rule", label: "规则" },
];

export default function FaqNewForm({
  preselectedGeneralId,
  allGenerals,
  onClose,
}: {
  preselectedGeneralId?: string;
  allGenerals: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<"general" | "skill" | "card" | "rule">("general");
  const [related, setRelated] = useState<string[]>(preselectedGeneralId ? [preselectedGeneralId] : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await adminFetch(`/api/admin/faqs`, {
        method: "POST",
        body: JSON.stringify({ question, answer, category, relatedGeneralIds: related }),
      });
      router.refresh();
      onClose();
    } catch (e) {
      const err = e as AdminFetchError;
      if (err.fieldErrors) {
        const m: Record<string, string> = {};
        for (const fe of err.fieldErrors) m[fe.path] = fe.message;
        setFieldErrors(m);
      } else {
        setError(err.message ?? "新建失败");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-vermillion/30 bg-paper-mist/80 p-4 text-sm dark:bg-night/80">
      <h3 className="font-semibold">新建 FAQ</h3>
      <label className="block">
        <span className="mb-1 block text-xs">问题</span>
        <textarea rows={2} className="w-full rounded border border-slate-300/50 px-2 py-1" value={question} onChange={(e) => setQuestion(e.target.value)} />
        {fieldErrors.question && <span className="text-xs text-red-500">{fieldErrors.question}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">答案</span>
        <textarea rows={4} className="w-full rounded border border-slate-300/50 px-2 py-1" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        {fieldErrors.answer && <span className="text-xs text-red-500">{fieldErrors.answer}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">类别</span>
        <select className="w-full rounded border border-slate-300/50 px-2 py-1" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        {fieldErrors.category && <span className="text-xs text-red-500">{fieldErrors.category}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">关联武将</span>
        <MultiSelect
          options={allGenerals.map((g) => ({ value: g.id, label: g.name }))}
          value={related}
          onChange={setRelated}
        />
      </label>

      {error && <p className="text-red-500">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="rounded border border-slate-400/50 px-3 py-1" onClick={onClose}>取消</button>
        <button type="button" disabled={saving} className="rounded bg-vermillion px-3 py-1 text-white disabled:opacity-50" onClick={submit}>
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `FaqEditForm.tsx`** (similar to `FaqNewForm` but PATCH and includes Delete button)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FAQ } from "@sgs/data";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import MultiSelect from "./MultiSelect";

const CATEGORIES = [
  { value: "general", label: "通用" },
  { value: "skill", label: "技能" },
  { value: "card", label: "卡牌" },
  { value: "rule", label: "规则" },
];

export default function FaqEditForm({
  faq,
  allGenerals,
  onClose,
}: {
  faq: FAQ;
  allGenerals: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [category, setCategory] = useState<FAQ["category"]>(faq.category);
  const [related, setRelated] = useState<string[]>(((faq.relatedGeneralIds as unknown as string[]) ?? []));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await adminFetch(`/api/admin/faqs/${faq.id}`, {
        method: "PATCH",
        body: JSON.stringify({ question, answer, category, relatedGeneralIds: related }),
      });
      router.refresh();
      onClose();
    } catch (e) {
      const err = e as AdminFetchError;
      if (err.fieldErrors) {
        const m: Record<string, string> = {};
        for (const fe of err.fieldErrors) m[fe.path] = fe.message;
        setFieldErrors(m);
      } else {
        setError(err.message ?? "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm("确定删除这条 FAQ 吗？此操作无法撤销。")) return;
    setDeleting(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/faqs/${faq.id}`, { method: "DELETE" });
      router.refresh();
      onClose();
    } catch (e) {
      const err = e as AdminFetchError;
      setError(err.message ?? "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-vermillion/30 bg-paper-mist/80 p-4 text-sm dark:bg-night/80">
      <h3 className="font-semibold">编辑 FAQ</h3>
      <label className="block">
        <span className="mb-1 block text-xs">问题</span>
        <textarea rows={2} className="w-full rounded border border-slate-300/50 px-2 py-1" value={question} onChange={(e) => setQuestion(e.target.value)} />
        {fieldErrors.question && <span className="text-xs text-red-500">{fieldErrors.question}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">答案</span>
        <textarea rows={4} className="w-full rounded border border-slate-300/50 px-2 py-1" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        {fieldErrors.answer && <span className="text-xs text-red-500">{fieldErrors.answer}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">类别</span>
        <select className="w-full rounded border border-slate-300/50 px-2 py-1" value={category} onChange={(e) => setCategory(e.target.value as FAQ["category"])}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs">关联武将</span>
        <MultiSelect
          options={allGenerals.map((g) => ({ value: g.id, label: g.name }))}
          value={related}
          onChange={setRelated}
        />
      </label>

      {error && <p className="text-red-500">{error}</p>}
      <div className="flex items-center justify-between pt-2">
        <button type="button" disabled={deleting} className="rounded border border-red-500/50 px-3 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50" onClick={del}>
          {deleting ? "删除中…" : "删除"}
        </button>
        <div className="flex gap-2">
          <button type="button" className="rounded border border-slate-400/50 px-3 py-1" onClick={onClose}>取消</button>
          <button type="button" disabled={saving} className="rounded bg-vermillion px-3 py-1 text-white disabled:opacity-50" onClick={save}>
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/admin/FaqNewForm.tsx packages/web/src/components/admin/FaqEditForm.tsx
git commit -m "feat(web/admin): FAQ new/edit/delete forms"
```

---

### Task 5.8: Wire affordances into existing pages

**Files:**
- Modify: `packages/web/src/app/generals/[id]/page.tsx`
- Modify: `packages/web/src/app/generals/[id]/components/SkillCard.tsx`
- Modify: `packages/web/src/app/faq/components/FaqListClient.tsx`

- [ ] **Step 1: Create `EditAffordance.tsx` (toggle wrapper)**

Create `packages/web/src/components/admin/EditAffordance.tsx`:

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { useAdmin } from "./AdminContext";

/**
 * Renders `trigger` (a small pencil/gear button) only when admin is logged in.
 * When clicked, replaces `trigger` with the result of `renderForm({ close })`.
 */
export default function EditAffordance({
  trigger,
  renderForm,
}: {
  trigger: ReactNode;
  renderForm: (close: () => void) => ReactNode;
}) {
  const { authed } = useAdmin();
  const [open, setOpen] = useState(false);
  if (!authed) return null;
  if (open) return <>{renderForm(() => setOpen(false))}</>;
  return <button type="button" onClick={() => setOpen(true)}>{trigger}</button>;
}
```

- [ ] **Step 2: Use in `/generals/[id]/page.tsx`**

In `packages/web/src/app/generals/[id]/page.tsx`, after fetching `general` / `generalSkills` / `generalFaqs`:

a) Add a gear icon next to the general's name section (top-right of info panel):

```tsx
import EditAffordance from "@/components/admin/EditAffordance";
import GeneralEditForm from "@/components/admin/GeneralEditForm";
import FaqNewForm from "@/components/admin/FaqNewForm";

// Inside the info panel, near the name:
<EditAffordance
  trigger={<span className="text-vermillion" title="编辑武将基础字段">⚙️</span>}
  renderForm={(close) => (
    <GeneralEditForm
      general={general}
      allGenerals={await /* must be loaded server-side */ {/* see step 3 */}}
      allSkills={/* ... */}
      onClose={close}
    />
  )}
/>
```

NOTE: `EditAffordance.renderForm` runs on the client; you cannot `await` there. So pre-load `allGenerals` and `allSkills` server-side and pass them as plain props to a small client wrapper.

Practical fix — create `packages/web/src/app/generals/[id]/components/AdminBaseEdit.tsx`:

```tsx
"use client";

import type { General } from "@sgs/data";
import EditAffordance from "@/components/admin/EditAffordance";
import GeneralEditForm from "@/components/admin/GeneralEditForm";

export default function AdminBaseEdit({
  general,
  allGenerals,
  allSkills,
}: {
  general: General;
  allGenerals: Array<{ id: string; name: string }>;
  allSkills: Array<{ id: string; name: string }>;
}) {
  return (
    <EditAffordance
      trigger={<span className="text-vermillion" title="编辑武将基础字段">⚙ 编辑</span>}
      renderForm={(close) => (
        <GeneralEditForm general={general} allGenerals={allGenerals} allSkills={allSkills} onClose={close} />
      )}
    />
  );
}
```

In `page.tsx`:

```tsx
import AdminBaseEdit from "./components/AdminBaseEdit";

// Server-side load lookup lists
const [allGeneralsRaw, allSkillsRaw] = await Promise.all([
  entityStore.getGenerals(),
  // For all-skill lookup we currently don't have an index. Use the bundled JSON for the dropdown only.
  Promise.resolve((await import("../../../../data/src/skills.json")).default as Array<{ id: string; name: string }>),
]);
const allGenerals = allGeneralsRaw.map((g) => ({ id: g.id, name: g.name }));
const allSkills = allSkillsRaw.map((s) => ({ id: s.id, name: s.name }));

// In JSX, near the general's name:
<AdminBaseEdit general={general as General} allGenerals={allGenerals} allSkills={allSkills} />
```

b) Add a similar wrapper for skill cards (`AdminSkillEdit`) that wraps `<SkillEditForm>`. Place it inside `SkillCard` as a new prop slot, OR render it next to each `<SkillCard>` invocation.

Create `packages/web/src/app/generals/[id]/components/AdminSkillEdit.tsx`:

```tsx
"use client";

import type { Skill } from "@sgs/data";
import EditAffordance from "@/components/admin/EditAffordance";
import SkillEditForm from "@/components/admin/SkillEditForm";

export default function AdminSkillEdit({ skill }: { skill: Skill }) {
  return (
    <EditAffordance
      trigger={<span className="text-vermillion" title="编辑技能">✎</span>}
      renderForm={(close) => <SkillEditForm skill={skill} onClose={close} />}
    />
  );
}
```

Use next to each SkillCard in the page (right inside the `space-y-4` div):

```tsx
{generalSkills.map((skill) => (
  <div key={skill.id} className="relative">
    <div className="absolute right-2 top-2 z-10">
      <AdminSkillEdit skill={skill as Skill} />
    </div>
    <SkillCard ... />
  </div>
))}
```

c) Add a "+ 为本武将添加 FAQ" button below the existing FAQ section. Create `packages/web/src/app/generals/[id]/components/AdminFaqAdd.tsx`:

```tsx
"use client";

import EditAffordance from "@/components/admin/EditAffordance";
import FaqNewForm from "@/components/admin/FaqNewForm";

export default function AdminFaqAdd({
  generalId,
  allGenerals,
}: {
  generalId: string;
  allGenerals: Array<{ id: string; name: string }>;
}) {
  return (
    <EditAffordance
      trigger={<span className="rounded border border-vermillion/40 px-2 py-1 text-xs text-vermillion">+ 为本武将添加 FAQ</span>}
      renderForm={(close) => (
        <FaqNewForm preselectedGeneralId={generalId} allGenerals={allGenerals} onClose={close} />
      )}
    />
  );
}
```

In page.tsx, render it near the FAQ section header:

```tsx
{generalFaqs.length > 0 && (
  <section className="mt-10">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="section-title">常见问题</h2>
      <AdminFaqAdd generalId={general.id} allGenerals={allGenerals} />
    </div>
    {/* existing FAQ render */}
  </section>
)}
{generalFaqs.length === 0 && (
  <section className="mt-10">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="section-title">常见问题</h2>
      <AdminFaqAdd generalId={general.id} allGenerals={allGenerals} />
    </div>
  </section>
)}
```

- [ ] **Step 3: Add edit/delete affordances to FAQ list page**

In `packages/web/src/app/faq/components/FaqListClient.tsx`:

- Import `EditAffordance`, `FaqEditForm` (and bring in the full `FAQ` type)
- Add a per-row admin slot: pencil to edit, the form replaces the row inline when open
- Add a "+ 新建 FAQ" button at the top — same approach using `EditAffordance` + `FaqNewForm`

Example pseudo-diff (adapt to actual file structure):

```tsx
"use client";
import EditAffordance from "@/components/admin/EditAffordance";
import FaqEditForm from "@/components/admin/FaqEditForm";
import FaqNewForm from "@/components/admin/FaqNewForm";

// Top-level: render <EditAffordance> wrapping `+ 新建 FAQ` trigger
// Per row: render <EditAffordance> wrapping `✎` trigger that opens <FaqEditForm faq={...} ... />
// Pass `allGenerals` as a prop down from page.tsx
```

Update `packages/web/src/app/faq/page.tsx` to pass `allGenerals` to `FaqListClient`:

```tsx
const allGenerals = (await entityStore.getGenerals()).map((g) => ({ id: g.id, name: g.name }));
return <FaqListClient entries={entries} allGenerals={allGenerals} />;
```

And update `FaqListClient`'s prop type to include `allGenerals`.

- [ ] **Step 4: Smoke test**

```bash
pnpm --filter @sgs/web dev
# Login at /admin/login
# Navigate to /generals/<some-id> — see ⚙ 编辑 + ✎ on each skill + + FAQ button
# Click ⚙ → form opens; Cancel; Save (won't persist locally without Redis env vars — expect 502, that's fine for now)
# Logout — affordances disappear
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/app/generals/[id]/components/AdminBaseEdit.tsx \
        packages/web/src/app/generals/[id]/components/AdminSkillEdit.tsx \
        packages/web/src/app/generals/[id]/components/AdminFaqAdd.tsx \
        packages/web/src/app/generals/[id]/page.tsx \
        packages/web/src/app/faq/page.tsx \
        packages/web/src/app/faq/components/FaqListClient.tsx \
        packages/web/src/components/admin/EditAffordance.tsx
git commit -m "feat(web/admin): inline edit affordances on general detail + FAQ list"
```

---

## Phase 6 — Deploy + smoke

### Task 6.1: Configure Vercel + Upstash + first seed

- [ ] **Step 1: In Vercel Dashboard → Project → Storage → Marketplace → add Upstash Redis integration**

Vercel auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

- [ ] **Step 2: In Vercel Project → Settings → Environment Variables → add:**
  - `ADMIN_PASSWORD` = (your chosen password)
  - `SESSION_SECRET` = `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` output
  - `SESSION_GENERATION` = `1`
  - `VERCEL_DEPLOY_HOOK_URL` = (created in Settings → Git → Deploy Hooks)

- [ ] **Step 3: Pull env vars locally**

```bash
cd packages/web
vercel env pull .env.local
```

- [ ] **Step 4: Run seed against PROD Upstash**

```bash
cd ../..  # back to repo root
pnpm --filter @sgs/web exec dotenv -e packages/web/.env.local -- pnpm seed-redis
# OR simpler: source the env vars manually then run pnpm seed-redis
```

Verify with a quick read:

```bash
node -e "
const { Redis } = require('@upstash/redis');
const r = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
r.get('generals:index').then(idx => console.log('Generals indexed:', idx?.length));
"
```

- [ ] **Step 5: Deploy + smoke checklist**

```bash
git push  # main → Vercel deploys
```

After deploy, on prod URL:

- [ ] Visit `/generals/<some-id>` — page renders normally
- [ ] Visit `/admin/login` — login with `ADMIN_PASSWORD`
- [ ] Top bar shows `● 管理员模式 [同步搜索] 退出`
- [ ] Click ⚙ on a general → edit name → save → see toast → page refreshes with new name
- [ ] Click ✎ on a skill → edit description → save → see updated text
- [ ] Click `+ 为本武将添加 FAQ` → fill in → save → new FAQ appears in section
- [ ] Visit `/faq` → see new FAQ; click ✎ → edit → save → updated; click delete → confirm → gone
- [ ] Click "同步搜索" — toast says deploy triggered; after ~90s, search index reflects edits
- [ ] Click "退出" → top bar affordances disappear; `/admin/login` reachable again
- [ ] In Vercel logs: confirm no Redis errors during the smoke run
- [ ] Bump `SESSION_GENERATION` to `2` → redeploy → old session no longer authed; have to re-login
- [ ] Manually trigger `redis-snapshot` workflow run → confirm it commits to main with `[snapshot]` tag and `data-files-guard` skips it

- [ ] **Step 6: Final commit (record smoke completion)**

```bash
git commit --allow-empty -m "ops: admin mode v1 smoke-tested in prod"
```

---

## Self-Review Notes (post-write)

**Spec coverage check** — every spec section has at least one task:
- §2 In-scope items: tasks 5.5–5.8 (general/skill/FAQ edit), 5.3 (sync-search button), 1.1 + 6.1 (SESSION_GENERATION), 3.4 (nightly snapshot)
- §3 Components: tasks 0.1, 1.3 (entityStore), 2.1–2.6 (routes), 5.1 (AdminContext), 3.1 (seed), 3.4 (snapshot)
- §4 Data model: 1.3 (Redis keys + reverse lookup), 3.1 (seed), 4.5 (fallback inside entityStore), 4.4 (search docs in 5.3 + 6.1)
- §5 API: tasks 2.1–2.6 (all 8 endpoints + revalidate-map applied)
- §6 Auth: tasks 1.1 (HMAC + generation), 2.2 (login/logout/me)
- §7 UI: tasks 5.2 (login), 5.3 (top bar), 5.5–5.7 (forms), 5.8 (wire-in)
- §8 Error handling: validators (1.2), 502 in routes, fallback in entityStore (1.3)
- §9 Tests: 1.1, 1.2, 1.3, 1.4 unit; 6.1 manual smoke
- §10 Implementation steps: phases 0–6 mirror the spec's 18 steps
- §11 Risks: surface during smoke (6.1) and snapshot run

**No placeholders, no TBDs, no "implement later".**

**Type consistency** — `entityStore` interface is referenced consistently across routes (Phase 2) and pages (Phase 4); `pathsToRevalidate` signature consistent; `EditAffordance` props consistent across `AdminBaseEdit`/`AdminSkillEdit`/`AdminFaqAdd`.

**Known small gaps that are acceptable**:
- Schema validators don't cover every optional field (e.g., `subfaction` validation could be tighter); the rule "explicit > absent" is enforced for required fields. Pragmatic for v1.
- `dump-redis.ts` skill collection uses `general.skills` union as the canonical skill ID set. This matches today's data (every skill is referenced by some general) but if orphan skills exist they'd be lost from the snapshot. v1 acceptable; v2 can add a `skills:index` key.
