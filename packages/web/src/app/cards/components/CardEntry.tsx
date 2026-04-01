/* ------------------------------------------------------------------ */
/*  Local types (avoids @sgs/data build-order dependency)              */
/* ------------------------------------------------------------------ */

export type Suit = "spade" | "heart" | "club" | "diamond";

/* ------------------------------------------------------------------ */
/*  Suit display helpers                                               */
/* ------------------------------------------------------------------ */

const SUIT_ICON: Record<Suit, string> = {
  spade: "\u2660",
  heart: "\u2665",
  club: "\u2663",
  diamond: "\u2666",
};

const SUIT_LABEL: Record<Suit, string> = {
  spade: "\u9ED1\u6843",
  heart: "\u7EA2\u6843",
  club: "\u6885\u82B1",
  diamond: "\u65B9\u5757",
};

const SUIT_COLOR: Record<Suit, string> = {
  spade: "text-slate-900 dark:text-slate-100",
  club: "text-slate-900 dark:text-slate-100",
  heart: "text-red-600 dark:text-red-400",
  diamond: "text-red-600 dark:text-red-400",
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
/*  Type / subtype labels and styles                                   */
/* ------------------------------------------------------------------ */

export type CardType = "basic" | "trick" | "equipment";
export type CardSubtype =
  | "weapon"
  | "armor"
  | "defensiveHorse"
  | "offensiveHorse"
  | "treasure"
  | "instantTrick"
  | "delayedTrick";

const TYPE_BADGE: Record<
  CardType,
  { bg: string; text: string; border: string; label: string }
> = {
  basic: {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200/80 dark:border-red-800/60",
    label: "\u57FA\u672C\u724C",
  },
  trick: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200/80 dark:border-blue-800/60",
    label: "\u9526\u56CA\u724C",
  },
  equipment: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-800/60",
    label: "\u88C5\u5907\u724C",
  },
};

const SUBTYPE_LABEL: Record<string, string> = {
  weapon: "\u6B66\u5668",
  armor: "\u9632\u5177",
  defensiveHorse: "\u9632\u5FA1\u5750\u9A91",
  offensiveHorse: "\u8FDB\u653B\u5750\u9A91",
  treasure: "\u5B9D\u7269",
  instantTrick: "\u5373\u65F6\u9526\u56CA",
  delayedTrick: "\u5EF6\u65F6\u9526\u56CA",
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface CardEntryProps {
  name: string;
  type: CardType;
  subtype?: CardSubtype;
  suit: Suit;
  number: number;
  description: string;
  range?: number;
  /** How many copies of this exact card (same name) exist in the deck. */
  count: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CardEntry({
  name,
  type,
  subtype,
  suit,
  number,
  description,
  range,
  count,
}: CardEntryProps) {
  const badge = TYPE_BADGE[type];
  const subtypeText = subtype ? SUBTYPE_LABEL[subtype] : null;

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/85 p-3 transition-colors hover:border-slate-300/80 dark:border-slate-800/80 dark:bg-slate-950/80 dark:hover:border-slate-700/80 sm:p-4">
      {/* Suit + number pill */}
      <div
        className={[
          "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border",
          badge.border,
          badge.bg,
        ].join(" ")}
      >
        <span className={`text-sm font-bold leading-none ${SUIT_COLOR[suit]}`}>
          {SUIT_ICON[suit]}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold leading-none text-slate-600 dark:text-slate-300">
          {displayNumber(number)}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name row */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
            {name}
          </h3>

          {/* Type badge */}
          <span
            className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.label}
          </span>

          {/* Subtype badge */}
          {subtypeText && (
            <span className="inline-flex rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              {subtypeText}
            </span>
          )}

          {/* Range indicator for weapons */}
          {range != null && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-medium">{range}</span>
            </span>
          )}
        </div>

        {/* Suit text + count */}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span className={SUIT_COLOR[suit]}>
            {SUIT_ICON[suit]} {SUIT_LABEL[suit]}{displayNumber(number)}
          </span>
          {count > 1 && (
            <span className="ml-2 text-slate-400 dark:text-slate-500">
              x{count}
            </span>
          )}
        </p>

        {/* Description */}
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
