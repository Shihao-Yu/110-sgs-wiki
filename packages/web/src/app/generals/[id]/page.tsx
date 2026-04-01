import type { Metadata } from "next";
import type { Faction } from "@sgs/data";
import Link from "next/link";
import { notFound } from "next/navigation";
import generalsData from "../../../../../data/src/generals.json";
import skillsData from "../../../../../data/src/skills.json";
import faqData from "../../../../../data/src/faq.json";
import GeneralImage from "./components/GeneralImage";
import RadarChart from "./components/RadarChart";
import SkillCard from "./components/SkillCard";

/* ---------- Types for the raw JSON shapes ---------- */

type RawGeneral = {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  subfaction?: Faction;
  hp: number;
  maxHp: number;
  gender: string;
  skills: string[];
  image: string;
  pack: string;
};

type RawSkill = {
  id: string;
  name: string;
  description: string;
  type: "active" | "passive" | "lock" | "limited" | "awakening" | "mission";
  timing: string[];
  generalIds: string[];
  faq: { id: string; question: string; answer: string }[];
};

type RawFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedGeneralIds?: string[];
  relatedSkillIds?: string[];
};

/* ---------- Lookup maps (built once at build time) ---------- */

const generals = generalsData as RawGeneral[];
const skills = skillsData as RawSkill[];
const faqs = faqData as RawFaq[];

const generalMap = new Map(generals.map((g) => [g.id, g]));
const skillMap = new Map(skills.map((s) => [s.id, s]));

/* ---------- Faction display helpers ---------- */

const FACTION_META: Record<
  Faction,
  { label: string; badge: string; hex: string }
> = {
  WEI: {
    label: "魏",
    badge:
      "border-wei/25 bg-wei/15 text-wei dark:border-wei/40 dark:bg-wei/25 dark:text-blue-300",
    hex: "#2563EB",
  },
  SHU: {
    label: "蜀",
    badge:
      "border-shu/25 bg-shu/15 text-shu dark:border-shu/40 dark:bg-shu/25 dark:text-red-300",
    hex: "#DC2626",
  },
  WU: {
    label: "吴",
    badge:
      "border-wu/25 bg-wu/15 text-wu dark:border-wu/40 dark:bg-wu/25 dark:text-green-300",
    hex: "#16A34A",
  },
  QUN: {
    label: "群",
    badge:
      "border-qun/30 bg-qun/15 text-qun dark:border-qun/40 dark:bg-qun/25 dark:text-yellow-200",
    hex: "#CA8A04",
  },
  JIN: {
    label: "晋",
    badge:
      "border-jin/25 bg-jin/15 text-jin dark:border-jin/40 dark:bg-jin/25 dark:text-purple-200",
    hex: "#9333EA",
  },
};

const FACTION_GRADIENT: Record<Faction, string> = {
  WEI: "from-wei/20 to-wei/5 dark:from-wei/30 dark:to-wei/10",
  SHU: "from-shu/20 to-shu/5 dark:from-shu/30 dark:to-shu/10",
  WU: "from-wu/20 to-wu/5 dark:from-wu/30 dark:to-wu/10",
  QUN: "from-qun/20 to-qun/5 dark:from-qun/30 dark:to-qun/10",
  JIN: "from-jin/20 to-jin/5 dark:from-jin/30 dark:to-jin/10",
};

/* ---------- Static params for all 341 generals ---------- */

export function generateStaticParams() {
  return generals.map((g) => ({ id: g.id }));
}

/* ---------- Dynamic metadata ---------- */

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const g = generalMap.get(id);
  if (!g) return { title: "未找到武将" };
  return {
    title: `${g.name} · ${g.title}`,
    description: `${g.name}（${g.title}）— ${FACTION_META[g.faction].label}势力，${g.hp}体力。三国杀国战武将详情与技能说明。`,
  };
}

/* ---------- Page component ---------- */

export default async function GeneralDetailPage({ params }: PageProps) {
  const { id } = await params;
  const general = generalMap.get(id);
  if (!general) notFound();

  const faction = FACTION_META[general.faction];
  const gradient = FACTION_GRADIENT[general.faction];

  /* Resolve skills for this general */
  const generalSkills = general.skills
    .map((sid) => skillMap.get(sid))
    .filter((s): s is RawSkill => s != null);

  /* Collect FAQ entries related to this general from faq.json */
  const generalFaqs = faqs.filter(
    (f) => f.relatedGeneralIds && f.relatedGeneralIds.includes(general.id),
  );

  /* Build per-skill FAQ lookup from faq.json */
  const skillFaqMap = new Map<string, typeof generalFaqs>();
  for (const faq of generalFaqs) {
    if (faq.relatedSkillIds) {
      for (const sid of faq.relatedSkillIds) {
        const arr = skillFaqMap.get(sid) ?? [];
        arr.push(faq);
        skillFaqMap.set(sid, arr);
      }
    }
  }

  /* Placeholder radar scores — can be replaced with real data later */
  const radarScores: [number, number, number, number] = [5, 5, 5, 5];

  return (
    <div className="page-shell py-8 sm:py-12">
      {/* Back link */}
      <Link
        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        href="/generals"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M15 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        返回武将列表
      </Link>

      {/* Hero section: image + info side by side */}
      <div className="panel overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Card image */}
          <div
            className={`relative aspect-[3/4] w-full shrink-0 bg-gradient-to-b md:w-72 lg:w-80 ${gradient}`}
          >
            <GeneralImage
              alt={`${general.name} - ${general.title}`}
              src={`/assets/${general.image}`}
            />
          </div>

          {/* Info panel */}
          <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
            {/* Name + Title + Faction */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  {general.name}
                </h1>
                <span
                  className={`rounded-lg border px-2.5 py-1 text-sm font-bold ${faction.badge}`}
                >
                  {faction.label}
                </span>
                {general.subfaction && (
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-sm font-bold ${FACTION_META[general.subfaction].badge}`}
                  >
                    {FACTION_META[general.subfaction].label}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-lg text-slate-500 dark:text-slate-400">
                {general.title}
              </p>
            </div>

            {/* HP hearts */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                体力值
              </p>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: general.maxHp }, (_, i) => (
                  <span
                    key={i}
                    className={`block h-5 w-5 rounded-full border shadow-sm ${
                      i < general.hp
                        ? "border-red-400/50 bg-red-500 shadow-red-900/30"
                        : "border-slate-300/50 bg-slate-200 dark:border-slate-600/50 dark:bg-slate-700"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {general.hp} / {general.maxHp}
                </span>
              </div>
            </div>

            {/* Radar chart */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                维度评分
              </p>
              <div className="h-48 w-48">
                <RadarChart color={faction.hex} scores={radarScores} />
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                性别：{general.gender === "male" ? "男" : "女"}
              </span>
              <span>系列：{general.pack}</span>
              <span>ID：{general.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills section */}
      <section className="mt-10">
        <h2 className="section-title mb-5">技能</h2>
        {generalSkills.length > 0 ? (
          <div className="space-y-4">
            {generalSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                description={skill.description}
                faq={skillFaqMap.get(skill.id) ?? skill.faq ?? []}
                name={skill.name}
                timing={skill.timing}
                type={skill.type}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            暂无技能数据。
          </p>
        )}
      </section>

      {/* General FAQ section (entries not linked to a specific skill) */}
      {generalFaqs.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-5">常见问题</h2>
          <div className="space-y-3">
            {generalFaqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80"
              >
                <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-medium text-slate-800 transition-colors hover:text-slate-950 dark:text-slate-200 dark:hover:text-white">
                  {faq.question}
                </summary>
                <p className="border-t border-slate-200/40 px-5 py-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700/40 dark:text-slate-400">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
