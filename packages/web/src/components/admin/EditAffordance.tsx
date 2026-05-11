"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAdmin } from "./AdminContext";

/**
 * Renders `trigger` (a small pencil/gear button) only when admin is logged in.
 * On click, the form is rendered as a centered modal (full-screen on mobile,
 * card on desktop). Trigger stays visible but disabled while open.
 */
export default function EditAffordance({
  trigger,
  ariaLabel,
  renderForm,
}: {
  trigger: ReactNode;
  ariaLabel: string;
  renderForm: (close: () => void) => ReactNode;
}) {
  const { authed } = useAdmin();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!authed) return null;

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
        className="text-ink-mute hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-md bg-paper-mist shadow-xl sm:rounded-md dark:bg-paper-deep">
            <div className="flex items-center justify-between gap-2 border-b border-vermillion/20 px-4 py-2">
              <span className="font-display text-sm text-ink dark:text-ivory">{ariaLabel}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="text-ink-mute hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {renderForm(() => setOpen(false))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
