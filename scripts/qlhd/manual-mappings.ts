import type { SubFaction } from './parse-filename.js';

/**
 * 新素材的双势力文件名丢失了 `&副势力` 段，需要补。
 * 键：`${faction}${cardNo}`。
 *
 * 前 5 条搬运自替换前的 generals.json；后 7 条由裁取左上角双色徽记
 * 与体力阴阳鱼配色解图认定（蜀橙 / 魏蓝 / 吴绿 / 群白），见 spec 5.2。
 */
export const DUAL_FACTION: Record<string, SubFaction> = {
  QUN072: 'SHU',   // 刘琦   —— 旧数据
  QUN066: 'WEI',   // 许攸   —— 旧数据
  QUN051: 'WU',    // 士燮   —— 旧数据
  SHU071: 'WU',    // 糜芳&傅士仁 —— 旧数据
  WEI079: 'SHU',   // 孟达   —— 旧数据
  QUN195: 'SHU',   // 孟优   —— 解图
  SHU041: 'WEI',   // 夏侯霸 —— 解图
  SHU072: 'QUN',   // 彭羕   —— 解图
  WEI168: 'SHU',   // 黄权   —— 解图
  WU050: 'SHU',    // 潘濬   —— 解图
  WU070: 'QUN',    // 苏飞   —— 解图
  WU071: 'QUN',    // 许贡   —— 解图
};

/** 唯一一个 UUID 命名的散图，解图确认是杜预 G.QUN110。 */
export const UUID_FILE_MAP: Record<
  string,
  { faction: 'QUN'; cardNo: string; title: string; name: string }
> = {
  'ab539b47-7fa1-4918-af21-6114c3aa9067.png': {
    faction: 'QUN', cardNo: '110', title: '龙吟破乱', name: '杜预',
  },
};

/**
 * 标记牌归属：标记牌名（不含扩展名、不含「背面」）→ generalId。
 * 认不出归属的标记牌不要写进这里，让 ownerGeneralId 留空。
 *
 * 注意 `全综` 是素材的错别字，卡面署名为「全琮」。
 */
export const TOKEN_OWNERS: Record<string, string> = {
  // ——— 按文件名即可关联的 11 组 ———
  // 下面这些 generalId 已由控制方用 Task 1 的 parseCardFilename 对真实素材
  // 跑过一遍核对，是实测值不是推断值，直接用。
  羊祜: 'general_wei_089',      // 剑影当锋
  羊徽瑜: 'general_wei_124',    // 月耀华裳
  许褚: 'general_wei_005',      // 摧城拔山
  马钧: 'general_wei_063',      // 能工巧匠
  黄权: 'general_wei_168',      // 智答魏诏
  邓芝: 'general_shu_073',      // 樽俎折冲
  荀谌: 'general_qun_078',      // 鸿雪寒山
  曹髦: 'general_wei_101',      // 向死存魏
  冯熙: 'general_wu_089',       // 龙挟抑志
  郭照红色: 'general_wei_102',  // 慕贤明德（红黑两套标记指向同一武将）
  郭照黑色: 'general_wei_102',
  // ——— 文件名对不上、靠解图认亲的 ———
  // 「全综」是素材的错别字，卡面右下角署名为「全琮技能卡」。
  全综: 'general_wu_035',       // 全琮 · 拥立鲁王
  // 以下 4 条由 Task 4 解图认定：标记牌名是技能名/道具名，跟归属武将的姓名
  // 没有字面关系，唯一证据是卡面底部署名条「XX技能卡」，逐字读出后再到
  // 素材里按人名反查唯一匹配的 generalId。
  命运签: 'general_shu_056',    // 卡面署名「周群技能卡」· 周群 · 瞻天瞩世
  明鉴: 'general_wei_037',      // 卡面署名「曹叡技能卡」· 曹叡 · 大权独揽
  // 卡面署名「郭皇后技能卡」· 郭皇后 · 狼视眈眈。注意 郭皇后(WEI040) 与
  // 郭照(WEI102，即上面 郭照红色/黑色 所属的 general_wei_102) 是素材里
  // 两个不同的武将，名字相近但不是同一人，不要混淆。
  矫诏: 'general_wei_040',      // 卡面署名「郭皇后技能卡」· 郭皇后 · 狼视眈眈
  许身: 'general_shu_070',      // 卡面署名「鲍三娘技能卡」· 鲍三娘 · 漫花剑俏
};

/**
 * 标记牌共 24 张正面，除上面写入的条目和「大攻车图纸/大攻车技能」（属于
 * 大攻车模块，不需要归属，见 Task 6）外，以下 6 张解图后确认卡面**没有
 * 任何武将姓名或署名条**，故不写入 TOKEN_OWNERS，归属留空：
 *   上上签、上签、中签、下签、下下签 —— 卡面只有抽签规则文字（如
 *     「防止每回合受到的首次伤害。」），无署名条，也非以武将命名。
 *   福利卡 —— 底部署名条只写「福利卡」，无武将姓名；卡面效果面向
 *     「第一个死亡的角色」，与具体武将无关。
 * 这不是漏填，是解图后确认无法归属。
 */

/**
 * 十常侍 10 名子卡的姓名。用于判定某张卡是否要挂 parentGeneralId。
 *
 * 注意其中张让(QUN038) 与赵忠(QUN118) 有真实卡号，走 generalIdFor 得到
 * general_qun_038 / general_qun_118；只有其余 8 名是 QUNXXX，按出现顺序
 * 拿 general_qun_000_m01 … m08。父卡 general_qun_000（群/QUN000
 * 祸乱纲常·十常侍）在素材中存在，引用不会悬空。
 */
export const EUNUCH_ORDER: string[] = [
  '张让', '赵忠', '夏恽', '孙璋', '栗嵩',
  '段珪', '毕岚', '郭胜', '韩悝', '高望',
];
