#!/usr/bin/env tsx
/**
 * 在 seed-redis --replace 之前，把生产 Redis 里**会被删除的全部键**存成一份快照。
 *
 * 为什么不用 scripts/dump-redis.ts：那个脚本不写 stdout，而是直接覆盖
 * packages/data/src/{generals,skills,faq}.json —— 在替换流程的这个时点，
 * 那三个文件装的是刚生成好的新数据，跑一次就会被 Redis 里的旧数据换掉。
 *
 * 备份范围必须与 seed-redis.ts 的 --replace 删除集合逐类对应：
 *   general:<id>              (id ∈ generals:index)
 *   skills:by-general:<gid>   (gid ∈ generals:index)
 *   skill:<id>                (id ∈ skills:index)
 *   generals:index / skills:index
 *   ratings:all
 *   ratings:log:<date>        (SCAN 枚举)
 * 另外一并存 faqs（--replace 不删，但备份更宽属安全方向）。
 *
 * 用法：
 *   cd packages/web
 *   BACKUP=/tmp/redis-backup-$(date +%Y%m%d-%H%M%S).json pnpm tsx ../../scripts/qlhd/backup-redis.ts
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { Redis } from "@upstash/redis";

const out = process.env.BACKUP;
if (!out) {
  console.error("请用环境变量 BACKUP 指定输出文件路径");
  process.exit(1);
}

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN)");
  process.exit(1);
}
console.error(`>>> backup target: ${new URL(url).host}`);

const r = new Redis({ url, token });

async function scanAll(match: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = await r.scan(cursor, { match, count: 200 });
    cursor = String(next);
    keys.push(...batch);
  } while (cursor !== "0");
  return keys;
}

async function grabByIndex(indexKey: string, key: (id: string) => string) {
  const ids = (await r.get<string[]>(indexKey)) ?? [];
  const values = ids.length ? await r.mget<unknown[]>(...ids.map(key)) : [];
  return { ids, values };
}

(async () => {
  const generalIds = (await r.get<string[]>("generals:index")) ?? [];

  const snapshot = {
    takenAt: new Date().toISOString(),
    host: new URL(url).host,
    generals: await grabByIndex("generals:index", (id) => `general:${id}`),
    skills: await grabByIndex("skills:index", (id) => `skill:${id}`),
    faqs: await grabByIndex("faqs:index", (id) => `faq:${id}`),
    // 派生表：理论上可从 skills[].generalIds 重算，但若线上曾与之漂移，
    // 那份漂移量只存在于这些键里，删掉就没了。原样存一份，成本 5 行。
    skillsByGeneral: {
      keys: generalIds.map((id) => `skills:by-general:${id}`),
      values: generalIds.length
        ? await r.mget<unknown[]>(...generalIds.map((id) => `skills:by-general:${id}`))
        : [],
    },
    ratings: await r.get("ratings:all"),
    ratingLogs: {} as Record<string, unknown[]>,
  };

  for (const k of await scanAll("ratings:log:*")) {
    snapshot.ratingLogs[k] = await r.lrange(k, 0, -1);
  }

  writeFileSync(out, JSON.stringify(snapshot, null, 2));
  console.error(
    `备份完成 -> ${out}\n` +
      `  generals ${snapshot.generals.ids.length} / skills ${snapshot.skills.ids.length} / ` +
      `faqs ${snapshot.faqs.ids.length} / skills:by-general ${snapshot.skillsByGeneral.keys.length} / ` +
      `ratingLogs ${Object.keys(snapshot.ratingLogs).length} 个键`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
