"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <input
        className="w-full rounded-xl border border-slate-200/80 bg-white/80 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20 sm:py-2.5 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand/50 dark:focus:ring-brand/30"
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索武将名、称号、技能名…"
        type="text"
        value={value}
      />
      {value && (
        <button
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          onClick={() => onChange("")}
          type="button"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
