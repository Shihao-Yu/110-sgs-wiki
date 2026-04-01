"use client";

const HP_OPTIONS = [
  { value: 0, label: "全部" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5+" },
];

type HpFilterProps = {
  selected: number;
  onChange: (hp: number) => void;
};

export default function HpFilter({ selected, onChange }: HpFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        体力:
      </span>
      <div className="flex gap-1">
        {HP_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              selected === value
                ? "border-brand/50 bg-brand/10 text-brand shadow-sm dark:border-brand/60 dark:bg-brand/20 dark:text-red-300"
                : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600"
            }`}
            onClick={() => onChange(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
