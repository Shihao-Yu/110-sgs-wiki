#!/usr/bin/env tsx
/**
 * 从解压素材生成 packages/data/src/qlhd-generals.json（395 条，id 带 general_qlhd_ 前缀）。
 *
 * 用法： pnpm tsx scripts/qlhd/build-generals.ts
 */
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCardFilename, type ParsedCard } from './parse-filename.js';
import { generalIdFor } from './ids.js';
import { DUAL_FACTION, UUID_FILE_MAP, EUNUCH_ORDER } from './manual-mappings.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = resolve(process.env.HOME!, 'qlhd-src/c国战 - Copy');
const PACK = '群狼环鼎';
const EUNUCH_PARENT = 'general_qlhd_qun_000';

/** 十常侍目录里这三张是标记牌，不是武将卡。 */
const NON_GENERAL_IN_EUNUCH_DIR = new Set([
  '休整.png', '休整背面.png', '十常侍背面.png',
]);

type Out = {
  id: string; name: string; title: string; faction: string;
  subfaction?: string; hp: number; maxHp: number; gender: string;
  skills: string[]; image: string; pack: string;
  isAmbitionist?: boolean; parentGeneralId?: string;
};

/**
 * AM（野心家）卡的真实势力取自所在素材目录 —— 卡面徽记也印证：
 * AM001 司马昭在「魏」、AM003 孙綝在「吴」、AM004 公孙渊在「群」。
 * 文件名里的 AM 只表示卡类，不是势力。
 */
const DIR_TO_FACTION: Record<string, string> = {
  魏: 'WEI', 蜀: 'SHU', 吴: 'WU', 群: 'QUN',
};

/**
 * AM 卡的势力只能来自 DIR_TO_FACTION，**不设兜底默认值**。
 *
 * `collect()` 还会遍历 双势力/ 与 十常侍/ 两个目录，它们不在 DIR_TO_FACTION 里。
 * 若哪天有 AM 卡出现在那里，静默退回 'QUN' 正是本任务要防的「一律记 QUN」失败模式，
 * 而且不会有任何断言发现。宁可让脚本炸掉，也不要写出一条势力错误的数据。
 */
function amFaction(dir: string): string {
  const f = DIR_TO_FACTION[dir];
  if (!f) {
    throw new Error(
      `AM 野心家卡出现在未映射的素材目录「${dir}」，无法判定势力。` +
      `请把该目录加入 DIR_TO_FACTION，或确认这张卡是否放错了位置。`,
    );
  }
  return f;
}

function collect(): { parsed: ParsedCard; file: string; dir: string }[] {
  const out: { parsed: ParsedCard; file: string; dir: string }[] = [];
  for (const dir of ['魏', '蜀', '吴', '群', '双势力', '十常侍']) {
    for (const file of readdirSync(resolve(SRC, dir))) {
      if (NON_GENERAL_IN_EUNUCH_DIR.has(file)) continue;
      const override = UUID_FILE_MAP[file];
      if (override) {
        out.push({ parsed: { ...override }, file, dir });
        continue;
      }
      const parsed = parseCardFilename(file);
      if (!parsed) throw new Error(`无法解析武将卡文件名: ${dir}/${file}`);
      out.push({ parsed, file, dir });
    }
  }
  return out;
}

function main() {
  const cards = collect();

  // 同 (势力, 卡号) 出现多次时按文件名排序后依次给 _b / _c
  const dupCount = new Map<string, number>();
  const sorted = [...cards].sort((a, b) => a.file.localeCompare(b.file, 'zh-CN'));

  const generals: Out[] = [];
  let eunuchSeq = 0;
  let xxxSeq = 0;

  for (const { parsed, file, dir } of sorted) {
    const key = `${parsed.faction}${parsed.cardNo}`;

    let id: string;
    let parentGeneralId: string | undefined;
    if (parsed.cardNo === 'XXX') {
      if (EUNUCH_ORDER.includes(parsed.name)) {
        // 8 名无卡号的十常侍成员 -> m01…m08
        eunuchSeq += 1;
        id = `${EUNUCH_PARENT}_m${String(eunuchSeq).padStart(2, '0')}`;
        parentGeneralId = EUNUCH_PARENT;
      } else {
        // 非十常侍的 XXX 卡号（目前只有魏讽）。**不要把中文姓名拼进 id** ——
        // validators.ts 的 GENERAL_ID_RE 是 /^general_[a-zA-Z0-9_]+$/，
        // 非 ASCII id 会让 /session 保存整桌牌局时 422。
        xxxSeq += 1;
        id = `general_qlhd_${parsed.faction.toLowerCase()}_xxx_${String(xxxSeq).padStart(2, '0')}`;
      }
    } else {
      const n = dupCount.get(key) ?? 0;
      dupCount.set(key, n + 1);
      // generalIdFor 产出不带版本前缀的 id（旧包沿用的格式）；这里补上 qlhd_ 段
      // 以区分两版共存的数据，同时仍以 general_ 开头，满足 validators.ts 的 GENERAL_ID_RE。
      id = generalIdFor(parsed.faction, parsed.cardNo, n).replace(/^general_/, 'general_qlhd_');
    }

    // 有卡号的十常侍成员（张让 QUN038 / 赵忠 QUN118）也要挂到父卡
    if (parsed.cardNo !== 'XXX' && EUNUCH_ORDER.includes(parsed.name)) {
      parentGeneralId = EUNUCH_PARENT;
    }

    const g: Out = {
      id,
      name: parsed.name,
      title: parsed.title,
      faction: parsed.faction === 'AM' ? amFaction(dir) : parsed.faction,
      hp: 4,
      maxHp: 4,
      gender: 'male',
      skills: [],
      image: `generals/${file.replace(/\.(png|jpg)$/i, '.webp')}`,
      pack: PACK,
    };

    const sub = parsed.subfaction ?? DUAL_FACTION[key];
    if (sub) g.subfaction = sub;
    if (parsed.faction === 'AM') g.isAmbitionist = true;
    if (parentGeneralId) g.parentGeneralId = parentGeneralId;

    generals.push(g);
  }

  // —— 断言 ——
  const ids = generals.map((g) => g.id);
  const dups = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dups.length) throw new Error(`重复 ID: ${[...new Set(dups)].join(', ')}`);
  if (generals.length !== 395) {
    throw new Error(`条目数 ${generals.length}，预期 395`);
  }
  for (const g of generals) {
    const p = resolve(REPO_ROOT, 'assets', g.image);
    if (!existsSync(p)) throw new Error(`图片不存在: ${g.image} (${g.id} ${g.name})`);
  }

  const dest = resolve(REPO_ROOT, 'packages/data/src/qlhd-generals.json');
  writeFileSync(dest, JSON.stringify(generals, null, 2) + '\n', 'utf8');
  console.log(`写入 ${generals.length} 条 -> ${dest}`);
  console.log(`  野心家 ${generals.filter((g) => g.isAmbitionist).length}`);
  console.log(`  双势力 ${generals.filter((g) => g.subfaction).length}`);
  console.log(`  十常侍成员 ${generals.filter((g) => g.parentGeneralId).length}`);
}

main();
