import type { Faction } from './faction.js';
import type { SkillId } from './skill.js';

export type GeneralId = string & { readonly __brand: 'GeneralId' };
export type Gender = 'male' | 'female';

export interface General {
  id: GeneralId;
  name: string;
  title: string;
  faction: Faction;
  subfaction?: Faction;
  hp: number;
  maxHp: number;
  gender: Gender;
  skills: SkillId[];
  image: string;
  paired?: boolean;
  pairedNames?: string[];
  isEmperor?: boolean;
  designer?: string;
  pack: string;
  perfectMatchPartners?: GeneralId[];
}
