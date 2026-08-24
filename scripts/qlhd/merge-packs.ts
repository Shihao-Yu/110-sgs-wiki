#!/usr/bin/env tsx
/**
 * 合并旧「国战」包（341 条）与新「群狼环鼎」包（395 条）为两版共存的
 * packages/data/src/generals.json（736 条，旧包在前、新包在后）。
 *
 * 同时把 tokens.json 里指向新包武将的 ownerGeneralId 同步加上 qlhd_ 前缀 ——
 * tokens.json 是在新包尚未加前缀时生成的，18 条 ownerGeneralId 全部指向新包
 * 武将，合并后若不改写就会全部悬空。
 *
 * 前置：先跑 build-generals.ts 生成 qlhd-generals.json，
 *       再跑 restore-guozhan.ts 生成 guozhan-generals.json。
 *
 * 用法： pnpm tsx scripts/qlhd/merge-packs.ts
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA_DIR = resolve(REPO_ROOT, 'packages/data/src');

type GeneralRecord = { id: string; name: string; image: string; [key: string]: unknown };
type TokenRecord = { id: string; ownerGeneralId?: string; [key: string]: unknown };

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function main() {
  const guozhan = readJson<GeneralRecord[]>(resolve(DATA_DIR, 'guozhan-generals.json'));
  const qlhd = readJson<GeneralRecord[]>(resolve(DATA_DIR, 'qlhd-generals.json'));

  // 旧包在前、新包在后
  const merged = [...guozhan, ...qlhd];

  // —— generals.json 断言 ——
  if (merged.length !== 736) {
    throw new Error(`合并后条目数 ${merged.length}，预期 736`);
  }
  const ids = merged.map((g) => g.id);
  const dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dupIds.length) {
    throw new Error(`重复 ID: ${[...new Set(dupIds)].join(', ')}`);
  }
  for (const g of merged) {
    const p = resolve(REPO_ROOT, 'assets', g.image);
    if (!existsSync(p)) throw new Error(`图片不存在: ${g.image} (${g.id} ${g.name})`);
  }

  const generalsDest = resolve(DATA_DIR, 'generals.json');
  writeFileSync(generalsDest, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(`generals.json: ${merged.length} 条（旧包 ${guozhan.length} + 新包 ${qlhd.length}）`);

  // —— 同步 tokens.json 的 ownerGeneralId ——
  const tokens = readJson<TokenRecord[]>(resolve(DATA_DIR, 'tokens.json'));
  const knownIds = new Set(merged.map((g) => g.id));
  let rewritten = 0;
  const updatedTokens = tokens.map((t) => {
    if (!t.ownerGeneralId) return t;
    rewritten += 1;
    return { ...t, ownerGeneralId: t.ownerGeneralId.replace(/^general_/, 'general_qlhd_') };
  });

  // —— tokens.json 断言 ——
  if (updatedTokens.length !== 44) {
    throw new Error(`tokens.json 条目数 ${updatedTokens.length}，预期 44`);
  }
  if (rewritten !== 18) {
    throw new Error(`改写的 ownerGeneralId 条数 ${rewritten}，预期 18`);
  }
  for (const t of updatedTokens) {
    if (t.ownerGeneralId && !knownIds.has(t.ownerGeneralId)) {
      throw new Error(
        `token ${t.id} 的 ownerGeneralId 在合并后的 generals.json 里找不到: ${t.ownerGeneralId}`,
      );
    }
  }

  const tokensDest = resolve(DATA_DIR, 'tokens.json');
  writeFileSync(tokensDest, JSON.stringify(updatedTokens, null, 2) + '\n', 'utf8');
  console.log(`tokens.json: ${updatedTokens.length} 条（改写 ownerGeneralId ${rewritten} 条）`);
}

main();
