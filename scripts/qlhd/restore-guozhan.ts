#!/usr/bin/env tsx
/**
 * 从 git 历史恢复旧「国战」包的 341 条武将数据，写到
 * packages/data/src/guozhan-generals.json。
 *
 * 旧包整体替换前的数据快照在提交 6fce1e0。该提交里的 image 全部是顶层
 * `generals/<名>.png`（已核实 0 条引用 emperors/ 或 eunuchs/）。转换后的
 * webp 现在放在 assets/generals/guozhan/ 下，文件名不变，仅扩展名变化，
 * 因此这里只改写 image 字段，把它指到新目录 + .webp。
 *
 * id / name / title / faction / hp / skills / pack 等其余字段一律不动 ——
 * 旧包的现有链接、收藏、外链要继续可用，两版共存靠 id 前缀区分，不靠改动
 * 旧包本身的字段。
 *
 * 用法： pnpm tsx scripts/qlhd/restore-guozhan.ts
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OLD_COMMIT = '6fce1e0';

/** 不用窄类型列举字段，避免恢复时漏掉某条独有的字段（如 paired / pairedNames）。 */
type GeneralRecord = { id: string; name: string; image: string; [key: string]: unknown };

function main() {
  const raw = execFileSync(
    'git',
    ['show', `${OLD_COMMIT}:packages/data/src/generals.json`],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
  const generals = JSON.parse(raw) as GeneralRecord[];

  const restored = generals.map((g) => {
    const m = /^generals\/(.+)\.(png|jpg)$/i.exec(g.image);
    if (!m) {
      throw new Error(
        `旧包 image 路径不是预期的 generals/<名>.png|jpg 格式: ${g.image} (${g.id} ${g.name})`,
      );
    }
    return { ...g, image: `generals/guozhan/${m[1]}.webp` };
  });

  // —— 断言 ——
  if (restored.length !== 341) {
    throw new Error(`条目数 ${restored.length}，预期 341`);
  }
  const ids = restored.map((g) => g.id);
  const dups = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dups.length) throw new Error(`重复 ID: ${[...new Set(dups)].join(', ')}`);
  for (const g of restored) {
    const p = resolve(REPO_ROOT, 'assets', g.image);
    if (!existsSync(p)) throw new Error(`图片不存在: ${g.image} (${g.id} ${g.name})`);
  }

  const dest = resolve(REPO_ROOT, 'packages/data/src/guozhan-generals.json');
  writeFileSync(dest, JSON.stringify(restored, null, 2) + '\n', 'utf8');
  console.log(`写入 ${restored.length} 条 -> ${dest}`);
}

main();
