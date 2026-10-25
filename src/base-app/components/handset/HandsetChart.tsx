import React, { useId } from "react";

const WIDTH = 320;
const HEIGHT = 150;

/** One-day price line: green when the day ends up, red when it ends down. */
export function HandsetChart({
  points,
  label,
}: {
  points: number[];
  label: string;
}) {
  const gradient = `handset-chart-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const min = Math.min(...points);
  const range = Math.max(...points) - min || 1;
  const x = (index: number) => (index / (points.length - 1)) * WIDTH;
  const y = (price: number) =>
    HEIGHT - 8 - ((price - min) / range) * (HEIGHT - 22);
  const line = points
    .map((price, index) => `${index ? "L" : "M"}${x(index)} ${y(price)}`)
    .join("");
  const up = points[points.length - 1] >= points[0];
  const stroke = up ? "#7ee0a8" : "#ff9b9b";
  return (
    <div className="handset-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={stroke} stopOpacity={up ? 0.2 : 0.18} />
            <stop offset="1" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d={`${line}L${WIDTH} ${HEIGHT}L0 ${HEIGHT}Z`}
          fill={`url(#${gradient})`}
        />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={1.8}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="handset-chart-dot"
        style={{
          top: `${(y(points[points.length - 1]) / HEIGHT) * 100}%`,
          background: stroke,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
