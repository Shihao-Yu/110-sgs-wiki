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
