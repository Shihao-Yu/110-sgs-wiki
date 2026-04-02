/* ------------------------------------------------------------------ */
/*  Simple horizontal SVG bar chart                                    */
/* ------------------------------------------------------------------ */

export type BarDatum = {
  label: string;
  value: number;
  /** Optional hex colour for the bar (default: brand red) */
  color?: string;
};

type BarChartProps = {
  data: BarDatum[];
  /** Maximum possible value (right edge of chart). Defaults to auto. */
  maxValue?: number;
  /** Value suffix rendered next to the bar label (default "%") */
  suffix?: string;
  /** Bar height in px (default 24) */
  barHeight?: number;
  /** Gap between bars in px (default 6) */
  barGap?: number;
};

const DEFAULT_COLOR = "#DC2626"; // brand red

export default function BarChart({
  data,
  maxValue: maxValueProp,
  suffix = "%",
  barHeight = 24,
  barGap = 6,
}: BarChartProps) {
  const maxValue =
    maxValueProp ?? Math.max(...data.map((d) => d.value), 1);

  const labelWidth = 80;
  const valueWidth = 50;
  const padding = { top: 4, right: valueWidth + 8, bottom: 4, left: labelWidth };
  const chartWidth = 400;
  const barAreaWidth = chartWidth - padding.left - padding.right;
  const chartHeight =
    padding.top + data.length * (barHeight + barGap) - barGap + padding.bottom;

  return (
    <svg
      className="w-full"
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {data.map((d, i) => {
        const y = padding.top + i * (barHeight + barGap);
        const width = Math.max(
          0,
          (d.value / maxValue) * barAreaWidth,
        );
        const color = d.color ?? DEFAULT_COLOR;

        return (
          <g key={d.label}>
            {/* Label */}
            <text
              className="fill-slate-700 dark:fill-slate-300"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={500}
              textAnchor="end"
              x={padding.left - 8}
              y={y + barHeight / 2}
            >
              {d.label}
            </text>

            {/* Track (faint background bar) */}
            <rect
              className="fill-slate-100 dark:fill-slate-800"
              height={barHeight}
              rx={4}
              width={barAreaWidth}
              x={padding.left}
              y={y}
            />

            {/* Filled bar */}
            <rect
              fill={color}
              fillOpacity={0.85}
              height={barHeight}
              rx={4}
              width={width}
              x={padding.left}
              y={y}
            />

            {/* Value label */}
            <text
              className="fill-slate-600 dark:fill-slate-300"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={600}
              x={padding.left + barAreaWidth + 8}
              y={y + barHeight / 2}
            >
              {d.value.toFixed(1)}
              {suffix}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
