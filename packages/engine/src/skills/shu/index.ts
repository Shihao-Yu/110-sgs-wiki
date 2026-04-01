/**
 * SHU faction skill registry — generals SHU001 through SHU093.
 *
 * Re-exports every skill plugin and provides a convenience array
 * for bulk registration with SkillRegistry.
 */

/* ------------------------------------------------------------------
 * SHU001–SHU008  (original individual exports preserved)
 * ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------
 * SHU009–SHU012  (key generals — fully implemented)
 * ------------------------------------------------------------------ */
export { jizhi, qicai, shu009Skills } from './shu009-huangyueying.js';
export { lianhuan, niepan, shu010Skills } from './shu010-pangtong.js';
export { tiaoxin, shu011Skills } from './shu011-jiangwei.js';
export { enyuanGratitude, enyuanGrudge, shu012Skills } from './shu012-fazheng.js';

/* ------------------------------------------------------------------
 * SHU013–SHU030  (batch 1 remainder — placeholders / partial)
 * ------------------------------------------------------------------ */
export { shu013Skills } from './shu013-masu.js';
export { shu014Skills } from './shu014-wuguotai.js';
export { shu015Skills } from './shu015-sunshangxiang.js';
export { shu016Skills } from './shu016-liushan.js';
export { shu017Skills } from './shu017-guanxingzhangbao.js';
export { shu018Skills } from './shu018-madai.js';
export { shu019Skills } from './shu019-zhugeliang-wolong.js';
export { shu020Skills } from './shu020-huangzhong-old.js';
export { shu021Skills } from './shu021-liaohua.js';
export { shu022Skills } from './shu022-guanyu-sp.js';
export { shu023Skills } from './shu023-zhangfei-sp.js';
export { shu024Skills } from './shu024-zhaoyun-sp.js';
export { shu025Skills } from './shu025-menghuo.js';
export { shu026Skills } from './shu026-zhurong.js';
export { shu027Skills } from './shu027-weiyan-sp.js';
export { shu028Skills } from './shu028-xumadam.js';
export { shu029Skills } from './shu029-yiji.js';
export { shu030Skills } from './shu030-mifuren.js';

/* ------------------------------------------------------------------
 * SHU031–SHU060  (batch 2 — placeholders)
 * ------------------------------------------------------------------ */
export { shu031Skills } from './shu031-jiangwan.js';
export { shu032Skills } from './shu032-feishi.js';
export { shu033Skills } from './shu033-dongyun.js';
export { shu034Skills } from './shu034-zhangyi.js';
export { shu035Skills } from './shu035-zhangbao.js';
export { shu036Skills } from './shu036-guanxing-individual.js';
export { shu037Skills } from './shu037-wangping.js';
export { shu038Skills } from './shu038-jiangfei.js';
export { shu039Skills } from './shu039-xiahoushi.js';
export { shu040Skills } from './shu040-zhangxuan.js';
export { shu041Skills } from './shu041-mazhong.js';
export { shu042Skills } from './shu042-sunqian.js';
export { shu043Skills } from './shu043-jianrong.js';
export { shu044Skills } from './shu044-mizhu.js';
export { shu045Skills } from './shu045-guanyinping.js';
export { shu046Skills } from './shu046-zhangfei-old.js';
export { shu047Skills } from './shu047-liubei-sp.js';
export { shu048Skills } from './shu048-huaman.js';
export { shu049Skills } from './shu049-yanyan.js';
export { shu050Skills } from './shu050-zhangsong.js';
export { shu051Skills } from './shu051-wuyi.js';
export { shu052Skills } from './shu052-liyan.js';
export { shu053Skills } from './shu053-chenshi.js';
export { shu054Skills } from './shu054-fazheng-sp.js';
export { shu055Skills } from './shu055-zhanglu.js';
export { shu056Skills } from './shu056-zhoufuren.js';
export { shu057Skills } from './shu057-xingcai.js';
export { shu058Skills } from './shu058-liuchen.js';
export { shu059Skills } from './shu059-zhaotong-zhaoguang.js';
export { shu060Skills } from './shu060-chenqun.js';

/* ------------------------------------------------------------------
 * SHU061–SHU093  (batch 3 — placeholders)
 * ------------------------------------------------------------------ */
export { shu061Skills } from './shu061-guansuo.js';
export { shu062Skills } from './shu062-zhangnan.js';
export { shu063Skills } from './shu063-fengxi.js';
export { shu064Skills } from './shu064-liufeng.js';
export { shu065Skills } from './shu065-shamoke.js';
export { shu066Skills } from './shu066-zhangyi-sp.js';
export { shu067Skills } from './shu067-mateng.js';
export { shu068Skills } from './shu068-wutugu.js';
export { shu069Skills } from './shu069-zhuran.js';
export { shu070Skills } from './shu070-liru.js';
export { shu071Skills } from './shu071-zhangren.js';
export { shu072Skills } from './shu072-yanxiang.js';
export { shu073Skills } from './shu073-zhangbao-sp.js';
export { shu074Skills } from './shu074-chendao.js';
export { shu075Skills } from './shu075-wuban.js';
export { shu076Skills } from './shu076-guanyue.js';
export { shu077Skills } from './shu077-gaoxiang.js';
export { shu078Skills } from './shu078-dengzhi.js';
export { shu079Skills } from './shu079-zhoujing.js';
export { shu080Skills } from './shu080-luji.js';
export { shu081Skills } from './shu081-zhangwan.js';
export { shu082Skills } from './shu082-sungan.js';
export { shu083Skills } from './shu083-qinmi.js';
export { shu084Skills } from './shu084-zhangsong-sp.js';
export { shu085Skills } from './shu085-zhangxiu.js';
export { shu086Skills } from './shu086-luban.js';
export { shu087Skills } from './shu087-caoshuang.js';
export { shu088Skills } from './shu088-wuguotai-sp.js';
export { shu089Skills } from './shu089-sunshangxiang-sp.js';
export { shu090Skills } from './shu090-liubiao.js';
export { shu091Skills } from './shu091-panfeng.js';
export { shu092Skills } from './shu092-chenlin.js';
export { shu093Skills } from './shu093-liubei-lord.js';

/* ------------------------------------------------------------------
 * Aggregated arrays
 * ------------------------------------------------------------------ */
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

import { shu009Skills } from './shu009-huangyueying.js';
import { shu010Skills } from './shu010-pangtong.js';
import { shu011Skills } from './shu011-jiangwei.js';
import { shu012Skills } from './shu012-fazheng.js';
import { shu013Skills } from './shu013-masu.js';
import { shu014Skills } from './shu014-wuguotai.js';
import { shu015Skills } from './shu015-sunshangxiang.js';
import { shu016Skills } from './shu016-liushan.js';
import { shu017Skills } from './shu017-guanxingzhangbao.js';
import { shu018Skills } from './shu018-madai.js';
import { shu019Skills } from './shu019-zhugeliang-wolong.js';
import { shu020Skills } from './shu020-huangzhong-old.js';
import { shu021Skills } from './shu021-liaohua.js';
import { shu022Skills } from './shu022-guanyu-sp.js';
import { shu023Skills } from './shu023-zhangfei-sp.js';
import { shu024Skills } from './shu024-zhaoyun-sp.js';
import { shu025Skills } from './shu025-menghuo.js';
import { shu026Skills } from './shu026-zhurong.js';
import { shu027Skills } from './shu027-weiyan-sp.js';
import { shu028Skills } from './shu028-xumadam.js';
import { shu029Skills } from './shu029-yiji.js';
import { shu030Skills } from './shu030-mifuren.js';
import { shu031Skills } from './shu031-jiangwan.js';
import { shu032Skills } from './shu032-feishi.js';
import { shu033Skills } from './shu033-dongyun.js';
import { shu034Skills } from './shu034-zhangyi.js';
import { shu035Skills } from './shu035-zhangbao.js';
import { shu036Skills } from './shu036-guanxing-individual.js';
import { shu037Skills } from './shu037-wangping.js';
import { shu038Skills } from './shu038-jiangfei.js';
import { shu039Skills } from './shu039-xiahoushi.js';
import { shu040Skills } from './shu040-zhangxuan.js';
import { shu041Skills } from './shu041-mazhong.js';
import { shu042Skills } from './shu042-sunqian.js';
import { shu043Skills } from './shu043-jianrong.js';
import { shu044Skills } from './shu044-mizhu.js';
import { shu045Skills } from './shu045-guanyinping.js';
import { shu046Skills } from './shu046-zhangfei-old.js';
import { shu047Skills } from './shu047-liubei-sp.js';
import { shu048Skills } from './shu048-huaman.js';
import { shu049Skills } from './shu049-yanyan.js';
import { shu050Skills } from './shu050-zhangsong.js';
import { shu051Skills } from './shu051-wuyi.js';
import { shu052Skills } from './shu052-liyan.js';
import { shu053Skills } from './shu053-chenshi.js';
import { shu054Skills } from './shu054-fazheng-sp.js';
import { shu055Skills } from './shu055-zhanglu.js';
import { shu056Skills } from './shu056-zhoufuren.js';
import { shu057Skills } from './shu057-xingcai.js';
import { shu058Skills } from './shu058-liuchen.js';
import { shu059Skills } from './shu059-zhaotong-zhaoguang.js';
import { shu060Skills } from './shu060-chenqun.js';
import { shu061Skills } from './shu061-guansuo.js';
import { shu062Skills } from './shu062-zhangnan.js';
import { shu063Skills } from './shu063-fengxi.js';
import { shu064Skills } from './shu064-liufeng.js';
import { shu065Skills } from './shu065-shamoke.js';
import { shu066Skills } from './shu066-zhangyi-sp.js';
import { shu067Skills } from './shu067-mateng.js';
import { shu068Skills } from './shu068-wutugu.js';
import { shu069Skills } from './shu069-zhuran.js';
import { shu070Skills } from './shu070-liru.js';
import { shu071Skills } from './shu071-zhangren.js';
import { shu072Skills } from './shu072-yanxiang.js';
import { shu073Skills } from './shu073-zhangbao-sp.js';
import { shu074Skills } from './shu074-chendao.js';
import { shu075Skills } from './shu075-wuban.js';
import { shu076Skills } from './shu076-guanyue.js';
import { shu077Skills } from './shu077-gaoxiang.js';
import { shu078Skills } from './shu078-dengzhi.js';
import { shu079Skills } from './shu079-zhoujing.js';
import { shu080Skills } from './shu080-luji.js';
import { shu081Skills } from './shu081-zhangwan.js';
import { shu082Skills } from './shu082-sungan.js';
import { shu083Skills } from './shu083-qinmi.js';
import { shu084Skills } from './shu084-zhangsong-sp.js';
import { shu085Skills } from './shu085-zhangxiu.js';
import { shu086Skills } from './shu086-luban.js';
import { shu087Skills } from './shu087-caoshuang.js';
import { shu088Skills } from './shu088-wuguotai-sp.js';
import { shu089Skills } from './shu089-sunshangxiang-sp.js';
import { shu090Skills } from './shu090-liubiao.js';
import { shu091Skills } from './shu091-panfeng.js';
import { shu092Skills } from './shu092-chenlin.js';
import { shu093Skills } from './shu093-liubei-lord.js';

/** Legacy array — SHU001-SHU008 only (backward compat). */
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

/** All SHU faction skills — generals SHU001 through SHU093. */
export const allShuSkills: SkillPlugin[] = [
  // SHU001–SHU008 (original)
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
  // SHU009–SHU060
  ...shu009Skills,
  ...shu010Skills,
  ...shu011Skills,
  ...shu012Skills,
  ...shu013Skills,
  ...shu014Skills,
  ...shu015Skills,
  ...shu016Skills,
  ...shu017Skills,
  ...shu018Skills,
  ...shu019Skills,
  ...shu020Skills,
  ...shu021Skills,
  ...shu022Skills,
  ...shu023Skills,
  ...shu024Skills,
  ...shu025Skills,
  ...shu026Skills,
  ...shu027Skills,
  ...shu028Skills,
  ...shu029Skills,
  ...shu030Skills,
  ...shu031Skills,
  ...shu032Skills,
  ...shu033Skills,
  ...shu034Skills,
  ...shu035Skills,
  ...shu036Skills,
  ...shu037Skills,
  ...shu038Skills,
  ...shu039Skills,
  ...shu040Skills,
  ...shu041Skills,
  ...shu042Skills,
  ...shu043Skills,
  ...shu044Skills,
  ...shu045Skills,
  ...shu046Skills,
  ...shu047Skills,
  ...shu048Skills,
  ...shu049Skills,
  ...shu050Skills,
  ...shu051Skills,
  ...shu052Skills,
  ...shu053Skills,
  ...shu054Skills,
  ...shu055Skills,
  ...shu056Skills,
  ...shu057Skills,
  ...shu058Skills,
  ...shu059Skills,
  ...shu060Skills,
  // SHU061–SHU093
  ...shu061Skills,
  ...shu062Skills,
  ...shu063Skills,
  ...shu064Skills,
  ...shu065Skills,
  ...shu066Skills,
  ...shu067Skills,
  ...shu068Skills,
  ...shu069Skills,
  ...shu070Skills,
  ...shu071Skills,
  ...shu072Skills,
  ...shu073Skills,
  ...shu074Skills,
  ...shu075Skills,
  ...shu076Skills,
  ...shu077Skills,
  ...shu078Skills,
  ...shu079Skills,
  ...shu080Skills,
  ...shu081Skills,
  ...shu082Skills,
  ...shu083Skills,
  ...shu084Skills,
  ...shu085Skills,
  ...shu086Skills,
  ...shu087Skills,
  ...shu088Skills,
  ...shu089Skills,
  ...shu090Skills,
  ...shu091Skills,
  ...shu092Skills,
  ...shu093Skills,
];
