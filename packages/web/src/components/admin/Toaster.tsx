"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: number;
  text: string;
  level: "info" | "success" | "error";
  ttl: number;
}

let _push: (t: Omit<Toast, "id">) => void = () => {};
export function toast(text: string, level: Toast["level"] = "info", ttl = 3500) {
  _push({ text, level, ttl });
}

export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    let nextId = 1;
    _push = (t) => {
      const id = nextId++;
      setItems((cur) => [...cur, { ...t, id }]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), t.ttl);
    };
    return () => {
      _push = () => {};
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={
            "max-w-md rounded-md border px-3 py-2 text-sm shadow pointer-events-auto " +
            (t.level === "error"
              ? "border-red-400/40 bg-red-50/90 text-red-900 dark:border-red-300/30 dark:bg-red-950/80 dark:text-red-100"
              : t.level === "success"
              ? "border-emerald-400/40 bg-emerald-50/90 text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-950/80 dark:text-emerald-100"
              : "border-vermillion/30 bg-paper-mist/95 text-ink dark:border-vermillion/40 dark:bg-paper-deep/90 dark:text-ivory")
          }
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
