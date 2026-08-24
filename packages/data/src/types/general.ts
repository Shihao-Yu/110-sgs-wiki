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

/**
 * 武将所属的版本包。国战（旧包）与群狼环鼎（新包）现已合并共存于同一份
 * generals.json，靠 id 前缀区分——群狼环鼎全部以 `general_qlhd_` 开头，
 * 国战没有该前缀。所有需要区分两版的地方都应调用 getGeneralPackVersion，
 * 不要在各处自行比较 id 前缀字符串，否则将来并入第三个包时容易漏改。
 */
export type GeneralPackVersion = 'qlhd' | 'guozhan';

const QLHD_ID_PREFIX = 'general_qlhd_';

export function getGeneralPackVersion(id: string): GeneralPackVersion {
  return id.startsWith(QLHD_ID_PREFIX) ? 'qlhd' : 'guozhan';
}

export const GENERAL_PACK_VERSION_LABEL: Record<GeneralPackVersion, string> = {
  qlhd: '群狼环鼎',
  guozhan: '国战',
};
