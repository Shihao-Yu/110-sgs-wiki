/**
 * QUN faction skill registry — generals 001 through 030.
 *
 * Registers all QUN skills with the central SkillRegistry.
 */

import type { SkillRegistry } from '../skill-registry.js';
import type { SkillPlugin } from '../types.js';

// QUN001 华佗
export { jijiu, qingnang } from './qun001-huatuo.js';
// QUN002 吕布
export { wushuang } from './qun002-lvbu.js';
// QUN003 貂蝉
export { lijian, biyue } from './qun003-diaochan.js';
// QUN004 袁绍
export { luanji } from './qun004-yuanshao.js';
// QUN005 颜良&文丑
export { shuangxiong } from './qun005-yanliang-wenchou.js';
// QUN006 董卓
export { jiuchi, roulin, benghuai } from './qun006-dongzhuo.js';
// QUN007 贾诩
export { weimu, wansha } from './qun007-jiaxu.js';
// QUN008 庞德
export { mashuPangde, mengjin } from './qun008-pangde.js';
// QUN009 张角
export { leiji, guidao, huangtian } from './qun009-zhangjiao.js';
// QUN010 于吉
export { guhuo } from './qun010-yuzhenzi.js';
// QUN011 庞统
export { lianhuan, niepan } from './qun011-pangtonq.js';
// QUN012 诸葛亮(卧龙)
export { huoji, kanpo, bazhen } from './qun012-zhugeliang.js';
// QUN013 马腾
export { mashuMateng } from './qun013-mateng.js';
// QUN014 贾诩(SP)
export { luanwu } from './qun014-jiaxu-sp.js';
// QUN015 左慈
export { huashen, xinsheng } from './qun015-zuoci.js';
// QUN016 蔡文姬
export { beige, duanchang } from './qun016-caiwenji.js';
// QUN017 孟获
export { huoshou, zaiqi } from './qun017-menghuo.js';
// QUN018 祝融
export { lieren, juxiang } from './qun018-zhurong.js';

// — Imports for the aggregate array —

import { qun001Skills } from './qun001-huatuo.js';
import { qun002Skills } from './qun002-lvbu.js';
import { qun003Skills } from './qun003-diaochan.js';
import { qun004Skills } from './qun004-yuanshao.js';
import { qun005Skills } from './qun005-yanliang-wenchou.js';
import { qun006Skills } from './qun006-dongzhuo.js';
import { qun007Skills } from './qun007-jiaxu.js';
import { qun008Skills } from './qun008-pangde.js';
import { qun009Skills } from './qun009-zhangjiao.js';
import { qun010Skills } from './qun010-yuzhenzi.js';
import { qun011Skills } from './qun011-pangtonq.js';
import { qun012Skills } from './qun012-zhugeliang.js';
import { qun013Skills } from './qun013-mateng.js';
import { qun014Skills } from './qun014-jiaxu-sp.js';
import { qun015Skills } from './qun015-zuoci.js';
import { qun016Skills } from './qun016-caiwenji.js';
import { qun017Skills } from './qun017-menghuo.js';
import { qun018Skills } from './qun018-zhurong.js';
import { qun019Skills } from './qun019-luxun-sp.js';
import { qun020Skills } from './qun020-tian-feng.js';
import { qun021Skills } from './qun021-pangde-sp.js';
import { qun022Skills } from './qun022-yanwen-sp.js';
import { qun023Skills } from './qun023-niujin.js';
import { qun024Skills } from './qun024-chunyuqiong.js';
import { qun025Skills } from './qun025-jiling.js';
import { qun026Skills } from './qun026-gongsunzan.js';
import { qun027Skills } from './qun027-liuxie.js';
import { qun028Skills } from './qun028-fuwan.js';
import { qun029Skills } from './qun029-huaxiong.js';
import { qun030Skills } from './qun030-lijue.js';

/** All QUN skill plugins in general order. */
export const qunSkills: readonly SkillPlugin[] = [
  // QUN001 华佗
  ...qun001Skills,
  // QUN002 吕布
  ...qun002Skills,
  // QUN003 貂蝉
  ...qun003Skills,
  // QUN004 袁绍
  ...qun004Skills,
  // QUN005 颜良&文丑
  ...qun005Skills,
  // QUN006 董卓
  ...qun006Skills,
  // QUN007 贾诩
  ...qun007Skills,
  // QUN008 庞德
  ...qun008Skills,
  // QUN009 张角
  ...qun009Skills,
  // QUN010 于吉
  ...qun010Skills,
  // QUN011 庞统
  ...qun011Skills,
  // QUN012 诸葛亮(卧龙)
  ...qun012Skills,
  // QUN013 马腾
  ...qun013Skills,
  // QUN014 贾诩(SP)
  ...qun014Skills,
  // QUN015 左慈
  ...qun015Skills,
  // QUN016 蔡文姬
  ...qun016Skills,
  // QUN017 孟获
  ...qun017Skills,
  // QUN018 祝融
  ...qun018Skills,
  // QUN019 placeholder
  ...qun019Skills,
  // QUN020 田丰
  ...qun020Skills,
  // QUN021 placeholder
  ...qun021Skills,
  // QUN022 placeholder
  ...qun022Skills,
  // QUN023 placeholder
  ...qun023Skills,
  // QUN024 placeholder
  ...qun024Skills,
  // QUN025 placeholder
  ...qun025Skills,
  // QUN026 placeholder
  ...qun026Skills,
  // QUN027 placeholder
  ...qun027Skills,
  // QUN028 placeholder
  ...qun028Skills,
  // QUN029 placeholder
  ...qun029Skills,
  // QUN030 placeholder
  ...qun030Skills,
];

/** Register all QUN skills into a SkillRegistry instance. */
export function registerQunSkills(registry: SkillRegistry): void {
  for (const skill of qunSkills) {
    registry.register(skill);
  }
}
