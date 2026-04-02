import type { Faction } from "@sgs/data";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type HeatMapCell = {
  /** Row faction */
  row: Faction;
  /** Column faction */
  col: Faction;
  /** Value to display (e.g. win rate percentage) */
  value: number;
};

type HeatMapProps = {
  /** Row labels (factions on the Y axis) */
  rows: { id: Faction; label: string }[];
  /** Column labels (factions on the X axis) */
  cols: { id: Faction; label: string }[];
  /** Flat array of cell data — one entry per row/col combination */
  cells: HeatMapCell[];
  /** Minimum value in the colour scale */
  min?: number;
  /** Maximum value in the colour scale */
  max?: number;
  /** Value suffix shown inside cells (default "%") */
  suffix?: string;
};

/* ------------------------------------------------------------------ */
/*  Colour interpolation helpers                                       */
/* ------------------------------------------------------------------ */

/** Linearly interpolate between two [r,g,b] colours. */
function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

/** Low-end colour (cool blue) */
const LO: [number, number, number] = [219, 234, 254]; // blue-100
/** Mid colour (white) */
const MID: [number, number, number] = [255, 255, 255];
/** High-end colour (warm red) */
const HI: [number, number, number] = [254, 202, 202]; // red-200

function cellBg(value: number, min: number, max: number): string {
  const mid = (min + max) / 2;
  if (value <= mid) {
    const t = (value - min) / (mid - min || 1);
    return lerpRgb(LO, MID, t);
  }
  const t = (value - mid) / (max - mid || 1);
  return lerpRgb(MID, HI, t);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HeatMap({
  rows,
  cols,
  cells,
  min = 40,
  max = 60,
  suffix = "%",
}: HeatMapProps) {
  /** Build a lookup map for O(1) cell access. */
  const lookup = new Map<string, number>();
  for (const c of cells) {
    lookup.set(`${c.row}:${c.col}`, c.value);
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-px"
        style={{
          gridTemplateColumns: `auto repeat(${cols.length}, minmax(3.5rem, 1fr))`,
          gridTemplateRows: `auto repeat(${rows.length}, minmax(2.5rem, 1fr))`,
        }}
      >
        {/* Top-left empty corner */}
        <div />

        {/* Column headers */}
        {cols.map((c) => (
          <div
            key={c.id}
            className="flex items-end justify-center pb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            {c.label}
          </div>
        ))}

        {/* Rows */}
        {rows.map((r) => (
          <>
            {/* Row header */}
            <div
              key={`rh-${r.id}`}
              className="flex items-center justify-end pr-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              {r.label}
            </div>

            {/* Data cells */}
            {cols.map((c) => {
              const val = lookup.get(`${r.id}:${c.id}`);
              const display = val != null ? val.toFixed(1) : "—";
              const bg =
                val != null
                  ? cellBg(val, min, max)
                  : "transparent";

              /* For dark mode we overlay a semi-transparent layer */
              return (
                <div
                  key={`${r.id}:${c.id}`}
                  className="flex items-center justify-center rounded-md text-xs font-medium tabular-nums text-slate-800 dark:brightness-90"
                  style={{
                    backgroundColor: bg,
                    minWidth: "3.5rem",
                    minHeight: "2.5rem",
                  }}
                >
                  {display}
                  {val != null && suffix}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
