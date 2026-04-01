"use client";

import { useEffect, useState } from "react";
import type { SkillEffectEvent } from "./AnimationManager";

/* ------------------------------------------------------------------ */
/*  Faction → colour tokens                                            */
/* ------------------------------------------------------------------ */

const FACTION_GLOW: Record<string, { text: string; border: string; shadow: string }> = {
  WEI: {
    text: "text-wei",
    border: "border-wei/70",
    shadow: "shadow-[0_0_24px_rgba(37,99,235,0.5)]",
  },
  SHU: {
    text: "text-shu",
    border: "border-shu/70",
    shadow: "shadow-[0_0_24px_rgba(220,38,38,0.5)]",
  },
  WU: {
    text: "text-wu",
    border: "border-wu/70",
    shadow: "shadow-[0_0_24px_rgba(22,163,74,0.5)]",
  },
  QUN: {
    text: "text-qun",
    border: "border-qun/70",
    shadow: "shadow-[0_0_24px_rgba(202,138,4,0.5)]",
  },
  JIN: {
    text: "text-jin",
    border: "border-jin/70",
    shadow: "shadow-[0_0_24px_rgba(147,51,234,0.5)]",
  },
};

const DEFAULT_GLOW = {
  text: "text-slate-200",
  border: "border-slate-400/70",
  shadow: "shadow-[0_0_24px_rgba(148,163,184,0.4)]",
};

/** Total visible duration of the skill banner. */
const DISPLAY_MS = 1200;
/** Fade-in duration. */
const FADE_IN_MS = 150;
/** Fade-out duration. */
const FADE_OUT_MS = 300;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  event: SkillEffectEvent;
  onDone: () => void;
}

/**
 * A skill-name banner that appears over the player position with a
 * faction-coloured glowing border, holds briefly, then fades out.
 */
export default function SkillEffect({ event, onDone }: Props) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  const glow = (event.faction && FACTION_GLOW[event.faction]) ?? DEFAULT_GLOW;

  /* Phase progression: enter → hold → exit → done */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), FADE_IN_MS);
    const t2 = setTimeout(() => setPhase("exit"), DISPLAY_MS - FADE_OUT_MS);
    const t3 = setTimeout(onDone, DISPLAY_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const opacity = phase === "enter" ? 0 : phase === "hold" ? 1 : 0;
  const scale = phase === "enter" ? 0.8 : phase === "hold" ? 1 : 1.05;
  const transitionDuration = phase === "enter" ? FADE_IN_MS : FADE_OUT_MS;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: event.position.x,
        top: event.position.y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: `opacity ${transitionDuration}ms ease-out, transform ${transitionDuration}ms ease-out`,
      }}
    >
      {/* Glowing border ring */}
      <div
        className={[
          "rounded-xl border-2 bg-black/70 px-5 py-2 backdrop-blur-sm",
          glow.border,
          glow.shadow,
        ].join(" ")}
      >
        <span
          className={[
            "whitespace-nowrap text-lg font-bold tracking-wider select-none",
            glow.text,
          ].join(" ")}
        >
          {event.skillName}
        </span>
      </div>
    </div>
  );
}
