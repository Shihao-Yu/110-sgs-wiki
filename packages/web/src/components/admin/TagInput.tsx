"use client";

import { useState, type KeyboardEvent } from "react";

export default function TagInput({
  value,
  onChange,
  placeholder = "回车添加",
  ariaLabel = "标签",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim();
    if (!t || value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300/60 bg-slate-100 px-2 py-0.5 text-xs dark:border-slate-700/60 dark:bg-paper-deep"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="text-ink-mute hover:text-vermillion"
              aria-label={`移除 ${t}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        aria-label={ariaLabel}
        className="input-base"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
      />
    </div>
  );
}
