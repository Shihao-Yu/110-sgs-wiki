export const siteConfig = {
  name: "三国杀国战 Wiki",
  description:
    "A Next.js shell for the Sanguosha Kingdom War wiki, sandbox, replay viewer, and statistics dashboard.",
  footer:
    "Static frontend shell built with Next.js App Router and Tailwind CSS.",
} as const;

export const navigationItems = [
  {
    slug: "generals",
    href: "/generals",
    label: "武将",
    english: "Generals",
    description: "武将图鉴、技能说明、FAQ 与后续配将分析入口。",
    cardClassName:
      "border-wei/20 bg-gradient-to-br from-wei/10 via-white to-white dark:from-wei/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-wei/20 bg-wei/10 text-wei dark:border-wei/40 dark:bg-wei/20 dark:text-blue-300",
    plannedFeatures: [
      "武将列表与筛选",
      "技能与FAQ详情",
      "配将与胜率洞察",
    ],
  },
  {
    slug: "cards",
    href: "/cards",
    label: "卡牌",
    english: "Cards",
    description: "基础牌、锦囊牌、装备牌与牌堆分布信息。",
    cardClassName:
      "border-shu/20 bg-gradient-to-br from-shu/10 via-white to-white dark:from-shu/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-shu/20 bg-shu/10 text-shu dark:border-shu/40 dark:bg-shu/20 dark:text-red-300",
    plannedFeatures: [
      "卡牌百科与效果说明",
      "花色点数分布",
      "牌堆与装备索引",
    ],
  },
  {
    slug: "sandbox",
    href: "/sandbox",
    label: "沙盒",
    english: "Sandbox",
    description: "浏览器内国战对局实验场，后续接入规则引擎与交互桌面。",
    cardClassName:
      "border-wu/20 bg-gradient-to-br from-wu/10 via-white to-white dark:from-wu/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-wu/20 bg-wu/10 text-wu dark:border-wu/40 dark:bg-wu/20 dark:text-green-300",
    plannedFeatures: [
      "对局桌面与行动面板",
      "双将展示与翻面状态",
      "AI 与规则流程联调",
    ],
  },
  {
    slug: "replay",
    href: "/replay",
    label: "录像",
    english: "Replay",
    description: "QSanguosha 录像导入、回放控制与事件时间线占位页。",
    cardClassName:
      "border-jin/20 bg-gradient-to-br from-jin/10 via-white to-white dark:from-jin/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-jin/20 bg-jin/10 text-jin dark:border-jin/40 dark:bg-jin/20 dark:text-purple-200",
    plannedFeatures: [
      "录像导入与校验",
      "逐回合回放时间线",
      "事件与技能触发面板",
    ],
  },
  {
    slug: "stats",
    href: "/stats",
    label: "统计",
    english: "Stats",
    description: "胜率看板、维度评分、因子分析与后续图表面板。",
    cardClassName:
      "border-brand/20 bg-gradient-to-br from-brand/10 via-white to-white dark:from-brand/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-brand/20 bg-brand/10 text-brand dark:border-brand/40 dark:bg-brand/20 dark:text-red-200",
    plannedFeatures: [
      "胜率与出场率榜单",
      "雷达图与维度评分",
      "因子与配将分析",
    ],
  },
  {
    slug: "faq",
    href: "/faq",
    label: "FAQ",
    english: "FAQ",
    description: "争议裁定、常见问题与规则澄清的统一入口。",
    cardClassName:
      "border-qun/20 bg-gradient-to-br from-qun/10 via-white to-white dark:from-qun/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-qun/20 bg-qun/10 text-qun dark:border-qun/40 dark:bg-qun/20 dark:text-yellow-200",
    plannedFeatures: [
      "通用规则问答",
      "技能与武将裁定整理",
      "后续全文检索入口",
    ],
  },
] as const;

export type SectionSlug = (typeof navigationItems)[number]["slug"];

export const statsPreviewItems = [
  {
    label: "Generals",
    value: "341+",
    description: "Target coverage for the full Kingdom War general roster.",
  },
  {
    label: "Skills",
    value: "600+",
    description: "Planned skill and FAQ knowledge surface from the data layer.",
  },
  {
    label: "Replay",
    value: "Timeline",
    description: "Playback and analysis UI will attach to imported QSanguosha logs.",
  },
  {
    label: "Simulation",
    value: "MC",
    description: "Future Monte Carlo results will drive the stats dashboard.",
  },
] as const;

export function getNavigationItemBySlug(slug: string) {
  return navigationItems.find((item) => item.slug === slug);
}
