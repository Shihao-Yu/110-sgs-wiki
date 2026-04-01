"use client";

import { useCallback } from "react";
import { useGameStore } from "@/lib/game/store";
import CardComponent from "./CardComponent";

/* ------------------------------------------------------------------ */
/*  Fan-shaped layout helpers                                          */
/* ------------------------------------------------------------------ */

/**
 * Compute rotation & horizontal offset for the i-th card in a fan of `total`.
 *
 * Cards are arranged in a slight arc: centre cards are nearly vertical,
 * outer cards tilt away from centre, and all overlap slightly.
 */
function fanTransform(
  index: number,
  total: number,
): { rotate: number; translateX: number; translateY: number } {
  if (total <= 1) return { rotate: 0, translateX: 0, translateY: 0 };

  const maxAngle = Math.min(total * 3, 30); // total fan spread (degrees)
  const step = total > 1 ? (maxAngle * 2) / (total - 1) : 0;
  const rotate = -maxAngle + step * index;

  // Slight vertical arc — centre is lowest, edges rise
  const centre = (total - 1) / 2;
  const distFromCentre = Math.abs(index - centre);
  const translateY = distFromCentre * distFromCentre * 1.2;

  // Horizontal overlap: shift each card so they fan out but overlap
  const cardOverlap = Math.min(52, 260 / total); // px
  const translateX = (index - centre) * cardOverlap;

  return { rotate, translateX, translateY };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HandCards() {
  const hand = useGameStore((s) => s.hand);
  const selectedCardIds = useGameStore((s) => s.selectedCardIds);
  const toggleCardSelected = useGameStore((s) => s.toggleCardSelected);
  const playSelectedCards = useGameStore((s) => s.playSelectedCards);
  const discardSelectedCards = useGameStore((s) => s.discardSelectedCards);

  const handlePlay = useCallback(() => {
    playSelectedCards();
  }, [playSelectedCards]);

  const handleDiscard = useCallback(() => {
    discardSelectedCards();
  }, [discardSelectedCards]);

  const hasSelection = selectedCardIds.length > 0;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          className={[
            "rounded-lg px-3 py-1 text-xs font-medium transition-all",
            hasSelection
              ? "border border-emerald-400/60 bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
              : "border border-slate-600 bg-slate-800 text-slate-500 cursor-not-allowed",
          ].join(" ")}
          disabled={!hasSelection}
          onClick={handlePlay}
          type="button"
        >
          出牌
        </button>
        <button
          className={[
            "rounded-lg px-3 py-1 text-xs font-medium transition-all",
            hasSelection
              ? "border border-red-400/60 bg-red-600 text-white shadow-sm hover:bg-red-500"
              : "border border-slate-600 bg-slate-800 text-slate-500 cursor-not-allowed",
          ].join(" ")}
          disabled={!hasSelection}
          onClick={handleDiscard}
          type="button"
        >
          弃牌
        </button>
        {hasSelection && (
          <span className="text-[10px] text-emerald-300/80">
            {selectedCardIds.length} 张已选
          </span>
        )}
      </div>

      {/* Card fan */}
      <div className="relative flex h-32 w-full items-end justify-center">
        {hand.map((card, i) => {
          const { rotate, translateX, translateY } = fanTransform(i, hand.length);
          const isSelected = selectedCardIds.includes(card.id);

          return (
            <div
              className="absolute bottom-0 transition-transform duration-200"
              key={card.id}
              style={{
                transform: [
                  `translateX(${translateX}px)`,
                  `translateY(${-translateY}px)`,
                  `rotate(${rotate}deg)`,
                ].join(" "),
                zIndex: i,
              }}
            >
              <CardComponent
                card={card}
                draggable
                onClick={() => toggleCardSelected(card.id)}
                selected={isSelected}
                variant="full"
              />
            </div>
          );
        })}

        {hand.length === 0 && (
          <span className="pb-6 text-xs text-white/30">手牌区</span>
        )}
      </div>
    </div>
  );
}
