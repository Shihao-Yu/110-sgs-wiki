"use client";

import { useState } from "react";
import GeneralPicker from "./GeneralPicker";
import GeneralCard, { EmptyGeneralCard } from "./GeneralCard";

interface GeneralOption {
  id: string;
  name: string;
  faction: string;
  hp: number;
  image: string;
}

export default function SessionPlayer({
  index,
  name,
  generals,
  allGenerals,
  excludedIds,
  onNameChange,
  onGeneralChange,
}: {
  index: number;
  name: string;
  generals: [string | null, string | null];
  allGenerals: GeneralOption[];
  excludedIds: string[];           // generals taken by *other* slots (not this player's own)
  onNameChange: (name: string) => void;
  onGeneralChange: (slot: 0 | 1, generalId: string | null) => void;
}) {
  const [pickingSlot, setPickingSlot] = useState<0 | 1 | null>(null);
  const own = generals.filter((g): g is string => g != null);

  const generalById = (id: string | null) =>
    id ? allGenerals.find((g) => g.id === id) ?? null : null;

  function excludedFor(slot: 0 | 1): string[] {
    const other = slot === 0 ? generals[1] : generals[0];
    const set = new Set(excludedIds);
    if (other) set.add(other);
    return Array.from(set);
  }

  return (
    <div className="panel ornate-corner space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <input
          aria-label={`玩家 ${index + 1} 名字`}
          className="input-base flex-1 font-display text-base"
          placeholder={`玩家 ${index + 1}`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={50}
        />
        <span className="shrink-0 rounded-full border border-vermillion/30 bg-paper-mist/50 px-2 py-0.5 text-xs text-ink-mute dark:bg-paper-deep/50 dark:text-ivory-soft">
          {own.length}/2
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((slot) => {
          const slotIdx = slot as 0 | 1;
          const gid = generals[slotIdx];
          const general = generalById(gid);

          if (pickingSlot === slotIdx) {
            return (
              <div key={slot} className="space-y-2">
                <GeneralPicker
                  ariaLabel={`选择 ${name || `玩家 ${index + 1}`} 的武将 ${slot + 1}`}
                  options={allGenerals}
                  excludedIds={excludedFor(slotIdx)}
                  autoFocus
                  onChange={(id) => {
                    onGeneralChange(slotIdx, id);
                    setPickingSlot(null);
                  }}
                  onCancel={() => setPickingSlot(null)}
                />
                <button
                  type="button"
                  onClick={() => setPickingSlot(null)}
                  className="w-full text-xs text-ink-mute hover:text-vermillion"
                >
                  取消
                </button>
              </div>
            );
          }

          if (general) {
            return (
              <GeneralCard
                key={slot}
                general={general}
                onClear={() => onGeneralChange(slotIdx, null)}
              />
            );
          }

          return (
            <EmptyGeneralCard
              key={slot}
              label={`选择武将 ${slot + 1}`}
              onClick={() => setPickingSlot(slotIdx)}
            />
          );
        })}
      </div>
    </div>
  );
}
