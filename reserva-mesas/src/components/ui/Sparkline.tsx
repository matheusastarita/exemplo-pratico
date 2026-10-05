import { useId } from "react";

/** Mini gráfico de linha. A cor vem de `currentColor` (defina com text-*). */
export function Sparkline({
  values,
  className = "",
}: {
  values: number[];
  className?: string;
}) {
  const gradientId = useId();
  if (values.length < 2) return null;

  const width = 100;
  const height = 32;
  const pad = 3;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * width;
    // série toda igual (ex.: tudo zero) vira uma linha reta na base
    const y =
      range === 0 ? height - pad : height - pad - ((value - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
