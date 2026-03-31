/**
 * Merge parsed asset metadata with QSanguosha skill data into
 * final generals.json and skills.json.
 *
 * Input:
 *   packages/data/src/parsed-generals.json  (341 entries from filenames)
 *   packages/data/src/qsgs-generals.json    (63 entries with skill data)
 *   packages/data/src/qsgs-skills.json      (107 skills)
 *
 * Output:
 *   packages/data/src/generals.json
 *   packages/data/src/skills.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'packages', 'data', 'src');

interface ParsedGeneral {
  filename: string;
  faction: string;
  subfaction?: string;
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

interface QsgsGeneral {
  id: string;
  name: string;
  title: string;
  faction: string;
  hp: number;
  maxHp: number;
  gender: 'male' | 'female';
  skills: string[];
  image: string;
  pack: string;
  isEmperor?: boolean;
}

interface QsgsSkill {
  id: string;
  name: string;
  description: string;
  type: string;
  timing: string[];
  generalIds: string[];
  faq: unknown[];
  tags?: string[];
}

// --- Load sources ---
const parsed: ParsedGeneral[] = JSON.parse(
  readFileSync(resolve(dataDir, 'parsed-generals.json'), 'utf-8'),
);
const qsgsGenerals: QsgsGeneral[] = JSON.parse(
  readFileSync(resolve(dataDir, 'qsgs-generals.json'), 'utf-8'),
);
const qsgsSkills: QsgsSkill[] = JSON.parse(
  readFileSync(resolve(dataDir, 'qsgs-skills.json'), 'utf-8'),
);

// --- Build lookup: name → QsgsGeneral ---
// QSGS paired names have no separator (e.g. "张昭张纮")
// Parsed paired names use "&" (e.g. "张昭&张纮")
// Normalize by stripping "&" for matching.
function normalizeName(name: string): string {
  return name.replace(/&/g, '');
}

const qsgsMap = new Map<string, QsgsGeneral>();
for (const g of qsgsGenerals) {
  qsgsMap.set(normalizeName(g.name), g);
}

// --- Pre-scan for duplicate names/numbers to generate unique IDs ---
// Count how many parsed entries match each QSGS general
const qsgsMatchCount = new Map<string, number>();
// Count how many parsed entries share faction+number
const factionNumCount = new Map<string, number>();
for (const p of parsed) {
  const normalizedName = normalizeName(p.name);
  if (qsgsMap.has(normalizedName)) {
    qsgsMatchCount.set(normalizedName, (qsgsMatchCount.get(normalizedName) ?? 0) + 1);
  }
  const fnKey = `${p.faction}_${p.number}`;
  factionNumCount.set(fnKey, (factionNumCount.get(fnKey) ?? 0) + 1);
}

// --- Merge ---
interface MergedGeneral {
  id: string;
  name: string;
  title: string;
  faction: string;
  subfaction?: string;
  hp: number;
  maxHp: number;
  gender: 'male' | 'female';
  skills: string[];
  image: string;
  paired?: boolean;
  pairedNames?: string[];
  isEmperor?: boolean;
  pack: string;
}

const mergedGenerals: MergedGeneral[] = [];
const unknownSkillIds = new Set<string>();
const referencedSkillIds = new Set<string>();
const usedIds = new Set<string>();

for (const p of parsed) {
  const normalizedName = normalizeName(p.name);
  const qsgs = qsgsMap.get(normalizedName);
  const fnKey = `${p.faction}_${p.number}`;

  let general: MergedGeneral;

  if (qsgs) {
    // Matched — merge QSanguosha data with parsed asset metadata
    // Disambiguate ID if multiple parsed entries match the same QSGS general
    let id = qsgs.id;
    if ((qsgsMatchCount.get(normalizedName) ?? 0) > 1) {
      id = `${qsgs.id}_${p.faction.toLowerCase()}${p.number}`;
    }

    general = {
      id,
      name: p.name,
      title: p.title, // use parsed title (asset-specific)
      faction: p.faction,
      ...(p.subfaction ? { subfaction: p.subfaction } : {}),
      hp: qsgs.hp,
      maxHp: qsgs.maxHp,
      gender: qsgs.gender,
      skills: qsgs.skills,
      image: p.imagePath,
      ...(p.paired ? { paired: true, pairedNames: p.pairedNames } : {}),
      ...(p.isEmperor || qsgs.isEmperor ? { isEmperor: true } : {}),
      pack: qsgs.pack,
    };
    for (const sid of qsgs.skills) referencedSkillIds.add(sid);
  } else {
    // Unmatched — keep filename metadata, set defaults
    const factionLower = p.faction.toLowerCase();
    // Disambiguate if multiple entries share faction+number
    let id: string;
    if ((factionNumCount.get(fnKey) ?? 0) > 1) {
      // Use a counter suffix to make unique
      let suffix = 1;
      do {
        id = `general_${factionLower}_${p.number}_${suffix}`;
        suffix++;
      } while (usedIds.has(id));
    } else {
      id = `general_${factionLower}_${p.number}`;
    }

    const hp = 4; // default HP for unknown generals
    const unknownSkillId = `skill_unknown_${id.replace('general_', '')}`;
    unknownSkillIds.add(unknownSkillId);

    general = {
      id,
      name: p.name,
      title: p.title,
      faction: p.faction,
      ...(p.subfaction ? { subfaction: p.subfaction } : {}),
      hp,
      maxHp: hp,
      gender: 'male', // default; corrected when data is available
      skills: [unknownSkillId],
      image: p.imagePath,
      ...(p.paired ? { paired: true, pairedNames: p.pairedNames } : {}),
      ...(p.isEmperor ? { isEmperor: true } : {}),
      pack: '国战',
    };
    referencedSkillIds.add(unknownSkillId);
  }

  usedIds.add(general.id);
  mergedGenerals.push(general);
}

// --- Build skills.json ---
// Start with all QSanguosha skills, then add unknown placeholders
interface MergedSkill {
  id: string;
  name: string;
  description: string;
  type: string;
  timing: string[];
  generalIds: string[];
  faq: unknown[];
  tags?: string[];
}

const mergedSkills: MergedSkill[] = [];

// Copy all QSGS skills, updating generalIds to reflect merged general IDs
for (const skill of qsgsSkills) {
  mergedSkills.push({ ...skill });
}

// Add placeholder skills for unmatched generals
for (const unknownId of unknownSkillIds) {
  const generalId = unknownId.replace('skill_unknown_', 'general_');
  mergedSkills.push({
    id: unknownId,
    name: '未知',
    description: '技能数据待补充。',
    type: 'passive',
    timing: [],
    generalIds: [generalId],
    faq: [],
  });
}

// --- Write output ---
writeFileSync(
  resolve(dataDir, 'generals.json'),
  JSON.stringify(mergedGenerals, null, 2) + '\n',
);
writeFileSync(
  resolve(dataDir, 'skills.json'),
  JSON.stringify(mergedSkills, null, 2) + '\n',
);

// --- Report ---
const matchedCount = parsed.filter(
  (p) => qsgsMap.has(normalizeName(p.name)),
).length;
console.log(`Merged ${mergedGenerals.length} generals:`);
console.log(`  ${matchedCount} matched with QSanguosha data`);
console.log(`  ${mergedGenerals.length - matchedCount} unmatched (defaults applied)`);
console.log(`Skills: ${mergedSkills.length} total (${qsgsSkills.length} from QSanguosha + ${unknownSkillIds.size} unknown placeholders)`);
console.log(`Output: generals.json, skills.json`);
