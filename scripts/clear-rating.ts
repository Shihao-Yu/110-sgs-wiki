#!/usr/bin/env tsx
/**
 * Clear the rating data for a specific general from the production ratings:all map.
 *
 * Usage:
 *   set -a && source packages/web/.env.production.local && set +a
 *   pnpm tsx scripts/clear-rating.ts <generalId>
 */
import "dotenv/config";
import { Redis } from "@upstash/redis";

const id = process.argv[2];
if (!id) {
  console.error("Usage: pnpm tsx scripts/clear-rating.ts <generalId>");
  process.exit(1);
}

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN).");
  process.exit(1);
}

console.error(`>>> target: ${new URL(url).host}`);
const r = new Redis({ url, token });

(async () => {
  const all = (await r.get<Record<string, unknown>>("ratings:all")) ?? {};
  const before = all[id];
  if (!before) {
    console.error(`No rating record for ${id} — nothing to clear.`);
    return;
  }
  console.error(`Before: ${JSON.stringify(before)}`);
  delete all[id];
  await r.set("ratings:all", all);
  console.error(`Cleared rating for ${id}.`);
})().catch((e) => { console.error(e); process.exit(1); });
