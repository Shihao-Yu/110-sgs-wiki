type SkillType = "active" | "passive" | "lock" | "limited" | "awakening" | "mission";

type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

type SkillCardProps = {
  name: string;
  type: SkillType;
  description: string;
  timing: string[];
  faq: FaqEntry[];
};

const TYPE_LABEL: Record<SkillType, string> = {
  active: "主动",
  passive: "被动",
  lock: "锁定",
  limited: "限定",
  awakening: "觉醒",
  mission: "使命",
};

const TYPE_STYLE: Record<SkillType, string> = {
  active:
    "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-600/50 dark:bg-emerald-950/60 dark:text-emerald-300",
  passive:
    "border-sky-300/60 bg-sky-50 text-sky-700 dark:border-sky-600/50 dark:bg-sky-950/60 dark:text-sky-300",
  lock: "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-600/50 dark:bg-amber-950/60 dark:text-amber-300",
  limited:
    "border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-600/50 dark:bg-rose-950/60 dark:text-rose-300",
  awakening:
    "border-violet-300/60 bg-violet-50 text-violet-700 dark:border-violet-600/50 dark:bg-violet-950/60 dark:text-violet-300",
  mission:
    "border-orange-300/60 bg-orange-50 text-orange-700 dark:border-orange-600/50 dark:bg-orange-950/60 dark:text-orange-300",
};

export default function SkillCard({
  name,
  type,
  description,
  timing,
  faq,
}: SkillCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {name}
        </h3>
        <span
          className={`rounded-md border px-2 py-0.5 text-xs font-bold ${TYPE_STYLE[type]}`}
        >
          {TYPE_LABEL[type]}
        </span>
      </div>

      {/* Timing tags */}
      {timing.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {timing.map((t) => (
            <span
              key={t}
              className="rounded-full border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {description}
      </p>

      {/* FAQ entries for this skill */}
      {faq.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            常见问题
          </p>
          {faq.map((entry) => (
            <details
              key={entry.id}
              className="group rounded-xl border border-slate-200/60 bg-slate-50/60 dark:border-slate-700/40 dark:bg-slate-900/40"
            >
              <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:text-slate-950 dark:text-slate-200 dark:hover:text-white">
                {entry.question}
              </summary>
              <p className="border-t border-slate-200/40 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:border-slate-700/40 dark:text-slate-400">
                {entry.answer}
              </p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
