/**
 * WU faction skills — generals WU001 through WU027.
 *
 * Re-exports every individual skill and provides a convenience array
 * (`wuSkills`) for bulk registration with a SkillRegistry.
 */
import type { SkillPlugin } from '../types.js';

// WU001 孙权
export { zhiheng } from './wu001-zhiheng.js';
// WU002 甘宁
export { qixi } from './wu002-qixi.js';
// WU003 吕蒙
export { keji } from './wu003-keji.js';
// WU004 黄盖
export { kurou } from './wu004-kurou.js';
// WU005 周瑜
export { yingzi } from './wu005-yingzi.js';
export { fanjian } from './wu005-fanjian.js';
// WU006 大乔
export { guose } from './wu006-guose.js';
export { liuli } from './wu006-liuli.js';
// WU007 陆逊
export { qianxun } from './wu007-qianxun.js';
export { lianying } from './wu007-lianying.js';
// WU008 孙尚香
export { jieyin } from './wu008-jieyin.js';
export { xiaoji } from './wu008-xiaoji.js';
// WU009 张昭&张纮
export { zhijian, guzheng } from './wu009-zhangzhao-zhangong.js';
// WU010 太史慈
export { tianyi } from './wu010-taishi-ci.js';
// WU011 周泰
export { buqu } from './wu011-zhou-tai.js';
// WU012 鲁肃
export { haoshi, dimeng } from './wu012-lu-su.js';
// WU013 孙坚
export { yinghun } from './wu013-sun-jian.js';
// WU014 小乔
export { tianxiang, hongyan } from './wu014-xiao-qiao.js';
// WU015 二张 (alt)
export { zhijianAlt } from './wu015-erzhang.js';
// WU016 丁奉
export { duanbing, fenxun } from './wu016-ding-feng.js';
// WU017 韩当
export { gongqi, jiefan } from './wu017-han-dang.js';
// WU018 朱然
export { danshou } from './wu018-zhu-ran.js';
// WU019 徐盛
export { pojun } from './wu019-xu-sheng.js';
// WU020 步练师
export { anxu, zhuiyi } from './wu020-bu-lianshi.js';
// WU021 程普
export { lihuo, chunlao } from './wu021-cheng-pu.js';
// WU022 潘璋&马忠
export { anjian, shuangren } from './wu022-pan-zhang-ma-zhong.js';
// WU023 孙鲁班
export { chanhui, jiaojin } from './wu023-sun-luban.js';
// WU024 孙鲁育
export { mirong, mixin } from './wu024-sun-luyu.js';
// WU025 朱治
export { qiaobian } from './wu025-zhu-zhi.js';
// WU026 顾雍
export { shenxing, bingyi } from './wu026-gu-yong.js';
// WU027 朱桓
export { fenwei } from './wu027-zhu-huan.js';

// — Imports for the aggregate array —
import { zhiheng } from './wu001-zhiheng.js';
import { qixi } from './wu002-qixi.js';
import { keji } from './wu003-keji.js';
import { kurou } from './wu004-kurou.js';
import { yingzi } from './wu005-yingzi.js';
import { fanjian } from './wu005-fanjian.js';
import { guose } from './wu006-guose.js';
import { liuli } from './wu006-liuli.js';
import { qianxun } from './wu007-qianxun.js';
import { lianying } from './wu007-lianying.js';
import { jieyin } from './wu008-jieyin.js';
import { xiaoji } from './wu008-xiaoji.js';
import { zhijian, guzheng } from './wu009-zhangzhao-zhangong.js';
import { tianyi } from './wu010-taishi-ci.js';
import { buqu } from './wu011-zhou-tai.js';
import { haoshi, dimeng } from './wu012-lu-su.js';
import { yinghun } from './wu013-sun-jian.js';
import { tianxiang, hongyan } from './wu014-xiao-qiao.js';
import { zhijianAlt } from './wu015-erzhang.js';
import { duanbing, fenxun } from './wu016-ding-feng.js';
import { gongqi, jiefan } from './wu017-han-dang.js';
import { danshou } from './wu018-zhu-ran.js';
import { pojun } from './wu019-xu-sheng.js';
import { anxu, zhuiyi } from './wu020-bu-lianshi.js';
import { lihuo, chunlao } from './wu021-cheng-pu.js';
import { anjian, shuangren } from './wu022-pan-zhang-ma-zhong.js';
import { chanhui, jiaojin } from './wu023-sun-luban.js';
import { mirong, mixin } from './wu024-sun-luyu.js';
import { qiaobian } from './wu025-zhu-zhi.js';
import { shenxing, bingyi } from './wu026-gu-yong.js';
import { fenwei } from './wu027-zhu-huan.js';

/** All WU faction skills in registration order. */
export const wuSkills: readonly SkillPlugin[] = [
  // WU001 孙权
  zhiheng,
  // WU002 甘宁
  qixi,
  // WU003 吕蒙
  keji,
  // WU004 黄盖
  kurou,
  // WU005 周瑜
  yingzi,
  fanjian,
  // WU006 大乔
  guose,
  liuli,
  // WU007 陆逊
  qianxun,
  lianying,
  // WU008 孙尚香
  jieyin,
  xiaoji,
  // WU009 张昭&张纮
  zhijian,
  guzheng,
  // WU010 太史慈
  tianyi,
  // WU011 周泰
  buqu,
  // WU012 鲁肃
  haoshi,
  dimeng,
  // WU013 孙坚
  yinghun,
  // WU014 小乔
  tianxiang,
  hongyan,
  // WU015 二张
  zhijianAlt,
  // WU016 丁奉
  duanbing,
  fenxun,
  // WU017 韩当
  gongqi,
  jiefan,
  // WU018 朱然
  danshou,
  // WU019 徐盛
  pojun,
  // WU020 步练师
  anxu,
  zhuiyi,
  // WU021 程普
  lihuo,
  chunlao,
  // WU022 潘璋&马忠
  anjian,
  shuangren,
  // WU023 孙鲁班
  chanhui,
  jiaojin,
  // WU024 孙鲁育
  mirong,
  mixin,
  // WU025 朱治
  qiaobian,
  // WU026 顾雍
  shenxing,
  bingyi,
  // WU027 朱桓
  fenwei,
];
