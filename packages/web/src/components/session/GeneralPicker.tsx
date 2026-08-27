"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { assetUrl } from "@/lib/assets";

interface Option {
  id: string;
  name: string;
  faction: string;
  hp: number;
  image: string;
}

const FACTION_LABEL: Record<string, string> = {
  WEI: "魏", SHU: "蜀", WU: "吴", QUN: "群", JIN: "晋",
};

const FACTION_BADGE: Record<string, string> = {
  WEI: "border-wei/40 bg-wei/15 text-wei dark:text-blue-300",
  SHU: "border-shu/40 bg-shu/15 text-shu dark:text-red-300",
  WU: "border-wu/40 bg-wu/15 text-wu dark:text-green-300",
  QUN: "border-qun/40 bg-qun/15 text-qun dark:text-yellow-200",
  JIN: "border-jin/40 bg-jin/15 text-jin dark:text-purple-200",
};

export default function GeneralPicker({
  options,
  excludedIds,
  onChange,
  ariaLabel = "选择武将",
  placeholder = "搜索武将…",
  autoFocus = false,
  onCancel,
}: {
  options: Option[];
  excludedIds: string[];
  onChange: (id: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(autoFocus);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const filtered = useMemo(() => {
    const candidates = options.filter((o) => !excluded.has(o.id));
    if (!q.trim()) return candidates.slice(0, 30);
    const needle = q.trim();
    return candidates.filter((o) => o.name.includes(needle) || o.id.includes(needle)).slice(0, 30);
  }, [options, excluded, q]);

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
    setOpen(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      e.preventDefault();
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
      onCancel?.();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
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
          /* data-picker-open 是给外层 .panel 的钩子：.panel 带 backdrop-filter，
             会创建层叠上下文，把这里的 z-20 关在里面，导致下拉被固定在视口底部的
             保存栏盖住。SessionPlayer 用 has-[[data-picker-open]] 在下拉打开时
             临时抬高整张卡的层级来解决。 */
          data-picker-open=""
          className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded border border-slate-300/60 bg-paper-mist/95 text-sm shadow-lg dark:border-slate-700/60 dark:bg-paper-deep/95"
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
                    "flex w-full items-center gap-2 px-2 py-1.5 text-left " +
                    (i === highlight ? "bg-vermillion/10" : "hover:bg-vermillion/10")
                  }
                >
                  <span className="block h-12 w-9 shrink-0 overflow-hidden rounded-sm border border-vermillion/15 bg-paper-deep/40">
                    <img
                      src={assetUrl(o.image)}
                      alt=""
                      className="h-full w-full object-cover object-top"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                    />
                  </span>
                  <span className="flex-1 font-medium">{o.name}</span>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${FACTION_BADGE[o.faction] ?? "border-slate-300 text-ink-mute"}`}>
                    {FACTION_LABEL[o.faction] ?? o.faction}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
