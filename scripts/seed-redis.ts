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
 *   Deletes every general:* / skills:by-general:* / skill:* key **that is
 *   referenced by generals:index or skills:index**, both index keys, then
 *   seeds fresh.
 *
 *   Rating data (ratings:all + ratings:log:*) is PRESERVED by default. This
 *   used to be a full-pack replacement (old generals vanish, so their
 *   ratings became orphans and were wiped alongside them). The pack strategy
 *   changed to two versions coexisting: all 341 old-pack general ids are
 *   still present, unchanged, in the merged 736-entry pack, so ratings
 *   recorded against those ids are still live data, not orphans. Pass
 *   --wipe-ratings to opt into the old behavior (deletes ratings:all +
 *   ratings:log:* too). --wipe-ratings only makes sense together with
 *   --replace; without --replace it errors out instead of being silently
 *   ignored.
 *
 *   删除是 index 驱动的，不是 SCAN 驱动的 —— 未被两个 index 引用的孤儿值键
 *   （例如 putGeneral 写完值键后 index 更新失败留下的残骸）不在删除范围内。
 *   这一点很重要：/generals/[id] 没有设 dynamicParams = false，index 之外的
 *   id 会走按需渲染并直接读值键，所以残留的孤儿值键才是 ghost page 的真正载体。
 *   正常路径下不会产生孤儿键；若怀疑历史上有，需另行 SCAN 排查。
 *
 *   Add --dry-run to print the exact key set that WOULD be deleted and exit
 *   without writing anything.
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
const WIPE_RATINGS = args.has("--wipe-ratings");

// --dry-run 只在 --replace 分支里被读取。若不加这道守卫，
// `--yes --force --dry-run` 会绕过 index 守卫、直接执行一次完整 seed，
// 把生产数据整体覆写 —— 一个名叫 dry-run 的开关触发了破坏性写入。
if (DRY_RUN && !REPLACE) {
  console.error("--dry-run 目前只对 --replace 有效；不带 --replace 时本脚本仍会写入。已中止。");
  process.exit(2);
}

// --wipe-ratings 只在 --replace 分支里被读取，本身不该在其他模式下
// 被静默忽略 —— 那会让人以为传了参数就生效，其实评分完好无损地留在库里。
if (WIPE_RATINGS && !REPLACE) {
  console.error("--wipe-ratings 只在 --replace 下有效；不带 --replace 时本脚本不会碰 ratings:*。已中止。");
  process.exit(2);
}

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
      ...(WIPE_RATINGS ? ["ratings:all"] : []),
    ];

    // ratings:log:YYYY-MM-DD 需要枚举而不是猜日期；放在删除之前，
    // 这样 --dry-run 也能报出完整的待删清单。默认（未加 --wipe-ratings）
    // 不删评分，也就没必要为了一份不会被删的清单去扫一遍 Redis。
    const logKeys: string[] = [];
    if (WIPE_RATINGS) {
      let cursor = "0";
      do {
        const [next, batch] = await r.scan(cursor, { match: "ratings:log:*", count: 200 });
        cursor = String(next);
        logKeys.push(...batch);
      } while (cursor !== "0");
    }

    if (DRY_RUN) {
      // 评分是唯一可能不可逆的部分，必须单独、具体地展示它的体量——
      // 不论这次是保留还是删除，都不能把它混进「generals:index / skills:index
      // 2」这样的行里，让人看不出自己正在批准（或放过）全站评分。
      const ratingsAll =
        (await r.get<Record<string, { total?: number }>>("ratings:all")) ?? {};
      const ratedCount = Object.keys(ratingsAll).length;
      const totalVotes = Object.values(ratingsAll).reduce(
        (a, v) => a + (v?.total ?? 0),
        0,
      );

      // 旧包有、新包没有的 ID —— 这些 URL 替换后会 404。
      const newIds = new Set(generals.map((g) => g.id));
      const vanishing = oldGeneralIds.filter((id) => !newIds.has(id));

      console.error(`>>> --dry-run: 以下 ${keys.length + logKeys.length} 个键**将会被删除**，本次不执行任何写操作`);
      console.error(`    general:*            ${oldGeneralIds.length}`);
      console.error(`    skills:by-general:*  ${oldGeneralIds.length}`);
      console.error(`    skill:*              ${oldSkillIds.length}`);
      console.error(`    generals:index       1`);
      console.error(`    skills:index         1`);
      if (WIPE_RATINGS) {
        console.error(`    ratings:log:*        ${logKeys.length}${logKeys.length ? ` (${logKeys.join(", ")})` : ""}`);
        console.error(``);
        console.error(`>>> ⚠️  ratings:all —— 这是不可逆的部分`);
        console.error(`    ${ratedCount} 名武将有评分，合计 ${totalVotes} 票，删除后无法恢复`);
      } else {
        console.error(`    ratings:log:*        0（不删除；未加 --wipe-ratings）`);
        console.error(``);
        console.error(`>>> ratings:all —— ${ratedCount} 名武将有评分，合计 ${totalVotes} 票（本次保留，未加 --wipe-ratings）`);
      }
      console.error(``);
      console.error(`>>> 替换后将写入 ${generals.length} generals / ${skills.length} skills / ${faqs.length} faqs`);
      if (vanishing.length > 0) {
        console.error(`>>> ⚠️  ${vanishing.length} 个旧 ID 在新包中不存在，其 URL 将变成 404：`);
        console.error(`    ${vanishing.join(", ")}`);
      } else {
        console.error(`>>> 所有旧 ID 在新包中都有对应条目，无 URL 失效`);
      }
      console.error(``);
      console.error(`>>> dry-run 结束，Redis 未被改动。`);
      console.error(`    注意：本次统计是此刻的快照。dry-run 与真正执行之间若有人投票或`);
      console.error(`    在 admin 里改动数据，实际删除的键集合会与上面略有出入。`);
      console.error(`    重跑 dry-run 是安全的（纯只读），执行前可再跑一次确认。`);
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
