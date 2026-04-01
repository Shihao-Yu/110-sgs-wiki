"use client";

import { type DragEvent, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Suit = "spade" | "heart" | "club" | "diamond";
export type CardCategory = "basic" | "trick" | "equipment";

export interface GameCard {
  id: string;
  name: string;
  suit: Suit;
  number: number;
  category: CardCategory;
}

/* ------------------------------------------------------------------ */
/*  Suit display helpers                                               */
/* ------------------------------------------------------------------ */

const SUIT_ICON: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  club: "♣",
  diamond: "♦",
};

const SUIT_COLOR: Record<Suit, string> = {
  spade: "text-slate-900 dark:text-slate-100",
  club: "text-slate-900 dark:text-slate-100",
  heart: "text-red-600 dark:text-red-400",
  diamond: "text-red-600 dark:text-red-400",
};

/* ------------------------------------------------------------------ */
/*  Category → border/accent colour                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_BORDER: Record<CardCategory, string> = {
  basic: "border-red-400/70",
  trick: "border-blue-400/70",
  equipment: "border-amber-400/70",
};

const CATEGORY_ACCENT_BG: Record<CardCategory, string> = {
  basic: "bg-red-50 dark:bg-red-950/40",
  trick: "bg-blue-50 dark:bg-blue-950/40",
  equipment: "bg-amber-50 dark:bg-amber-950/40",
};

const CATEGORY_NAME_COLOR: Record<CardCategory, string> = {
  basic: "text-red-700 dark:text-red-300",
  trick: "text-blue-700 dark:text-blue-300",
  equipment: "text-amber-700 dark:text-amber-300",
};

/* ------------------------------------------------------------------ */
/*  Number display (A, 2-10, J, Q, K)                                  */
/* ------------------------------------------------------------------ */

function displayNumber(n: number): string {
  if (n === 1) return "A";
  if (n === 11) return "J";
  if (n === 12) return "Q";
  if (n === 13) return "K";
  return String(n);
}

/* ------------------------------------------------------------------ */
/*  Card component                                                     */
/* ------------------------------------------------------------------ */

interface CardComponentProps {
  card: GameCard;
  /** Show back face only (for opponent cards). */
  faceDown?: boolean;
  /** Compact (used in info panels) vs full (hand). */
  variant?: "compact" | "full";
  /** Currently selected in hand. */
  selected?: boolean;
  /** Enable HTML drag. */
  draggable?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function CardComponent({
  card,
  faceDown = false,
  variant = "full",
  selected = false,
  draggable = false,
  onClick,
  className = "",
}: CardComponentProps) {
  /* ---- Drag start handler ---- */
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("application/x-card-id", card.id);
      e.dataTransfer.effectAllowed = "move";
    },
    [card.id],
  );

  /* ---- Card back ---- */
  if (faceDown) {
    const sizeClass =
      variant === "compact" ? "h-14 w-10" : "h-[6.5rem] w-[4.5rem]";
    return (
      <div
        className={[
          sizeClass,
          "flex shrink-0 items-center justify-center rounded-lg border-2 border-blue-800/60 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 shadow-md select-none",
          className,
        ].join(" ")}
      >
        <span className="text-lg font-bold text-blue-300/60">⚔</span>
      </div>
    );
  }

  /* ---- Size tokens ---- */
  const isCompact = variant === "compact";
  const sizeClass = isCompact ? "h-14 w-10" : "h-[6.5rem] w-[4.5rem]";

  return (
    <div
      className={[
        sizeClass,
        "group/card relative flex shrink-0 cursor-pointer flex-col rounded-lg border-2 shadow-md transition-all duration-150 select-none",
        CATEGORY_BORDER[card.category],
        CATEGORY_ACCENT_BG[card.category],
        selected
          ? "-translate-y-2 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20"
          : "hover:-translate-y-1 hover:shadow-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={draggable}
      onClick={onClick}
      onDragStart={draggable ? handleDragStart : undefined}
      role="button"
      tabIndex={0}
      title={`${card.name} ${SUIT_ICON[card.suit]}${displayNumber(card.number)}`}
    >
      {/* ---- Top-left: suit + number ---- */}
      <div
        className={[
          "flex flex-col items-center leading-none",
          isCompact ? "px-0.5 pt-0.5" : "px-1 pt-1",
          SUIT_COLOR[card.suit],
        ].join(" ")}
      >
        <span className={isCompact ? "text-[9px] font-bold" : "text-xs font-bold"}>
          {displayNumber(card.number)}
        </span>
        <span className={isCompact ? "text-[9px]" : "text-[11px]"}>
          {SUIT_ICON[card.suit]}
        </span>
      </div>

      {/* ---- Card name (center) ---- */}
      <div className="flex flex-1 items-center justify-center px-0.5">
        <span
          className={[
            "text-center font-semibold leading-tight",
            isCompact ? "text-[8px]" : "text-[11px]",
            CATEGORY_NAME_COLOR[card.category],
          ].join(" ")}
        >
          {card.name}
        </span>
      </div>
    </div>
  );
}
