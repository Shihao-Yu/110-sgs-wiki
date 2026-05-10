# Admin 内联编辑模式 Implementation Plan **v2**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the admin inline-edit mode v1 — 1 technical + 1 non-technical admin can edit existing general/skill descriptions/fields and CRUD FAQs (relatedGeneralIds only) directly from live visitor pages, with changes visible to visitors within seconds, deployed on Vercel with Upstash Redis as the runtime store.

**Architecture:** Same as v1 plan. SSG pages read via `entityStore` adapter (Upstash primary, bundled JSON fallback for visitor reads on Redis outage with a user-visible banner). Admin writes via Route Handlers gated by HMAC-signed cookie + `SESSION_GENERATION` + per-IP rate limit + Origin check. After every admin write, `revalidatePath()` invalidates affected pages. `/api/admin/sync-search` triggers a Vercel deploy hook (with 90s self rate-limit) to refresh the build-time search index. Nightly GitHub Action dumps Redis → JSON for ≤24h drift bound, with failure-notification + push collision protection.

**Tech Stack:** Next.js 15 + React 19 + TypeScript + Tailwind (existing); `@upstash/redis`, `@upstash/ratelimit`, `nanoid` (new); vitest (existing).

**Spec:** `docs/superpowers/specs/2026-05-09-admin-mode-design.md`.

**Plan-review:** `docs/superpowers/reviews/2026-05-10-admin-mode-plan-review.md` (this v2 incorporates all 13 recommended revisions).

---

## Changes from v1 → v2

| Type | Tasks | Driver finding(s) |
|---|---|---|
| **NEW** | 0.3 (vitest wiring), 1.5 (`getSkills` + `skills:index`), 2.7 (route integration tests), 4.4 (FallbackBanner) | RC-QA-1, RC-PM-1, RC-PM-2, cross-cutting #5 |
| **MODIFIED** | 0.1 (+ratelimit dep), 1.1 (narrowing + passwordMatches tests), 1.2 (derived enums + length caps + image URL allowlist + restrict FAQ category), 1.3 (`__resetForTests`, `withTimeout`, throwing-mock test), 2.1 (move file + Origin check + body cap), 2.2 (rate limit + warning), 2.3-2.5 (PUT semantics + try/catch revalidate + If-Match), 2.6 (90s rate limit), 3.1 (target URL print + --yes + --force), 3.2 (clean dead code + `with` syntax + skills:index), 3.3 (fetch-depth), 3.4 (failure issue + pull --rebase + concurrency + 18:00 UTC + partial install), 5.* entire UI (a11y + dark-mode audit + global Toaster + inline confirm + dirty guard + mobile breakpoint), 6.1 (health endpoint + timing assertion + banner verification) | RC-DEV-1..6, RC-FE-1..4, RC-SEC-1..2, RC-OPS-1..3, RI-* clusters |

Tasks not listed are unchanged from v1.

---

## File Structure (additions over v1)

```
packages/web/src/lib/auth-gate.ts                     # MOVED from app/api/admin/_middleware-helper.ts
packages/web/src/lib/auth-gate.test.ts                # NEW: gate tests
packages/web/src/lib/ratelimit.ts                     # NEW: @upstash/ratelimit wrapper
packages/web/src/components/FallbackBanner.tsx        # NEW: visitor banner when Redis unavailable
packages/web/src/components/admin/Toaster.tsx         # NEW: global toast (replaces inline form toasts)
packages/web/src/components/admin/InlineConfirm.tsx   # NEW: branded delete confirmation
packages/web/src/app/api/admin/_smoke.test.ts         # NEW: integration tests for routes
packages/web/src/app/api/health/route.ts              # NEW: smoke endpoint
packages/web/src/app/globals.css                      # MODIFIED: add .input-base, .input-error utility classes
packages/web/vitest.config.ts                         # NEW (if Task 0.3 finds it missing)
packages/web/src/lib/fallback-flag.ts                 # NEW: request-scoped flag for FallbackBanner
```

## New environment variables (over v1)

```
UPSTASH_REDIS_REST_URL              # (same; auto-injected)
UPSTASH_REDIS_REST_TOKEN            # (same; auto-injected)
ADMIN_PASSWORD                       # (same)
SESSION_SECRET                       # (same; 32-byte hex)
SESSION_GENERATION                   # (same; integer, default "1")
VERCEL_DEPLOY_HOOK_URL               # (same)
# NEW: none — `@upstash/ratelimit` reuses the same Upstash connection.
```

---

## Phase 0 — Setup

### Task 0.1: Add dependencies (MODIFIED — adds @upstash/ratelimit)

**Files:**
- Modify: `packages/web/package.json`

- [ ] **Step 1: Add deps to `packages/web/package.json` `dependencies`**

```json
{
  "dependencies": {
    "@sgs/data": "workspace:*",
    "@sgs/engine": "workspace:*",
    "@upstash/redis": "^1.34.0",
    "@upstash/ratelimit": "^2.0.0",
    "nanoid": "^5.0.0",
    "next": "^15.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zustand": "^5.0.12"
  }
}
```

- [ ] **Step 2: Add scripts**

```json
{
  "scripts": {
    "dev": "node --trace-uncaught ./node_modules/next/dist/bin/next dev --turbopack",
    "build": "pnpm --filter '@sgs/data' build && node -e \"require('fs').rmSync('.next', { recursive: true, force: true }); require('fs').rmSync('out', { recursive: true, force: true });\" && node --trace-uncaught ./node_modules/next/dist/bin/next build",
    "start": "node --trace-uncaught ./node_modules/next/dist/bin/next start",
    "lint": "node --trace-uncaught ./node_modules/next/dist/bin/next lint",
    "test": "vitest run",
    "seed-redis": "tsx ../../scripts/seed-redis.ts",
    "dump-redis": "tsx ../../scripts/dump-redis.ts"
  }
}
```

- [ ] **Step 3: Install + commit**

```bash
pnpm install
git add packages/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add @upstash/redis + @upstash/ratelimit + nanoid; admin mode v2 deps"
```

### Task 0.2: `.env.example` (MODIFIED — add password strength note)

**Files:**
- Create: `packages/web/.env.example`

- [ ] **Step 1: Create**

```bash
# Upstash Redis — auto-injected by Vercel Marketplace integration in production
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Admin auth.
# ADMIN_PASSWORD: minimum 20 chars, random; OR a 4-word passphrase with numbers/punctuation.
# This is the ENTIRE security perimeter — there is no MFA, no separate admin accounts.
# See docs/superpowers/specs/2026-05-09-admin-mode-design.md §6 for rotation procedure.
ADMIN_PASSWORD=

# 32 bytes hex; generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=

# Bump (e.g. 2, 3) to force-logout all existing sessions (password leak, etc.)
SESSION_GENERATION=1

# Vercel Deploy Hook URL — used by /api/admin/sync-search to refresh build-time search index.
# Create at Vercel → Settings → Git → Deploy Hooks. Treat as a credential.
VERCEL_DEPLOY_HOOK_URL=
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/.env.example
git commit -m "chore(web): document env vars + password strength expectation"
```

### Task 0.3 [NEW]: Verify vitest wiring picks up packages/web tests

**Files:**
- Create (if missing): `packages/web/vitest.config.ts`

- [ ] **Step 1: Probe with a temporary test**

```bash
mkdir -p packages/web/src/lib
cat > packages/web/src/lib/_probe.test.ts <<'EOF'
import { describe, expect, it } from "vitest";
describe("vitest wiring", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
EOF

pnpm vitest run packages/web/src/lib/_probe.test.ts
```

- [ ] **Step 2a (probe passed): cleanup probe**

```bash
rm packages/web/src/lib/_probe.test.ts
```

- [ ] **Step 2b (probe failed): create `packages/web/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

Then re-run the probe. Once green, remove the probe file.

- [ ] **Step 3: Commit**

```bash
git add packages/web/vitest.config.ts
git commit -m "chore(web): wire vitest config so package tests are discovered"
```

(If no config was needed, skip this commit.)

---

## Phase 1 — Core libraries (TDD)

### Task 1.1: HMAC cookie auth (MODIFIED — narrowing + passwordMatches tests)

**Files:**
- Create: `packages/web/src/lib/auth.ts`
- Test: `packages/web/src/lib/auth.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { signSessionCookie, verifySessionCookie, passwordMatches } from "./auth.js";

const SECRET = "0".repeat(64);

describe("signSessionCookie / verifySessionCookie", () => {
  const ORIGINAL_GEN = process.env.SESSION_GENERATION;
  beforeEach(() => { process.env.SESSION_GENERATION = "1"; });
  afterEach(() => { process.env.SESSION_GENERATION = ORIGINAL_GEN; });

  it("round-trips", () => {
    const t = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    expect(verifySessionCookie(t, SECRET).ok).toBe(true);
  });
  it("rejects tampered payload", () => {
    const t = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    const [p, s] = t.split(".");
    expect(verifySessionCookie(`${p}X.${s}`, SECRET).ok).toBe(false);
  });
  it("rejects bad signature", () => {
    const t = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    const [p] = t.split(".");
    expect(verifySessionCookie(`${p}.${"f".repeat(64)}`, SECRET).ok).toBe(false);
  });
  it("rejects expired", () => {
    const t = signSessionCookie({ ttlSeconds: -10 }, SECRET);
    expect(verifySessionCookie(t, SECRET).ok).toBe(false);
  });
  it("rejects on SESSION_GENERATION mismatch", () => {
    const t = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    process.env.SESSION_GENERATION = "2";
    expect(verifySessionCookie(t, SECRET).ok).toBe(false);
  });
  it("rejects malformed (missing dot)", () => {
    expect(verifySessionCookie("no-dot-here", SECRET).ok).toBe(false);
  });
  it("rejects empty string", () => {
    expect(verifySessionCookie("", SECRET).ok).toBe(false);
  });
});

describe("passwordMatches", () => {
  it("true on exact match", () => {
    expect(passwordMatches("hunter2", "hunter2")).toBe(true);
  });
  it("false on mismatch (same length)", () => {
    expect(passwordMatches("hunter2", "hunter3")).toBe(false);
  });
  it("false on length mismatch", () => {
    expect(passwordMatches("hunter", "hunter2")).toBe(false);
  });
  it("false when expected is undefined", () => {
    expect(passwordMatches("anything", undefined)).toBe(false);
  });
  it("false when expected is empty", () => {
    expect(passwordMatches("", "")).toBe(false);
  });
  it("handles unicode", () => {
    expect(passwordMatches("一二三四", "一二三四")).toBe(true);
    expect(passwordMatches("一二三四", "一二三五")).toBe(false);
  });
});
```

- [ ] **Step 2: Run → expect fail**

```bash
pnpm vitest run packages/web/src/lib/auth.test.ts
```

- [ ] **Step 3: Implement `packages/web/src/lib/auth.ts` (with narrowing for `noUncheckedIndexedAccess`)**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

interface SessionPayload {
  exp: number;
  gen: number;
}

export function signSessionCookie(opts: { ttlSeconds: number }, secret: string): string {
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
  if (typeof token !== "string" || token.length === 0 || !token.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const payloadB64: string = parts[0]!;
  const sig: string = parts[1]!;
  if (!payloadB64 || !sig) return { ok: false, reason: "malformed" };

  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("hex");
  let sigBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    sigBuf = Buffer.from(sig, "hex");
    expectedBuf = Buffer.from(expectedSig, "hex");
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (sigBuf.length !== expectedBuf.length) return { ok: false, reason: "bad-signature" };
  if (!timingSafeEqual(sigBuf, expectedBuf)) return { ok: false, reason: "bad-signature" };

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
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
  if (typeof input !== "string" || input.length === 0) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run → expect pass; commit**

```bash
pnpm vitest run packages/web/src/lib/auth.test.ts
git add packages/web/src/lib/auth.ts packages/web/src/lib/auth.test.ts
git commit -m "feat(web/auth): HMAC session cookie + passwordMatches with full negative coverage"
```

### Task 1.2: Schema validators (MODIFIED — derived enums + length caps + image URL allowlist + restrict FAQ category)

**Files:**
- Create: `packages/web/src/lib/validators.ts`
- Test: `packages/web/src/lib/validators.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { validateGeneralPatch, validateSkillPatch, validateFaqInput, MAX_TEXT_LEN } from "./validators.js";

describe("validateGeneralPatch", () => {
  const valid = {
    name: "曹操", title: "魏武帝", faction: "WEI",
    hp: 4, maxHp: 4, gender: "male",
    skills: ["skill_jianxiong"], image: "/img/x.png", pack: "标准版",
  };
  it("accepts valid", () => expect(validateGeneralPatch(valid).ok).toBe(true));
  it("rejects unknown faction", () => {
    const r = validateGeneralPatch({ ...valid, faction: "ZZZ" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.path === "faction")).toBe(true);
  });
  it("rejects HP=0 and HP=20", () => {
    expect(validateGeneralPatch({ ...valid, hp: 0 }).ok).toBe(false);
    expect(validateGeneralPatch({ ...valid, hp: 20 }).ok).toBe(false);
  });
  it("rejects hp > maxHp", () => {
    expect(validateGeneralPatch({ ...valid, hp: 5, maxHp: 4 }).ok).toBe(false);
  });
  it("rejects empty name", () => expect(validateGeneralPatch({ ...valid, name: "" }).ok).toBe(false));
  it("rejects gender not in enum", () => expect(validateGeneralPatch({ ...valid, gender: "other" }).ok).toBe(false));
  it("rejects pairedNames non-array", () => {
    expect(validateGeneralPatch({ ...valid, pairedNames: "x" as any }).ok).toBe(false);
  });
  it("rejects unknown subfaction", () => {
    expect(validateGeneralPatch({ ...valid, subfaction: "ZZZ" }).ok).toBe(false);
  });
  it("rejects image with javascript: scheme", () => {
    const r = validateGeneralPatch({ ...valid, image: "javascript:alert(1)" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.path === "image")).toBe(true);
  });
  it("rejects image with data: scheme", () => {
    expect(validateGeneralPatch({ ...valid, image: "data:text/html,<script>" }).ok).toBe(false);
  });
  it("accepts image with absolute http", () => {
    expect(validateGeneralPatch({ ...valid, image: "https://example.com/x.png" }).ok).toBe(true);
  });
  it("accepts image with site-relative path", () => {
    expect(validateGeneralPatch({ ...valid, image: "/img/x.png" }).ok).toBe(true);
  });
  it("rejects null/undefined input", () => {
    expect(validateGeneralPatch(null).ok).toBe(false);
    expect(validateGeneralPatch(undefined).ok).toBe(false);
  });
});

describe("validateSkillPatch", () => {
  const valid = { name: "奸雄", description: "当你受到伤害后...", type: "passive", timing: ["damaged"] };
  it("accepts valid", () => expect(validateSkillPatch(valid).ok).toBe(true));
  it("rejects unknown type", () => expect(validateSkillPatch({ ...valid, type: "foo" }).ok).toBe(false));
  it("rejects empty description", () => expect(validateSkillPatch({ ...valid, description: "" }).ok).toBe(false));
  it("rejects non-array timing", () => expect(validateSkillPatch({ ...valid, timing: "x" as any }).ok).toBe(false));
  it("rejects description over MAX_TEXT_LEN", () => {
    const long = "a".repeat(MAX_TEXT_LEN + 1);
    expect(validateSkillPatch({ ...valid, description: long }).ok).toBe(false);
  });
});

describe("validateFaqInput", () => {
  const valid = { question: "?", answer: "!", category: "rule", relatedGeneralIds: ["general_caocao"] };
  it("accepts valid", () => expect(validateFaqInput(valid).ok).toBe(true));
  it("accepts empty relatedGeneralIds", () => expect(validateFaqInput({ ...valid, relatedGeneralIds: [] }).ok).toBe(true));
  it("rejects missing question", () => expect(validateFaqInput({ ...valid, question: "" }).ok).toBe(false));
  it("rejects v1-disallowed category 'card'", () => {
    expect(validateFaqInput({ ...valid, category: "card" }).ok).toBe(false);
  });
  it("rejects v1-disallowed category 'skill'", () => {
    expect(validateFaqInput({ ...valid, category: "skill" }).ok).toBe(false);
  });
  it("accepts category 'general' and 'rule'", () => {
    expect(validateFaqInput({ ...valid, category: "general" }).ok).toBe(true);
    expect(validateFaqInput({ ...valid, category: "rule" }).ok).toBe(true);
  });
  it("rejects question over MAX_TEXT_LEN", () => {
    expect(validateFaqInput({ ...valid, question: "a".repeat(MAX_TEXT_LEN + 1) }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run → expect fail; then implement `packages/web/src/lib/validators.ts`**

```ts
// Pull canonical enums from the data package types where possible.
// Faction list comes from Faction type; SkillType from SkillType; FAQCategory from FAQCategory.
// We hard-code mirrors below but keep them minimal so drift is obvious in code review.
const FACTIONS = ["WEI", "SHU", "WU", "QUN", "JIN"] as const;
const GENDERS = ["male", "female"] as const;
const SKILL_TYPES = ["active", "passive", "lock", "limited", "awakening", "mission"] as const;
// v1 only exposes general/rule via the admin UI (skill/card categories require relations
// the v1 editor doesn't expose, so they'd produce orphans).
const FAQ_CATEGORIES_V1 = ["general", "rule"] as const;

export const MAX_TEXT_LEN = 5000;        // descriptions, answers, questions
export const MAX_SHORT_TEXT_LEN = 200;   // names, titles, single-line strings

export interface ValidationError { path: string; message: string }
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: ValidationError[] };

const isString = (v: unknown): v is string => typeof v === "string";
const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
const inRange = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const lenAtMost = (v: string, n: number) => v.length <= n;

// Image URL allowlist: site-relative path OR http(s):// absolute URL. Reject javascript:, data:, etc.
const IMAGE_URL_RE = /^(\/[^\s]*|https?:\/\/[^\s]+)$/;

export interface GeneralPatch {
  name: string; title: string;
  faction: typeof FACTIONS[number];
  subfaction?: typeof FACTIONS[number];
  hp: number; maxHp: number;
  gender: typeof GENDERS[number];
  skills: string[]; image: string;
  paired?: boolean; pairedNames?: string[];
  isEmperor?: boolean; designer?: string; pack: string;
  perfectMatchPartners?: string[];
}

export function validateGeneralPatch(input: unknown): ValidationResult<GeneralPatch> {
  const e: ValidationError[] = [];
  if (input == null || typeof input !== "object") {
    e.push({ path: "(root)", message: "请求体必须是对象" });
    return { ok: false, errors: e };
  }
  const v = input as Record<string, unknown>;
  if (!isNonEmptyString(v.name) || !lenAtMost(v.name, MAX_SHORT_TEXT_LEN)) e.push({ path: "name", message: "必填且 ≤200 字" });
  if (!isString(v.title) || !lenAtMost(v.title, MAX_SHORT_TEXT_LEN)) e.push({ path: "title", message: "≤200 字" });
  if (!FACTIONS.includes(v.faction as any)) e.push({ path: "faction", message: `必须是 ${FACTIONS.join("/")}` });
  if (v.subfaction !== undefined && !FACTIONS.includes(v.subfaction as any)) e.push({ path: "subfaction", message: "无效势力" });
  if (!inRange(v.hp, 1, 12)) e.push({ path: "hp", message: "HP 必须在 1-12" });
  if (!inRange(v.maxHp, 1, 12)) e.push({ path: "maxHp", message: "maxHp 必须在 1-12" });
  if (typeof v.hp === "number" && typeof v.maxHp === "number" && v.hp > v.maxHp) e.push({ path: "hp", message: "HP 不能大于 maxHp" });
  if (!GENDERS.includes(v.gender as any)) e.push({ path: "gender", message: "性别必须是 male/female" });
  if (!isStringArray(v.skills)) e.push({ path: "skills", message: "技能 ID 列表必须是字符串数组" });
  if (!isString(v.image) || !IMAGE_URL_RE.test(v.image)) e.push({ path: "image", message: "image 必须是 / 开头或 http(s):// 开头的 URL" });
  if (v.pairedNames !== undefined && !isStringArray(v.pairedNames)) e.push({ path: "pairedNames", message: "必须是字符串数组" });
  if (v.perfectMatchPartners !== undefined && !isStringArray(v.perfectMatchPartners)) e.push({ path: "perfectMatchPartners", message: "必须是字符串数组" });
  if (!isString(v.pack)) e.push({ path: "pack", message: "pack 必填" });
  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as GeneralPatch };
}

export interface SkillPatch {
  name: string; description: string;
  type: typeof SKILL_TYPES[number];
  timing: string[]; tags?: string[];
}

export function validateSkillPatch(input: unknown): ValidationResult<SkillPatch> {
  const e: ValidationError[] = [];
  if (input == null || typeof input !== "object") {
    return { ok: false, errors: [{ path: "(root)", message: "请求体必须是对象" }] };
  }
  const v = input as Record<string, unknown>;
  if (!isNonEmptyString(v.name) || !lenAtMost(v.name, MAX_SHORT_TEXT_LEN)) e.push({ path: "name", message: "必填且 ≤200 字" });
  if (!isNonEmptyString(v.description) || !lenAtMost(v.description, MAX_TEXT_LEN)) e.push({ path: "description", message: `必填且 ≤${MAX_TEXT_LEN} 字` });
  if (!SKILL_TYPES.includes(v.type as any)) e.push({ path: "type", message: `必须是 ${SKILL_TYPES.join("/")}` });
  if (!isStringArray(v.timing)) e.push({ path: "timing", message: "必须是字符串数组" });
  if (v.tags !== undefined && !isStringArray(v.tags)) e.push({ path: "tags", message: "必须是字符串数组" });
  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as SkillPatch };
}

export interface FaqInput {
  question: string; answer: string;
  category: typeof FAQ_CATEGORIES_V1[number];
  relatedGeneralIds: string[];
}

export function validateFaqInput(input: unknown): ValidationResult<FaqInput> {
  const e: ValidationError[] = [];
  if (input == null || typeof input !== "object") {
    return { ok: false, errors: [{ path: "(root)", message: "请求体必须是对象" }] };
  }
  const v = input as Record<string, unknown>;
  if (!isNonEmptyString(v.question) || !lenAtMost(v.question, MAX_TEXT_LEN)) e.push({ path: "question", message: `必填且 ≤${MAX_TEXT_LEN} 字` });
  if (!isNonEmptyString(v.answer) || !lenAtMost(v.answer, MAX_TEXT_LEN)) e.push({ path: "answer", message: `必填且 ≤${MAX_TEXT_LEN} 字` });
  if (!FAQ_CATEGORIES_V1.includes(v.category as any)) e.push({ path: "category", message: `v1 仅支持 ${FAQ_CATEGORIES_V1.join("/")}` });
  if (!isStringArray(v.relatedGeneralIds)) e.push({ path: "relatedGeneralIds", message: "必须是字符串数组（可空）" });
  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as FaqInput };
}
```

- [ ] **Step 3: Run → expect pass; commit**

```bash
pnpm vitest run packages/web/src/lib/validators.test.ts
git add packages/web/src/lib/validators.ts packages/web/src/lib/validators.test.ts
git commit -m "feat(web/validators): typed validators with image URL allowlist + length caps + v1 FAQ category restriction"
```

### Task 1.3: entityStore adapter (MODIFIED — `__resetForTests`, `withTimeout`, throwing-mock test, fallback flag)

**Files:**
- Create: `packages/web/src/lib/entity-store.ts`
- Test: `packages/web/src/lib/entity-store.test.ts`
- Create: `packages/web/src/lib/fallback-flag.ts` (request-scoped marker for `<FallbackBanner />`)

- [ ] **Step 1: Create `fallback-flag.ts`**

```ts
// Request-scoped marker that any read used the JSON fallback.
// Implemented via React's `cache` so it's per-request in App Router.
import { cache } from "react";

interface Flag { fellBack: boolean }

const getFlagBox = cache((): Flag => ({ fellBack: false }));

export function markFallbackUsed(): void {
  getFlagBox().fellBack = true;
}

export function didFallback(): boolean {
  return getFlagBox().fellBack;
}
```

- [ ] **Step 2: Write failing tests**

```ts
import { describe, expect, it, beforeEach, vi, afterAll } from "vitest";
import type { General, Skill, FAQ, GeneralId, SkillId, FAQId } from "@sgs/data";

const mem = new Map<string, string>();
let throwOnGet = false;
let throwOnMget = false;

vi.mock("@upstash/redis", () => {
  return {
    Redis: class {
      async get(key: string) {
        if (throwOnGet) throw new Error("simulated upstash failure");
        const v = mem.get(key);
        return v ? JSON.parse(v) : null;
      }
      async set(key: string, value: unknown) { mem.set(key, JSON.stringify(value)); }
      async del(key: string) { mem.delete(key); }
      async mget(...keys: string[]) {
        if (throwOnMget) throw new Error("simulated upstash failure");
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
  throwOnGet = false;
  throwOnMget = false;
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
});
afterAll(() => { Object.assign(process.env, ENV_BAK); });

import { entityStore, __resetForTests } from "./entity-store.js";

beforeEach(() => __resetForTests());

const G = (id: string, name: string): General => ({
  id: id as GeneralId, name, title: "T", faction: "WEI" as any, hp: 4, maxHp: 4,
  gender: "male" as any, skills: [], image: "", pack: "p",
}) as General;

const S = (id: string, name: string, generalIds: string[]): Skill => ({
  id: id as SkillId, name, description: "d", type: "passive" as any,
  timing: [], generalIds: generalIds as GeneralId[], faq: [],
}) as Skill;

const F = (id: string, q: string, generalIds: string[]): FAQ => ({
  id: id as FAQId, question: q, answer: "a", category: "rule" as any,
  relatedGeneralIds: generalIds as GeneralId[],
}) as FAQ;

describe("entityStore round-trip", () => {
  it("putGeneral / getGeneral", async () => {
    await entityStore.putGeneral("g1" as GeneralId, G("g1", "曹操"));
    expect((await entityStore.getGeneral("g1" as GeneralId))?.name).toBe("曹操");
  });
  it("getGenerals returns [] on empty index", async () => {
    expect(await entityStore.getGenerals()).toEqual([]);
  });
  it("putGeneral updates index", async () => {
    await entityStore.putGeneral("g1" as GeneralId, G("g1", "X"));
    await entityStore.putGeneral("g2" as GeneralId, G("g2", "Y"));
    const all = await entityStore.getGenerals();
    expect(all.map((g) => g.id).sort()).toEqual(["g1", "g2"]);
  });
  it("putSkill maintains skills:by-general", async () => {
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1"]));
    expect((await entityStore.getSkillsByGeneral("g1" as GeneralId)).map((s) => s.id)).toEqual(["s1"]);
  });
  it("putSkill removes old reverse entries on shrink", async () => {
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1", "g2"]));
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", ["g1"]));
    expect((await entityStore.getSkillsByGeneral("g1" as GeneralId)).length).toBe(1);
    expect((await entityStore.getSkillsByGeneral("g2" as GeneralId)).length).toBe(0);
  });
  it("getSkills uses skills:index (after Task 1.5 lands)", async () => {
    await entityStore.putSkill("s1" as SkillId, S("s1", "A", []));
    await entityStore.putSkill("s2" as SkillId, S("s2", "B", []));
    const all = await entityStore.getSkills();
    expect(all.map((s) => s.id).sort()).toEqual(["s1", "s2"]);
  });
  it("putFaq + getFaqs + deleteFaq", async () => {
    await entityStore.putFaq("f1" as FAQId, F("f1", "q1", []));
    await entityStore.putFaq("f2" as FAQId, F("f2", "q2", []));
    expect((await entityStore.getFaqs()).map((f) => f.id).sort()).toEqual(["f1", "f2"]);
    await entityStore.deleteFaq("f1" as FAQId);
    expect((await entityStore.getFaqs()).map((f) => f.id)).toEqual(["f2"]);
  });
});

describe("entityStore fallback to JSON when Redis env missing", () => {
  it("getGenerals reads bundled JSON", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __resetForTests();
    const all = await entityStore.getGenerals();
    expect(all.length).toBeGreaterThan(0);
  });
});

describe("entityStore fallback when Redis throws", () => {
  it("getGenerals falls back to JSON on mget failure", async () => {
    throwOnMget = true;
    // Seed the index so adapter would call mget if Redis worked
    mem.set("generals:index", JSON.stringify(["g1"]));
    const all = await entityStore.getGenerals();
    expect(all.length).toBeGreaterThan(0); // returned from JSON, not Redis
  });
  it("getGeneral falls back to JSON on get failure", async () => {
    throwOnGet = true;
    const g = await entityStore.getGeneral("not-real" as GeneralId);
    expect(g).toBeNull(); // gracefully returns null from JSON path (won't find this id)
  });
});

describe("entityStore writes never fall back", () => {
  it("putGeneral throws when Redis unavailable", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __resetForTests();
    await expect(entityStore.putGeneral("g1" as GeneralId, G("g1", "X"))).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Implement `packages/web/src/lib/entity-store.ts`**

```ts
import type { General, Skill, FAQ, GeneralId, SkillId, FAQId } from "@sgs/data";
import { Redis } from "@upstash/redis";
import { markFallbackUsed } from "./fallback-flag.js";

import generalsSeed from "../../../data/src/generals.json" with { type: "json" };
import skillsSeed from "../../../data/src/skills.json" with { type: "json" };
import faqsSeed from "../../../data/src/faq.json" with { type: "json" };

let _redis: Redis | null = null;
function redis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
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
  skillsIndex: "skills:index",                 // NEW in v2
  skillsByGeneral: (gid: string) => `skills:by-general:${gid}`,
  faq: (id: string) => `faq:${id}`,
  faqsIndex: "faqs:index",
};

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Redis timeout after ${ms}ms (${label})`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer!);
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
  async getSkills(): Promise<Skill[]> {
    return readWithFallback(
      () => getJsonArray<Skill>(redis()!, KEY.skillsIndex, KEY.skill),
      () => skillsSeed as Skill[],
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
    const old = await r.get<Skill>(KEY.skill(id));
    const oldGenIds = new Set(old?.generalIds ?? []);
    const newGenIds = new Set(value.generalIds ?? []);
    await r.set(KEY.skill(id), value);
    // Maintain skills:index (NEW in v2)
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
};
```

- [ ] **Step 4: Run → expect pass; commit**

```bash
pnpm vitest run packages/web/src/lib/entity-store.test.ts
git add packages/web/src/lib/entity-store.ts packages/web/src/lib/entity-store.test.ts packages/web/src/lib/fallback-flag.ts
git commit -m "feat(web/entity-store): adapter with timeout, throwing-fallback, fallback flag, skills:index"
```

### Task 1.4: revalidate-map (UNCHANGED from v1) — see v1 plan Task 1.4

(Identical to v1 Task 1.4. Implement and commit unchanged.)

### Task 1.5 [NEW]: ratelimit wrapper

**Files:**
- Create: `packages/web/src/lib/ratelimit.ts`

- [ ] **Step 1: Implement**

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _loginLimiter: Ratelimit | null = null;
let _syncSearchLimiter: Ratelimit | null = null;

function redis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export function loginLimiter(): Ratelimit | null {
  if (_loginLimiter) return _loginLimiter;
  const r = redis();
  if (!r) return null;
  _loginLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, "15 m"),  // 5 attempts / 15 min / IP
    prefix: "ratelimit:login",
  });
  return _loginLimiter;
}

export function syncSearchLimiter(): Ratelimit | null {
  if (_syncSearchLimiter) return _syncSearchLimiter;
  const r = redis();
  if (!r) return null;
  _syncSearchLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.fixedWindow(1, "90 s"),    // 1 deploy trigger / 90 s globally
    prefix: "ratelimit:sync-search",
  });
  return _syncSearchLimiter;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/lib/ratelimit.ts
git commit -m "feat(web/ratelimit): @upstash/ratelimit wrappers for login + sync-search"
```

---

## Phase 2 — API Routes

### Task 2.1: Auth gate helper (MODIFIED — moved to lib + Origin/Referer check + body cap)

**Files:**
- Create: `packages/web/src/lib/auth-gate.ts`
- Test: `packages/web/src/lib/auth-gate.test.ts`

- [ ] **Step 1: Implement**

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "./auth.js";

export const ADMIN_COOKIE_NAME = "admin_session";
export const MAX_BODY_BYTES = 50 * 1024; // 50 KB body cap

/**
 * Verifies admin auth and request hygiene.
 * Returns NextResponse on rejection (caller should `return` it). Returns null on pass.
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  // 1. Server config sanity
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn("[auth-gate] SESSION_SECRET is not set; admin endpoints will reject all requests");
    return NextResponse.json({ error: "server-misconfigured" }, { status: 500 });
  }

  // 2. Origin/Referer check (defense-in-depth on top of SameSite=Lax cookie)
  const expectedHost = req.headers.get("host");
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const checkSource = origin ?? referer;
  if (checkSource && expectedHost) {
    try {
      const u = new URL(checkSource);
      if (u.host !== expectedHost) {
        return NextResponse.json({ error: "origin-mismatch" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "invalid-origin" }, { status: 403 });
    }
  }

  // 3. Auth cookie
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = verifySessionCookie(token, secret);
  if (!r.ok) return NextResponse.json({ error: "unauthorized", reason: r.reason }, { status: 401 });

  // 4. Body size pre-check (only if Content-Length sent)
  const cl = req.headers.get("content-length");
  if (cl && Number(cl) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload-too-large", limit: MAX_BODY_BYTES }, { status: 413 });
  }

  return null;
}
```

- [ ] **Step 2: Tests**

```ts
import { describe, expect, it, beforeEach, vi } from "vitest";

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const v = cookieStore.get(name);
      return v ? { value: v } : undefined;
    },
  }),
}));

import { requireAdmin, ADMIN_COOKIE_NAME } from "./auth-gate.js";
import { signSessionCookie } from "./auth.js";

const SECRET = "0".repeat(64);

beforeEach(() => {
  cookieStore.clear();
  process.env.SESSION_SECRET = SECRET;
  process.env.SESSION_GENERATION = "1";
});

function reqOf(opts: { host?: string; origin?: string; bodyLen?: number } = {}): Request {
  const h = new Headers();
  if (opts.host) h.set("host", opts.host);
  if (opts.origin) h.set("origin", opts.origin);
  if (opts.bodyLen) h.set("content-length", String(opts.bodyLen));
  return new Request("https://example.com/api/admin/x", { method: "POST", headers: h });
}

describe("requireAdmin", () => {
  it("500 if SESSION_SECRET missing", async () => {
    delete process.env.SESSION_SECRET;
    const r = await requireAdmin(reqOf());
    expect(r?.status).toBe(500);
  });
  it("401 if no cookie", async () => {
    const r = await requireAdmin(reqOf());
    expect(r?.status).toBe(401);
  });
  it("401 with bad cookie", async () => {
    cookieStore.set(ADMIN_COOKIE_NAME, "bad.cookie");
    const r = await requireAdmin(reqOf());
    expect(r?.status).toBe(401);
  });
  it("passes with good cookie + same-origin", async () => {
    cookieStore.set(ADMIN_COOKIE_NAME, signSessionCookie({ ttlSeconds: 60 }, SECRET));
    const r = await requireAdmin(reqOf({ host: "example.com", origin: "https://example.com" }));
    expect(r).toBeNull();
  });
  it("403 on origin mismatch", async () => {
    cookieStore.set(ADMIN_COOKIE_NAME, signSessionCookie({ ttlSeconds: 60 }, SECRET));
    const r = await requireAdmin(reqOf({ host: "example.com", origin: "https://evil.com" }));
    expect(r?.status).toBe(403);
  });
  it("413 on oversized body", async () => {
    cookieStore.set(ADMIN_COOKIE_NAME, signSessionCookie({ ttlSeconds: 60 }, SECRET));
    const r = await requireAdmin(reqOf({ host: "example.com", bodyLen: 999_999 }));
    expect(r?.status).toBe(413);
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
pnpm vitest run packages/web/src/lib/auth-gate.test.ts
git add packages/web/src/lib/auth-gate.ts packages/web/src/lib/auth-gate.test.ts
git commit -m "feat(web/auth-gate): unified admin gate (auth + Origin check + body cap)"
```

### Task 2.2: `/api/auth/login`, `/logout`, `/me` (MODIFIED — login rate limit + me warning)

**Files:**
- Create: `packages/web/src/app/api/auth/login/route.ts`
- Create: `packages/web/src/app/api/auth/logout/route.ts`
- Create: `packages/web/src/app/api/auth/me/route.ts`

- [ ] **Step 1: `login/route.ts`** (with `@upstash/ratelimit` + Cache-Control)

```ts
import { NextResponse } from "next/server";
import { passwordMatches, signSessionCookie } from "@/lib/auth";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-gate";
import { loginLimiter, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Rate limit by IP — first defense against brute force
  const limiter = loginLimiter();
  if (limiter) {
    const ip = clientIp(req);
    const r = await limiter.limit(ip);
    if (!r.success) {
      const res = NextResponse.json({ error: "too-many-attempts", retryInSeconds: Math.ceil((r.reset - Date.now()) / 1000) }, { status: 429 });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = typeof body.password === "string" ? body.password : "";

  if (!passwordMatches(password, process.env.ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 250));
    const res = NextResponse.json({ error: "invalid-password" }, { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    const res = NextResponse.json({ error: "server-misconfigured" }, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const ttl = 60 * 60 * 24 * 30;
  const token = signSessionCookie({ ttlSeconds: ttl }, secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttl,
    path: "/",
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
```

- [ ] **Step 2: `logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 0, path: "/",
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
```

- [ ] **Step 3: `me/route.ts`** (warns server-side on missing SESSION_SECRET)

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn("[auth/me] SESSION_SECRET missing — admin login will not work");
    const res = NextResponse.json({ authed: false });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE_NAME)?.value;
  const ok = token ? verifySessionCookie(token, secret).ok : false;
  const res = NextResponse.json({ authed: ok });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/app/api/auth/
git commit -m "feat(web/api): auth routes with login rate-limit, no-store cache, server-side warning on missing SESSION_SECRET"
```

### Tasks 2.3-2.5: Admin entity routes (MODIFIED — PUT semantics + try/catch revalidate + If-Match)

**Pattern shared by all three:**

```ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";
import { validateGeneralPatch } from "@/lib/validators";
import { pathsToRevalidate } from "@/lib/revalidate-map";
import type { General, GeneralId } from "@sgs/data";
import { requireAdmin } from "@/lib/auth-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT semantics: full object replacement (validators require all required fields).
// We expose this as PATCH at the URL because the existing payload pattern matches PATCH conventions; rename if needed.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin(req);
  if (gate) return gate;

  const { id } = await ctx.params;
  const old = await entityStore.getGeneral(id as GeneralId);

  // If-Match concurrency guard (optional client header — clients that send it get conflict detection)
  const ifMatch = req.headers.get("if-match");
  if (ifMatch && old && (old as any).updatedAt && ifMatch !== (old as any).updatedAt) {
    return NextResponse.json({
      error: "conflict",
      message: "another admin edited this entity since you loaded it; reload and re-apply your changes",
      currentUpdatedAt: (old as any).updatedAt,
    }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const result = validateGeneralPatch(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });

  const updatedAt = new Date().toISOString();
  const next: General = { ...(old as General), ...(result.value as Partial<General>), id: id as GeneralId, updatedAt } as General;

  try {
    await entityStore.putGeneral(id as GeneralId, next);
  } catch (e) {
    return NextResponse.json({ error: "store-write-failed", detail: String(e) }, { status: 502 });
  }

  const failed: string[] = [];
  const revalidated: string[] = [];
  for (const p of pathsToRevalidate({ type: "general", id, oldValue: old ?? undefined, newValue: next })) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {
      failed.push(p);
    }
  }

  const res = NextResponse.json({ ok: true, value: next, revalidated, revalidateFailed: failed });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
```

- [ ] **Step 1: Implement `packages/web/src/app/api/admin/generals/[id]/route.ts`** (per pattern above)
- [ ] **Step 2: Implement `packages/web/src/app/api/admin/skills/[id]/route.ts`** (same shape, validateSkillPatch, type "skill")
- [ ] **Step 3: Implement `packages/web/src/app/api/admin/faqs/route.ts`** (POST create, generates `faq_${nanoid(8)}` id, includes `updatedAt`)
- [ ] **Step 4: Implement `packages/web/src/app/api/admin/faqs/[id]/route.ts`** (PATCH + DELETE, both with try/catch revalidate)

(Each handler follows the same pattern: rateimiter not applied — admin-gated routes are protected by auth + Origin + body cap.)

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/app/api/admin/
git commit -m "feat(web/api): admin entity routes — PUT semantics, try/catch revalidate, If-Match concurrency guard"
```

### Task 2.6: `/api/admin/sync-search` (MODIFIED — 90s rate limit)

**Files:**
- Create: `packages/web/src/app/api/admin/sync-search/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-gate";
import { syncSearchLimiter } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (gate) return gate;

  // Global rate limit — one deploy trigger per 90 s, regardless of which admin clicks.
  const limiter = syncSearchLimiter();
  if (limiter) {
    const r = await limiter.limit("global");
    if (!r.success) {
      const wait = Math.ceil((r.reset - Date.now()) / 1000);
      return NextResponse.json({ error: "rate-limited", retryInSeconds: wait }, { status: 429 });
    }
  }

  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return NextResponse.json({ error: "deploy-hook-not-configured" }, { status: 500 });

  try {
    const r = await fetch(url, { method: "POST" });
    if (!r.ok) return NextResponse.json({ error: "deploy-hook-failed", status: r.status }, { status: 502 });
    const res = NextResponse.json({ ok: true, message: "Search index will refresh after the next deploy completes (~60-90s)." }, { status: 202 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    return NextResponse.json({ error: "deploy-hook-error", detail: String(e) }, { status: 502 });
  }
}
```

- [ ] **Commit**

```bash
git add packages/web/src/app/api/admin/sync-search/
git commit -m "feat(web/api): sync-search with 90s global rate limit"
```

### Task 2.7 [NEW]: API route integration tests

**Files:**
- Create: `packages/web/src/app/api/admin/_smoke.test.ts`

- [ ] **Step 1: Write tests covering auth gate + validator rejection + revalidate invocation + deploy hook**

```ts
import { describe, expect, it, beforeEach, vi } from "vitest";

// ---- Mocks ----
const cookieStore = new Map<string, string>();
const revalidated: string[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => {
      const v = cookieStore.get(n);
      return v ? { value: v } : undefined;
    },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => { revalidated.push(p); },
}));

const mem = new Map<string, string>();
vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(k: string) { const v = mem.get(k); return v ? JSON.parse(v) : null; }
    async set(k: string, v: unknown) { mem.set(k, JSON.stringify(v)); }
    async del(k: string) { mem.delete(k); }
    async mget(...keys: string[]) {
      return keys.map((k) => { const v = mem.get(k); return v ? JSON.parse(v) : null; });
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

const SECRET = "0".repeat(64);
beforeEach(() => {
  cookieStore.clear();
  mem.clear();
  revalidated.length = 0;
  process.env.SESSION_SECRET = SECRET;
  process.env.SESSION_GENERATION = "1";
  process.env.ADMIN_PASSWORD = "test-pass-very-long-enough";
  process.env.UPSTASH_REDIS_REST_URL = "https://example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  process.env.VERCEL_DEPLOY_HOOK_URL = "https://example.com/hook";
});

import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { PATCH as generalsPatch } from "@/app/api/admin/generals/[id]/route";
import { POST as faqsPost } from "@/app/api/admin/faqs/route";
import { POST as syncPost } from "@/app/api/admin/sync-search/route";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-gate";
import { signSessionCookie } from "@/lib/auth";
import { __resetForTests as resetStore } from "@/lib/entity-store";

beforeEach(() => resetStore());

function authedReq(method: string, body?: unknown): Request {
  cookieStore.set(ADMIN_COOKIE_NAME, signSessionCookie({ ttlSeconds: 60 }, SECRET));
  const h = new Headers({ "host": "example.com", "origin": "https://example.com", "content-type": "application/json" });
  return new Request("https://example.com/api/admin/x", { method, headers: h, body: body ? JSON.stringify(body) : undefined });
}

describe("auth login flow", () => {
  it("rejects wrong password", async () => {
    const req = new Request("https://example.com/api/auth/login", { method: "POST", body: JSON.stringify({ password: "WRONG" }) });
    const res = await loginPost(req);
    expect(res.status).toBe(401);
  });
  it("accepts correct password and sets cookie", async () => {
    const req = new Request("https://example.com/api/auth/login", { method: "POST", body: JSON.stringify({ password: "test-pass-very-long-enough" }) });
    const res = await loginPost(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/admin_session=/);
  });
});

describe("/api/auth/me", () => {
  it("authed: false without cookie", async () => {
    const res = await meGet();
    expect(await res.json()).toEqual({ authed: false });
  });
});

describe("/api/admin/generals/[id]", () => {
  it("401 without auth", async () => {
    const req = new Request("https://example.com/api/admin/generals/g1", { method: "PATCH", body: "{}" });
    const res = await generalsPatch(req, { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(401);
  });
  it("422 on invalid body when authed", async () => {
    const res = await generalsPatch(authedReq("PATCH", { name: "" }), { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(422);
  });
  it("200 + revalidates on valid edit", async () => {
    // Pre-seed Redis with the existing entity
    mem.set("general:g1", JSON.stringify({ id: "g1", name: "old", title: "T", faction: "WEI", hp: 4, maxHp: 4, gender: "male", skills: [], image: "/x.png", pack: "p" }));
    mem.set("generals:index", JSON.stringify(["g1"]));
    const res = await generalsPatch(
      authedReq("PATCH", { name: "new", title: "T", faction: "WEI", hp: 4, maxHp: 4, gender: "male", skills: [], image: "/x.png", pack: "p" }),
      { params: Promise.resolve({ id: "g1" }) },
    );
    expect(res.status).toBe(200);
    expect(revalidated).toContain("/generals/g1");
    expect(revalidated).toContain("/generals");
  });
});

describe("/api/admin/faqs POST", () => {
  it("creates a new FAQ", async () => {
    const res = await faqsPost(authedReq("POST", { question: "Q?", answer: "A.", category: "general", relatedGeneralIds: [] }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.value.id).toMatch(/^faq_/);
  });
});

describe("/api/admin/sync-search", () => {
  it("triggers deploy hook and returns 202", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const res = await syncPost(authedReq("POST"));
    expect(res.status).toBe(202);
    expect(fetchSpy).toHaveBeenCalledWith("https://example.com/hook", { method: "POST" });
    fetchSpy.mockRestore();
  });
  it("502 on deploy hook failure", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    const res = await syncPost(authedReq("POST"));
    expect(res.status).toBe(502);
    fetchSpy.mockRestore();
  });
  it("500 when deploy hook URL not configured", async () => {
    delete process.env.VERCEL_DEPLOY_HOOK_URL;
    const res = await syncPost(authedReq("POST"));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run + commit**

```bash
pnpm vitest run packages/web/src/app/api/admin/_smoke.test.ts
git add packages/web/src/app/api/admin/_smoke.test.ts
git commit -m "test(web/api): integration smoke tests for auth + admin + sync-search routes"
```

---

## Phase 3 — Seed, Snapshot, CI

### Task 3.1: `scripts/seed-redis.ts` (MODIFIED — target URL print + --yes guard + --force for re-seed)

**Files:**
- Create: `scripts/seed-redis.ts`

```ts
#!/usr/bin/env tsx
/**
 * One-time seed: read packages/data/src/{generals,skills,faq}.json
 * and write to Upstash Redis. Maintains generals:index, skills:index,
 * skills:by-general:* reverse table, and faqs:index.
 *
 * Usage (PROD):
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... pnpm seed-redis -- --yes
 *
 * Refusal mode (default): if generals:index already exists, exits without writing.
 *   Pass --force to overwrite (DESTROYS LIVE EDITS).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";

const args = new Set(process.argv.slice(2));
const YES = args.has("--yes") || args.has("-y");
const FORCE = args.has("--force");

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
  process.exit(1);
}

const targetHost = (() => {
  try { return new URL(url).host; } catch { return "(unparseable)"; }
})();
console.error(`>>> seed-redis target: ${targetHost}`);

if (!YES) {
  console.error(`Refusing to run without --yes. Re-run with: pnpm seed-redis -- --yes`);
  process.exit(2);
}

const r = new Redis({ url, token });
const dataDir = resolve(process.cwd(), "packages/data/src");
const generals = JSON.parse(readFileSync(resolve(dataDir, "generals.json"), "utf8")) as Array<{ id: string }>;
const skills = JSON.parse(readFileSync(resolve(dataDir, "skills.json"), "utf8")) as Array<{ id: string; generalIds?: string[] }>;
const faqs = JSON.parse(readFileSync(resolve(dataDir, "faq.json"), "utf8")) as Array<{ id: string }>;

(async () => {
  const existingIndex = await r.get<string[]>("generals:index");
  if (existingIndex && existingIndex.length > 0 && !FORCE) {
    console.error(`>>> generals:index exists with ${existingIndex.length} entries.`);
    console.error(`>>> Refusing to overwrite without --force. (This would destroy any live admin edits.)`);
    process.exit(3);
  }

  console.error(`Seeding ${generals.length} generals, ${skills.length} skills, ${faqs.length} faqs into ${targetHost}...`);

  for (const g of generals) await r.set(`general:${g.id}`, g);
  await r.set("generals:index", generals.map((g) => g.id));

  for (const s of skills) await r.set(`skill:${s.id}`, s);
  await r.set("skills:index", skills.map((s) => s.id));

  const byGeneral: Record<string, string[]> = {};
  for (const s of skills) {
    for (const gid of s.generalIds ?? []) {
      (byGeneral[gid] ??= []).push(s.id);
    }
  }
  for (const [gid, sids] of Object.entries(byGeneral)) {
    await r.set(`skills:by-general:${gid}`, sids);
  }

  for (const f of faqs) await r.set(`faq:${f.id}`, f);
  await r.set("faqs:index", faqs.map((f) => f.id));

  console.error("Seed complete.");
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Add `dotenv` dev dep + commit**

```bash
pnpm add -D -w dotenv
git add scripts/seed-redis.ts package.json pnpm-lock.yaml
git commit -m "feat(scripts): seed-redis with --yes guard, --force re-seed gate, target URL print, skills:index"
```

### Task 3.2: `scripts/dump-redis.ts` (MODIFIED — clean dead code, `with` syntax, use `skills:index`)

**Files:**
- Create: `scripts/dump-redis.ts`

```ts
#!/usr/bin/env tsx
/**
 * Dump current Upstash state -> JSON files in packages/data/src/.
 * Run by .github/workflows/redis-snapshot.yml nightly.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
  process.exit(1);
}
const r = new Redis({ url, token });

async function dumpEntities<T>(indexKey: string, valueKey: (id: string) => string): Promise<T[]> {
  const ids = (await r.get<string[]>(indexKey)) ?? [];
  if (ids.length === 0) return [];
  const values = await r.mget<(T | null)[]>(...ids.map(valueKey));
  const out: T[] = [];
  let dropped = 0;
  for (const v of values) {
    if (v == null) dropped++;
    else out.push(v);
  }
  if (dropped > 0) {
    console.error(`>>> WARNING: ${indexKey} index referenced ${dropped} missing value(s); dropping from snapshot.`);
  }
  return out;
}

(async () => {
  const dataDir = resolve(process.cwd(), "packages/data/src");

  const generals = await dumpEntities<{ id: string }>("generals:index", (id) => `general:${id}`);
  const skills = await dumpEntities<{ id: string }>("skills:index", (id) => `skill:${id}`);
  const faqs = await dumpEntities<{ id: string }>("faqs:index", (id) => `faq:${id}`);

  // Sort by id for stable diffs (avoids spurious snapshot churn)
  generals.sort((a, b) => a.id.localeCompare(b.id));
  skills.sort((a, b) => a.id.localeCompare(b.id));
  faqs.sort((a, b) => a.id.localeCompare(b.id));

  writeFileSync(resolve(dataDir, "generals.json"), JSON.stringify(generals, null, 2) + "\n", "utf8");
  writeFileSync(resolve(dataDir, "skills.json"), JSON.stringify(skills, null, 2) + "\n", "utf8");
  writeFileSync(resolve(dataDir, "faq.json"), JSON.stringify(faqs, null, 2) + "\n", "utf8");

  console.error(`Dumped: ${generals.length} generals, ${skills.length} skills, ${faqs.length} faqs.`);
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Commit**

```bash
git add scripts/dump-redis.ts
git commit -m "feat(scripts): dump-redis using skills:index, with stable sorting and missing-value warnings"
```

### Task 3.3: DO-NOT-EDIT marker + CI gate (MODIFIED — fetch-depth + push trigger)

**Files:**
- Create: `packages/data/src/MANAGED.md` (unchanged from v1 plan)
- Create: `.github/workflows/data-files-guard.yml`

- [ ] **Step 1: `MANAGED.md` per v1 Task 3.3 Step 1**

- [ ] **Step 2: `data-files-guard.yml` (with full history fetch, push trigger, and bot-allowlist)**

```yaml
name: Guard managed data files

on:
  pull_request:
    paths:
      - "packages/data/src/generals.json"
      - "packages/data/src/skills.json"
      - "packages/data/src/faq.json"
  push:
    branches: [main]
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
      - name: Verify edit source (PR)
        if: github.event_name == 'pull_request'
        run: |
          set -e
          git fetch origin "${{ github.event.pull_request.base.ref }}" --depth=100 || true
          changed=$(git diff --name-only "${{ github.event.pull_request.base.sha }}" "${{ github.event.pull_request.head.sha }}" -- packages/data/src/generals.json packages/data/src/skills.json packages/data/src/faq.json)
          if [ -z "$changed" ]; then echo "No managed files changed."; exit 0; fi
          has_label="${{ contains(github.event.pull_request.labels.*.name, 'data-edit-approved') }}"
          if [ "$has_label" = "true" ]; then echo "PR has data-edit-approved label; allowing."; exit 0; fi
          all_ok=true
          for sha in $(git log --format=%H "${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}" -- packages/data/src/generals.json packages/data/src/skills.json packages/data/src/faq.json); do
            msg=$(git log -n1 --format=%B "$sha")
            if ! echo "$msg" | grep -q '\[snapshot\]'; then
              echo "Commit $sha modifies managed files but lacks [snapshot] tag"
              all_ok=false
            fi
          done
          if [ "$all_ok" = "false" ]; then
            echo "::error::Managed JSON files modified outside admin/snapshot flow."
            echo "::error::Use /admin or apply 'data-edit-approved' label."
            exit 1
          fi
      - name: Verify edit source (push to main)
        if: github.event_name == 'push'
        run: |
          set -e
          msg=$(git log -1 --format=%B)
          author=$(git log -1 --format=%ae)
          if echo "$msg" | grep -q '\[snapshot\]'; then echo "snapshot push, OK"; exit 0; fi
          if [ "$author" = "41898282+github-actions[bot]@users.noreply.github.com" ]; then echo "github-actions bot, OK"; exit 0; fi
          echo "::error::Direct push to main modifies managed JSON files outside snapshot flow"
          exit 1
```

- [ ] **Commit**

```bash
git add packages/data/src/MANAGED.md .github/workflows/data-files-guard.yml
git commit -m "ci(data): guard managed JSON files on PR + push, with full git history fetch"
```

### Task 3.4: Nightly snapshot workflow (MODIFIED — failure issue + pull --rebase + concurrency + 18:00 UTC + partial install)

**Files:**
- Create: `.github/workflows/redis-snapshot.yml`

```yaml
name: Nightly Redis -> JSON snapshot

on:
  schedule:
    - cron: "0 18 * * *"   # 18:00 UTC = 02:00 Beijing (low-traffic window for CN admins)
  workflow_dispatch: {}

concurrency:
  group: redis-snapshot
  cancel-in-progress: false

jobs:
  snapshot:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
    env:
      UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
      UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install minimal deps
        run: npm install --no-save @upstash/redis@^1.34.0 dotenv@^16 tsx@^4.21
      - name: Dump Redis to JSON
        run: npx tsx scripts/dump-redis.ts
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
          # Pull --rebase to handle any concurrent commits to main
          git pull --rebase origin main || (git rebase --abort && exit 1)
          git push
      - name: Open issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Nightly Redis snapshot failed (${new Date().toISOString().slice(0,10)})`,
              body: `The nightly snapshot workflow failed. JSON fallback is now staler than 24h until this is fixed.\n\nRun: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
              labels: ["snapshot-failure"],
            });
```

- [ ] **Step: Set GitHub secrets** (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) and commit

```bash
git add .github/workflows/redis-snapshot.yml
git commit -m "ci(snapshot): nightly Redis dump with concurrency, pull-rebase, partial install, failure issue"
```

---

## Phase 4 — Refactor pages + FallbackBanner

### Task 4.1: Refactor `/generals` (UNCHANGED conceptually from v1)

Replace `import generalsData` with `await entityStore.getGenerals()`. Make page async. Smoke + commit.

### Task 4.2: Refactor `/generals/[id]` (UNCHANGED conceptually from v1)

Replace JSON imports with `entityStore.getGeneral(id)`, `entityStore.getSkillsByGeneral(id)`, `entityStore.getFaqs()`. Use `entityStore.getGenerals()` in `generateStaticParams`. Keep `cardTextData` import (out of admin scope).

### Task 4.3: Refactor `/faq` (MODIFIED — use entityStore.getSkills() instead of JSON import)

In `packages/web/src/app/faq/page.tsx`:

```tsx
import { entityStore } from "@/lib/entity-store";

export default async function FaqPage() {
  const [faqs, generals, skills] = await Promise.all([
    entityStore.getFaqs(),
    entityStore.getGenerals(),
    entityStore.getSkills(),  // NEW: dynamic instead of JSON import
  ]);

  const generalNameMap = new Map(generals.map((g) => [g.id, g.name]));
  const skillNameMap = new Map(skills.map((s) => [s.id, s.name]));

  // ... existing entry mapping using these maps
}
```

This resolves cross-cutting #5 (FAQ list shows fresh skill names after admin edits).

### Task 4.4 [NEW]: FallbackBanner component

**Files:**
- Create: `packages/web/src/components/FallbackBanner.tsx`
- Modify: `packages/web/src/app/layout.tsx` (mount the banner)

- [ ] **Step 1: Component**

```tsx
import { didFallback } from "@/lib/fallback-flag";

export default function FallbackBanner() {
  if (!didFallback()) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-400/40 bg-amber-50/80 px-4 py-2 text-center text-xs text-amber-900 dark:border-amber-300/30 dark:bg-amber-900/30 dark:text-amber-100"
    >
      内容暂时回退到上次部署版本（数据存储暂不可用，正在重试）
    </div>
  );
}
```

- [ ] **Step 2: Mount in layout above `<main>`**

```tsx
import FallbackBanner from "@/components/FallbackBanner";

// inside RootLayout body:
<AdminProvider>
  <div className="flex min-h-screen flex-col">
    <FallbackBanner />
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
</AdminProvider>
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/FallbackBanner.tsx packages/web/src/app/layout.tsx
git commit -m "feat(web): FallbackBanner shown when entityStore reads fall back to bundled JSON"
```

### Task 4.5 [NEW]: `/api/health` endpoint

**Files:**
- Create: `packages/web/src/app/api/health/route.ts`

```ts
import { NextResponse } from "next/server";
import { entityStore } from "@/lib/entity-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [generals, faqs] = await Promise.all([entityStore.getGenerals(), entityStore.getFaqs()]);
    return NextResponse.json({
      status: "ok",
      generals_count: generals.length,
      faqs_count: faqs.length,
    });
  } catch (e) {
    return NextResponse.json({ status: "degraded", error: String(e) }, { status: 503 });
  }
}
```

- [ ] **Commit**

```bash
git add packages/web/src/app/api/health/route.ts
git commit -m "feat(web/api): /api/health for smoke checks and on-call sanity"
```

---

## Phase 5 — Admin UI (MODIFIED — a11y + dark-mode + global Toaster + inline confirm + dirty guard + mobile breakpoint + SVG icons)

### Phase 5 — design tokens audit (MUST DO FIRST)

Before writing any form: search for and replace any non-existent token classes. The plan v1 code used `bg-night/70` etc. — verify against the existing Tailwind config and existing site classes:

- ✅ Use `dark:bg-night/60`, `dark:bg-night/70` only if `night` is configured WITH alpha-tolerant variants in Tailwind. Otherwise use `dark:bg-night-deep/70` or the literal `night` shade names.
- ✅ Use `bg-paper-mist/70` for light mode (matches `Header.tsx`).
- ✅ Borders: `border-vermillion/30 dark:border-vermillion/40` (matches existing).
- ✅ Text: `text-ink dark:text-ivory`, mute `text-ink-mute dark:text-ivory-soft`.
- Verify by running the Tailwind config:

```bash
pnpm --filter @sgs/web exec tailwindcss --config tailwind.config.ts --content "src/**/*.{ts,tsx}" -o /dev/stdout 2>&1 | head -50
```

Replace any `bg-night/<n>` that doesn't resolve.

### Task 5.0 [NEW]: Global utility classes

Add to `packages/web/src/app/globals.css`:

```css
@layer components {
  .input-base {
    @apply w-full rounded border border-slate-300/60 bg-paper-mist/50 px-2 py-1.5 text-sm text-ink
           dark:border-slate-700/60 dark:bg-night/50 dark:text-ivory
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/50;
  }
  .input-base:disabled {
    @apply opacity-60 cursor-not-allowed;
  }
  .input-error {
    @apply border-red-500/70 dark:border-red-400/70;
  }
  .btn-primary {
    @apply rounded bg-vermillion px-3 py-1.5 text-sm font-medium text-white
           hover:bg-vermillion/90
           disabled:bg-vermillion/40 disabled:cursor-not-allowed
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40;
  }
  .btn-secondary {
    @apply rounded border border-slate-400/50 px-3 py-1.5 text-sm
           hover:bg-slate-100 dark:hover:bg-night/40
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40;
  }
  .btn-danger {
    @apply rounded border border-red-500/50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50
           dark:hover:bg-red-900/20
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40;
  }
}
```

Commit:
```bash
git add packages/web/src/app/globals.css
git commit -m "feat(web/css): admin UI utility classes (input-base, btn-*) with focus rings"
```

### Task 5.1: AdminContext + admin-fetch (UNCHANGED from v1)

(See v1 Task 5.1.)

### Task 5.2: Global Toaster [NEW] — replaces inline form toasts

**Files:**
- Create: `packages/web/src/components/admin/Toaster.tsx`
- Modify: `packages/web/src/components/admin/AdminContext.tsx` (add `toast()` function)

```tsx
"use client";

import { useEffect, useState } from "react";

interface Toast { id: number; text: string; level: "info" | "success" | "error"; ttl: number }

let _push: (t: Omit<Toast, "id">) => void = () => {};
export function toast(text: string, level: Toast["level"] = "info", ttl = 3500) {
  _push({ text, level, ttl });
}

export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    let nextId = 1;
    _push = (t) => {
      const id = nextId++;
      setItems((cur) => [...cur, { ...t, id }]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), t.ttl);
    };
    return () => { _push = () => {}; };
  }, []);

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className={
            "max-w-md rounded-md border px-3 py-2 text-sm shadow " +
            (t.level === "error"
              ? "border-red-400/40 bg-red-50/90 text-red-900 dark:border-red-300/30 dark:bg-red-950/80 dark:text-red-100"
              : t.level === "success"
              ? "border-emerald-400/40 bg-emerald-50/90 text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-950/80 dark:text-emerald-100"
              : "border-vermillion/30 bg-paper-mist/95 text-ink dark:border-vermillion/40 dark:bg-night/90 dark:text-ivory")
          }
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
```

Mount `<Toaster />` inside `<AdminProvider>` so admin views get it. Commit.

### Task 5.3: `/admin/login` (MODIFIED — branded styling + focus rings)

Use `panel`/`section-title` classes; wrap `<input>` with `input-base` utility; show `aria-invalid` + role="alert" on error. (Apply to v1 LoginForm — replace ad-hoc Tailwind with utility classes.)

### Task 5.4: `<AdminAffordances />` (MODIFIED — collapsed dropdown + SVG icons)

In small-desktop/mobile widths, collapse the three elements (badge / sync / logout) into a single dropdown to avoid Header crowding. Inline SVG for icons (1.5px stroke, `currentColor`).

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "./AdminContext";
import { adminFetch } from "@/lib/admin-fetch";
import { toast } from "./Toaster";

export default function AdminAffordances() {
  const router = useRouter();
  const { authed, loading, refresh } = useAdmin();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  if (loading || !authed) return null;

  async function handleSync() {
    setSyncing(true);
    try {
      await adminFetch<{ message: string }>("/api/admin/sync-search", { method: "POST" });
      toast("已触发部署，搜索约 60-90s 后对齐", "success");
    } catch (e: any) {
      if (e?.status === 429) {
        toast(`同步过于频繁，请 ${e?.message ?? "稍后"} 再试`, "error");
      } else {
        toast("同步失败，请稍后重试", "error");
      }
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
    <div className="relative text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-2.5 py-1 text-emerald-700 dark:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        管理员模式
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 w-44 rounded-md border border-vermillion/30 bg-paper-mist/95 p-1 shadow-md dark:border-vermillion/40 dark:bg-night/90">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="block w-full rounded px-2 py-1 text-left hover:bg-vermillion/10 disabled:opacity-50"
          >
            {syncing ? "同步中…" : "同步搜索 (重新部署)"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded px-2 py-1 text-left hover:bg-vermillion/10"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
```

### Task 5.5: Shared form primitives (MODIFIED)

- `MultiSelect.tsx`: add `role="combobox"`, `aria-expanded`, `aria-controls`, ArrowUp/Down/Enter/Esc handlers, "无匹配项" empty state, replace `bg-white dark:bg-slate-900` with `bg-paper-mist dark:bg-night-deep` (or whatever resolved token is, per Phase 5 audit).
- `TagInput.tsx`: add `aria-label`, `focus-visible:ring`, replace ad-hoc styles with `input-base` utility.
- `InlineConfirm.tsx` (new): branded delete confirmation that replaces native `confirm()`. Renders two buttons in place of the trash icon.

```tsx
"use client";
import { useState } from "react";

export default function InlineConfirm({
  trigger,
  message,
  onConfirm,
  destructive = false,
}: {
  trigger: React.ReactNode;
  message: string;
  onConfirm: () => Promise<void> | void;
  destructive?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!armed) {
    return <button type="button" onClick={() => setArmed(true)}>{trigger}</button>;
  }

  return (
    <span className="inline-flex items-center gap-2 rounded border border-red-500/40 bg-red-50/70 px-2 py-1 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-100">
      <span>{message}</span>
      <button
        type="button"
        disabled={busy}
        className={destructive ? "btn-danger px-2 py-0.5 text-xs" : "btn-primary px-2 py-0.5 text-xs"}
        onClick={async () => {
          setBusy(true);
          try { await onConfirm(); } finally { setBusy(false); setArmed(false); }
        }}
      >
        {busy ? "执行中…" : "确认"}
      </button>
      <button type="button" className="btn-secondary px-2 py-0.5 text-xs" onClick={() => setArmed(false)}>取消</button>
    </span>
  );
}
```

### Task 5.6-5.8: Edit forms (MODIFIED — utility classes + dirty tracking + global toast + render-below-trigger)

Patterns to apply across `GeneralEditForm`, `SkillEditForm`, `FaqNewForm`, `FaqEditForm`:

1. Replace ad-hoc `<input className="...">` with `<input className="input-base">` (or `input-base input-error` when there's a field error).
2. Replace inline `<style jsx>` blocks — they're now in `globals.css`.
3. Track `dirty = JSON.stringify(form) !== JSON.stringify(initial)`. On Cancel, if `dirty`, render an inline confirm ("放弃未保存的修改？").
4. Replace local `toast` with `import { toast } from "@/components/admin/Toaster"` and call `toast("已保存", "success")`. Remove the per-form 1.2s autoclose; rely on global.
5. Forms render in a `max-h-[80vh] overflow-y-auto` container so they're usable on mobile.
6. Use SVG icons for triggers (no emoji); include `aria-label` on the wrapping button.

For `FaqEditForm` delete: replace native `confirm()` with `<InlineConfirm>`:

```tsx
<InlineConfirm
  destructive
  message="删除这条 FAQ?"
  trigger={<svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500"><path d="M3 6h18M9 6v12m6-12v12M6 6l1 14h10l1-14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
  onConfirm={async () => { await del(); }}
/>
```

For `EditAffordance`: render the form **below** the trigger (not in place), keep trigger visible in a "正在编辑" disabled state during edit:

```tsx
"use client";
import { useState, type ReactNode } from "react";
import { useAdmin } from "./AdminContext";

export default function EditAffordance({
  trigger,
  ariaLabel,
  renderForm,
}: {
  trigger: ReactNode;
  ariaLabel: string;
  renderForm: (close: () => void) => ReactNode;
}) {
  const { authed } = useAdmin();
  const [open, setOpen] = useState(false);
  if (!authed) return null;
  return (
    <span className="inline-block">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="text-ink-mute hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40 disabled:opacity-50"
        disabled={open}
      >
        {trigger}
      </button>
      {open && (
        <div className="mt-2 max-h-[80vh] overflow-y-auto">
          {renderForm(() => setOpen(false))}
        </div>
      )}
    </span>
  );
}
```

Replace v1 emoji triggers (⚙️/✎) with inline SVG, e.g. for skill pencil:

```tsx
<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
</svg>
```

### Task 5.9: Wire affordances into pages (UNCHANGED conceptually from v1; uses `entityStore.getSkills()` for the GeneralEditForm dropdown)

In `packages/web/src/app/generals/[id]/page.tsx`:

```tsx
const [allGeneralsRaw, allSkillsRaw] = await Promise.all([
  entityStore.getGenerals(),
  entityStore.getSkills(),  // CHANGED from JSON import
]);
const allGenerals = allGeneralsRaw.map((g) => ({ id: g.id, name: g.name }));
const allSkills = allSkillsRaw.map((s) => ({ id: s.id, name: s.name }));
```

Pass `allSkills` to `<AdminBaseEdit allGenerals={allGenerals} allSkills={allSkills} />`.

Same change for FAQ list: pass `allGenerals` from `entityStore.getGenerals()` to `FaqListClient`.

Commit each form/component as it's wired in:

```bash
git add packages/web/src/components/admin/ packages/web/src/app/generals/[id]/components/ packages/web/src/app/faq/components/ ...
git commit -m "feat(web/admin): UI forms with input-base utility, global toast, dirty guard, inline confirm, SVG icons, mobile breakpoint"
```

---

## Phase 6 — Deploy + Smoke (MODIFIED — health endpoint, timing assertion, banner verification)

### Task 6.1: Configure Vercel + Upstash + first seed

- [ ] **Step 1: Vercel Marketplace → add Upstash Redis integration**

(Auto-injects `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.)

- [ ] **Step 2: Set environment variables on Vercel**

```
ADMIN_PASSWORD=<your-strong-password — see .env.example for guidelines>
SESSION_SECRET=<32-byte hex; use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
SESSION_GENERATION=1
VERCEL_DEPLOY_HOOK_URL=<from Vercel Settings → Git → Deploy Hooks>
```

Also set GitHub repo secrets: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

- [ ] **Step 3: Pull env vars locally**

```bash
cd packages/web
vercel env pull .env.local
# Verify .env.local is git-ignored:
git check-ignore packages/web/.env.local && echo "ignored" || echo "NOT IGNORED — add to .gitignore"
```

If not ignored, add `.env.local` to root `.gitignore`.

- [ ] **Step 4: First seed (with explicit confirmation)**

```bash
cd ../..  # repo root
pnpm --filter @sgs/web seed-redis -- --yes
# Expect:
#   >>> seed-redis target: <prod-host>.upstash.io
#   Seeding ... generals, ... skills, ... faqs into <host>...
#   Seed complete.
```

If you see "Refusing to overwrite without --force" → the index already exists. Verify this is the right Upstash and decide whether to `--force`.

- [ ] **Step 5: Deploy + smoke checklist (with timing assertions)**

```bash
git push
```

After deploy:

- [ ] **Health**: `curl https://<your-prod>/api/health` → `{status:"ok", generals_count:>0, faqs_count:>0}`
- [ ] **Visitor pages render**: `/generals/<id>`, `/faq` — no banner visible
- [ ] **Login**: `/admin/login` → wrong password → `密码错误` toast; correct password → home, top-bar shows `● 管理员模式` button
- [ ] **Brute-force lockout**: try wrong password 6 times in a row → 6th attempt returns 429
- [ ] **Edit timing assertion (TPM critical promise)**: Click ⚙ on a general → change `name` → save → without manual reload, navigate to `/generals` and back → **see new name within 10 seconds**
- [ ] **Skill edit revalidates linked generals**: edit a skill description → verify on the linked general(s) detail page within 10s
- [ ] **FAQ create**: `+ 为本武将添加 FAQ` → fill form → save → see new FAQ on this general's page AND on `/faq` list within 10s
- [ ] **FAQ edit + delete**: pencil → edit + save; trash → inline confirm → delete; verify gone from both pages
- [ ] **Sync search**: click "同步搜索" in admin dropdown → toast says deploy triggered; **wait 90s** → click search box → search results reflect edits
- [ ] **Sync rate limit**: immediately click "同步搜索" again → `同步过于频繁` toast (429)
- [ ] **Logout**: dropdown → 退出登录 → `/admin/login` reachable; pencils gone
- [ ] **Force-logout**: bump `SESSION_GENERATION` to `2` in Vercel env, redeploy → old session invalid → forced to re-login
- [ ] **Snapshot dry-run**: GitHub Actions → "Nightly Redis -> JSON snapshot" → Run workflow (workflow_dispatch). Verify it commits `data: nightly snapshot YYYY-MM-DD [snapshot]` to main, `data-files-guard` passes (push trigger sees the bot author/snapshot tag), Vercel does NOT redeploy (we don't trigger deploy hook from this workflow).
- [ ] **CI guard PR check**: in a fresh branch, manually edit `packages/data/src/generals.json` (without `[snapshot]` tag) → open PR → expect `data-files-guard` to fail. Then add label `data-edit-approved` → expect re-run to pass.
- [ ] **Fallback banner**: in Vercel env, temporarily rotate `UPSTASH_REDIS_REST_TOKEN` to a wrong value → trigger redeploy → visitor pages should render with "内容暂时回退到上次部署版本" banner above the header. Restore the correct token immediately afterward.

- [ ] **Step 6: Final commit**

```bash
git commit --allow-empty -m "ops: admin mode v2 smoke-tested in prod"
```

---

## Self-Review (post-write)

**Spec coverage** — every spec section maps to at least one task:
- §2 in-scope: Tasks 2.3-2.5 (entity edits), 2.5 (FAQ CRUD), 5.4 (sync-search button), 1.1+6.1 (SESSION_GENERATION), 3.4 (snapshot)
- §3 components: 0.1 (deps), 1.3 (entityStore), 4.4 (FallbackBanner), 2.* (routes), 5.1-5.4 (UI), 3.1 (seed), 3.4 (snapshot), 1.5 (ratelimit)
- §4 data: 1.3 (per-entity keys + skills:index), 4.5 (fallback flag), 4.4 (banner), 3.1+3.2 (seed/dump), 4.* (search note + sync button)
- §5 API: 2.1-2.6 (all 8 endpoints + revalidate-map applied)
- §6 auth: 1.1 (HMAC + generation), 2.1 (Origin/body cap), 2.2 (login + rate limit + me warning)
- §7 UI: 5.0 (utility classes), 5.2 (Toaster), 5.3 (login), 5.4 (top bar), 5.5 (primitives + InlineConfirm), 5.6-5.8 (forms), 5.9 (wire-in)
- §8 errors: validators (1.2), 502/422/401 in routes, fallback in store (1.3), banner (4.4)
- §9 tests: 1.1, 1.2, 1.3, 2.1, 2.7 (route smoke); 6.1 manual smoke
- §10 implementation steps: phases 0-6
- §11 risks: addressed via 4.4 banner, 4.5 health, 3.4 failure issue, ratelimit, etc.

**No placeholders, no TBDs.** Type consistency across `entityStore` interface and `pathsToRevalidate` mutation type maintained.

**Acceptable gaps (defer to v1.5 / v2)**:
- Pinyin search in MultiSelect
- Code-split admin JS via `next/dynamic`
- `SESSION_SECRET` rotation runbook in dedicated doc (covered inline in §6 + .env.example)
- Per-edit audit log (Vercel logs are sufficient for v1)
- `peter-evans/create-pull-request` for snapshot (chose `git pull --rebase` for simplicity)
- Dynamic Faction list pulled from `@sgs/data` (mirrored constants in validators with comment instead — drift caught in code review since they're 5 lines)
