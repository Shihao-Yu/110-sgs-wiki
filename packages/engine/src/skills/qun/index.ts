/**
 * QUN faction skill registry — generals 001 through 087.
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
import { qun031Skills } from './qun031-guosi.js';
import { qun032Skills } from './qun032-zhangxiu.js';
import { qun033Skills } from './qun033-fanjiangzhangda.js';
import { qun034Skills } from './qun034-wutugu.js';
import { qun035Skills } from './qun035-tadun.js';
import { qun036Skills } from './qun036-shenpei.js';
import { qun037Skills } from './qun037-kongrong.js';
import { qun038Skills } from './qun038-miheng.js';
import { qun039Skills } from './qun039-taoqian.js';
import { qun040Skills } from './qun040-yuji.js';
import { qun041Skills } from './qun041-yanliangwenchou-sp.js';
import { qun042Skills } from './qun042-hansui.js';
import { qun043Skills } from './qun043-liru.js';
import { qun044Skills } from './qun044-zhangbao.js';
import { qun045Skills } from './qun045-zhangliang.js';
import { qun046Skills } from './qun046-lvlingqi.js';
import { qun047Skills } from './qun047-panshuang.js';
import { qun048Skills } from './qun048-shamoke.js';
import { qun049Skills } from './qun049-zhugedan.js';
import { qun050Skills } from './qun050-simazhao.js';
import { qun051Skills } from './qun051-wangyuanji.js';
import { qun052Skills } from './qun052-caomao.js';
import { qun053Skills } from './qun053-simashi.js';
import { qun054Skills } from './qun054-zhangrang.js';
import { qun055Skills } from './qun055-hetaihou.js';
import { qun056Skills } from './qun056-liufeng.js';
import { qun057Skills } from './qun057-beimihu.js';
import { qun058Skills } from './qun058-mushun.js';
import { qun059Skills } from './qun059-dongbai.js';
import { qun060Skills } from './qun060-xushao.js';
import { qun061Skills } from './qun061-zhangji.js';
import { qun062Skills } from './qun062-liuyan.js';
import { qun063Skills } from './qun063-guansuo.js';
import { qun064Skills } from './qun064-baosanniang.js';
import { qun065Skills } from './qun065-huaman.js';
import { qun066Skills } from './qun066-tadun-sp.js';
import { qun067Skills } from './qun067-zhangmancheng.js';
import { qun068Skills } from './qun068-liubiao.js';
import { qun069Skills } from './qun069-chengyu.js';
import { qun070Skills } from './qun070-liuzhang.js';
import { qun071Skills } from './qun071-zhanglu.js';
import { qun072Skills } from './qun072-hetaihou-sp.js';
import { qun073Skills } from './qun073-yanbaihu.js';
import { qun074Skills } from './qun074-wangcan.js';
import { qun075Skills } from './qun075-luzhi.js';
import { qun076Skills } from './qun076-gongsunzan-sp.js';
import { qun077Skills } from './qun077-caosong.js';
import { qun078Skills } from './qun078-sufei.js';
import { qun079Skills } from './qun079-zhangning.js';
import { qun080Skills } from './qun080-hejin.js';
import { qun081Skills } from './qun081-jianggan.js';
import { qun082Skills } from './qun082-duanwei.js';
import { qun083Skills } from './qun083-liupi.js';
import { qun084Skills } from './qun084-gongsunyuan.js';
import { qun085Skills } from './qun085-huangzu.js';
import { qun086Skills } from './qun086-zhangren.js';
import { qun087Skills } from './qun087-quyi.js';

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
  // QUN031 郭汜
  ...qun031Skills,
  // QUN032 张绣
  ...qun032Skills,
  // QUN033 范疆&张达
  ...qun033Skills,
  // QUN034 兀突骨
  ...qun034Skills,
  // QUN035 蹋顿
  ...qun035Skills,
  // QUN036 审配
  ...qun036Skills,
  // QUN037 孔融
  ...qun037Skills,
  // QUN038 祢衡
  ...qun038Skills,
  // QUN039 陶谦
  ...qun039Skills,
  // QUN040 虞姬
  ...qun040Skills,
  // QUN041 颜良&文丑(SP)
  ...qun041Skills,
  // QUN042 韩遂
  ...qun042Skills,
  // QUN043 李儒
  ...qun043Skills,
  // QUN044 张宝
  ...qun044Skills,
  // QUN045 张梁
  ...qun045Skills,
  // QUN046 吕玲绮
  ...qun046Skills,
  // QUN047 潘双
  ...qun047Skills,
  // QUN048 沙摩柯
  ...qun048Skills,
  // QUN049 诸葛诞
  ...qun049Skills,
  // QUN050 司马昭
  ...qun050Skills,
  // QUN051 王元姬
  ...qun051Skills,
  // QUN052 曹髦
  ...qun052Skills,
  // QUN053 司马师
  ...qun053Skills,
  // QUN054 张让
  ...qun054Skills,
  // QUN055 何太后
  ...qun055Skills,
  // QUN056 刘封
  ...qun056Skills,
  // QUN057 卑弥呼
  ...qun057Skills,
  // QUN058 木顺
  ...qun058Skills,
  // QUN059 董白
  ...qun059Skills,
  // QUN060 许劭
  ...qun060Skills,
  // QUN061 张济
  ...qun061Skills,
  // QUN062 刘焉
  ...qun062Skills,
  // QUN063 关索
  ...qun063Skills,
  // QUN064 鲍三娘
  ...qun064Skills,
  // QUN065 花鬘
  ...qun065Skills,
  // QUN066 蹋顿(SP)
  ...qun066Skills,
  // QUN067 张曼成
  ...qun067Skills,
  // QUN068 刘表
  ...qun068Skills,
  // QUN069 程昱
  ...qun069Skills,
  // QUN070 刘璋
  ...qun070Skills,
  // QUN071 张鲁
  ...qun071Skills,
  // QUN072 何太后(SP)
  ...qun072Skills,
  // QUN073 严白虎
  ...qun073Skills,
  // QUN074 王粲
  ...qun074Skills,
  // QUN075 卢植
  ...qun075Skills,
  // QUN076 公孙瓒(SP)
  ...qun076Skills,
  // QUN077 曹嵩
  ...qun077Skills,
  // QUN078 苏飞
  ...qun078Skills,
  // QUN079 张宁
  ...qun079Skills,
  // QUN080 何进
  ...qun080Skills,
  // QUN081 蒋干
  ...qun081Skills,
  // QUN082 段煨
  ...qun082Skills,
  // QUN083 刘辟
  ...qun083Skills,
  // QUN084 公孙渊
  ...qun084Skills,
  // QUN085 黄祖
  ...qun085Skills,
  // QUN086 张任
  ...qun086Skills,
  // QUN087 麹义
  ...qun087Skills,
];

/** Register all QUN skills into a SkillRegistry instance. */
export function registerQunSkills(registry: SkillRegistry): void {
  for (const skill of qunSkills) {
    registry.register(skill);
  }
}
