import type { CardId } from './card.js';
import type { GeneralId } from './general.js';
import type { SkillId } from './skill.js';

export type FAQId = string & { readonly __brand: 'FAQId' };
export type FAQCategory = 'general' | 'skill' | 'card' | 'rule';

export interface FAQ {
  id: FAQId;
  question: string;
  answer: string;
  category: FAQCategory;
  relatedGeneralIds?: GeneralId[];
  relatedSkillIds?: SkillId[];
  relatedCardIds?: CardId[];
}
