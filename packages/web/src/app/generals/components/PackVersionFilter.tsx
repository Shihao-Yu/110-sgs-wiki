"use client";

import {
  GENERAL_PACK_VERSION_LABEL,
  type GeneralPackVersion,
} from "../../../../../data/src/types/general";

const VERSIONS: GeneralPackVersion[] = ["guozhan", "qlhd"];

type PackVersionFilterProps = {
  selected: Set<GeneralPackVersion>;
  onToggle: (version: GeneralPackVersion) => void;
};

export default function PackVersionFilter({
  selected,
  onToggle,
}: PackVersionFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {VERSIONS.map((version) => {
        const isActive = selected.has(version);
        return (
          <button
            key={version}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all sm:px-3.5 sm:py-1.5 sm:text-sm ${
              isActive
                ? "border-brand/50 bg-brand/10 text-brand shadow-sm dark:border-brand/60 dark:bg-brand/20 dark:text-red-300"
                : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600"
            }`}
            onClick={() => onToggle(version)}
            type="button"
          >
            {GENERAL_PACK_VERSION_LABEL[version]}
          </button>
        );
      })}
    </div>
  );
}
