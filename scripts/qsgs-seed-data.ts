/**
 * QSanguosha seed data — hardcoded skill/general data for core generals.
 *
 * Sources: QSanguosha open-source game data, official SanGuoSha rulebooks,
 * and community-maintained wikis. Skill descriptions follow the standard
 * Chinese wording used in the physical card game.
 */

// ── Types used only within this seed file ──────────────────────────────

export type Faction = 'WEI' | 'SHU' | 'WU' | 'QUN' | 'JIN';
export type Gender = 'male' | 'female';
export type SkillType =
  | 'active'
  | 'passive'
  | 'lock'
  | 'limited'
  | 'awakening'
  | 'mission';

export interface SeedSkill {
  key: string;          // unique id slug, e.g. "jianxiong"
  name: string;         // Chinese display name
  description: string;  // Chinese rules text
  type: SkillType;
  timing: string[];     // e.g. ["受到伤害后"] or ["出牌阶段"]
}

export interface SeedGeneral {
  key: string;          // unique id slug, e.g. "caocao"
  name: string;         // Chinese display name
  title: string;        // epithet / 称号
  faction: Faction;
  hp: number;
  maxHp: number;
  gender: Gender;
  skills: SeedSkill[];
  pack: string;         // expansion pack name
  isEmperor?: boolean;
}

// ── WEI faction ────────────────────────────────────────────────────────

const wei: SeedGeneral[] = [
  {
    key: 'caocao',
    name: '曹操',
    title: '魏武帝',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    isEmperor: true,
    skills: [
      {
        key: 'jianxiong',
        name: '奸雄',
        description:
          '当你受到伤害后，你可以获得造成此伤害的牌。',
        type: 'passive',
        timing: ['受到伤害后'],
      },
      {
        key: 'hujia',
        name: '护驾',
        description:
          '主公技，当你需要使用或打出【闪】时，你可以令其他魏势力角色打出一张【闪】（视为由你使用或打出）。',
        type: 'active',
        timing: ['需要使用或打出闪时'],
      },
    ],
  },
  {
    key: 'simayi',
    name: '司马懿',
    title: '狼顾之鬼',
    faction: 'WEI',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'fankui',
        name: '反馈',
        description:
          '当你受到伤害后，你可以获得伤害来源的一张牌。',
        type: 'passive',
        timing: ['受到伤害后'],
      },
      {
        key: 'guicai',
        name: '鬼才',
        description:
          '当一名角色的判定牌生效前，你可以打出一张手牌代替之。',
        type: 'passive',
        timing: ['判定牌生效前'],
      },
    ],
  },
  {
    key: 'xiahoudun',
    name: '夏侯惇',
    title: '独眼的罗刹',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'ganglie',
        name: '刚烈',
        description:
          '当你受到伤害后，你可以进行判定：若结果不为♥，则伤害来源须弃置两张手牌或受到你造成的1点伤害。',
        type: 'passive',
        timing: ['受到伤害后'],
      },
    ],
  },
  {
    key: 'zhangliao',
    name: '张辽',
    title: '前将军',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'tuxi',
        name: '突袭',
        description:
          '摸牌阶段，你可以少摸任意张牌（至少一张），然后分别从等量的其他角色处各获得一张手牌。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
    ],
  },
  {
    key: 'xuchu',
    name: '许褚',
    title: '虎痴',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'luoyi',
        name: '裸衣',
        description:
          '摸牌阶段，你可以少摸一张牌，若如此做，本回合你使用【杀】或【决斗】造成的伤害+1。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
    ],
  },
  {
    key: 'guojia',
    name: '郭嘉',
    title: '早终的先知',
    faction: 'WEI',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'tiandu',
        name: '天妒',
        description: '当你的判定牌生效后，你可以获得此判定牌。',
        type: 'passive',
        timing: ['判定牌生效后'],
      },
      {
        key: 'yiji',
        name: '遗计',
        description:
          '当你受到1点伤害后，你可以摸两张牌，然后将至多两张手牌交给任意角色。',
        type: 'passive',
        timing: ['受到伤害后'],
      },
    ],
  },
  {
    key: 'zhenji',
    name: '甄姬',
    title: '薄幸的美人',
    faction: 'WEI',
    hp: 3,
    maxHp: 3,
    gender: 'female',
    pack: '标准版',
    skills: [
      {
        key: 'qingguo',
        name: '倾国',
        description: '你可以将一张黑色手牌当【闪】使用或打出。',
        type: 'active',
        timing: ['需要使用或打出闪时'],
      },
      {
        key: 'luoshen',
        name: '洛神',
        description:
          '准备阶段，你可以进行判定：若为黑色，你获得此判定牌并可以继续判定。',
        type: 'passive',
        timing: ['准备阶段'],
      },
    ],
  },
  {
    key: 'dianwei',
    name: '典韦',
    title: '古之恶来',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '风',
    skills: [
      {
        key: 'qiangxi',
        name: '强袭',
        description:
          '出牌阶段限一次，你可以失去1点体力或弃置一张武器牌，对你攻击范围内的一名角色造成1点伤害。',
        type: 'active',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'xunyu',
    name: '荀彧',
    title: '王佐之才',
    faction: 'WEI',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '火',
    skills: [
      {
        key: 'quhu',
        name: '驱虎',
        description:
          '出牌阶段限一次，你可以与一名体力值大于你的角色拼点，若你赢，该角色对其攻击范围内你指定的一名角色造成1点伤害。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'jieming',
        name: '节命',
        description:
          '当你受到1点伤害后，你可以令一名角色摸两张牌，然后该角色将手牌弃至其体力上限。',
        type: 'passive',
        timing: ['受到伤害后'],
      },
    ],
  },
  {
    key: 'caoren',
    name: '曹仁',
    title: '大将军',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '火',
    skills: [
      {
        key: 'jushou',
        name: '据守',
        description:
          '结束阶段，你可以摸三张牌，然后翻面。',
        type: 'passive',
        timing: ['结束阶段'],
      },
    ],
  },
  {
    key: 'xiahоuyuan',
    name: '夏侯渊',
    title: '疾行的猎豹',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'shensu',
        name: '神速',
        description:
          '你可以做以下一项或两项：1.跳过判定阶段和摸牌阶段，视为对一名角色使用一张【杀】；2.跳过出牌阶段并弃置一张装备牌，视为对一名角色使用一张【杀】。',
        type: 'active',
        timing: ['判定阶段', '出牌阶段'],
      },
    ],
  },
  {
    key: 'zhanghe',
    name: '张郃',
    title: '料敌机先',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '风',
    skills: [
      {
        key: 'qiaobian',
        name: '巧变',
        description:
          '你可以弃置一张手牌，跳过你的一个阶段（准备阶段和结束阶段除外）：若跳过摸牌阶段，你可以获得至多两名其他角色各一张手牌；若跳过出牌阶段，你可以将场上一张牌移动到另一名角色的相应区域。',
        type: 'active',
        timing: ['各阶段开始时'],
      },
    ],
  },
];

// ── SHU faction ────────────────────────────────────────────────────────

const shu: SeedGeneral[] = [
  {
    key: 'liubei',
    name: '刘备',
    title: '乱世的枭雄',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    isEmperor: true,
    skills: [
      {
        key: 'rende',
        name: '仁德',
        description:
          '出牌阶段，你可以将任意张手牌交给其他角色，当你于本阶段以此法给出第二张牌时，你回复1点体力。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'jijiang',
        name: '激将',
        description:
          '主公技，当你需要使用或打出【杀】时，你可以令其他蜀势力角色打出一张【杀】（视为由你使用或打出）。',
        type: 'active',
        timing: ['需要使用或打出杀时'],
      },
    ],
  },
  {
    key: 'guanyu',
    name: '关羽',
    title: '美髯公',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'wusheng',
        name: '武圣',
        description: '你可以将一张红色牌当【杀】使用或打出。',
        type: 'active',
        timing: ['需要使用或打出杀时'],
      },
    ],
  },
  {
    key: 'zhangfei',
    name: '张飞',
    title: '万夫不当',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'paoxiao',
        name: '咆哮',
        description: '锁定技，你使用【杀】无次数限制。',
        type: 'lock',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'zhugeliang',
    name: '诸葛亮',
    title: '迟暮的丞相',
    faction: 'SHU',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'guanxing',
        name: '观星',
        description:
          '准备阶段，你可以观看牌堆顶的X张牌（X为存活角色数且至多为5），将任意数量的牌以任意顺序置于牌堆顶，其余以任意顺序置于牌堆底。',
        type: 'passive',
        timing: ['准备阶段'],
      },
      {
        key: 'kongcheng',
        name: '空城',
        description:
          '锁定技，若你没有手牌，你不能成为【杀】或【决斗】的目标。',
        type: 'lock',
        timing: ['成为目标时'],
      },
    ],
  },
  {
    key: 'zhaoyun',
    name: '赵云',
    title: '少年将军',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'longdan',
        name: '龙胆',
        description:
          '你可以将一张【杀】当【闪】使用或打出，或将一张【闪】当【杀】使用或打出。',
        type: 'active',
        timing: ['需要使用或打出杀或闪时'],
      },
    ],
  },
  {
    key: 'machao',
    name: '马超',
    title: '一骑当千',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'mashu',
        name: '马术',
        description: '锁定技，你计算与其他角色的距离-1。',
        type: 'lock',
        timing: ['锁定技'],
      },
      {
        key: 'tieqi',
        name: '铁骑',
        description:
          '当你使用【杀】指定一个目标后，你可以进行判定：若结果为红色，该角色不能使用【闪】响应此【杀】。',
        type: 'passive',
        timing: ['使用杀指定目标后'],
      },
    ],
  },
  {
    key: 'huangzhong',
    name: '黄忠',
    title: '老当益壮',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'liegong',
        name: '烈弓',
        description:
          '当你于出牌阶段使用【杀】指定一个目标后，若该角色的手牌数不小于你的体力值或不大于你的攻击范围，你可以令其不能使用【闪】响应此【杀】。',
        type: 'passive',
        timing: ['使用杀指定目标后'],
      },
    ],
  },
  {
    key: 'weiyan',
    name: '魏延',
    title: '嗜血的独狼',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '风',
    skills: [
      {
        key: 'kuanggu',
        name: '狂骨',
        description:
          '当你对距离1以内的一名角色造成1点伤害后，你可以回复1点体力。',
        type: 'passive',
        timing: ['造成伤害后'],
      },
    ],
  },
  {
    key: 'pangtong',
    name: '庞统',
    title: '凤雏',
    faction: 'SHU',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '火',
    skills: [
      {
        key: 'lianhuan',
        name: '连环',
        description:
          '你可以将一张♣手牌当【铁索连环】使用或重铸。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'niepan',
        name: '涅槃',
        description:
          '限定技，当你处于濒死状态时，你可以弃置你区域里的所有牌，复原你的武将牌，摸三张牌并将体力回复至3点。',
        type: 'limited',
        timing: ['濒死状态时'],
      },
    ],
  },
  {
    key: 'huangyueying',
    name: '黄月英',
    title: '归隐的杰女',
    faction: 'SHU',
    hp: 3,
    maxHp: 3,
    gender: 'female',
    pack: '标准版',
    skills: [
      {
        key: 'jizhi',
        name: '集智',
        description:
          '当你使用一张非延时锦囊牌时，你可以摸一张牌。',
        type: 'passive',
        timing: ['使用锦囊牌时'],
      },
      {
        key: 'qicai',
        name: '奇才',
        description:
          '锁定技，你使用锦囊牌无距离限制。',
        type: 'lock',
        timing: ['锁定技'],
      },
    ],
  },
  {
    key: 'jiangwei',
    name: '姜维',
    title: '龙的衣钵',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '山',
    skills: [
      {
        key: 'tiaoxin',
        name: '挑衅',
        description:
          '出牌阶段限一次，你可以指定一名攻击范围内含有你的角色，该角色须对你使用一张【杀】，否则你弃置其一张牌。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'zhiji',
        name: '志继',
        description:
          '觉醒技，准备阶段，若你没有手牌，你回复1点体力或摸两张牌，然后减1点体力上限，获得技能"观星"。',
        type: 'awakening',
        timing: ['准备阶段'],
      },
    ],
  },
  {
    key: 'fazheng',
    name: '法正',
    title: '蜀汉的辅翼',
    faction: 'SHU',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '山',
    skills: [
      {
        key: 'enyuan',
        name: '恩怨',
        description:
          '当你获得其他角色的牌后，你可以令其摸一张牌；当你受到1点伤害后，你可以令伤害来源选择一项：交给你一张手牌，或失去1点体力。',
        type: 'passive',
        timing: ['获得牌后', '受到伤害后'],
      },
      {
        key: 'xuanhuo',
        name: '眩惑',
        description:
          '摸牌阶段，你可以少摸一张牌，然后获得一名其他角色的一张手牌并交给另一名其他角色。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
    ],
  },
];

// ── WU faction ─────────────────────────────────────────────────────────

const wu: SeedGeneral[] = [
  {
    key: 'sunquan',
    name: '孙权',
    title: '年轻的贤君',
    faction: 'WU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    isEmperor: true,
    skills: [
      {
        key: 'zhiheng',
        name: '制衡',
        description:
          '出牌阶段限一次，你可以弃置任意张牌并摸等量的牌。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'jiuyuan',
        name: '救援',
        description:
          '主公技，锁定技，其他吴势力角色对你使用【桃】回复的体力+1。',
        type: 'lock',
        timing: ['回复体力时'],
      },
    ],
  },
  {
    key: 'ganning',
    name: '甘宁',
    title: '锦帆游侠',
    faction: 'WU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'qixi',
        name: '奇袭',
        description:
          '你可以将一张黑色牌当【过河拆桥】使用。',
        type: 'active',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'lvmeng',
    name: '吕蒙',
    title: '白衣渡江',
    faction: 'WU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'keji',
        name: '克己',
        description:
          '若你未于出牌阶段使用或打出过【杀】，你可以跳过弃牌阶段。',
        type: 'passive',
        timing: ['弃牌阶段'],
      },
    ],
  },
  {
    key: 'huanggai',
    name: '黄盖',
    title: '轻身为国',
    faction: 'WU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'kurou',
        name: '苦肉',
        description:
          '出牌阶段，你可以失去1点体力，然后摸两张牌。',
        type: 'active',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'zhouyu',
    name: '周瑜',
    title: '大都督',
    faction: 'WU',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'yingzi',
        name: '英姿',
        description: '摸牌阶段，你可以多摸一张牌。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
      {
        key: 'fanjian',
        name: '反间',
        description:
          '出牌阶段限一次，你可以令一名其他角色选择一种花色，然后获得你的一张手牌并展示之：若此牌与所选花色不同，你对其造成1点伤害。',
        type: 'active',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'daqiao',
    name: '大乔',
    title: '矜持之花',
    faction: 'WU',
    hp: 3,
    maxHp: 3,
    gender: 'female',
    pack: '标准版',
    skills: [
      {
        key: 'guose',
        name: '国色',
        description:
          '你可以将一张♦牌当【乐不思蜀】使用。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'liuli',
        name: '流离',
        description:
          '当你成为【杀】的目标时，你可以弃置一张牌并选择你攻击范围内的一名角色：该角色成为此【杀】的目标（你不再是目标）。',
        type: 'passive',
        timing: ['成为杀的目标时'],
      },
    ],
  },
  {
    key: 'luxun',
    name: '陆逊',
    title: '儒生雄才',
    faction: 'WU',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'qianxun',
        name: '谦逊',
        description:
          '锁定技，你不能成为【顺手牵羊】和【乐不思蜀】的目标。',
        type: 'lock',
        timing: ['成为目标时'],
      },
      {
        key: 'lianying',
        name: '连营',
        description:
          '当你失去最后的手牌时，你可以摸一张牌。',
        type: 'passive',
        timing: ['失去手牌后'],
      },
    ],
  },
  {
    key: 'sunshangxiang',
    name: '孙尚香',
    title: '弓腰姬',
    faction: 'WU',
    hp: 3,
    maxHp: 3,
    gender: 'female',
    pack: '标准版',
    skills: [
      {
        key: 'jieyin',
        name: '结姻',
        description:
          '出牌阶段限一次，你可以弃置两张手牌并选择一名已受伤的男性角色：你和该角色各回复1点体力。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'xiaoji',
        name: '枭姬',
        description:
          '当你失去装备区里的牌后，你可以摸两张牌。',
        type: 'passive',
        timing: ['失去装备牌后'],
      },
    ],
  },
  {
    key: 'taishici',
    name: '太史慈',
    title: '笃烈之士',
    faction: 'WU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '火',
    skills: [
      {
        key: 'tianyi',
        name: '天义',
        description:
          '出牌阶段限一次，你可以与一名角色拼点：若你赢，本回合你使用【杀】无距离限制、可以多使用一张【杀】且使用【杀】可以额外指定一个目标；若你没赢，本回合你不能使用【杀】。',
        type: 'active',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'zhoutai',
    name: '周泰',
    title: '历战之躯',
    faction: 'WU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '风',
    skills: [
      {
        key: 'buqu',
        name: '不屈',
        description:
          '锁定技，当你处于濒死状态时，将牌堆顶一张牌置于你的武将牌上：若与已有牌点数均不同，你回复至1点体力；若点数相同，将此牌置入弃牌堆。',
        type: 'lock',
        timing: ['濒死状态时'],
      },
    ],
  },
  {
    key: 'xiaoqiao',
    name: '小乔',
    title: '矫情之花',
    faction: 'WU',
    hp: 3,
    maxHp: 3,
    gender: 'female',
    pack: '风',
    skills: [
      {
        key: 'tianxiang',
        name: '天香',
        description:
          '当你受到伤害时，你可以弃置一张♥手牌：防止此伤害，然后你选择一名其他角色，该角色受到1点伤害，然后该角色摸X张牌（X为该角色已损失的体力值）。',
        type: 'passive',
        timing: ['受到伤害时'],
      },
      {
        key: 'hongyan',
        name: '红颜',
        description:
          '锁定技，你的♠牌视为♥牌。',
        type: 'lock',
        timing: ['锁定技'],
      },
    ],
  },
  {
    key: 'lusu',
    name: '鲁肃',
    title: '独断的外交家',
    faction: 'WU',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '山',
    skills: [
      {
        key: 'haoshi',
        name: '好施',
        description:
          '摸牌阶段，你可以多摸两张牌，若此时你的手牌数大于5，你须将一半（向下取整）的手牌交给手牌最少的一名其他角色。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
      {
        key: 'dimeng',
        name: '缔盟',
        description:
          '出牌阶段限一次，你可以选择两名其他角色并弃置X张牌（X为这两名角色手牌数之差的绝对值），令这两名角色交换手牌。',
        type: 'active',
        timing: ['出牌阶段'],
      },
    ],
  },
];

// ── QUN faction ────────────────────────────────────────────────────────

const qun: SeedGeneral[] = [
  {
    key: 'huatuo',
    name: '华佗',
    title: '神医',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'qingnang',
        name: '青囊',
        description:
          '出牌阶段限一次，你可以弃置一张手牌，令一名已受伤的角色回复1点体力。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'jijiu',
        name: '急救',
        description:
          '你的回合外，你可以将一张红色牌当【桃】使用。',
        type: 'active',
        timing: ['回合外'],
      },
    ],
  },
  {
    key: 'lvbu',
    name: '吕布',
    title: '武的化身',
    faction: 'QUN',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'wushuang',
        name: '无双',
        description:
          '锁定技，你使用【杀】指定目标后，该目标角色需连续使用两张【闪】才能抵消此【杀】；你使用【决斗】指定目标后，或成为【决斗】的目标后，对方每次须连续打出两张【杀】。',
        type: 'lock',
        timing: ['使用杀或决斗时'],
      },
    ],
  },
  {
    key: 'diaochan',
    name: '貂蝉',
    title: '绝世的舞姬',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'female',
    pack: '标准版',
    skills: [
      {
        key: 'lijian',
        name: '离间',
        description:
          '出牌阶段限一次，你可以弃置一张牌并选择两名男性角色：视为其中一名角色对另一名角色使用一张【决斗】（此【决斗】不能被【无懈可击】响应）。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'biyue',
        name: '闭月',
        description: '结束阶段，你可以摸一张牌。',
        type: 'passive',
        timing: ['结束阶段'],
      },
    ],
  },
  {
    key: 'yuanshao',
    name: '袁绍',
    title: '高贵的名门',
    faction: 'QUN',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '火',
    skills: [
      {
        key: 'luanji',
        name: '乱击',
        description:
          '你可以将两张手牌当【万箭齐发】使用。',
        type: 'active',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'dongzhuo',
    name: '董卓',
    title: '魔王',
    faction: 'QUN',
    hp: 8,
    maxHp: 8,
    gender: 'male',
    pack: '林',
    skills: [
      {
        key: 'jiuchi',
        name: '酒池',
        description:
          '你可以将一张♠手牌当【酒】使用。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'roulin',
        name: '肉林',
        description:
          '锁定技，你对女性角色使用【杀】时，该角色须使用两张【闪】才能抵消；女性角色对你使用【杀】时，你须使用两张【闪】才能抵消。',
        type: 'lock',
        timing: ['使用杀时', '成为杀的目标时'],
      },
      {
        key: 'benghuai',
        name: '崩坏',
        description:
          '锁定技，结束阶段，若你的体力值大于其他角色，你须选择一项：失去1点体力，或减1点体力上限。',
        type: 'lock',
        timing: ['结束阶段'],
      },
      {
        key: 'baonue',
        name: '暴虐',
        description:
          '主公技，当其他群势力角色造成伤害后，该角色可以进行判定：若为♠，你回复1点体力。',
        type: 'passive',
        timing: ['造成伤害后'],
      },
    ],
  },
  {
    key: 'jiaxu',
    name: '贾诩',
    title: '毒士',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '林',
    skills: [
      {
        key: 'wansha',
        name: '完杀',
        description:
          '锁定技，你的回合内，不处于濒死状态的角色不能使用【桃】。',
        type: 'lock',
        timing: ['锁定技'],
      },
      {
        key: 'luanwu',
        name: '乱武',
        description:
          '限定技，出牌阶段，你可以令所有其他角色依次对距离最近的角色使用一张【杀】，否则失去1点体力。',
        type: 'limited',
        timing: ['出牌阶段'],
      },
      {
        key: 'weimu',
        name: '帷幕',
        description:
          '锁定技，你不能成为黑色锦囊牌的目标。',
        type: 'lock',
        timing: ['成为目标时'],
      },
    ],
  },
  {
    key: 'pangde',
    name: '庞德',
    title: '人马一体',
    faction: 'QUN',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '火',
    skills: [
      {
        key: 'mashu_pangde',
        name: '马术',
        description: '锁定技，你计算与其他角色的距离-1。',
        type: 'lock',
        timing: ['锁定技'],
      },
      {
        key: 'mengjin',
        name: '猛进',
        description:
          '当你使用【杀】对目标角色造成伤害前，若该角色有牌，你可以弃置其一张牌。',
        type: 'passive',
        timing: ['造成伤害前'],
      },
    ],
  },
  {
    key: 'zuoci',
    name: '左慈',
    title: '迷之仙人',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '山',
    skills: [
      {
        key: 'huashen',
        name: '化身',
        description:
          '游戏开始前，你随机获得两张武将牌作为"化身"。在每个回合开始阶段和结束阶段，你可以更换化身武将牌。你拥有化身武将牌上的一个技能（锁定技、觉醒技和限定技除外）。',
        type: 'active',
        timing: ['回合开始时', '结束阶段'],
      },
      {
        key: 'xinsheng',
        name: '新生',
        description:
          '当你受到1点伤害后，你可以获得一张新的"化身"武将牌。',
        type: 'passive',
        timing: ['受到伤害后'],
      },
    ],
  },
  {
    key: 'zhangjiao',
    name: '张角',
    title: '天公将军',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '风',
    skills: [
      {
        key: 'leiji',
        name: '雷击',
        description:
          '当你使用或打出一张【闪】时，你可以令一名角色进行判定：若结果为♠，你对该角色造成2点雷电伤害。',
        type: 'passive',
        timing: ['使用或打出闪时'],
      },
      {
        key: 'guidao',
        name: '鬼道',
        description:
          '当一名角色的判定牌生效前，你可以用一张黑色牌替换之。',
        type: 'passive',
        timing: ['判定牌生效前'],
      },
      {
        key: 'huangtian',
        name: '黄天',
        description:
          '主公技，其他群势力角色的出牌阶段限一次，该角色可以交给你一张【闪】或【闪电】。',
        type: 'passive',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'caiwenjii',
    name: '蔡文姬',
    title: '金璧之才',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'female',
    pack: '山',
    skills: [
      {
        key: 'beige',
        name: '悲歌',
        description:
          '当一名角色受到【杀】造成的伤害后，你可以弃置一张牌，令其进行判定：♥回复1点体力；♦摸两张牌；♣伤害来源弃置两张牌；♠伤害来源翻面。',
        type: 'passive',
        timing: ['受到杀的伤害后'],
      },
      {
        key: 'duanchang',
        name: '断肠',
        description:
          '锁定技，当你死亡时，杀死你的角色失去所有技能。',
        type: 'lock',
        timing: ['死亡时'],
      },
    ],
  },
  {
    key: 'yuanshu',
    name: '袁术',
    title: '仲家帝',
    faction: 'QUN',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '林',
    skills: [
      {
        key: 'wangzun',
        name: '妄尊',
        description:
          '锁定技，其他角色的准备阶段，若该角色的体力值大于你，该角色本回合手牌上限-1。',
        type: 'lock',
        timing: ['准备阶段'],
      },
      {
        key: 'tongji',
        name: '同疾',
        description:
          '锁定技，当其他角色使用【杀】指定你为目标时，若你的手牌数大于该角色，此【杀】对你无效。',
        type: 'lock',
        timing: ['成为杀的目标时'],
      },
    ],
  },
  {
    key: 'zhangxiu',
    name: '张绣',
    title: '北地枪王',
    faction: 'QUN',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '一将成名',
    skills: [
      {
        key: 'congjian',
        name: '从谏',
        description:
          '当你成为其他角色使用的锦囊牌的目标时，你可以对其中一个目标角色（包括你）摸一张牌。',
        type: 'passive',
        timing: ['成为锦囊牌的目标时'],
      },
    ],
  },
];

// ── Additional generals (placeholders + some with data) ────────────────

const additional: SeedGeneral[] = [
  // WEI additional
  {
    key: 'xuzhu_sp',
    name: '徐晃',
    title: '周亚夫之风',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '标准版',
    skills: [
      {
        key: 'duanliang',
        name: '断粮',
        description:
          '你可以将一张黑色基本牌或黑色装备牌当【兵粮寸断】使用；你对其他角色使用【兵粮寸断】时无距离限制。',
        type: 'active',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'caozhang',
    name: '曹彰',
    title: '黄须儿',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '一将成名',
    skills: [
      {
        key: 'jiangchi',
        name: '将驰',
        description:
          '摸牌阶段，你可以选择一项：多摸一张牌，本回合不能使用或打出【杀】；或少摸一张牌，本回合使用【杀】无距离限制且次数+1。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
    ],
  },
  {
    key: 'yujin',
    name: '于禁',
    title: '毅重的将军',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '一将成名',
    skills: [
      {
        key: 'zhenjun',
        name: '镇军',
        description: '待补充',
        type: 'passive',
        timing: ['出牌阶段'],
      },
    ],
  },
  // SHU additional
  {
    key: 'menghuo',
    name: '孟获',
    title: '南蛮王',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '林',
    skills: [
      {
        key: 'huoshou',
        name: '祸首',
        description:
          '锁定技，【南蛮入侵】对你无效；当其他角色使用【南蛮入侵】造成伤害时，你是伤害来源。',
        type: 'lock',
        timing: ['锁定技'],
      },
      {
        key: 'zaiqi',
        name: '再起',
        description:
          '摸牌阶段，若你已受伤，你可以放弃摸牌，然后翻开牌堆顶的X张牌（X为你已损失的体力值）：其中每有一张♥牌，你回复1点体力，然后弃置其余的牌。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
    ],
  },
  {
    key: 'zhurong',
    name: '祝融',
    title: '野性的女王',
    faction: 'SHU',
    hp: 4,
    maxHp: 4,
    gender: 'female',
    pack: '林',
    skills: [
      {
        key: 'juxiang',
        name: '巨象',
        description:
          '锁定技，【南蛮入侵】对你无效；当你受到【南蛮入侵】的伤害时，你获得此【南蛮入侵】。',
        type: 'lock',
        timing: ['锁定技'],
      },
      {
        key: 'lieren',
        name: '烈刃',
        description:
          '当你使用【杀】对目标角色造成伤害后，你可以与该角色拼点：若你赢，你获得该角色的一张牌。',
        type: 'passive',
        timing: ['造成伤害后'],
      },
    ],
  },
  // WU additional
  {
    key: 'sunce',
    name: '孙策',
    title: '江东的小霸王',
    faction: 'WU',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '林',
    skills: [
      {
        key: 'jiang',
        name: '激昂',
        description:
          '当你使用或打出红色的【杀】或【决斗】时，你可以摸一张牌。',
        type: 'passive',
        timing: ['使用或打出杀或决斗时'],
      },
      {
        key: 'hunzi',
        name: '魂姿',
        description:
          '觉醒技，准备阶段，若你的体力值为1，你减1点体力上限，然后获得技能"英姿"和"英魂"。',
        type: 'awakening',
        timing: ['准备阶段'],
      },
      {
        key: 'zhiba',
        name: '制霸',
        description:
          '主公技，其他吴势力角色的出牌阶段限一次，该角色可以与你拼点：若该角色没赢，你可以获得双方拼点的牌。',
        type: 'passive',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'zhangzhao_zhanghong',
    name: '张昭张纮',
    title: '经天纬地',
    faction: 'WU',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '山',
    skills: [
      {
        key: 'zhijian',
        name: '直谏',
        description:
          '出牌阶段，你可以将手牌中的一张装备牌置入其他角色的装备区（须可以使用），然后摸一张牌。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'guzheng',
        name: '固政',
        description:
          '其他角色的弃牌阶段结束时，你可以将该角色于此阶段弃置的一张牌交给该角色，然后获得其余的牌。',
        type: 'passive',
        timing: ['弃牌阶段结束时'],
      },
    ],
  },
  // QUN additional
  {
    key: 'yanliangwenchou',
    name: '颜良文丑',
    title: '河北上将',
    faction: 'QUN',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '火',
    skills: [
      {
        key: 'shuangxiong',
        name: '双雄',
        description:
          '摸牌阶段，你可以放弃摸牌并进行判定：获得此判定牌，本回合你可以将与此判定牌不同颜色的手牌当【决斗】使用。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
    ],
  },
  {
    key: 'chengong',
    name: '陈宫',
    title: '刚直壮烈',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '一将成名',
    skills: [
      {
        key: 'mingce',
        name: '明策',
        description:
          '出牌阶段限一次，你可以将一张装备牌或【杀】交给一名其他角色，然后令该角色选择一项：对其攻击范围内你指定的角色使用一张【杀】，或摸一张牌。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'zhichi',
        name: '智迟',
        description:
          '锁定技，你的回合外，当你受到伤害后，本回合内【杀】和非延时锦囊牌对你无效。',
        type: 'lock',
        timing: ['受到伤害后'],
      },
    ],
  },
  {
    key: 'jiling',
    name: '纪灵',
    title: '袁术的走狗',
    faction: 'QUN',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    pack: '一将成名',
    skills: [
      {
        key: 'shuangren',
        name: '双刃',
        description:
          '出牌阶段开始时，你可以与一名角色拼点：若你赢，你视为对其与其距离为1以内的一名角色使用一张【杀】；若你没赢，你本回合不能使用【杀】。',
        type: 'passive',
        timing: ['出牌阶段开始时'],
      },
    ],
  },
  {
    key: 'liubiao',
    name: '刘表',
    title: '跨蹈汉南',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '山',
    skills: [
      {
        key: 'zishou',
        name: '自守',
        description:
          '摸牌阶段，你可以多摸X张牌（X为现存势力数），然后本回合你不能使用或打出牌指定其他角色为目标。',
        type: 'passive',
        timing: ['摸牌阶段'],
      },
      {
        key: 'zongshi',
        name: '宗室',
        description:
          '锁定技，你的手牌上限+X（X为现存势力数）。',
        type: 'lock',
        timing: ['锁定技'],
      },
    ],
  },
  {
    key: 'manchong',
    name: '满宠',
    title: '计略过人',
    faction: 'WEI',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '一将成名',
    skills: [
      {
        key: 'junxing',
        name: '峻刑',
        description:
          '出牌阶段限一次，你可以弃置至少一张手牌并选择一名其他角色：若该角色不弃置一张与你弃置的牌类别均不同的手牌，该角色翻面。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'yuce',
        name: '御策',
        description:
          '当你受到伤害后，你可以展示一张手牌，若伤害来源不弃置与该牌类别不同的一张手牌，你回复1点体力。',
        type: 'passive',
        timing: ['受到伤害后'],
      },
    ],
  },
  {
    key: 'xunyou',
    name: '荀攸',
    title: '曹操的谋主',
    faction: 'WEI',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '一将成名',
    skills: [
      {
        key: 'qice',
        name: '奇策',
        description:
          '出牌阶段限一次，你可以将所有手牌（至少一张）当任意一张非延时锦囊牌使用。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'zhiyu',
        name: '智愚',
        description:
          '当你受到伤害后，你可以摸一张牌并展示所有手牌：若颜色均相同，伤害来源弃置一张手牌。',
        type: 'passive',
        timing: ['受到伤害后'],
      },
    ],
  },
  {
    key: 'liru',
    name: '李儒',
    title: '魔仕',
    faction: 'QUN',
    hp: 3,
    maxHp: 3,
    gender: 'male',
    pack: '一将成名',
    skills: [
      {
        key: 'juece',
        name: '绝策',
        description:
          '结束阶段，你可以对没有手牌的一名其他角色造成1点伤害。',
        type: 'passive',
        timing: ['结束阶段'],
      },
      {
        key: 'mieji',
        name: '灭计',
        description:
          '出牌阶段限一次，你可以将一张黑色非基本牌置于牌堆顶，令一名有手牌的其他角色选择一项：展示所有手牌并弃置其中所有非基本牌，或弃置一张手牌。',
        type: 'active',
        timing: ['出牌阶段'],
      },
      {
        key: 'fencheng',
        name: '焚城',
        description:
          '限定技，出牌阶段，你可以令所有其他角色依次选择一项：弃置X张牌（X为该角色装备区里的牌数+1），或受到你造成的2点火焰伤害。',
        type: 'limited',
        timing: ['出牌阶段'],
      },
    ],
  },
  {
    key: 'zhangchunhua',
    name: '张春华',
    title: '冷血皇后',
    faction: 'WEI',
    hp: 3,
    maxHp: 3,
    gender: 'female',
    pack: '一将成名',
    skills: [
      {
        key: 'jueqing',
        name: '绝情',
        description:
          '锁定技，你造成的伤害均视为体力流失。',
        type: 'lock',
        timing: ['造成伤害时'],
      },
      {
        key: 'shangshi',
        name: '伤逝',
        description:
          '当你的手牌数小于你已损失的体力值时，你可以将手牌补至等于你已损失的体力值。',
        type: 'passive',
        timing: ['失去手牌后', '受到伤害后'],
      },
    ],
  },
];

// ── Export all seed generals ───────────────────────────────────────────

export const seedGenerals: SeedGeneral[] = [
  ...wei,
  ...shu,
  ...wu,
  ...qun,
  ...additional,
];
