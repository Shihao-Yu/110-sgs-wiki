#!/usr/bin/env tsx
/**
 * extract-qsgs.ts
 *
 * Transforms QSanguosha seed data into structured JSON files that conform
 * to the @sgs/data type definitions (General and Skill interfaces).
 *
 * Usage:  pnpm tsx scripts/extract-qsgs.ts
 * Output: packages/data/src/qsgs-generals.json
 *         packages/data/src/qsgs-skills.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { seedGenerals } from './qsgs-seed-data.js';
import type { SeedGeneral, SeedSkill } from './qsgs-seed-data.js';

// ── Output paths ───────────────────────────────────────────────────────

const OUT_DIR = resolve(process.cwd(), 'packages', 'data', 'src');
const GENERALS_PATH = resolve(OUT_DIR, 'qsgs-generals.json');
const SKILLS_PATH = resolve(OUT_DIR, 'qsgs-skills.json');

// ── Mapped types matching @sgs/data interfaces ─────────────────────────

interface OutputSkill {
  id: string;
  name: string;
  description: string;
  type: string;
  timing: string[];
  generalIds: string[];
  faq: never[];
  tags?: string[];
}

interface OutputGeneral {
  id: string;
  name: string;
  title: string;
  faction: string;
  hp: number;
  maxHp: number;
  gender: string;
  skills: string[];
  image: string;
  pack: string;
  isEmperor?: boolean;
}

// ── Transform logic ────────────────────────────────────────────────────

function buildSkillId(generalKey: string, skillKey: string): string {
  return `skill_${skillKey}`;
}

function buildGeneralId(key: string): string {
  return `general_${key}`;
}

function extractAll(generals: SeedGeneral[]) {
  const skillMap = new Map<string, OutputSkill>();
  const outputGenerals: OutputGeneral[] = [];

  for (const g of generals) {
    const generalId = buildGeneralId(g.key);
    const skillIds: string[] = [];

    for (const s of g.skills) {
      const skillId = buildSkillId(g.key, s.key);
      skillIds.push(skillId);

      const existing = skillMap.get(skillId);
      if (existing) {
        if (!existing.generalIds.includes(generalId)) {
          existing.generalIds.push(generalId);
        }
      } else {
        skillMap.set(skillId, {
          id: skillId,
          name: s.name,
          description: s.description,
          type: s.type,
          timing: s.timing,
          generalIds: [generalId],
          faq: [],
        });
      }
    }

    outputGenerals.push({
      id: generalId,
      name: g.name,
      title: g.title,
      faction: g.faction,
      hp: g.hp,
      maxHp: g.maxHp,
      gender: g.gender,
      skills: skillIds,
      image: `generals/${g.key}.webp`,
      pack: g.pack,
      ...(g.isEmperor ? { isEmperor: true } : {}),
    });
  }

  return {
    generals: outputGenerals,
    skills: Array.from(skillMap.values()),
  };
}

// ── Main ───────────────────────────────────────────────────────────────

function main() {
  const { generals, skills } = extractAll(seedGenerals);

  mkdirSync(dirname(GENERALS_PATH), { recursive: true });

  writeFileSync(GENERALS_PATH, JSON.stringify(generals, null, 2) + '\n', 'utf-8');
  writeFileSync(SKILLS_PATH, JSON.stringify(skills, null, 2) + '\n', 'utf-8');

  // Stats
  const factions = new Map<string, number>();
  for (const g of generals) {
    factions.set(g.faction, (factions.get(g.faction) ?? 0) + 1);
  }

  console.log('✓ QSanguosha data extraction complete');
  console.log(`  Generals: ${generals.length}`);
  console.log(`  Skills:   ${skills.length}`);
  console.log('  By faction:');
  for (const [f, count] of [...factions.entries()].sort()) {
    console.log(`    ${f}: ${count}`);
  }
  console.log(`  Output:`);
  console.log(`    ${GENERALS_PATH}`);
  console.log(`    ${SKILLS_PATH}`);
}

main();
