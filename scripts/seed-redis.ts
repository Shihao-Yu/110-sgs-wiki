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
 *
 * Replace mode:
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... \
 *     pnpm seed-redis -- --yes --replace
 *
 *   Deletes every general:* / skill:* / skills:by-general:* key, both index
 *   keys, and ALL rating data (ratings:all + ratings:log:*), then seeds fresh.
 *   Used when swapping the entire general pack — stale IDs from the previous
 *   pack would otherwise linger in generals:index and render as ghost pages.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const YES = args.has("--yes") || args.has("-y");
const FORCE = args.has("--force");
const REPLACE = args.has("--replace");
const DRY_RUN = args.has("--dry-run");

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN from Vercel Marketplace)");
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
const dataDir = resolve(REPO_ROOT, "packages/data/src");
const generals = JSON.parse(readFileSync(resolve(dataDir, "generals.json"), "utf8")) as Array<{ id: string }>;
const skills = JSON.parse(readFileSync(resolve(dataDir, "skills.json"), "utf8")) as Array<{ id: string; generalIds?: string[] }>;
const faqs = JSON.parse(readFileSync(resolve(dataDir, "faq.json"), "utf8")) as Array<{ id: string }>;

(async () => {
  if (REPLACE) {
    console.error(`>>> --replace: wiping existing pack data on ${targetHost}`);

    const oldGeneralIds = (await r.get<string[]>("generals:index")) ?? [];
    const oldSkillIds = (await r.get<string[]>("skills:index")) ?? [];
    console.error(`    ${oldGeneralIds.length} generals, ${oldSkillIds.length} skills to remove`);

    const keys: string[] = [
      ...oldGeneralIds.map((id) => `general:${id}`),
      ...oldGeneralIds.map((id) => `skills:by-general:${id}`),
      ...oldSkillIds.map((id) => `skill:${id}`),
      "generals:index",
      "skills:index",
      "ratings:all",
    ];

    // ratings:log:YYYYMMDD 需要枚举而不是猜日期；放在删除之前，
    // 这样 --dry-run 也能报出完整的待删清单。
    const logKeys: string[] = [];
    {
      let cursor = "0";
      do {
        const [next, batch] = await r.scan(cursor, { match: "ratings:log:*", count: 200 });
        cursor = String(next);
        logKeys.push(...batch);
      } while (cursor !== "0");
    }

    if (DRY_RUN) {
      console.error(`>>> --dry-run: 以下 ${keys.length + logKeys.length} 个键**将会被删除**，本次不执行任何写操作`);
      console.error(`    general:*            ${oldGeneralIds.length}`);
      console.error(`    skills:by-general:*  ${oldGeneralIds.length}`);
      console.error(`    skill:*              ${oldSkillIds.length}`);
      console.error(`    generals:index / skills:index / ratings:all   3`);
      console.error(`    ratings:log:*        ${logKeys.length}${logKeys.length ? ` (${logKeys.join(", ")})` : ""}`);
      console.error(`>>> 随后会写入 ${generals.length} generals / ${skills.length} skills / ${faqs.length} faqs`);
      console.error(`>>> dry-run 结束，Redis 未被改动`);
      process.exit(0);
    }

    // Upstash caps the number of args per command; delete in chunks.
    for (let i = 0; i < keys.length; i += 256) {
      const chunk = keys.slice(i, i + 256);
      if (chunk.length > 0) await r.del(...chunk);
    }

    if (logKeys.length > 0) {
      await r.del(...logKeys);
      console.error(`    removed ${logKeys.length} rating log keys`);
    }

    console.error(`    wipe complete (${keys.length} keys + ${logKeys.length} logs)`);
  }

  const existingIndex = await r.get<string[]>("generals:index");
  if (existingIndex && existingIndex.length > 0 && !FORCE && !REPLACE) {
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
