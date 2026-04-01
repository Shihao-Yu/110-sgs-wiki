import type { Faction } from "@sgs/data";

/** Hex colour per faction — mirrors FACTION_META used elsewhere. */
const FACTION_HEX: Record<Faction, string> = {
  WEI: "#2563EB",
  SHU: "#DC2626",
  WU: "#16A34A",
  QUN: "#CA8A04",
  JIN: "#9333EA",
};

export type ComparisonEntry = {
  name: string;
  faction: Faction;
  /** [过牌, 控场, 爆发, 防御] — each 0-10 */
  scores: [number, number, number, number];
};

type ComparisonChartProps = {
  entries: ComparisonEntry[];
};

const LABELS = ["过牌", "控场", "爆发", "防御"] as const;

/**
 * Multi-general radar chart — overlays one polygon per general onto
 * a single SVG diamond grid.  Pure server component, no JS runtime.
 */
export default function ComparisonChart({ entries }: ComparisonChartProps) {
  const cx = 120;
  const cy = 120;
  const maxR = 90;

  /** Map a 0-10 score to a point on the given axis. */
  function point(axisIndex: number, value: number): [number, number] {
    const clamped = Math.max(0, Math.min(10, value));
    const r = (clamped / 10) * maxR;
    const angles: [number, number, number, number] = [
      -Math.PI / 2,
      0,
      Math.PI / 2,
      Math.PI,
    ];
    const angle = angles[axisIndex as 0 | 1 | 2 | 3];
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  /** Diamond polygon for a background ring at the given fraction. */
  function ring(fraction: number): string {
    return [0, 1, 2, 3]
      .map((i) => point(i, fraction * 10).join(","))
      .join(" ");
  }

  return (
    <div>
      <svg
        className="h-full w-full"
        viewBox="0 0 240 240"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background rings at 25%, 50%, 75%, 100% */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            className="fill-none stroke-slate-200 dark:stroke-slate-700"
            points={ring(f)}
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {[0, 1, 2, 3].map((i) => {
          const [px, py] = point(i, 10);
          return (
            <line
              key={i}
              className="stroke-slate-300 dark:stroke-slate-600"
              strokeWidth={0.5}
              x1={cx}
              x2={px}
              y1={cy}
              y2={py}
            />
          );
        })}

        {/* One polygon per general — stacked with translucent fills */}
        {entries.map((entry) => {
          const color = FACTION_HEX[entry.faction];
          const pts = entry.scores
            .map((s, i) => point(i, s).join(","))
            .join(" ");
          return (
            <g key={entry.name}>
              <polygon
                fill={color}
                fillOpacity={0.15}
                points={pts}
                stroke={color}
                strokeWidth={1.5}
              />
              {entry.scores.map((s, i) => {
                const [px, py] = point(i, s);
                return (
                  <circle key={i} cx={px} cy={py} fill={color} r={2.5} />
                );
              })}
            </g>
          );
        })}

        {/* Axis labels */}
        {LABELS.map((label, i) => {
          const [px, py] = point(i, 10);
          const OFFSETS: [
            [number, number],
            [number, number],
            [number, number],
            [number, number],
          ] = [
            [0, -14],
            [16, 4],
            [0, 18],
            [-16, 4],
          ];
          const [ox, oy] = OFFSETS[i as 0 | 1 | 2 | 3];
          return (
            <text
              key={label}
              className="fill-slate-600 dark:fill-slate-300"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={500}
              textAnchor="middle"
              x={px + ox}
              y={py + oy}
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
        {entries.map((entry) => {
          const color = FACTION_HEX[entry.faction];
          return (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {entry.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
