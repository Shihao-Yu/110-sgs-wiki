"use client";

import { useEffect, useRef, useState } from "react";
import type { CardFlyEvent } from "./AnimationManager";

/* ------------------------------------------------------------------ */
/*  Speed → duration mapping                                           */
/* ------------------------------------------------------------------ */

const SPEED_MS: Record<CardFlyEvent["speed"], number> = {
  fast: 300,
  normal: 500,
  slow: 750,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  event: CardFlyEvent;
  onDone: () => void;
}

/**
 * Renders a card that flies from `event.from` to `event.to` using CSS
 * transforms + transitions, then fades out and calls `onDone`.
 *
 * All positions are viewport-relative pixels (e.g. from
 * `getBoundingClientRect()`).
 */
export default function CardFlyAnimation({ event, onDone }: Props) {
  const [phase, setPhase] = useState<"start" | "fly" | "fade">("start");
  const nodeRef = useRef<HTMLDivElement>(null);
  const duration = SPEED_MS[event.speed];

  useEffect(() => {
    /* Frame 1 — place at source position (opacity 1). */
    const raf = requestAnimationFrame(() => {
      setPhase("fly");
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase === "fly") {
      /* After the translate completes, start fade-out. */
      const t = setTimeout(() => setPhase("fade"), duration);
      return () => clearTimeout(t);
    }
    if (phase === "fade") {
      /* After fade-out, signal done. */
      const t = setTimeout(onDone, 200);
      return () => clearTimeout(t);
    }
  }, [phase, duration, onDone]);

  const x = phase === "start" ? event.from.x : event.to.x;
  const y = phase === "start" ? event.from.y : event.to.y;
  const opacity = phase === "fade" ? 0 : 1;
  const scale = phase === "start" ? 1.1 : phase === "fly" ? 1 : 0.85;

  return (
    <div
      ref={nodeRef}
      aria-hidden
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: x,
        top: y,
        opacity,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition:
          phase === "start"
            ? "none"
            : phase === "fly"
              ? `left ${duration}ms cubic-bezier(.4,0,.2,1), top ${duration}ms cubic-bezier(.4,0,.2,1), transform ${duration}ms ease-out`
              : "opacity 200ms ease-out, transform 200ms ease-out",
      }}
    >
      {/* Minimal card visual — name + glow */}
      <div className="flex h-16 w-12 items-center justify-center rounded-lg border-2 border-amber-400/80 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg shadow-amber-400/30 dark:from-amber-950 dark:to-amber-900">
        <span className="text-center text-[10px] font-bold leading-tight text-amber-800 dark:text-amber-200">
          {event.cardName}
        </span>
      </div>
    </div>
  );
}
