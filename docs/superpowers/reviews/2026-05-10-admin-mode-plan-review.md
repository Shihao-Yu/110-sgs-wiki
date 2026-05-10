# Plan Review Report: Admin 内联编辑模式 v1

## Overall Verdict: **APPROVED WITH CHANGES**

**Reviewers:** Product, QA, Senior Dev, Frontend, Security, DevOps/SRE (6 in parallel)
**Plan:** `docs/superpowers/plans/2026-05-10-admin-mode.md`
**Spec:** `docs/superpowers/specs/2026-05-09-admin-mode-design.md`
**Date:** 2026-05-10

The plan's architecture is sound and the TDD spine on Phase 1 is exemplary. But **two of six reviewers voted REVISE** (Senior Dev, QA) primarily on testing gaps + several real "won't compile" issues, **two voted CONCERNS** (Product, DevOps) on UX/operational blind spots, and **two voted CONCERNS** (Frontend, Security) on a11y/dark-mode + real attack vectors.

The good news: cross-cutting findings (issues raised independently by multiple reviewers) cluster around ~10 concrete fixes. Once addressed, the plan is shippable.

## Summary

| Reviewer | Verdict | 🔴 Critical | 🟡 Important | 🟢 Suggestions |
|----------|---------|-------------|--------------|----------------|
| Product  | ⚠️ CONCERNS | 3 | 5 | 3 |
| QA       | 🔴 REVISE   | 3 | 8 | 4 |
| Dev      | 🔴 REVISE   | 6 | 10 | 5 |
| Frontend | 🔴 REVISE   | 4 | 9 | 5 |
| Security | ⚠️ CONCERNS | 2 | 5 | 4 |
| DevOps   | ⚠️ CONCERNS | 3 | 9 | 5 |

## Cross-Cutting Themes (multiple reviewers, prioritized)

1. **Fallback banner UI missing** — Product (RC-PM-1) + Frontend (Missing) + DevOps (implied by RC-OPS-3 recovery story). Spec §4.5 mandates a "内容暂时回退到上次部署版本" banner; plan only `console.warn`s. Visitors silently see stale data.
2. **API route integration tests absent** — QA (RC-QA-1) + Dev (RI-DEV-6). Spec §9 explicitly required them ("mock Redis; verify auth gate, SESSION_GENERATION force-logout, validation, revalidate calls, deploy hook"). Plan ships routes with zero tests.
3. **Module-level Redis singleton breaks tests** — QA (RC-QA-2) + Dev (RC-DEV-4). `_redis` cached across tests; `delete process.env.UPSTASH_REDIS_REST_URL` doesn't release it; fallback test as written cannot exercise the fallback path.
4. **Login has no rate limit** — Product (RI-PM-3) + Security (RC-SEC-2). 250ms delay alone = ~14k attempts/hour against a single shared password.
5. **FAQ list page silently shows stale skill names after edits** — Product (RC-PM-2) + Dev (RI-DEV-8). Plan hardcodes JSON skill name import as "acceptable workaround"; this contradicts spec's "几秒生效" promise.
6. **Validator enums drift from `@sgs/data` types** — Dev (RI-DEV-2). Hardcoded `["WEI","SHU"...]` not derived from source-of-truth types; new factions silently rejected.
7. **Vitest wiring for `packages/web` unverified** — QA (RI-QA-3) + Dev (RI-DEV-4). Plan adds tests at `packages/web/src/lib/*.test.ts` but no task confirms `pnpm vitest` actually picks them up.

## 🔴 Critical Issues (must resolve before execution)

### A — Won't compile / run as written
- **[RC-DEV-1]** `dump-redis.ts` defines `writeJson(path, data)` and `HEADER` but never calls them — dead code that contradicts the actual `writeFileSync(JSON.stringify(generals))` calls. → **Fix**: remove dead code or actually use it.
- **[RC-DEV-2]** `import ... assert { type: "json" }` is deprecated; use `with { type: "json" }` or `JSON.parse(readFileSync(...))`. → **Fix**: switch syntax.
- **[RC-DEV-3]** `entity-store.ts` reaches `../../../data/src/generals.json` — sidesteps `@sgs/data` workspace boundary; vitest may not resolve. → **Fix**: re-export JSON from `@sgs/data` or accept the deep import + verify in test.
- **[RC-DEV-4]** Module-level `_redis` singleton breaks fallback tests (see cross-cutting #3). → **Fix**: add a `__resetForTests()` export that clears `_redis = null`, call in `beforeEach`.
- **[RC-DEV-5]** `_middleware-helper.ts` uses `..` relative imports from deeply nested route folders; easy to miscount. → **Fix**: move to `packages/web/src/lib/auth-gate.ts`, import via `@/lib/auth-gate`.
- **[RC-DEV-6]** `data-files-guard.yml` `git diff` may have shallow history. → **Fix**: add `git fetch origin ${{ github.event.pull_request.base.ref }}` step.
- **[RC-FE-1]** `bg-night/70` references a non-existent token shape (Tailwind config exposes `night.DEFAULT`/`night.deep`); also `darkMode: "media"` (not "class") means many `dark:` variants won't behave as expected. → **Fix**: audit form components, use existing tokens (`dark:bg-night/60`, `dark:bg-night-deep/70`, etc.) consistent with `Header.tsx`.

### B — Real safety/security holes
- **[RC-SEC-1]** Image URL field accepts `javascript:` and `data:text/html` schemes via free-text input. Stored XSS vector when admin (or attacker with cookie) sets `image: "javascript:alert(1)"`. → **Fix**: in `validateGeneralPatch`, reject any `image` not matching `^(/|https?:\/\/)`. Also: add explicit invariant in plan that admin-editable text fields MUST NEVER pass through `dangerouslySetInnerHTML`; add CI grep check.
- **[RC-SEC-2]** Single shared password + no rate limit + 30-day session = entire perimeter is one password against unlimited online guessing. → **Fix**: add per-IP `@upstash/ratelimit` on `/api/auth/login` (5 attempts / 15min), document min password strength in `.env.example`.

### C — Test gaps blocking the spec's own commitments
- **[RC-QA-1]** No integration tests for any `/api/*` route. Spec §9 explicitly required them. → **Fix**: add `Task 2.7: Route handler integration tests` — one consolidated test file mocking `entityStore`, `revalidatePath`, `cookies()` covering auth gate, validation rejection, revalidate invocation, deploy-hook path. ~150 lines, ~5 tests per route.
- **[RC-QA-2]** `entity-store.test.ts` fallback test cannot actually exercise the fallback (singleton, see cross-cutting #3); also no test for "Redis throws → fallback used" + no 3s read timeout in implementation. → **Fix**: bundle with RC-DEV-4 fix; add throwing-mock test; add `withTimeout(3000)` wrapper in adapter.
- **[RC-QA-3]** `putSkill` reverse-index update is read-modify-write without transaction; concurrent edits lose updates silently. → **Fix**: document as known-limitation in v1 (accept), OR use Upstash `pipeline` (slightly more code, much safer).

### D — UX commitments unmet
- **[RC-PM-1]** Spec §4.5 mandates fallback banner; plan has no banner UI task. → **Fix**: add `Task 4.4: FallbackBanner component` — `entityStore.readWithFallback` sets a request-scoped flag (via `unstable_noStore`-safe mechanism), `<FallbackBanner />` mounted in layout reads it.
- **[RC-PM-2 / RI-DEV-8]** FAQ list will show stale skill names after admin edits a skill (see cross-cutting #5). → **Fix**: add `entityStore.getSkills()` (mget over `skills:index` — requires also adding `skills:index` key in seed + `putSkill`); FAQ page reads from it.
- **[RC-FE-2]** Form inputs have no `focus-visible:ring-*` — non-technical admin tabbing through 12 fields can't tell where they are. → **Fix**: add a single `.input-base` utility class in `globals.css` with focus ring, replace `<style jsx>` blocks.
- **[RC-FE-3]** `MultiSelect` is mouse-only (no keyboard nav, no ARIA combobox role); also uses non-palette `bg-white dark:bg-slate-900`. → **Fix**: add ArrowUp/Down/Enter/Esc handlers, `role="combobox" aria-expanded`, swap colors to `bg-paper-mist`/`bg-night-deep`. Full WCAG combobox can wait; basic kbd nav cannot.
- **[RC-FE-4]** Native `confirm()` for FAQ delete — visually breaks the brand. → **Fix**: inline confirm pattern (button row replaces trash button: "确认删除" + "取消").

### E — Operational silent failures
- **[RC-OPS-1]** Nightly snapshot has no failure notification → silent JSON staleness for weeks if action fails. → **Fix**: add `if: failure()` step that opens a GitHub Issue via `gh issue create`.
- **[RC-OPS-2]** Snapshot push has no `git pull --rebase`; collisions with concurrent main commits = silently missed days. → **Fix**: add `git pull --rebase origin main` before commit, OR switch to `peter-evans/create-pull-request`.
- **[RC-OPS-3]** `dump-redis.ts` derives skill set from `general.skills` union; orphan skills lost on snapshot. Recovery from snapshot then loses them permanently. → **Fix**: bundle with cross-cutting #5 — add `skills:index` and use it in dump too.

## 🟡 Important Issues (should address)

Grouped to keep this readable:

**Validation / typing**
- [RI-DEV-1] PATCH semantics — validators require all fields, so it's actually PUT. Either rename or relax validator.
- [RI-DEV-2] Validator enums drift from `@sgs/data/types/` (cross-cutting #6). Use derived consts.
- [RI-DEV-3] `noUncheckedIndexedAccess: true` will reject destructuring `split(".")`. Add narrowing.
- [RI-QA-1] Weak validator boundary tests: missing `hp > maxHp` cross-field, missing `pairedNames` non-array, etc.
- [RI-QA-6] FAQ category enum allows `"card"`/`"skill"` but only `relatedGeneralIds` is exposed; orphan-state possible. Restrict to `general`/`rule` for v1, or add validation.
- [RI-SEC-3] No body size limits — admin can POST 10MB description, blow Upstash quota. Add 50KB cap, length cap on text fields (5KB).

**Test infrastructure**
- [RI-QA-3 / RI-DEV-4] `pnpm vitest` from root must pick up `packages/web` tests. Add a Phase-0 step to verify (and add `vitest.config.ts` to `packages/web` if needed).
- [RI-QA-2] `passwordMatches` exported but untested — add 4 cases (empty, mismatch, unicode, undefined env).
- [RI-QA-4] Deploy-hook path untested — missing env, 4xx, network error, success.
- [RI-QA-5] Stale `skills:by-general` reverse index when general's `skills` array changes via PATCH (no reciprocal update). Document or fix.

**Concurrency / consistency**
- [RI-PM-2] Two admins on same general silently stomp; add `If-Match: <updatedAt>` round-trip → 409 + form reload prompt.
- [RI-OPS-4] `revalidatePath` failure not handled in routes — admin sees "saved" but page stays stale. Wrap in try/catch, return `revalidated: string[]` in response.
- [RI-OPS-6] `sync-search` no rate limit — admin spam-click = deploy storm + Vercel build minute burn. Track `sync-search:last-trigger` in Redis, 429 if <90s old.

**Frontend polish (non-cosmetic)**
- [RI-FE-2] Toast: 1.2s autoclose + no `role="status"` = unreadable + a11y miss. Make global, 3.5s, polite live region.
- [RI-FE-4] No mobile/tablet form breakpoint. Add `max-h-[80vh] overflow-y-auto` at minimum.
- [RI-FE-5] No unsaved-changes guard. Track `dirty`, prompt on cancel/navigate.
- [RI-FE-6] `EditAffordance` replaces trigger with form — context lost. Render form below trigger; keep trigger visible as "正在编辑".
- [RI-FE-7] Header crowding at 1024-1280px. Collapse admin chrome into dropdown OR move success message to global toast.
- [RI-FE-8] `<button>` triggers lack `aria-label`.
- [RI-FE-9] `MultiSelect` "no matches" empty state missing.

**Security hardening**
- [RI-SEC-1] Add Origin/Referer check in `requireAdmin()` — defense-in-depth on top of SameSite=Lax.
- [RI-SEC-2] `me` route silently 401s on missing `SESSION_SECRET` — log a server-side warning to surface dev misconfig.

**Operational**
- [RI-OPS-2] Seed script needs target URL print + `--yes` confirmation flag — otherwise one distracted run wipes prod.
- [RI-OPS-3] Seed is destructive without `--force` guard; re-running silently overwrites edits.
- [RI-OPS-5] Add Upstash dashboard URL to README; bandwidth note in case ISR fanout is large.
- [RI-OPS-7] Verify `packages/web/.env.local` is git-ignored (root `.env*` may not match nested file).
- [RI-OPS-8] Snapshot action runs full `pnpm install` for one TS script — slow + fragile lockfile coupling. Filter or use `npx tsx`.
- [RI-OPS-9] Add `/api/health` endpoint returning `{redis, generals_count, faqs_count}` for smoke + future debugging.

## 🟢 Suggestions (defer or v1.5)

- [RS-PM-1] `/admin/recent-changes` page rendering `git log --grep '\[snapshot\]'` — give non-tech admin sanity-check surface.
- [RS-PM-3] Pinyin search in `MultiSelect` — v2.
- [RS-FE-1] Reuse `panel`/`eyebrow` classes inside form containers for visual nesting.
- [RS-FE-2] Login form: wrap in `panel ornate-corner` + use `seal` mark + `section-title` heading.
- [RS-FE-3] `prefers-reduced-motion` guard on `anim-rise`/`anim-stamp`.
- [RS-FE-5] `useMemo` for `MultiSelect` options.
- [RS-SEC-1] Log admin write events (route + entity ID + diff hash, not content) to Vercel logs for forensics.
- [RS-SEC-2] Add `Cache-Control: no-store` headers to all `/api/auth/*` and `/api/admin/*`.
- [RS-SEC-3] Pin GitHub Actions to commit SHAs (supply chain).
- [RS-SEC-4] Document `SESSION_SECRET` rotation procedure (must bump `SESSION_GENERATION` simultaneously).
- [RS-OPS-1] Move snapshot cron from 03:00 UTC to 18:00 UTC to avoid Beijing daytime active editing.
- [RS-OPS-3] Add `concurrency: { group: redis-snapshot }` to workflow.
- [RS-OPS-5] Document `SESSION_SECRET` rotation runbook.

## Recommended Plan Changes (concrete actions)

Bundle the **Critical** items into ~10 plan revisions:

1. **Add Task 0.3 + 1.5 + 2.7 + 4.4** (3 new tasks):
   - 0.3: Verify `pnpm vitest` picks up `packages/web` tests; add config if missing
   - 1.5: Add `getSkills()` + `skills:index` to entityStore (resolves cross-cutting #5, #3)
   - 2.7: Integration tests for all API routes (resolves RC-QA-1)
   - 4.4: `<FallbackBanner />` component + `entityStore.readWithFallback` flag (resolves RC-PM-1)

2. **Modify Task 1.1**: add narrowing for `noUncheckedIndexedAccess` (RI-DEV-3); add tests for `passwordMatches` (RI-QA-2).

3. **Modify Task 1.2**: derive enums from `@sgs/data/types/` (RI-DEV-2); add `hp > maxHp` cross-field test (RI-QA-1); add image URL scheme allowlist (RC-SEC-1); add length caps (RI-SEC-3); restrict FAQ category to `general|rule` for v1 (RI-QA-6).

4. **Modify Task 1.3**: add `__resetForTests()` export; add `withTimeout(3000)` wrapper; add throwing-mock fallback test; verify deep JSON import works in vitest (RC-DEV-3, RC-DEV-4, RC-QA-2).

5. **Modify Task 2.1**: move `_middleware-helper.ts` → `packages/web/src/lib/auth-gate.ts`; add Origin/Referer check; add 50KB body cap (RC-DEV-5, RI-SEC-1, RI-SEC-3).

6. **Modify Task 2.2**: add `@upstash/ratelimit` on login (RC-SEC-2); log warning on missing `SESSION_SECRET` in `me` route (RI-SEC-2).

7. **Modify Tasks 2.3-2.5**: rename PATCH→PUT or document; wrap `revalidatePath` in try/catch; return `revalidated: string[]`; add `If-Match` concurrency check (RI-DEV-1, RI-OPS-4, RI-PM-2).

8. **Modify Task 2.6**: add 90s rate-limit via Redis (RI-OPS-6).

9. **Modify Task 3.1**: print target URL host + require `--yes` flag + check existing keys + add `--force` guard (RI-OPS-2, RI-OPS-3).

10. **Modify Task 3.2**: clean up dead `writeJson`/`HEADER`; switch from `assert` to `with` syntax for JSON imports; use `skills:index` (RC-DEV-1, RC-DEV-2, RC-OPS-3).

11. **Modify Task 3.4 (snapshot workflow)**: add `if: failure()` GitHub Issue step; add `git pull --rebase` before commit; concurrency group; consider 18:00 UTC; consider partial install (RC-OPS-1, RC-OPS-2, RS-OPS-1, RS-OPS-3, RI-OPS-8).

12. **Modify Phase 5 entire UI section**:
    - Audit `bg-night/70` → use `bg-night-deep/70` or correct token (RC-FE-1)
    - Add `.input-base` utility class with focus ring in globals.css (RC-FE-2)
    - Add keyboard handlers + ARIA combobox role to `MultiSelect`; swap palette (RC-FE-3)
    - Replace native `confirm()` with inline confirm pattern (RC-FE-4)
    - Render form below trigger, keep trigger visible (RI-FE-6)
    - Global `<Toaster>` with 3.5s + `role="status"` (RI-FE-2)
    - Add `dirty` tracking + cancel guard (RI-FE-5)
    - Add mobile breakpoint (`max-h-[80vh] overflow-y-auto`) (RI-FE-4)
    - Replace emoji icons with inline SVG (RI-FE-1)
    - Add empty state to `MultiSelect` (RI-FE-9)

13. **Modify Task 6.1 smoke**: add health endpoint check; add explicit "edit→navigate→back within 10s, see new text" timing assertion (RC-PM-3); add fallback banner verification step.

## Recommendation

**Apply revisions before execution.** The cross-cutting findings are real (especially #1-7 above) and the security/dev-environment issues will cause concrete pain in Phase 1. Estimated ~45-90 min of plan editing to bundle the fixes.

Two reasonable execution paths:
- **Path A**: I revise the plan now per the 13 actions above → re-commit → execute
- **Path B**: User triages — keeps a smaller subset (e.g., only RC-* items) and ships faster, accepting RI-* items as known follow-ups
