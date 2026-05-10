#!/usr/bin/env tsx
/**
 * Dump current Upstash state -> JSON files in packages/data/src/.
 * Run by .github/workflows/redis-snapshot.yml nightly.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN from Vercel Marketplace)");
  process.exit(1);
}
const r = new Redis({ url, token });

interface Identifiable { id: string }

async function dumpEntities<T extends Identifiable>(indexKey: string, valueKey: (id: string) => string): Promise<T[]> {
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

  const generals = await dumpEntities<Identifiable>("generals:index", (id) => `general:${id}`);
  const skills = await dumpEntities<Identifiable>("skills:index", (id) => `skill:${id}`);
  const faqs = await dumpEntities<Identifiable>("faqs:index", (id) => `faq:${id}`);

  generals.sort((a, b) => a.id.localeCompare(b.id));
  skills.sort((a, b) => a.id.localeCompare(b.id));
  faqs.sort((a, b) => a.id.localeCompare(b.id));

  writeFileSync(resolve(dataDir, "generals.json"), JSON.stringify(generals, null, 2) + "\n", "utf8");
  writeFileSync(resolve(dataDir, "skills.json"), JSON.stringify(skills, null, 2) + "\n", "utf8");
  writeFileSync(resolve(dataDir, "faq.json"), JSON.stringify(faqs, null, 2) + "\n", "utf8");

  console.error(`Dumped: ${generals.length} generals, ${skills.length} skills, ${faqs.length} faqs.`);
})().catch((e) => { console.error(e); process.exit(1); });
