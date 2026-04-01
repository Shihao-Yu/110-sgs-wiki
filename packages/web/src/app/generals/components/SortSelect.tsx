"use client";

export type SortKey = "name" | "id" | "faction";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "按名称" },
  { value: "id", label: "按编号" },
  { value: "faction", label: "按势力" },
];

type SortSelectProps = {
  value: SortKey;
  onChange: (key: SortKey) => void;
};

export default function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        排序:
      </span>
      <select
        className="rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200"
        onChange={(e) => onChange(e.target.value as SortKey)}
        value={value}
      >
        {SORT_OPTIONS.map(({ value: v, label }) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
