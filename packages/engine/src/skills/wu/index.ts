/**
 * WU faction skills — generals WU001 through WU079.
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
// WU028 吕范
export { diaodu } from './wu028-lu-fan.js';
// WU029 朱据
export { yiju } from './wu029-zhu-ju.js';
// WU030 虞翻
export { zongxuan, zhiyan } from './wu030-yu-fan.js';
// WU031 凌统
export { xuanfeng } from './wu031-ling-tong.js';
// WU032 全琮
export { cuiwei } from './wu032-quan-cong.js';
// WU033 陈武&董袭
export { fenming } from './wu033-chenwu-dongxi.js';
// WU034 蒋钦
export { shangyi } from './wu034-jiang-qin.js';
// WU035 周鲂
export { duanfa } from './wu035-zhou-fang.js';
// WU036 骆统
export { renshu } from './wu036-luo-tong.js';
// WU037 孙翊
export { hanyong } from './wu037-sun-yi.js';
// WU038 诸葛恪
export { aocai, minjie } from './wu038-zhuge-ke.js';
// WU039 步骘
export { jujian } from './wu039-bu-zhi.js';
// WU040 孙休
export { zhaofu, weidai } from './wu040-sun-xiu.js';
// WU041 贺齐
export { qizheng } from './wu041-he-qi.js';
// WU042 孙皓
export { miewu, canbao } from './wu042-sun-hao.js';
// WU043 孙亮
export { xiuming } from './wu043-sun-liang.js';
// WU044 韩综
export { xieshi } from './wu044-han-zong.js';
// WU045 吾粲
export { yiyan } from './wu045-wu-can.js';
// WU046 朱治 (alt)
export { qiaobianAlt } from './wu046-zhu-zhi-alt.js';
// WU047 孙策
export { jiang, hunshang } from './wu047-sun-ce.js';
// WU048 张昭
export { zhijianZhangzhao } from './wu048-zhang-zhao.js';
// WU049 程秉
export { shida } from './wu049-cheng-bing.js';
// WU050 孙登
export { kuangbi } from './wu050-sun-deng.js';
// WU051 潘濬
export { yishe } from './wu051-pan-jun.js';
// WU052 朱异
export { duanshu } from './wu052-zhu-yi.js';
// WU053 陆抗
export { zhenwei } from './wu053-lu-kang.js';
// WU054 徐夫人
export { diwei } from './wu054-lady-xu.js';
// WU055 朱然 (alt)
export { danshouAlt } from './wu055-zhu-ran-alt.js';
// WU056 孙峻
export { duofeng, shiqin } from './wu056-sun-jun.js';
// WU057 孙綝
export { miewuAlt } from './wu057-sun-chen.js';
// WU058 诸葛瑾
export { huanshi, hongyuan } from './wu058-zhuge-jin.js';
// WU059 徐盛 (alt)
export { pojunAlt } from './wu059-xu-sheng-alt.js';
// WU060 诸葛亮 (Wu ver.)
export { huogong } from './wu060-zhu-ge-liang-wu.js';
// WU061 凌操
export { xuanfengAlt } from './wu061-ling-cao.js';
// WU062 孙桓
export { jieyi } from './wu062-sun-huan.js';
// WU063 全怿
export { guizao } from './wu063-quan-yi.js';
// WU064 孙茹
export { miji } from './wu064-sun-ru.js';
// WU065 诸葛恪 (alt)
export { aocaiAlt } from './wu065-zhuge-ke-alt.js';
// WU066 吕岱
export { zhengu } from './wu066-lu-dai.js';
// WU067 蒋琬
export { chengye, junyi } from './wu067-jiang-wan.js';
// WU068 曹婴
export { lingce } from './wu068-cao-ying.js';
// WU069 谢景
export { zhili } from './wu069-xie-jing.js';
// WU070 留赞
export { fenming as fenmingAlt } from './wu070-liu-zan.js';
// WU071 裴秀
export { mingtu } from './wu071-pei-xiu.js';
// WU072 吴景
export { fenyong } from './wu072-wu-jing.js';
// WU073 孙翊 (alt)
export { hanyongAlt } from './wu073-sun-yi-alt.js';
// WU074 吴夫人
export { ganlu, buyi } from './wu074-lady-wu.js';
// WU075 程党
export { zhongfu } from './wu075-cheng-dang.js';
// WU076 孙邻
export { fayue } from './wu076-sun-lin.js';
// WU077 阚泽
export { chenci } from './wu077-kan-ze.js';
// WU078 徐质
export { xiaoxi } from './wu078-xu-zhi.js';
// WU079 朱桓 (alt)
export { fenweiAlt } from './wu079-zhu-huan-alt.js';

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
import { diaodu } from './wu028-lu-fan.js';
import { yiju } from './wu029-zhu-ju.js';
import { zongxuan, zhiyan } from './wu030-yu-fan.js';
import { xuanfeng } from './wu031-ling-tong.js';
import { cuiwei } from './wu032-quan-cong.js';
import { fenming } from './wu033-chenwu-dongxi.js';
import { shangyi } from './wu034-jiang-qin.js';
import { duanfa } from './wu035-zhou-fang.js';
import { renshu } from './wu036-luo-tong.js';
import { hanyong } from './wu037-sun-yi.js';
import { aocai, minjie } from './wu038-zhuge-ke.js';
import { jujian } from './wu039-bu-zhi.js';
import { zhaofu, weidai } from './wu040-sun-xiu.js';
import { qizheng } from './wu041-he-qi.js';
import { miewu, canbao } from './wu042-sun-hao.js';
import { xiuming } from './wu043-sun-liang.js';
import { xieshi } from './wu044-han-zong.js';
import { yiyan } from './wu045-wu-can.js';
import { qiaobianAlt } from './wu046-zhu-zhi-alt.js';
import { jiang, hunshang } from './wu047-sun-ce.js';
import { zhijianZhangzhao } from './wu048-zhang-zhao.js';
import { shida } from './wu049-cheng-bing.js';
import { kuangbi } from './wu050-sun-deng.js';
import { yishe } from './wu051-pan-jun.js';
import { duanshu } from './wu052-zhu-yi.js';
import { zhenwei } from './wu053-lu-kang.js';
import { diwei } from './wu054-lady-xu.js';
import { danshouAlt } from './wu055-zhu-ran-alt.js';
import { duofeng, shiqin } from './wu056-sun-jun.js';
import { miewuAlt } from './wu057-sun-chen.js';
import { huanshi, hongyuan } from './wu058-zhuge-jin.js';
import { pojunAlt } from './wu059-xu-sheng-alt.js';
import { huogong } from './wu060-zhu-ge-liang-wu.js';
import { xuanfengAlt } from './wu061-ling-cao.js';
import { jieyi } from './wu062-sun-huan.js';
import { guizao } from './wu063-quan-yi.js';
import { miji } from './wu064-sun-ru.js';
import { aocaiAlt } from './wu065-zhuge-ke-alt.js';
import { zhengu } from './wu066-lu-dai.js';
import { chengye, junyi } from './wu067-jiang-wan.js';
import { lingce } from './wu068-cao-ying.js';
import { zhili } from './wu069-xie-jing.js';
import { fenming as fenmingAlt } from './wu070-liu-zan.js';
import { mingtu } from './wu071-pei-xiu.js';
import { fenyong } from './wu072-wu-jing.js';
import { hanyongAlt } from './wu073-sun-yi-alt.js';
import { ganlu, buyi } from './wu074-lady-wu.js';
import { zhongfu } from './wu075-cheng-dang.js';
import { fayue } from './wu076-sun-lin.js';
import { chenci } from './wu077-kan-ze.js';
import { xiaoxi } from './wu078-xu-zhi.js';
import { fenweiAlt } from './wu079-zhu-huan-alt.js';

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
  // WU028 吕范
  diaodu,
  // WU029 朱据
  yiju,
  // WU030 虞翻
  zongxuan,
  zhiyan,
  // WU031 凌统
  xuanfeng,
  // WU032 全琮
  cuiwei,
  // WU033 陈武&董袭
  fenming,
  // WU034 蒋钦
  shangyi,
  // WU035 周鲂
  duanfa,
  // WU036 骆统
  renshu,
  // WU037 孙翊
  hanyong,
  // WU038 诸葛恪
  aocai,
  minjie,
  // WU039 步骘
  jujian,
  // WU040 孙休
  zhaofu,
  weidai,
  // WU041 贺齐
  qizheng,
  // WU042 孙皓
  miewu,
  canbao,
  // WU043 孙亮
  xiuming,
  // WU044 韩综
  xieshi,
  // WU045 吾粲
  yiyan,
  // WU046 朱治 (alt)
  qiaobianAlt,
  // WU047 孙策
  jiang,
  hunshang,
  // WU048 张昭
  zhijianZhangzhao,
  // WU049 程秉
  shida,
  // WU050 孙登
  kuangbi,
  // WU051 潘濬
  yishe,
  // WU052 朱异
  duanshu,
  // WU053 陆抗
  zhenwei,
  // WU054 徐夫人
  diwei,
  // WU055 朱然 (alt)
  danshouAlt,
  // WU056 孙峻
  duofeng,
  shiqin,
  // WU057 孙綝
  miewuAlt,
  // WU058 诸葛瑾
  huanshi,
  hongyuan,
  // WU059 徐盛 (alt)
  pojunAlt,
  // WU060 诸葛亮 (Wu ver.)
  huogong,
  // WU061 凌操
  xuanfengAlt,
  // WU062 孙桓
  jieyi,
  // WU063 全怿
  guizao,
  // WU064 孙茹
  miji,
  // WU065 诸葛恪 (alt)
  aocaiAlt,
  // WU066 吕岱
  zhengu,
  // WU067 蒋琬
  chengye,
  junyi,
  // WU068 曹婴
  lingce,
  // WU069 谢景
  zhili,
  // WU070 留赞
  fenmingAlt,
  // WU071 裴秀
  mingtu,
  // WU072 吴景
  fenyong,
  // WU073 孙翊 (alt)
  hanyongAlt,
  // WU074 吴夫人
  ganlu,
  buyi,
  // WU075 程党
  zhongfu,
  // WU076 孙邻
  fayue,
  // WU077 阚泽
  chenci,
  // WU078 徐质
  xiaoxi,
  // WU079 朱桓 (alt)
  fenweiAlt,
];
