"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/*  Animation event types                                              */
/* ------------------------------------------------------------------ */

export interface CardFlyEvent {
  type: "card-fly";
  id: string;
  cardName: string;
  /** CSS selector or {x,y} for the source position. */
  from: { x: number; y: number };
  /** CSS selector or {x,y} for the target position. */
  to: { x: number; y: number };
  /** Animation speed — maps to duration. */
  speed: "fast" | "normal" | "slow";
}

export interface DamageNumberEvent {
  type: "damage";
  id: string;
  /** Negative for damage, positive for recovery. */
  amount: number;
  /** Position where the number appears. */
  position: { x: number; y: number };
}

export interface SkillEffectEvent {
  type: "skill";
  id: string;
  skillName: string;
  /** Faction colour key. */
  faction: "WEI" | "SHU" | "WU" | "QUN" | "JIN" | null;
  /** Position of the player slot. */
  position: { x: number; y: number };
}

export type AnimationEvent = CardFlyEvent | DamageNumberEvent | SkillEffectEvent;

/* ------------------------------------------------------------------ */
/*  Context type                                                       */
/* ------------------------------------------------------------------ */

interface AnimationContextValue {
  /** Push one or more animations onto the queue. */
  enqueue: (...events: AnimationEvent[]) => void;
  /** The event currently being played (null when idle). */
  current: AnimationEvent | null;
  /** Signal that the current animation finished rendering. */
  notifyDone: () => void;
  /** Number of animations waiting (including current). */
  pending: number;
}

const AnimationContext = createContext<AnimationContextValue>({
  enqueue: () => {},
  current: null,
  notifyDone: () => {},
  pending: 0,
});

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AnimationProvider({ children }: { children: ReactNode }) {
  const queueRef = useRef<AnimationEvent[]>([]);
  const [current, setCurrent] = useState<AnimationEvent | null>(null);
  const [pending, setPending] = useState(0);
  const processingRef = useRef(false);

  /* Advance to the next event in the queue. */
  const advance = useCallback(() => {
    const next = queueRef.current.shift();
    if (next) {
      setCurrent(next);
      setPending(queueRef.current.length + 1);
    } else {
      setCurrent(null);
      setPending(0);
      processingRef.current = false;
    }
  }, []);

  /* Called by animation components when they finish. */
  const notifyDone = useCallback(() => {
    advance();
  }, [advance]);

  /* Enqueue new animations. */
  const enqueue = useCallback(
    (...events: AnimationEvent[]) => {
      queueRef.current.push(...events);
      setPending(queueRef.current.length + (current ? 1 : 0));

      if (!processingRef.current) {
        processingRef.current = true;
        advance();
      }
    },
    [advance, current],
  );

  return (
    <AnimationContext.Provider value={{ enqueue, current, notifyDone, pending }}>
      {children}
    </AnimationContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAnimations() {
  return useContext(AnimationContext);
}

/* ------------------------------------------------------------------ */
/*  Overlay — renders the current animation                            */
/* ------------------------------------------------------------------ */

import CardFlyAnimation from "./CardFlyAnimation";
import DamageNumber from "./DamageNumber";
import SkillEffect from "./SkillEffect";

/**
 * Place this component once inside `AnimationProvider`, above the game
 * table so the overlay sits on top. It renders whichever animation is
 * current and auto-advances when each one completes.
 */
export function AnimationOverlay() {
  const { current, notifyDone } = useAnimations();

  /* Auto-advance safety net — if an animation stalls, clear after 3 s. */
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (current) {
      timerRef.current = setTimeout(notifyDone, 3000);
      return () => clearTimeout(timerRef.current);
    }
  }, [current, notifyDone]);

  if (!current) return null;

  switch (current.type) {
    case "card-fly":
      return <CardFlyAnimation event={current} onDone={notifyDone} />;
    case "damage":
      return <DamageNumber event={current} onDone={notifyDone} />;
    case "skill":
      return <SkillEffect event={current} onDone={notifyDone} />;
    default:
      return null;
  }
}
