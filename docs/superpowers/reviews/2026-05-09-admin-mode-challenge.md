# Strategic Challenge Report: Admin Inline-Edit Mode

**Date**: 2026-05-09
**Spec reviewed**: `docs/superpowers/specs/2026-05-09-admin-mode-design.md`
**Lenses applied**: First Principles · Problem Worth · Future Blindspots · Simplicity & Alternatives

## Overall Assessment: **PAUSE AND RETHINK**

All four lenses independently converge on the same finding: **the spec over-engineers the solution for a problem that "git commit + Vercel auto-deploy" already solves at this scale**. Two of four lenses voted RETHINK; the other two voted CONCERNS but recommended the same architectural shift.

The convergence point: drop the Upstash Redis runtime store and adopt a **git-as-CMS** model (inline edit UI commits JSON via GitHub Contents API, Vercel auto-deploys). Same UX outcome for the admin; ~30% the code; eliminates 4 risk classes (split-brain, search drift, seed ordering, cookie rotation).

## The Problem Statement Test

**What the spec says we're solving**: 1–2 trusted admins need to edit general/skill descriptions and CRUD FAQs from live pages, with changes visible to visitors **within seconds**.

**What we're actually solving (after first-principles decomposition)**: Trusted hobbyist editors need a **low-friction text-edit surface** for a small canonical dataset, where each edit must reach readers **promptly**.

**Gap**: The spec equates "low-friction edit" with "live runtime database" and equates "promptly" with "within seconds." Neither is necessarily true. The data is small (~700 generals, ~1500 skills, <500 FAQs), changes infrequently, is read-mostly, and the user is one of two admins. That's a content-authoring problem (historically solved with git-backed CMSes), not a runtime DB problem. And "within 60–90 seconds" is "promptly" for a hobby wiki.

## Challenge Summary

| Lens | Verdict | Key Finding |
|------|---------|-------------|
| First Principles | ⚠️ CONCERNS | Solving 60s deploy latency by introducing a runtime data plane; pays in operational surface > latency saved |
| Problem Worth | 🔴 RETHINK | User is the developer AND the admin; `git commit` already works; 5–8 days of infra unjustified |
| Future Blindspots | ⚠️ CONCERNS | Redis-only + no fallback + 10K/day free cap = single bad day → site outage; cards v2 forces re-arch |
| Simplicity | 🔴 RETHINK | 10 files, 8 endpoints, 6 schema shapes for 1–2 admins; "same UX with GitHub Contents API" is ~30% the code |

## 🔴 Fundamental Concerns (might need to rethink)

1. **The "几秒生效" requirement is unvalidated.** The spec uses this as the justification for picking Redis over rebuild-on-edit. But: who will be unhappy with 60–90s? The user/dev never quantified edit frequency or named a non-dev admin. If the admins are technical (or willing to use a CMS UI), 60s is fine — and 60s with full git history is *better* than seconds with no history.

2. **Search index divergence is a self-inflicted wound.** The spec accepts that the home-page search box stays stale until next deploy. But that contradicts the spec's *own justification* for picking Redis ("几秒可见"). Admins will edit a skill, search for it, see stale results, and wonder why. With git-as-CMS, redeploy = save and search stays consistent.

3. **JSON files become "dangerous" after first edit.** Once Redis is the source of truth, any future contributor PR-editing `packages/data/src/*.json` silently overwrites Redis on next seed. JSON drifts immediately and silently. The "JSON as recovery" plan fails the moment someone trusts it.

4. **Two of four reviewers explicitly flagged: "the user is the developer and the admin."** That changes the calculus entirely. The whole inline-CMS design exists to abstract git away from non-technical editors. If both editors are technical (one literally being the dev), the value collapses.

## 🟡 Strategic Risks (would need design changes)

1. **Single-bad-day Redis outage = site down.** §4.3 explicitly chose "no JSON fallback" to avoid split-brain, but this means a 10K/day cap breach (during a bot crawl, link unfurler spike, deploy churn) takes the *visitor* site down with no degraded path. For a hobby site nobody is paging on, brief stale > total down.

2. **`SESSION_GENERATION` env var should ship in v1, not be deferred.** It's 5 lines and is the only mechanism to actually invalidate sessions on password rotation. Without it, leak = wait 30 days.

3. **Cards v2 architectural decision is deferred but blocking.** Per-entity Redis keys assume stable IDs; cards have name-based dedup. v1 architecture will not extend cleanly to cards. Decide the card identity model **now** (one paragraph in spec), even if not implemented.

4. **`revalidate-map.ts` is a known bug magnet.** Forgetting to add a path when adding a new relationship = silent stale data. Mitigate with unit tests per mutation type from day 1.

## 🟢 Noted but Acceptable

- Single shared password + 30-day cookie. Fine for 2 admins, low value target.
- last-write-wins concurrent edit. With 2 admins, conflict probability is negligible.
- No multi-admin attribution. Not needed at this scale.
- Skipping E2E for v1, manual smoke instead. Reasonable.

## Assumptions That Need Validation

- **[A-1]** A non-technical admin actually exists (or will exist within 6 months). Cheap test: name them today. If the answer is "just me and another developer friend," kill the runtime CMS premise entirely.
- **[A-2]** Edit frequency justifies sub-deploy latency. Cheap test: count git commits to `packages/data/` over the last 90 days. If <10, the edit cadence doesn't need a runtime DB.
- **[A-3]** Off-the-shelf git-backed CMSes (Decap, TinaCMS, Pages CMS, Sveltia) were genuinely evaluated. Spec mentions none. **They likely solve this better than building from scratch.**
- **[A-4]** ISR cache hit rate stays >95% so 10K/day Upstash cap holds. No baseline measurement; just hope.

## The "What If" Scenarios

1. **What if the second admin is also technical?** → The entire Redis stack serves nobody. `git commit` works for both. Verdict: ship nothing; add a `pnpm validate` hook + `pnpm new-faq` CLI prompt instead.
2. **What if a third friend wants to help edit?** → Single shared password = no individual revocation. Forces re-architecture of auth. Document the threshold.
3. **What if Upstash hits the daily cap?** → §4.3 says render `error.tsx`. Site down. No fallback. → Add stale-while-error JSON read for *visitor* path.
4. **What if v2 needs card edits?** → Per-entity keying breaks on name-deduped cards. → Decide card identity model now.
5. **What if Next.js 16 changes `revalidatePath` semantics again?** → Central `revalidate-map.ts` rewrite. Acceptable cost given the abstraction is in one place.
6. **What if the password leaks?** → Wait 30 days for cookies to expire. → Ship `SESSION_GENERATION` in v1.

## Alternative Approaches Considered

### Alt 1 (Strongly Recommended): Git-as-CMS with same inline UX
- Keep all UI work from the spec (inline pencils, FAQ CRUD, AdminAffordances, typed forms, login)
- Replace the persistence handler: instead of `PATCH /api/admin/...` → write Redis, do `POST /api/admin/commit` → use GitHub Contents API to commit JSON edit on `main`, Vercel auto-deploys
- Auth: same shared password + HMAC cookie OR a GitHub PAT in env (admins don't need GitHub accounts)
- Net: ~30% of spec code, free undo via git history, search stays consistent, no Redis, no seed, no revalidate-map, no split-brain, no search-drift caveat
- Cost: 60–90s publish latency (Vercel rebuild), GitHub PAT in env

### Alt 2: Off-the-shelf git-backed CMS (Decap / TinaCMS / Pages CMS / Sveltia)
- Point the CMS at `packages/data/src/*.json`
- ~15% of spec effort; ~95% of value
- Cost: less control over UX, dependency on a 3rd-party project

### Alt 3: Status quo + lightweight tooling
- Add a `pnpm validate` pre-commit hook
- Add a `pnpm new-faq` CLI prompt that appends to `faq.json`
- ~2% of spec effort; ~80% of value (for FAQ which is the only true add/delete entity)
- Cost: still requires git knowledge

### Alt 4: FAQ-only inline editor on Redis (scope cut)
- If FAQs are the only thing that genuinely changes often, build only FAQ CRUD on Redis; leave generals/skills in JSON
- ~30% of spec effort; ~70% of value

### Alt 5 (spec as-is)
- Only justified if a non-technical admin must edit from a phone with sub-second feedback
- The spec never establishes this requirement

## Recommendation

**Pause writing-plans. Ask the user three concrete questions first:**

1. **Does a non-technical admin exist or will exist in the next 3 months? Name them.** If no, drop the runtime CMS premise.
2. **In the last 90 days, how many edits have happened to `packages/data/src/*.json`?** (`git log --oneline -- packages/data/src/ | wc -l`) If <10, edit frequency doesn't justify runtime infra.
3. **Is "几秒生效" a hard requirement, or is "60–90s" acceptable?** Be honest. If 60–90s is acceptable, Alt 1 (git-as-CMS) wins on every dimension.

**If the user answers** (a) "no non-tech admin", (b) "<10 edits/90d", (c) "60–90s is fine":
→ **Drop this spec entirely**. Adopt Alt 3 (validate hook + CLI) or Alt 2 (Decap CMS). Spend the 5–8 engineer-days on Feature ② (牌局记录) or actual content additions.

**If the user answers** (a) "yes there's a non-tech admin" or (c) "几秒生效 is hard":
→ **Rewrite spec as Alt 1** (git-as-CMS with same inline UX). Keeps 100% of the UI design work, replaces the storage layer, drops 4 risk classes.

**Do not proceed to writing-plans on the current spec without one of these resolutions.**

If the user genuinely wants to build this as a learning exercise (Redis + Next.js Route Handlers practice), that's a valid hobby motivation — but should be named honestly, not framed as required for the use case. The bar then becomes "is this fun to build" rather than "is this the right solution."
