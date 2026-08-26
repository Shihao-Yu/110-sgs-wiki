import type { Metadata } from "next";
import { Suspense } from "react";
import { getNavigationItemBySlug } from "@/lib/site";
import { entityStore } from "@/lib/entity-store";
import { averageTier } from "@/lib/ratings";
import GeneralListClient, {
  type GeneralEntry,
} from "./components/GeneralListClient";

const section = getNavigationItemBySlug("generals");

export const metadata: Metadata = {
  title: section?.label ?? "武将",
  description: "三国杀国战武将图鉴 — 群狼环鼎武将包，按势力筛选，按武将名与称号搜索。",
};

export default async function GeneralsPage() {
  const [generals, ratings] = await Promise.all([
    entityStore.getGenerals(),
    entityStore.getRatings(),
  ]);

  const entries: GeneralEntry[] = generals
    // 十常侍 10 名子卡没有独立详情页，只在父卡页面展示
    .filter((g) => !(g as { parentGeneralId?: string }).parentGeneralId)
    .map((g) => ({
      id: g.id,
      name: g.name,
      title: g.title,
      faction: g.faction,
      hp: g.hp,
      image: g.image,
      averageTier: averageTier(ratings[g.id as unknown as string] ?? null),
    }));

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">武将</span>
        <h1 className="section-title mt-3">武将图鉴</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          浏览群狼环鼎武将包共 {entries.length} 名武将，按势力筛选，或搜索武将名与称号。
        </p>
      </header>

      <Suspense fallback={null}>
        <GeneralListClient generals={entries} />
      </Suspense>
    </div>
  );
}
