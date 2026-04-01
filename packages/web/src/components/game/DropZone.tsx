"use client";

import { type DragEvent, useCallback, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DropZoneProps {
  /** Visual label inside the zone. */
  label: string;
  /** Called with the card id when a card is dropped. */
  onDrop: (cardId: string) => void;
  /** Optional extra styling. */
  className?: string;
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DropZone({
  label,
  onDrop,
  className = "",
  children,
}: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const cardId = e.dataTransfer.getData("application/x-card-id");
      if (cardId) {
        onDrop(cardId);
      }
    },
    [onDrop],
  );

  return (
    <div
      className={[
        "flex items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200",
        dragOver
          ? "border-yellow-400 bg-yellow-400/10 shadow-inner shadow-yellow-400/10"
          : "border-white/20 bg-white/5",
        className,
      ].join(" ")}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children ?? (
        <span
          className={[
            "text-xs font-medium transition-colors",
            dragOver
              ? "text-yellow-300"
              : "text-white/40",
          ].join(" ")}
        >
          {label}
        </span>
      )}
    </div>
  );
}
