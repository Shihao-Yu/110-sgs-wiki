/**
 * WEI faction skill registry — generals 001 through 088.
 *
 * Registers all WEI skills with the central SkillRegistry.
 */

import type { SkillRegistry } from '../skill-registry.js';
import type { SkillPlugin } from '../types.js';

import { wei001Skills } from './wei001-caocao.js';
import { wei002Skills } from './wei002-simayi.js';
import { wei003Skills } from './wei003-xiahoudun.js';
import { wei004Skills } from './wei004-zhangliao.js';
import { wei005Skills } from './wei005-xuchu.js';
import { wei006Skills } from './wei006-guojia.js';
import { wei007Skills } from './wei007-zhenji.js';
import { wei008Skills } from './wei008-dianwei.js';
import { wei009Skills } from './wei009-xunyu.js';
import { wei010Skills } from './wei010-caoren.js';
import { wei011Skills } from './wei011-xiahouyuan.js';
import { wei012Skills } from './wei012-zhanghe.js';
import { wei013Skills } from './wei013-xuhuang.js';
import { wei014Skills } from './wei014-caozhang.js';
import { wei015Skills } from './wei015-yujin.js';
import { wei016Skills } from './wei016-manchong.js';
import { wei017Skills } from './wei017-xunyou.js';
import { wei018Skills } from './wei018-zhangchunhua.js';
import { wei019Skills } from './wei019-caopi.js';
import { wei020Skills } from './wei020-caozhi.js';
import { wei021Skills } from './wei021-lidian.js';
import { wei022Skills } from './wei022-yufan.js';
import { wei023Skills } from './wei023-chengyu.js';
import { wei024Skills } from './wei024-caohong.js';
import { wei025Skills } from './wei025-wangyi.js';
import { wei026Skills } from './wei026-guohuai.js';
import { wei027Skills } from './wei027-zhonghui.js';
import { wei028Skills } from './wei028-dengai.js';
import { wei029Skills } from './wei029-jiaxu.js';
import { wei030Skills } from './wei030-xushu.js';
import { wei031Skills } from './wei031-caochong.js';
import { wei032Skills } from './wei032-guohuai2.js';
import { wei033Skills } from './wei033-caozhen.js';
import { wei034Skills } from './wei034-chenqun.js';
import { wei035Skills } from './wei035-hanhao-shihuan.js';
import { wei036Skills } from './wei036-caorui.js';
import { wei037Skills } from './wei037-caoxiu.js';
import { wei038Skills } from './wei038-zhongyao.js';
import { wei039Skills } from './wei039-yangxiu.js';
import { wei040Skills } from './wei040-chenlin.js';
import { wei041Skills } from './wei041-chengyu.js';
import { wei042Skills } from './wei042-caoangg.js';
import { wei043Skills } from './wei043-zhugezhan.js';
import { wei044Skills } from './wei044-simalang.js';
import { wei045Skills } from './wei045-wangji.js';
import { wei046Skills } from './wei046-litong.js';
import { wei047Skills } from './wei047-xizhicai.js';
import { wei048Skills } from './wei048-wanglang.js';
import { wei049Skills } from './wei049-caochun.js';
import { wei050Skills } from './wei050-liuye.js';
import { wei051Skills } from './wei051-majun.js';
import { wei052Skills } from './wei052-xinxianying.js';
import { wei053Skills } from './wei053-jikang.js';
import { wei054Skills } from './wei054-haozhao.js';
import { wei055Skills } from './wei055-guanqiujian.js';
import { wei056Skills } from './wei056-luzhi.js';
import { wei057Skills } from './wei057-caoying.js';
import { wei058Skills } from './wei058-tangzi.js';
import { wei059Skills } from './wei059-wenyong.js';
import { wei060Skills } from './wei060-jianggan.js';
import { wei061Skills } from './wei061-simazhao.js';
import { wei062Skills } from './wei062-simashi.js';
import { wei063Skills } from './wei063-zhanghu.js';
import { wei064Skills } from './wei064-lebin.js';
import { wei065Skills } from './wei065-wangshuang.js';
import { wei066Skills } from './wei066-bianfuren.js';
import { wei067Skills } from './wei067-liufang.js';
import { wei068Skills } from './wei068-sunzi.js';
import { wei069Skills } from './wei069-xiahouhui.js';
import { wei070Skills } from './wei070-duji.js';
import { wei071Skills } from './wei071-zhangji.js';
import { wei072Skills } from './wei072-xiahoushang.js';
import { wei073Skills } from './wei073-caoshuang.js';
import { wei074Skills } from './wei074-zhangling.js';
import { wei075Skills } from './wei075-wenpin.js';
import { wei076Skills } from './wei076-caoanmin.js';
import { wei077Skills } from './wei077-dingyi.js';
import { wei078Skills } from './wei078-dingyi2.js';
import { wei079Skills } from './wei079-liufu.js';
import { wei080Skills } from './wei080-liuxie.js';
import { wei081Skills } from './wei081-zangba.js';
import { wei082Skills } from './wei082-caojie.js';
import { wei083Skills } from './wei083-kuailiangkuaiyue.js';
import { wei084Skills } from './wei084-caoxi.js';
import { wei085Skills } from './wei085-zhangqian.js';
import { wei086Skills } from './wei086-caomao.js';
import { wei087Skills } from './wei087-zhugexu.js';
import { wei088Skills } from './wei088-wangling.js';

/** All WEI skill plugins in general order. */
export const allWeiSkills: SkillPlugin[] = [
  ...wei001Skills,
  ...wei002Skills,
  ...wei003Skills,
  ...wei004Skills,
  ...wei005Skills,
  ...wei006Skills,
  ...wei007Skills,
  ...wei008Skills,
  ...wei009Skills,
  ...wei010Skills,
  ...wei011Skills,
  ...wei012Skills,
  ...wei013Skills,
  ...wei014Skills,
  ...wei015Skills,
  ...wei016Skills,
  ...wei017Skills,
  ...wei018Skills,
  ...wei019Skills,
  ...wei020Skills,
  ...wei021Skills,
  ...wei022Skills,
  ...wei023Skills,
  ...wei024Skills,
  ...wei025Skills,
  ...wei026Skills,
  ...wei027Skills,
  ...wei028Skills,
  ...wei029Skills,
  ...wei030Skills,
  ...wei031Skills,
  ...wei032Skills,
  ...wei033Skills,
  ...wei034Skills,
  ...wei035Skills,
  ...wei036Skills,
  ...wei037Skills,
  ...wei038Skills,
  ...wei039Skills,
  ...wei040Skills,
  ...wei041Skills,
  ...wei042Skills,
  ...wei043Skills,
  ...wei044Skills,
  ...wei045Skills,
  ...wei046Skills,
  ...wei047Skills,
  ...wei048Skills,
  ...wei049Skills,
  ...wei050Skills,
  ...wei051Skills,
  ...wei052Skills,
  ...wei053Skills,
  ...wei054Skills,
  ...wei055Skills,
  ...wei056Skills,
  ...wei057Skills,
  ...wei058Skills,
  ...wei059Skills,
  ...wei060Skills,
  ...wei061Skills,
  ...wei062Skills,
  ...wei063Skills,
  ...wei064Skills,
  ...wei065Skills,
  ...wei066Skills,
  ...wei067Skills,
  ...wei068Skills,
  ...wei069Skills,
  ...wei070Skills,
  ...wei071Skills,
  ...wei072Skills,
  ...wei073Skills,
  ...wei074Skills,
  ...wei075Skills,
  ...wei076Skills,
  ...wei077Skills,
  ...wei078Skills,
  ...wei079Skills,
  ...wei080Skills,
  ...wei081Skills,
  ...wei082Skills,
  ...wei083Skills,
  ...wei084Skills,
  ...wei085Skills,
  ...wei086Skills,
  ...wei087Skills,
  ...wei088Skills,
];

/** Register all WEI skills into a SkillRegistry instance. */
export function registerWeiSkills(registry: SkillRegistry): void {
  for (const skill of allWeiSkills) {
    registry.register(skill);
  }
}
