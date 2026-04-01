import type { Metadata } from "next";
import { getNavigationItemBySlug } from "@/lib/site";
import faqData from "../../../../data/src/faq.json";
import generalsData from "../../../../data/src/generals.json";
import skillsData from "../../../../data/src/skills.json";
import FaqListClient, {
  type FaqCategory,
  type FaqEntry,
} from "./components/FaqListClient";

/* ------------------------------------------------------------------ */
/*  Types for raw JSON shapes                                          */
/* ------------------------------------------------------------------ */

type RawFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedGeneralIds?: string[];
  relatedSkillIds?: string[];
  relatedCardIds?: string[];
};

type RawGeneral = {
  id: string;
  name: string;
};

type RawSkill = {
  id: string;
  name: string;
};

/* ------------------------------------------------------------------ */
/*  Lookup maps (built once at build time)                             */
/* ------------------------------------------------------------------ */

const section = getNavigationItemBySlug("faq");

const generalNameMap = new Map<string, string>(
  (generalsData as RawGeneral[]).map((g) => [g.id, g.name]),
);

const skillNameMap = new Map<string, string>(
  (skillsData as RawSkill[]).map((s) => [s.id, s.name]),
);

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: section?.label ?? "FAQ",
  description:
    "\u4E09\u56FD\u6740\u56FD\u6218\u5E38\u89C1\u95EE\u7B54 \u2014 \u89C4\u5219\u88C1\u5B9A\u3001\u6B66\u5C06\u6280\u80FDFAQ\u3001\u4E89\u8BAE\u95EE\u9898\u6F84\u6E05\u3002",
};

/* ------------------------------------------------------------------ */
/*  Build entries for the client                                       */
/* ------------------------------------------------------------------ */

function buildFaqEntries(): FaqEntry[] {
  return (faqData as RawFaq[]).map((raw) => {
    const category: FaqCategory =
      raw.category === "rule" ? "rule" : "general";

    const relatedGenerals = (raw.relatedGeneralIds ?? [])
      .map((gid) => {
        const name = generalNameMap.get(gid);
        if (!name) return null;
        return { id: gid, name, href: `/generals/${gid}` };
      })
      .filter((g): g is NonNullable<typeof g> => g != null);

    const relatedSkills = (raw.relatedSkillIds ?? [])
      .map((sid) => skillNameMap.get(sid))
      .filter((n): n is string => n != null);

    return {
      id: raw.id,
      question: raw.question,
      answer: raw.answer,
      category,
      relatedGenerals,
      relatedSkills,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FaqPage() {
  const entries = buildFaqEntries();

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">FAQ</span>
        <h1 className="section-title mt-3">
          {"\u5E38\u89C1\u95EE\u7B54"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {"\u5171"} {entries.length}{" "}
          {"\u6761\u5E38\u89C1\u95EE\u7B54\uFF0C\u6DB5\u76D6\u56FD\u6218\u89C4\u5219\u88C1\u5B9A\u4E0E\u6B66\u5C06\u6280\u80FD\u7591\u96BE\u89E3\u7B54\u3002"}
        </p>
      </header>

      <FaqListClient entries={entries} />
    </div>
  );
}
