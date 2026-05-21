"use client";

import { RATING_TIERS, type RatingTier } from "@/lib/ratings";

export type RatingFilterValue = "all" | "unrated" | RatingTier;

const OPTIONS: { value: RatingFilterValue; label: string }[] = [
  { value: "all", label: "全部" },
  ...RATING_TIERS.map((t) => ({ value: t, label: t })),
  { value: "unrated", label: "未评级" },
];

type RatingFilterProps = {
  selected: RatingFilterValue;
  onChange: (value: RatingFilterValue) => void;
};

export default function RatingFilter({ selected, onChange }: RatingFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        评级:
      </span>
      <div className="flex flex-wrap gap-1">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all sm:px-2.5 sm:py-1 ${
              selected === value
                ? "border-brand/50 bg-brand/10 text-brand shadow-sm dark:border-brand/60 dark:bg-brand/20 dark:text-red-300"
                : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
