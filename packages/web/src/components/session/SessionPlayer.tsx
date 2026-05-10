"use client";

import Link from "next/link";
import GeneralPicker from "./GeneralPicker";

interface GeneralOption {
  id: string;
  name: string;
  faction: string;
  hp: number;
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
  const displayName = name.trim() || `玩家 ${index + 1}`;
  const own = generals.filter((g): g is string => g != null);
  const excludedForSlot = (slot: 0 | 1) => {
    // Exclude all other taken (other slots in this player + other players)
    const other = slot === 0 ? generals[1] : generals[0];
    const set = new Set(excludedIds);
    if (other) set.add(other);
    return Array.from(set);
  };

  return (
    <div className="panel ornate-corner space-y-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <input
          aria-label={`玩家 ${index + 1} 名字`}
          className="input-base flex-1 font-display text-base"
          placeholder={`玩家 ${index + 1}`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={50}
        />
        <span className="shrink-0 text-xs text-ink-mute dark:text-ivory-soft">{own.length}/2</span>
      </div>

      <div className="space-y-2">
        {[0, 1].map((slot) => {
          const gid = generals[slot as 0 | 1];
          return (
            <div key={slot} className="space-y-1">
              <span className="block text-xs text-ink-mute dark:text-ivory-soft">
                武将 {slot + 1}
                {gid && (
                  <Link
                    href={`/generals/${gid}`}
                    className="ml-2 text-vermillion hover:underline"
                    target="_blank"
                    rel="noopener"
                    aria-label={`在新标签打开 ${gid} 详情`}
                  >
                    详情 ↗
                  </Link>
                )}
              </span>
              <GeneralPicker
                ariaLabel={`${displayName} 的武将 ${slot + 1}`}
                options={allGenerals}
                excludedIds={excludedForSlot(slot as 0 | 1)}
                value={gid}
                onChange={(next) => onGeneralChange(slot as 0 | 1, next)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
