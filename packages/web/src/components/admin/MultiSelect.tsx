"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";

interface Option {
  value: string;
  label: string;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "搜索…",
  ariaLabel = "多选",
}: {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [q, setQ] = useState("");
  const [highlight, setHighlight] = useState(0);
  const listId = useId();
  const selected = useMemo(() => new Set(value), [value]);
  const filtered = useMemo(
    () =>
      options
        .filter((o) => !selected.has(o.value))
        .filter((o) => o.label.includes(q) || o.value.includes(q))
        .slice(0, 20),
    [options, selected, q],
  );

  function commit(opt: Option) {
    onChange([...value, opt.value]);
    setQ("");
    setHighlight(0);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[highlight]) {
        e.preventDefault();
        commit(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      setQ("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((v) => {
          const opt = options.find((o) => o.value === v);
          return (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border border-vermillion/30 bg-vermillion/10 px-2 py-0.5 text-xs"
            >
              {opt?.label ?? v}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="text-ink-mute hover:text-vermillion"
                aria-label={`移除 ${opt?.label ?? v}`}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <input
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={Boolean(q)}
        className="input-base"
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setHighlight(0); }}
        onKeyDown={onKey}
      />
      {q && (
        <ul
          id={listId}
          role="listbox"
          className="max-h-40 overflow-y-auto rounded border border-slate-300/60 bg-paper-mist/95 text-sm dark:border-slate-700/60 dark:bg-paper-deep/90"
        >
          {filtered.length === 0 ? (
            <li className="px-2 py-1.5 text-ink-mute dark:text-ivory-soft">无匹配项</li>
          ) : (
            filtered.map((o, i) => (
              <li key={o.value} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onClick={() => commit(o)}
                  onMouseEnter={() => setHighlight(i)}
                  className={
                    "block w-full px-2 py-1 text-left " +
                    (i === highlight ? "bg-vermillion/10" : "hover:bg-vermillion/10")
                  }
                >
                  {o.label} <span className="text-ink-mute">({o.value})</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
