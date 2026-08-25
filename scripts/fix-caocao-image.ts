#!/usr/bin/env tsx
/**
 * ⚠️ 已作废：本脚本属于「群狼环鼎」替换之前的旧数据管线，请勿运行。
 *
 * 群狼环鼎替换（2026-08）之后，generals.json / skills.json 由
 * scripts/qlhd/build-generals.ts 与 build-tokens.ts 生成。
 * 运行本脚本会用旧数据覆写它们，静默回滚整批替换工作。
 */

/**
 * One-off: production Redis has Cao Cao's image field set to a stale path
 * (`images/generals/general_wei_001.jpg`) that does not exist on the CDN.
 * The correct path lives in packages/data/src/generals.json.
 *
 * Usage:
 *   cd packages/web && vercel env pull .env.local   # one-time
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... pnpm tsx scripts/fix-caocao-image.ts
 *   (or: dotenv -e packages/web/.env.local -- pnpm tsx scripts/fix-caocao-image.ts)
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const TARGET_ID = "general_wei_001";

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN).");
  console.error("Run: cd packages/web && vercel env pull .env.local");
  process.exit(1);
}

const targetHost = (() => {
  try { return new URL(url).host; } catch { return "(unparseable)"; }
})();
console.error(`>>> target: ${targetHost}`);

const r = new Redis({ url, token });
const generals = JSON.parse(
  readFileSync(resolve(REPO_ROOT, "packages/data/src/generals.json"), "utf8"),
) as Array<{ id: string; image: string }>;

const seed = generals.find((g) => g.id === TARGET_ID);
if (!seed) {
  console.error(`No general with id=${TARGET_ID} in generals.json`);
  process.exit(2);
}

(async () => {
  const current = await r.get<{ image?: string; updatedAt?: string }>(`general:${TARGET_ID}`);
  if (!current) {
    console.error(`No record for general:${TARGET_ID} in Redis — nothing to fix.`);
    process.exit(3);
  }
  console.error(`Current image: ${current.image}`);
  console.error(`Correct image: ${seed.image}`);
  if (current.image === seed.image) {
    console.error("Already correct — no write.");
    return;
  }
  const next = { ...current, image: seed.image, updatedAt: new Date().toISOString() };
  await r.set(`general:${TARGET_ID}`, next);
  console.error("Updated. New image:", next.image);
})().catch((e) => { console.error(e); process.exit(1); });
