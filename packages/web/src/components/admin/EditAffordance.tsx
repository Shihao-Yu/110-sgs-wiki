"use client";

import { useState, type ReactNode } from "react";
import { useAdmin } from "./AdminContext";

/**
 * Renders `trigger` (a small pencil/gear button) only when admin is logged in.
 * On click, the form is rendered BELOW the trigger (trigger stays visible but disabled).
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
  if (!authed) return null;
  return (
    <span className="inline-block">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="text-ink-mute hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40 disabled:opacity-50"
        disabled={open}
      >
        {trigger}
      </button>
      {open && (
        <div className="mt-2 max-h-[80vh] overflow-y-auto">
          {renderForm(() => setOpen(false))}
        </div>
      )}
    </span>
  );
}
