import type { Metadata } from "next";
import Link from "next/link";
import { getNavigationItemBySlug } from "@/lib/site";

const section = getNavigationItemBySlug("stats");

export const metadata: Metadata = {
  title: section?.label ?? "统计",
  description: "国战武将胜率、维度评分、因子分析与模拟看板入口。",
};

const subSections = [
  {
    href: "/stats/leaderboard",
    title: "胜率排行榜",
    english: "Leaderboard",
    description: "按胜率排名的武将榜单，支持势力筛选与多维排序。",
    iconPath:
      "M3 10h4v11H3zm7-4h4v15h-4zm7-3h4v18h-4z",
  },
  {
    href: "/stats/compare",
    title: "武将对比",
    english: "Comparison",
    description: "选择 2-4 名武将，叠加雷达图对比四维评分与属性差异。",
    iconPath:
      "M8 7h3V4H8zm0 13h3v-3H8zm5-13h3V4h-3zm0 13h3v-3h-3zM3 11h18v2H3z",
  },
  {
    href: "/stats/factors",
    title: "因子分析",
    english: "Factor Analysis",
    description: "影响胜率的核心因子拆解与权重分析面板。",
    iconPath:
      "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  },
  {
    href: "/stats/simulate",
    title: "模拟引擎",
    english: "Simulation",
    description: "蒙特卡洛模拟配置与批量对局数据生成面板。",
    iconPath:
      "M22 18V2H6v16h16zm-2-2H8V4h12v12zM4 6H2v16h16v-2H4V6zm10 5l-4 4h3v2h2v-2h3l-4-4z",
  },
] as const;

export default function StatsPage() {
  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">Stats</span>
        <h1 className="section-title mt-3">统计面板</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          国战武将胜率看板、维度评分、因子分析与蒙特卡洛模拟入口。选择下方模块开始浏览。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {subSections.map((sub) => {
          const inner = (
            <div className="panel group relative flex h-full flex-col p-6 transition-shadow hover:shadow-lg">
              {/* Icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand dark:border-brand/30 dark:bg-brand/15">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d={sub.iconPath} />
                </svg>
              </div>

              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {sub.english}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {sub.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {sub.description}
              </p>

              {/* Coming soon badge */}
              {"comingSoon" in sub && sub.comingSoon && (
                <span className="mt-3 inline-flex w-fit rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                  即将上线
                </span>
              )}
            </div>
          );

          if ("comingSoon" in sub && sub.comingSoon) {
            return (
              <div
                key={sub.href}
                className="cursor-default opacity-60"
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={sub.href}
              className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              href={sub.href}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
