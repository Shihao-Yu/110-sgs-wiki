import type { Metadata } from "next";
import { getNavigationItemBySlug } from "@/lib/site";
import { entityStore } from "@/lib/entity-store";
import FaqListClient, {
  type FaqCategory,
  type FaqEntry,
} from "./components/FaqListClient";

const section = getNavigationItemBySlug("faq");

export const metadata: Metadata = {
  title: section?.label ?? "FAQ",
  description:
    "三国杀国战常见问答 — 规则裁定、武将技能FAQ、争议问题澄清。",
};

export default async function FaqPage() {
  const [faqs, generals, skills] = await Promise.all([
    entityStore.getFaqs(),
    entityStore.getGenerals(),
    entityStore.getSkills(),
  ]);

  const generalNameMap = new Map<string, string>(
    generals.map((g) => [g.id as unknown as string, g.name]),
  );
  const skillNameMap = new Map<string, string>(
    skills.map((s) => [s.id as unknown as string, s.name]),
  );

  const entries: FaqEntry[] = faqs.map((raw) => {
    const category: FaqCategory =
      raw.category === "rule" ? "rule" : "general";

    const relatedGenerals = ((raw.relatedGeneralIds as unknown as string[]) ?? [])
      .map((gid) => {
        const name = generalNameMap.get(gid);
        if (!name) return null;
        return { id: gid, name, href: `/generals/${gid}` };
      })
      .filter((g): g is NonNullable<typeof g> => g != null);

    const relatedSkills = ((raw.relatedSkillIds as unknown as string[]) ?? [])
      .map((sid) => skillNameMap.get(sid))
      .filter((n): n is string => n != null);

    return {
      id: raw.id as unknown as string,
      question: raw.question,
      answer: raw.answer,
      category,
      relatedGenerals,
      relatedSkills,
    };
  });

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">FAQ</span>
        <h1 className="section-title mt-3">
          {"常见问答"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {"共"} {entries.length}{" "}
          {"条常见问答，涵盖国战规则裁定与武将技能疑难解答。"}
        </p>
      </header>

      <FaqListClient entries={entries} />
    </div>
  );
}
