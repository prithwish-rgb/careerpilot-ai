"use client";

const COLORS: Record<string, string> = {
  saved: "#9CA3AF",
  applied: "#3B82F6",
  interview: "#EAB308",
  offer: "#22C55E",
  rejected: "#EF4444",
};

export function DonutChart({
  data,
  size = 160,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const stroke = size * 0.12;
  let cumulative = 0;

  const segments = data.map((d) => {
    const start = cumulative;
    cumulative += d.value / total;
    return { ...d, start, end: cumulative };
  });

  function arc(start: number, end: number) {
    const a0 = start * 2 * Math.PI - Math.PI / 2;
    const a1 = end * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        {segments.map((s) => (
          <path
            key={s.label}
            d={arc(s.start, s.end)}
            fill="none"
            stroke={COLORS[s.label] ?? "#6C63FF"}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 text-xl font-bold">
          {total}
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 capitalize">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[d.label] ?? "#6C63FF" }}
            />
            <span className="text-gray-700">{d.label}</span>
            <span className="text-gray-500 ml-auto">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
