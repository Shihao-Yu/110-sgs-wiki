/**
 * SHU faction skill registry — generals SHU001 through SHU060.
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

/** All SHU faction skills — generals SHU001 through SHU060. */
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
];
