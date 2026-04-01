type RadarChartProps = {
  /** [过牌, 控场, 爆发, 防御] — each 0-10 */
  scores: [number, number, number, number];
  /** Hex colour for the filled area (e.g. faction colour) */
  color: string;
};

const LABELS = ["过牌", "控场", "爆发", "防御"] as const;

/**
 * Simple SVG radar (diamond) chart with 4 axes.
 * Pure server component — no JS runtime, no chart library.
 */
export default function RadarChart({ scores, color }: RadarChartProps) {
  const cx = 100;
  const cy = 100;
  const maxR = 80;

  /** Map a 0-10 score to a point on the given axis. */
  function point(axisIndex: number, value: number): [number, number] {
    const clamped = Math.max(0, Math.min(10, value));
    const r = (clamped / 10) * maxR;
    // axes at 0°, 90°, 180°, 270° (top, right, bottom, left)
    const angles: [number, number, number, number] = [
      -Math.PI / 2,
      0,
      Math.PI / 2,
      Math.PI,
    ];
    const angle = angles[axisIndex as 0 | 1 | 2 | 3];
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  /** Build a diamond polygon string for a ring at the given fraction. */
  function ring(fraction: number): string {
    return [0, 1, 2, 3]
      .map((i) => point(i, fraction * 10).join(","))
      .join(" ");
  }

  const dataPoints = scores.map((s, i) => point(i, s));
  const dataPolygon = dataPoints.map((p) => p.join(",")).join(" ");

  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 200 200"
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

      {/* Filled data area */}
      <polygon
        fill={color}
        fillOpacity={0.25}
        points={dataPolygon}
        stroke={color}
        strokeWidth={1.5}
      />

      {/* Data-point dots */}
      {dataPoints.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} fill={color} r={3} />
      ))}

      {/* Axis labels */}
      {LABELS.map((label, i) => {
        const [px, py] = point(i, 10);
        // Nudge labels outward from the axis end
        const OFFSETS: [[number, number], [number, number], [number, number], [number, number]] = [
          [0, -12],
          [14, 4],
          [0, 16],
          [-14, 4],
        ];
        const [ox, oy] = OFFSETS[i as 0 | 1 | 2 | 3];
        return (
          <text
            key={label}
            className="fill-slate-600 dark:fill-slate-300"
            dominantBaseline="middle"
            fontSize={11}
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
  );
}
