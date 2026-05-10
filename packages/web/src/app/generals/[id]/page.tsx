import type { Metadata } from "next";
import type { Faction, GeneralId, General, Skill, FAQ } from "@sgs/data";
import Link from "next/link";
import { notFound } from "next/navigation";
import cardTextData from "../../../../../data/src/card-text.json";
import { entityStore } from "@/lib/entity-store";
import GeneralImage from "./components/GeneralImage";
import RadarChart from "./components/RadarChart";
import SkillCard from "./components/SkillCard";
import { assetUrl } from "@/lib/assets";

/* ---------- Types for the raw shapes ---------- */

type RawSkill = Skill & {
  faq?: { id: string; question: string; answer: string }[];
};

const cardTextMap = (cardTextData as {
  items: Record<string, { skillsText: string; skillLines: string[]; ocrScore: number }>;
}).items;

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

/* ---------- Card text helpers (OCR-extracted) ---------- */

function CardTextLines({ lines }: { lines: string[] }) {
  return (
    <ol className="space-y-1.5 text-sm leading-relaxed text-ink-soft dark:text-ivory-soft">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="select-none pt-0.5 font-latin text-xs text-vermillion/60">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="flex-1">{line}</span>
        </li>
      ))}
    </ol>
  );
}

function CardTextPanel({
  lines,
  ocrScore,
}: {
  lines: string[];
  ocrScore: number;
}) {
  return (
    <div className="rounded-sm border border-vermillion/25 bg-paper-mist/70 p-5 dark:border-vermillion/30 dark:bg-night/70">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="seal-soft">卡面原文</span>
        <span className="font-display tracking-wider text-ink-mute dark:text-ivory-soft">
          机读 OCR · 置信度 {(ocrScore * 100).toFixed(0)}%
        </span>
      </div>
      <CardTextLines lines={lines} />
      <p className="mt-3 text-xs leading-relaxed text-ink-mute dark:text-ivory-soft">
        以上内容由程序从卡图直接识别，可能存在断字、错字。如与卡面有出入以卡面为准。
      </p>
    </div>
  );
}

/* ---------- Static params for all generals ---------- */

export async function generateStaticParams() {
  const all = await entityStore.getGenerals();
  return all.map((g) => ({ id: g.id as unknown as string }));
}

/* ---------- Dynamic metadata ---------- */

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const g = await entityStore.getGeneral(id as GeneralId);
  if (!g) return { title: "未找到武将" };
  return {
    title: `${g.name} · ${g.title}`,
    description: `${g.name}（${g.title}）— ${FACTION_META[g.faction].label}势力，${g.hp}体力。三国杀国战武将详情与技能说明。`,
  };
}

/* ---------- Page component ---------- */

export default async function GeneralDetailPage({ params }: PageProps) {
  const { id } = await params;
  const general = (await entityStore.getGeneral(id as GeneralId)) as General | null;
  if (!general) notFound();

  const faction = FACTION_META[general.faction];
  const gradient = FACTION_GRADIENT[general.faction];

  /* Resolve skills for this general via the reverse-lookup index */
  const generalSkillsRaw = (await entityStore.getSkillsByGeneral(general.id)) as RawSkill[];
  // Preserve the order from the general's `skills` array
  const skillIndex = new Map(generalSkillsRaw.map((s) => [s.id as unknown as string, s]));
  const generalSkills = (general.skills as unknown as string[])
    .map((sid) => skillIndex.get(sid))
    .filter((s): s is RawSkill => s != null);
  const hasOnlyPlaceholderSkills = (general.skills as unknown as string[]).every((sid) =>
    sid.startsWith("skill_unknown_"),
  );

  /* Collect FAQ entries related to this general */
  const allFaqs = (await entityStore.getFaqs()) as FAQ[];
  const generalFaqs = allFaqs.filter(
    (f) => f.relatedGeneralIds && (f.relatedGeneralIds as unknown as string[]).includes(general.id as unknown as string),
  );

  /* Build per-skill FAQ lookup */
  const skillFaqMap = new Map<string, typeof generalFaqs>();
  for (const faq of generalFaqs) {
    if (faq.relatedSkillIds) {
      for (const sid of faq.relatedSkillIds as unknown as string[]) {
        const arr = skillFaqMap.get(sid) ?? [];
        arr.push(faq);
        skillFaqMap.set(sid, arr);
      }
    }
  }

  /* OCR-extracted text from the card image (best-effort, machine-read) */
  const cardText = cardTextMap[general.id as unknown as string];

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
              src={assetUrl(general.image)}
            />
          </div>

          {/* Info panel */}
          <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6 md:p-8">
            {/* Name + Title + Faction */}
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
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
              <div className="h-36 w-36 sm:h-48 sm:w-48">
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
        {hasOnlyPlaceholderSkills ? (
          cardText && cardText.skillLines.length > 0 ? (
            <CardTextPanel lines={cardText.skillLines} ocrScore={cardText.ocrScore} />
          ) : (
            <div className="rounded-sm border border-gold/40 bg-paper-mist/70 p-5 text-sm leading-relaxed text-ink-soft shadow-sm dark:border-gold/30 dark:bg-night/70 dark:text-ivory-soft">
              当前仅同步了这张国战武将卡的卡图与基础信息，尚未补齐和该版本一致的技能或
              wiki 说明。
            </div>
          )
        ) : generalSkills.length > 0 ? (
          <div className="space-y-4">
            {generalSkills.map((skill) => {
              const sid = skill.id as unknown as string;
              return (
                <SkillCard
                  key={sid}
                  description={skill.description}
                  faq={skillFaqMap.get(sid) ?? skill.faq ?? []}
                  name={skill.name}
                  timing={skill.timing}
                  type={skill.type}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-mute dark:text-ivory-soft">
            暂无技能数据。
          </p>
        )}
      </section>

      {/* 卡面原文 (machine-read OCR) — shown alongside structured skill data
          so readers can verify against the printed card text. */}
      {cardText && cardText.skillLines.length > 0 && !hasOnlyPlaceholderSkills && (
        <section className="mt-10">
          <details className="group rounded-sm border border-vermillion/20 bg-paper-mist/70 dark:border-vermillion/25 dark:bg-night/70">
            <summary className="flex cursor-pointer select-none items-center justify-between gap-3 px-5 py-3 text-sm font-display text-ink transition-colors hover:text-vermillion dark:text-ivory dark:hover:text-vermillion">
              <span className="flex items-center gap-2">
                <span className="seal-soft text-xs">卡面原文</span>
                <span className="text-xs tracking-wider text-ink-mute dark:text-ivory-soft">
                  机读 OCR · 置信度 {(cardText.ocrScore * 100).toFixed(0)}%
                </span>
              </span>
              <span aria-hidden className="text-vermillion transition-transform group-open:rotate-90">
                ▸
              </span>
            </summary>
            <div className="border-t border-vermillion/15 px-5 py-4">
              <CardTextLines lines={cardText.skillLines} />
            </div>
          </details>
        </section>
      )}

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
