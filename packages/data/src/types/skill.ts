import type { FAQ } from './faq.js';
import type { GeneralId } from './general.js';

export type SkillId = string & { readonly __brand: 'SkillId' };
export type SkillType =
  | 'active'
  | 'passive'
  | 'lock'
  | 'limited'
  | 'awakening'
  | 'mission';

export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  type: SkillType;
  timing: string[];
  generalIds: GeneralId[];
  faq: FAQ[];
  tags?: string[];
}
