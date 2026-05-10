"use client";

import { useState, type ReactNode } from "react";

export default function InlineConfirm({
  trigger,
  message,
  onConfirm,
  destructive = false,
  ariaLabel,
}: {
  trigger: ReactNode;
  message: string;
  onConfirm: () => Promise<void> | void;
  destructive?: boolean;
  ariaLabel: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={ariaLabel}
        className="inline-flex items-center text-ink-mute hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40"
      >
        {trigger}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded border border-red-500/40 bg-red-50/70 px-2 py-1 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-100">
      <span>{message}</span>
      <button
        type="button"
        disabled={busy}
        className={destructive ? "btn-danger px-2 py-0.5 text-xs" : "btn-primary px-2 py-0.5 text-xs"}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setArmed(false);
          }
        }}
      >
        {busy ? "执行中…" : "确认"}
      </button>
      <button
        type="button"
        className="btn-secondary px-2 py-0.5 text-xs"
        onClick={() => setArmed(false)}
      >
        取消
      </button>
    </span>
  );
}
