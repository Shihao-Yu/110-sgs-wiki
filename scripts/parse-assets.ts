/**
 * ⚠️ 已作废：本脚本属于「群狼环鼎」替换之前的旧数据管线，请勿运行。
 *
 * 群狼环鼎替换（2026-08）之后，generals.json / skills.json 由
 * scripts/qlhd/build-generals.ts 与 build-tokens.ts 生成。
 * 运行本脚本会用旧数据覆写它们，静默回滚整批替换工作。
 */

import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

// Source directories
const SRC_GENERALS = '/mnt/c/Users/SY/Downloads/打印/打印/国战武将卡背/';
const SRC_EMPERORS = '/mnt/c/Users/SY/Downloads/打印/打印/君主/';
const SRC_EUNUCHS = '/mnt/c/Users/SY/Downloads/打印/打印/十常侍/';
const SRC_CARDS = '/mnt/c/Users/SY/Downloads/打印/打印/国战手牌卡背/';
const SRC_TOKENS = '/mnt/c/Users/SY/Downloads/打印/打印/标记牌/';

// Destination directories (relative to project root)
const ROOT = new URL('..', import.meta.url).pathname;
const DEST_GENERALS = join(ROOT, 'assets/generals');
const DEST_EMPERORS = join(ROOT, 'assets/generals/emperors');
const DEST_EUNUCHS = join(ROOT, 'assets/generals/eunuchs');
const DEST_CARDS = join(ROOT, 'assets/cards');
const DEST_TOKENS = join(ROOT, 'assets/tokens');
const OUTPUT_JSON = join(ROOT, 'packages/data/src/parsed-generals.json');

type Faction = 'WEI' | 'SHU' | 'WU' | 'QUN';

interface ParsedGeneral {
  filename: string;
  faction: Faction;
  subfaction?: Faction;
  factionRaw: string;
  number: string;
  title: string;
  name: string;
  paired: boolean;
  pairedNames?: string[];
  isEmperor: boolean;
  isSpecial: boolean;
  imagePath: string;
}

// Pattern: 国战UI.{factionBlock}.{title}.{name}.png
// factionBlock can be:
//   WEI001, SHU&WU071, QUN&SHU072, G.SHU091, EM001, WEl174 (typo)
function parseFilename(filename: string): ParsedGeneral | null {
  // Strip prefix and extension
  const stripped = filename.replace(/^国战UI\./, '').replace(/\.png$/, '');
  if (!stripped || stripped === filename) return null;

  let faction: Faction;
  let subfaction: Faction | undefined;
  let factionRaw: string;
  let number: string;
  let title: string;
  let name: string;
  let isEmperor = false;
  let isSpecial = false;

  // Split by dots
  const parts = stripped.split('.');

  // Handle G prefix: G.SHU091.title.name
  if (parts[0] === 'G') {
    isSpecial = true;
    parts.shift(); // remove 'G'
  }

  // Handle Emperor prefix: EM001.title.name
  if (parts[0].startsWith('EM')) {
    isEmperor = true;
    number = parts[0].slice(2);
    factionRaw = 'EM';
    // Determine faction from emperor name (hardcoded since there are only 4)
    title = parts[1] || '';
    name = parts[2] || '';
    faction = guessEmperorFaction(name);
    return {
      filename, faction, factionRaw, number, title, name,
      paired: false, isEmperor, isSpecial,
      imagePath: `generals/emperors/${filename}`,
    };
  }

  // Parse faction block: WEI001, QUN&SHU072, WEl174 (typo)
  const factionBlock = parts[0];

  // Fix WEl typo (lowercase L instead of I)
  const fixedBlock = factionBlock.replace(/^WEl/, 'WEI');

  // Match dual-faction: FACTION&FACTION2NUMBER
  const dualMatch = fixedBlock.match(/^([A-Z]{2,3})&([A-Z]{2,3})(\d{3})$/);
  if (dualMatch) {
    faction = dualMatch[1] as Faction;
    subfaction = dualMatch[2] as Faction;
    number = dualMatch[3];
    factionRaw = factionBlock;
  } else {
    // Match single faction: FACTION + NUMBER
    const singleMatch = fixedBlock.match(/^([A-Z]{2,3})(\d{2,3}[A-Z]?)$/);
    if (singleMatch) {
      faction = singleMatch[1] as Faction;
      number = singleMatch[2];
      factionRaw = factionBlock;
    } else {
      console.warn(`  [WARN] Cannot parse faction block: "${factionBlock}" in ${filename}`);
      return null;
    }
  }

  title = parts[1] || '';
  name = parts.slice(2).join('.'); // rejoin in case name has dots

  // Detect paired generals (name contains &)
  const paired = name.includes('&');
  const pairedNames = paired ? name.split('&') : undefined;

  const imagePath = isSpecial
    ? `generals/${filename}`
    : `generals/${filename}`;

  return {
    filename, faction, subfaction, factionRaw, number, title, name,
    paired, pairedNames, isEmperor, isSpecial,
    imagePath,
  };
}

function guessEmperorFaction(name: string): Faction {
  const map: Record<string, Faction> = {
    '刘备': 'SHU',
    '张角': 'QUN',
    '孙权': 'WU',
    '曹操': 'WEI',
  };
  return map[name] || 'QUN';
}

async function copyDir(src: string, dest: string, label: string): Promise<number> {
  await mkdir(dest, { recursive: true });
  const files = await readdir(src);
  let count = 0;
  for (const file of files) {
    await copyFile(join(src, file), join(dest, file));
    count++;
  }
  console.log(`  ${label}: copied ${count} files → ${dest}`);
  return count;
}

async function main() {
  console.log('=== SGS Asset Pipeline ===\n');

  // 1. Parse general card filenames
  console.log('1. Parsing general card filenames...');
  const files = await readdir(SRC_GENERALS);
  const parsed: ParsedGeneral[] = [];
  const errors: string[] = [];

  for (const file of files.sort()) {
    if (!file.endsWith('.png')) continue;
    const result = parseFilename(file);
    if (result) {
      parsed.push(result);
    } else {
      errors.push(file);
    }
  }

  console.log(`  Parsed: ${parsed.length} generals`);
  if (errors.length) {
    console.log(`  Errors: ${errors.length} files could not be parsed:`);
    errors.forEach(e => console.log(`    - ${e}`));
  }

  // 2. Report faction counts
  console.log('\n2. Faction breakdown:');
  const counts: Record<string, number> = {};
  for (const g of parsed) {
    counts[g.faction] = (counts[g.faction] || 0) + 1;
  }
  for (const [f, c] of Object.entries(counts).sort()) {
    console.log(`  ${f}: ${c}`);
  }

  // 3. Report special generals
  const dualFaction = parsed.filter(g => g.subfaction);
  const paired = parsed.filter(g => g.paired);
  const emperors = parsed.filter(g => g.isEmperor);
  const specials = parsed.filter(g => g.isSpecial);

  console.log(`\n3. Special categories:`);
  console.log(`  Dual-faction: ${dualFaction.length}`);
  dualFaction.forEach(g => console.log(`    - ${g.factionRaw}: ${g.name}`));
  console.log(`  Paired generals: ${paired.length}`);
  paired.forEach(g => console.log(`    - ${g.name} → [${g.pairedNames!.join(', ')}]`));
  console.log(`  Special (G prefix): ${specials.length}`);
  specials.forEach(g => console.log(`    - ${g.faction}${g.number}: ${g.name}`));

  // 4. Copy assets
  console.log('\n4. Copying assets...');
  await copyDir(SRC_GENERALS, DEST_GENERALS, 'Generals');
  await copyDir(SRC_EMPERORS, DEST_EMPERORS, 'Emperors');
  await copyDir(SRC_EUNUCHS, DEST_EUNUCHS, 'Eunuchs');
  await copyDir(SRC_CARDS, DEST_CARDS, 'Cards');
  await copyDir(SRC_TOKENS, DEST_TOKENS, 'Tokens');

  // 5. Write parsed JSON
  console.log('\n5. Writing parsed-generals.json...');
  await mkdir(join(ROOT, 'packages/data/src'), { recursive: true });
  await writeFile(OUTPUT_JSON, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log(`  Written ${parsed.length} entries → ${OUTPUT_JSON}`);

  console.log('\n=== Done ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
