import type { Metadata } from "next";
import { getNavigationItemBySlug } from "@/lib/site";
import { entityStore } from "@/lib/entity-store";
import GeneralListClient, {
  type GeneralEntry,
} from "./components/GeneralListClient";

const section = getNavigationItemBySlug("generals");

export const metadata: Metadata = {
  title: section?.label ?? "武将",
  description: "三国杀国战武将图鉴 — 按势力、体力筛选，按名称搜索。",
};

export default async function GeneralsPage() {
  const [generals, skills] = await Promise.all([
    entityStore.getGenerals(),
    entityStore.getSkills(),
  ]);

  const skillNameMap = new Map(skills.map((s) => [s.id, s.name]));

  const entries: GeneralEntry[] = generals.map((g) => ({
    id: g.id,
    name: g.name,
    title: g.title,
    faction: g.faction,
    hp: g.hp,
    image: g.image,
    skillNames: (g.skills as unknown as string[])
      .map((sid) => skillNameMap.get(sid as unknown as typeof skills[number]["id"]))
      .filter((n): n is string => n != null),
  }));

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">武将</span>
        <h1 className="section-title mt-3">武将图鉴</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          浏览全部 {entries.length} 名国战武将，按势力、体力筛选，或搜索武将名、称号与技能名。
        </p>
      </header>

      <GeneralListClient generals={entries} />
    </div>
  );
}
