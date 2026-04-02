"use client";

import { useGameStore } from "@/lib/game/store";
import type { SkillData } from "@/lib/game/store";

/* ------------------------------------------------------------------ */
/*  Tag badge                                                          */
/* ------------------------------------------------------------------ */

const TAG_STYLES: Record<string, { label: string; className: string }> = {
  lord: {
    label: "主",
    className: "bg-yellow-500/20 text-yellow-300 ring-yellow-500/40",
  },
  wake: {
    label: "觉",
    className: "bg-purple-500/20 text-purple-300 ring-purple-500/40",
  },
  lock: {
    label: "锁",
    className: "bg-blue-500/20 text-blue-300 ring-blue-500/40",
  },
  limit: {
    label: "限",
    className: "bg-red-500/20 text-red-300 ring-red-500/40",
  },
};

function SkillTag({ tag }: { tag: string }) {
  const style = TAG_STYLES[tag];
  if (!style) return null;
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold leading-none ring-1 ${style.className}`}
    >
      {style.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Single skill button                                                */
/* ------------------------------------------------------------------ */

function SkillButton({
  skill,
  isActive,
  onActivate,
}: {
  skill: SkillData;
  isActive: boolean;
  onActivate: () => void;
}) {
  const disabled = !skill.enabled;

  return (
    <button
      className={[
        "group relative flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-150 sm:py-1.5",
        disabled
          ? "cursor-not-allowed border-slate-700 bg-slate-800/60 text-slate-600"
          : isActive
            ? "border-yellow-400/70 bg-yellow-500/20 text-yellow-200 shadow-md shadow-yellow-500/10 ring-1 ring-yellow-400/50"
            : "border-slate-600 bg-slate-800/80 text-slate-200 hover:border-emerald-400/50 hover:bg-emerald-900/30 hover:text-emerald-200",
      ].join(" ")}
      disabled={disabled}
      onClick={onActivate}
      title={skill.description}
      type="button"
    >
      {skill.tag && <SkillTag tag={skill.tag} />}
      <span>{skill.name}</span>

      {/* Tooltip on hover */}
      <span className="pointer-events-none absolute -top-9 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-slate-300 shadow-lg ring-1 ring-slate-700 group-hover:block">
        {skill.description.length > 40
          ? skill.description.slice(0, 40) + "..."
          : skill.description}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Skill panel                                                        */
/* ------------------------------------------------------------------ */

export default function SkillPanel() {
  const skills = useGameStore((s) => s.skills);
  const currentAction = useGameStore((s) => s.currentAction);
  const activateSkill = useGameStore((s) => s.activateSkill);
  const cancelAction = useGameStore((s) => s.cancelAction);

  if (skills.length === 0) return null;

  const activeSkillId =
    currentAction?.type === "skill" ? currentAction.sourceId : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Skills
        </span>
        {activeSkillId && (
          <button
            className="rounded border border-red-500/40 bg-red-900/30 px-2 py-0.5 text-[10px] text-red-300 transition-colors hover:bg-red-800/40"
            onClick={cancelAction}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <SkillButton
            isActive={skill.id === activeSkillId}
            key={skill.id}
            onActivate={() => {
              if (skill.id === activeSkillId) {
                cancelAction();
              } else {
                activateSkill(skill.id);
              }
            }}
            skill={skill}
          />
        ))}
      </div>
    </div>
  );
}
