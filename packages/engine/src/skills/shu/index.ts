/**
 * SHU faction skill index — generals SHU001 through SHU008.
 *
 * Re-exports every skill plugin and provides a convenience array
 * for bulk registration with SkillRegistry.
 */

export { rende } from './shu001-rende.js';
export { wusheng } from './shu002-wusheng.js';
export { paoxiao } from './shu003-paoxiao.js';
export { guanxing } from './shu004-guanxing.js';
export { kongcheng } from './shu004-kongcheng.js';
export { longdan } from './shu005-longdan.js';
export { mashu } from './shu006-mashu.js';
export { tieqi } from './shu006-tieqi.js';
export { liegong } from './shu007-liegong.js';
export { kuanggu } from './shu008-kuanggu.js';

import type { SkillPlugin } from '../types.js';
import { rende } from './shu001-rende.js';
import { wusheng } from './shu002-wusheng.js';
import { paoxiao } from './shu003-paoxiao.js';
import { guanxing } from './shu004-guanxing.js';
import { kongcheng } from './shu004-kongcheng.js';
import { longdan } from './shu005-longdan.js';
import { mashu } from './shu006-mashu.js';
import { tieqi } from './shu006-tieqi.js';
import { liegong } from './shu007-liegong.js';
import { kuanggu } from './shu008-kuanggu.js';

/** All SHU faction skills for bulk registration. */
export const shuSkills: SkillPlugin[] = [
  rende,
  wusheng,
  paoxiao,
  guanxing,
  kongcheng,
  longdan,
  mashu,
  tieqi,
  liegong,
  kuanggu,
];
