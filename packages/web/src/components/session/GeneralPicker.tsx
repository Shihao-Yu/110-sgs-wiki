"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

interface Option {
  id: string;
  name: string;
  faction: string;
  hp: number;
}

const FACTION_LABEL: Record<string, string> = {
  WEI: "魏", SHU: "蜀", WU: "吴", QUN: "群", JIN: "晋",
};

export default function GeneralPicker({
  options,
  excludedIds,
  value,
  onChange,
  ariaLabel = "选择武将",
  placeholder = "搜索武将…",
}: {
  options: Option[];
  excludedIds: string[];          // ids already taken by other slots
  value: string | null;
  onChange: (next: string | null) => void;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);

  const selected = value ? options.find((o) => o.id === value) : null;

  const filtered = useMemo(() => {
    const candidates = options.filter((o) => !excluded.has(o.id));
    if (!q.trim()) return candidates.slice(0, 30);
    const needle = q.trim();
    return candidates.filter((o) => o.name.includes(needle) || o.id.includes(needle)).slice(0, 30);
  }, [options, excluded, q]);

  // close dropdown when click outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function commit(opt: Option) {
    onChange(opt.id);
    setQ("");
    setHighlight(0);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQ("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
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
      setOpen(false);
      setQ("");
    }
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded border border-vermillion/30 bg-vermillion/5 px-2 py-1.5 text-sm">
        <span className="font-medium">{selected.name}</span>
        <span className="rounded border border-current/30 px-1.5 py-0.5 text-xs opacity-70">
          {FACTION_LABEL[selected.faction] ?? selected.faction}
        </span>
        <span className="text-xs text-ink-mute dark:text-ivory-soft">{selected.hp} 体力</span>
        <button
          type="button"
          onClick={clear}
          aria-label="移除武将"
          className="ml-auto text-ink-mute hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        className="input-base"
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setHighlight(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded border border-slate-300/60 bg-paper-mist/95 text-sm shadow dark:border-slate-700/60 dark:bg-paper-deep/95"
        >
          {filtered.length === 0 ? (
            <li className="px-2 py-1.5 text-ink-mute dark:text-ivory-soft">无匹配项</li>
          ) : (
            filtered.map((o, i) => (
              <li key={o.id} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onClick={() => commit(o)}
                  onMouseEnter={() => setHighlight(i)}
                  className={
                    "flex w-full items-center gap-2 px-2 py-1 text-left " +
                    (i === highlight ? "bg-vermillion/10" : "hover:bg-vermillion/10")
                  }
                >
                  <span className="font-medium">{o.name}</span>
                  <span className="rounded border border-current/30 px-1 text-xs opacity-70">{FACTION_LABEL[o.faction] ?? o.faction}</span>
                  <span className="text-xs text-ink-mute dark:text-ivory-soft">{o.hp} 体力</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
