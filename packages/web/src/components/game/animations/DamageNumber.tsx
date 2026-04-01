"use client";

import { useEffect, useState } from "react";
import type { DamageNumberEvent } from "./AnimationManager";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Total animation duration (float up + fade). */
const FLOAT_DURATION_MS = 800;
/** Distance the number floats upward (px). */
const FLOAT_DISTANCE = 48;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  event: DamageNumberEvent;
  onDone: () => void;
}

/**
 * A floating number that appears at `event.position`, drifts upward,
 * and fades out.
 *
 * - Negative `amount` → red text, shows "-N"
 * - Positive `amount` → green text, shows "+N"
 */
export default function DamageNumber({ event, onDone }: Props) {
  const [started, setStarted] = useState(false);

  const isDamage = event.amount < 0;
  const label = isDamage ? String(event.amount) : `+${event.amount}`;

  /* Kick off the animation one frame after mount so the browser sees
     the initial position before we transition. */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (started) {
      const t = setTimeout(onDone, FLOAT_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [started, onDone]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: event.position.x,
        top: event.position.y,
        transform: `translate(-50%, -50%) translateY(${started ? -FLOAT_DISTANCE : 0}px) scale(${started ? 1 : 1.4})`,
        opacity: started ? 0 : 1,
        transition: `transform ${FLOAT_DURATION_MS}ms ease-out, opacity ${FLOAT_DURATION_MS}ms ease-in`,
      }}
    >
      <span
        className={[
          "text-3xl font-black select-none",
          isDamage
            ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            : "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]",
        ].join(" ")}
        style={{ WebkitTextStroke: "1px rgba(0,0,0,0.25)" }}
      >
        {label}
      </span>
    </div>
  );
}
