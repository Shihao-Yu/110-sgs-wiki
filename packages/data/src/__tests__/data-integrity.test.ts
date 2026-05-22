import { describe, it, expect } from 'vitest';
import generalsData from '../generals.json';
import skillsData from '../skills.json';
import qsgsGeneralsData from '../qsgs-generals.json';

interface General {
  id: string;
  name: string;
  faction: string;
  skills: string[];
  [key: string]: unknown;
}

interface Skill {
  id: string;
  name: string;
  [key: string]: unknown;
}

const generals = generalsData as General[];
const skills = skillsData as Skill[];
const qsgsGenerals = qsgsGeneralsData as Array<{
  id: string;
  name: string;
  title: string;
}>;

function normalizeName(name: string) {
  return name.replace(/&/g, '');
}

const qsgsKeySet = new Set(
  qsgsGenerals.map((g) => `${normalizeName(g.name)}::${g.title}`),
);

describe('generals.json', () => {
  it('has 341 entries', () => {
    expect(generals).toHaveLength(341);
  });

  it('every general has id, name, and faction', () => {
    for (const g of generals) {
      expect(g.id, `general missing id: ${JSON.stringify(g)}`).toBeTruthy();
      expect(g.name, `general missing name: ${g.id}`).toBeTruthy();
      expect(g.faction, `general missing faction: ${g.id}`).toBeTruthy();
    }
  });

  it('has no duplicate IDs', () => {
    const ids = generals.map((g) => g.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('every general has at least one skill', () => {
    for (const g of generals) {
      expect(
        g.skills.length,
        `general ${g.id} (${g.name}) has no skills`,
      ).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('skills.json', () => {
  it('has no duplicate IDs', () => {
    const ids = skills.map((s) => s.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate skill IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });
});

describe('referential integrity', () => {
  it('all skills referenced by generals exist in skills.json', () => {
    const skillIds = new Set(skills.map((s) => s.id));
    const missing: string[] = [];
    for (const g of generals) {
      for (const sid of g.skills) {
        if (!skillIds.has(sid)) {
          missing.push(`${g.id} -> ${sid}`);
        }
      }
    }
    expect(missing, `orphan skill references:\n${missing.join('\n')}`).toHaveLength(0);
  });

  it('only merges skill data when the card title matches the QSanguosha source', () => {
    const offenders = generals
      .filter((g) => !g.skills.every((sid) => sid.startsWith('skill_unknown_')))
      .filter((g) => !qsgsKeySet.has(`${normalizeName(g.name)}::${String(g.title)}`))
      .map((g) => `${g.id} (${g.name} / ${String(g.title)})`);

    expect(
      offenders,
      `generals merged with non-placeholder skills despite title mismatch:\n${offenders.join('\n')}`,
    ).toHaveLength(0);
  });
});
