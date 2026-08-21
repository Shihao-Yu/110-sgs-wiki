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
  /** 野心家卡（AM001 司马昭 / AM003 孙綝 / AM004 公孙渊）。 */
  isAmbitionist?: boolean;
  /** 十常侍 10 名子卡指向父卡 general_qun_000。 */
  parentGeneralId?: GeneralId;
  perfectMatchPartners?: GeneralId[];
}
