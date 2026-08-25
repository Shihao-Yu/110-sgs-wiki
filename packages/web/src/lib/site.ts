export const siteConfig = {
  name: "三国杀国战 Wiki",
  description: "三国杀国战武将、卡牌与 FAQ 的中文资料站。",
  footer: "三国杀国战玩家自用资料站。",
} as const;

export const navigationItems = [
  {
    slug: "generals",
    href: "/generals",
    label: "武将",
    description: "武将图鉴、标记牌与 FAQ 入口。",
    cardClassName:
      "border-wei/20 bg-gradient-to-br from-wei/10 via-white to-white dark:from-wei/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-wei/20 bg-wei/10 text-wei dark:border-wei/40 dark:bg-wei/20 dark:text-blue-300",
  },
  {
    slug: "cards",
    href: "/cards",
    label: "卡牌",
    description: "基础牌、锦囊牌、装备牌与牌堆分布信息。",
    cardClassName:
      "border-shu/20 bg-gradient-to-br from-shu/10 via-white to-white dark:from-shu/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-shu/20 bg-shu/10 text-shu dark:border-shu/40 dark:bg-shu/20 dark:text-red-300",
  },
  {
    slug: "faq",
    href: "/faq",
    label: "FAQ",
    description: "争议裁定、常见问题与规则澄清的统一入口。",
    cardClassName:
      "border-qun/20 bg-gradient-to-br from-qun/10 via-white to-white dark:from-qun/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-qun/20 bg-qun/10 text-qun dark:border-qun/40 dark:bg-qun/20 dark:text-yellow-200",
  },
  {
    slug: "session",
    href: "/session",
    label: "牌局",
    description: "记录场上各位玩家亮出的将，桌上人手一台手机就能查。",
    cardClassName:
      "border-jin/20 bg-gradient-to-br from-jin/10 via-white to-white dark:from-jin/20 dark:via-slate-950 dark:to-slate-900",
    pillClassName:
      "border-jin/20 bg-jin/10 text-jin dark:border-jin/40 dark:bg-jin/20 dark:text-purple-200",
  },
] as const;

export type SectionSlug = (typeof navigationItems)[number]["slug"];

export function getNavigationItemBySlug(slug: string) {
  return navigationItems.find((item) => item.slug === slug);
}
