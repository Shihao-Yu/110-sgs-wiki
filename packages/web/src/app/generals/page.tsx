import type { Metadata } from "next";
import type { Faction } from "@sgs/data";
import { getNavigationItemBySlug } from "@/lib/site";
import generalsData from "../../../../data/src/generals.json";
import skillsData from "../../../../data/src/skills.json";
import GeneralListClient, {
  type GeneralEntry,
} from "./components/GeneralListClient";

const section = getNavigationItemBySlug("generals");

export const metadata: Metadata = {
  title: section?.label ?? "武将",
  description: "三国杀国战武将图鉴 — 按势力、体力筛选，按名称搜索。",
};

/** Build a skill-id to skill-name lookup at module scope (runs once at build time). */
const skillNameMap = new Map<string, string>(
  (skillsData as { id: string; name: string }[]).map((s) => [s.id, s.name])
);

/** Map raw generals data into the shape consumed by the client component. */
function buildGeneralEntries(): GeneralEntry[] {
  return (
    generalsData as {
      id: string;
      name: string;
      title: string;
      faction: Faction;
      hp: number;
      image: string;
      skills: string[];
    }[]
  ).map((g) => ({
    id: g.id,
    name: g.name,
    title: g.title,
    faction: g.faction,
    hp: g.hp,
    image: g.image,
    skillNames: g.skills
      .map((sid) => skillNameMap.get(sid))
      .filter((n): n is string => n != null),
  }));
}

export default function GeneralsPage() {
  const generals = buildGeneralEntries();

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">武将</span>
        <h1 className="section-title mt-3">武将图鉴</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          浏览全部 {generals.length} 名国战武将，按势力、体力筛选，或搜索武将名、称号与技能名。
        </p>
      </header>

      <GeneralListClient generals={generals} />
    </div>
  );
}
