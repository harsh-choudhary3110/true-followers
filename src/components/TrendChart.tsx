import { useRef, useState } from "react";
import { useStore } from "../store";

export interface TrendPoint {
  date: string; // ISO
  followers: number;
  following: number;
}

// Validated categorical slots 1 (blue) & 2 (orange) — CVD-safe in both modes.
const COLORS = {
  light: {
    followers: "#2a78d6",
    following: "#eb6834",
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    muted: "#898781",
  },
  dark: {
    followers: "#3987e5",
    following: "#d95926",
    grid: "#2c2c2a",
    axis: "#383835",
    muted: "#898781",
  },
};

const VB_W = 800;
const VB_H = 340;

function niceNum(x: number): number {
  const exp = Math.floor(Math.log10(x || 1));
  const f = x / 10 ** exp;
  const nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  return nf * 10 ** exp;
}

function niceScale(min: number, max: number, count = 4) {
  if (min === max) {
    min = Math.max(0, min - 1);
    max = max + 1;
  }
  const step = niceNum((max - min) / count);
  const niceMin = Math.max(0, Math.floor(min / step) * step);
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + 1e-9; v += step)
    ticks.push(Math.round(v));
  return { min: niceMin, max: niceMax, ticks };
}

// Compact axis labels: 1234567 -> "1.2M", 45000 -> "45K". Locale-aware.
const fmtCompact = (v: number) =>
  new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export default function TrendChart({ points }: { points: TrendPoint[] }) {
  const theme = useStore((s) => s.theme);
  const c = COLORS[theme];
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const n = points.length;
  const values = points.flatMap((p) => [p.followers, p.following]);
  const scale = niceScale(Math.min(...values), Math.max(...values));

  // Left gutter auto-sizes to the widest y-label so numbers sit snug and the
  // line starts right after them; right margin is just the marker radius.
  const labelWidth = Math.max(...scale.ticks.map((t) => fmtCompact(t).length)) * 7;
  const M = { top: 16, right: 8, bottom: 38, left: labelWidth + 10 };
  const PLOT_W = VB_W - M.left - M.right;
  const PLOT_H = VB_H - M.top - M.bottom;

  const xFor = (i: number) =>
    n === 1 ? M.left + PLOT_W / 2 : M.left + (i / (n - 1)) * PLOT_W;
  const yFor = (v: number) =>
    M.top + PLOT_H - ((v - scale.min) / (scale.max - scale.min)) * PLOT_H;

  const linePath = (key: "followers" | "following") =>
    points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p[key]).toFixed(1)}`,
      )
      .join(" ");

  // Map a pointer event to the nearest data index.
  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n < 1) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / VB_W;
    const plotLeftPx = M.left * scaleX;
    const plotRightPx = (VB_W - M.right) * scaleX;
    const t = (e.clientX - rect.left - plotLeftPx) / (plotRightPx - plotLeftPx);
    const idx = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
    setHover(idx);
  }

  const latest = points[n - 1];

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        {/* Legend with latest values */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: c.followers }}
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Followers
            </span>
            <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
              {latest.followers.toLocaleString()}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: c.following }}
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Following
            </span>
            <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
              {latest.following.toLocaleString()}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="btn-ghost ml-auto !px-2.5 text-xs text-slate-500 dark:text-slate-400"
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {showTable ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-white/10 dark:text-slate-400">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 text-right font-medium">Followers</th>
                <th className="py-2 text-right font-medium">Following</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr
                  key={p.date}
                  className="border-b border-slate-100 dark:border-white/5"
                >
                  <td className="py-2 pr-4 text-slate-700 dark:text-slate-200">
                    {new Date(p.date).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-900 dark:text-white">
                    {p.followers.toLocaleString()}
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-900 dark:text-white">
                    {p.following.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full"
            role="img"
            aria-label="Followers and following over time"
            onPointerMove={handleMove}
            onPointerLeave={() => setHover(null)}
          >
            {/* Y gridlines + labels */}
            {scale.ticks.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={VB_W - M.right}
                  y1={yFor(t)}
                  y2={yFor(t)}
                  stroke={c.grid}
                  strokeWidth={1}
                />
                <text
                  x={M.left - 8}
                  y={yFor(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={12}
                  fill={c.muted}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fmtCompact(t)}
                </text>
              </g>
            ))}

            {/* X labels */}
            {points.map((p, i) => {
              // thin labels if crowded
              const showEvery = Math.ceil(n / 6);
              if (n > 6 && i % showEvery !== 0 && i !== n - 1) return null;
              // Anchor the first/last labels to the edges so they don't overflow.
              const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
              const x =
                i === 0 ? M.left : i === n - 1 ? VB_W - M.right : xFor(i);
              return (
                <text
                  key={p.date}
                  x={x}
                  y={VB_H - M.bottom + 22}
                  textAnchor={anchor}
                  fontSize={12}
                  fill={c.muted}
                >
                  {fmtDate(p.date)}
                </text>
              );
            })}

            {/* Lines */}
            <path
              d={linePath("following")}
              fill="none"
              stroke={c.following}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={linePath("followers")}
              fill="none"
              stroke={c.followers}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Hover crosshair */}
            {hover !== null && (
              <line
                x1={xFor(hover)}
                x2={xFor(hover)}
                y1={M.top}
                y2={M.top + PLOT_H}
                stroke={c.axis}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}

            {/* Markers */}
            {points.map((p, i) => (
              <g key={p.date}>
                <circle
                  cx={xFor(i)}
                  cy={yFor(p.following)}
                  r={hover === i ? 5 : 4}
                  fill={c.following}
                  stroke="#fff"
                  strokeWidth={hover === i ? 2 : 0}
                />
                <circle
                  cx={xFor(i)}
                  cy={yFor(p.followers)}
                  r={hover === i ? 5 : 4}
                  fill={c.followers}
                  stroke="#fff"
                  strokeWidth={hover === i ? 2 : 0}
                />
              </g>
            ))}
          </svg>

          {/* Tooltip */}
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-slate-900"
              style={{ left: `${(xFor(hover) / VB_W) * 100}%` }}
            >
              <div className="mb-1 font-semibold text-slate-900 dark:text-white">
                {new Date(points[hover].date).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.followers }}
                />
                Followers
                <span className="ml-auto tabular-nums font-semibold text-slate-900 dark:text-white">
                  {points[hover].followers.toLocaleString()}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.following }}
                />
                Following
                <span className="ml-auto tabular-nums font-semibold text-slate-900 dark:text-white">
                  {points[hover].following.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
