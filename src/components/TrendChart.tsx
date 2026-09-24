import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore } from "../store";
import Select from "./Select";

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

// Desktop is wide; on phones a taller, narrower box gives the plot vertical
// room and makes the (viewBox-relative) axis labels read at a legible size.
const VB = {
  wide: { w: 800, h: 340 },
  mobile: { w: 440, h: 380 },
};

// Windowing options for long histories. `days: null` means "all time".
const RANGES: { label: string; value: string; days: number | null }[] = [
  { label: "Last 7 days", value: "7", days: 7 },
  { label: "Last 30 days", value: "30", days: 30 },
  { label: "Last 90 days", value: "90", days: 90 },
  { label: "Last year", value: "365", days: 365 },
  { label: "All time", value: "all", days: null },
];

// Tracks the narrow breakpoint so the chart can swap to a taller viewBox.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

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

// Smooth the line with a Catmull-Rom spline (converted to cubic béziers) so the
// trend reads as a soft curve instead of jagged straight segments. Tension is
// kept low (/6) to hug the data and avoid wild overshoot on noisy points.
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length < 3)
    return pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function TrendChart({
  points: allPoints,
}: {
  points: TrendPoint[];
}) {
  const theme = useStore((s) => s.theme);
  const c = COLORS[theme];
  const isMobile = useIsMobile();
  const { w: VB_W, h: VB_H } = isMobile ? VB.mobile : VB.wide;
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  // Pixel left for the tooltip, clamped so it never spills past either edge.
  const [tipLeft, setTipLeft] = useState(0);
  // null = all time; otherwise a window in days ending at the latest snapshot.
  const [rangeDays, setRangeDays] = useState<number | null>(null);

  // Total span of the history — decides which range buttons make sense.
  const spanDays =
    allPoints.length > 1
      ? (new Date(allPoints[allPoints.length - 1].date).getTime() -
          new Date(allPoints[0].date).getTime()) /
        86_400_000
      : 0;
  // Only offer a window shorter than the data itself; "All" always shows.
  const ranges = RANGES.filter((r) => r.days === null || r.days < spanDays);
  const showRanges = ranges.length > 1;

  // Apply the selected window, counting back from the most recent snapshot.
  let points = allPoints;
  if (rangeDays !== null && allPoints.length > 1) {
    const cutoff =
      new Date(allPoints[allPoints.length - 1].date).getTime() -
      rangeDays * 86_400_000;
    const windowed = allPoints.filter(
      (p) => new Date(p.date).getTime() >= cutoff,
    );
    // Keep at least two points so the chart still draws a line.
    points = windowed.length >= 2 ? windowed : allPoints.slice(-2);
  }

  const n = points.length;
  const values = points.flatMap((p) => [p.followers, p.following]);
  const scale = niceScale(Math.min(...values), Math.max(...values));

  // Left gutter auto-sizes to the widest y-label so numbers sit snug and the
  // line starts right after them; right margin is just the marker radius.
  // No x-axis date labels or per-point dots — the chart stays a clean pair of
  // trend lines; the date and values surface only on hover, so bottom needs
  // just a little breathing room.
  const labelWidth = Math.max(...scale.ticks.map((t) => fmtCompact(t).length)) * 7;
  const M = { top: 16, right: 8, bottom: 16, left: labelWidth + 10 };
  const PLOT_W = VB_W - M.left - M.right;
  const PLOT_H = VB_H - M.top - M.bottom;

  const xFor = (i: number) =>
    n === 1 ? M.left + PLOT_W / 2 : M.left + (i / (n - 1)) * PLOT_W;
  const yFor = (v: number) =>
    M.top + PLOT_H - ((v - scale.min) / (scale.max - scale.min)) * PLOT_H;

  const linePath = (key: "followers" | "following") =>
    smoothPath(points.map((p, i) => ({ x: xFor(i), y: yFor(p[key]) })));

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

  // On touch, capture the pointer so scrubbing keeps tracking even if the
  // thumb strays outside the svg, and show the tooltip immediately on tap.
  function handleDown(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleMove(e);
  }

  const latest = points[n - 1];

  // Position the tooltip at the hovered point but clamp it inside the chart so
  // it never overflows the container (and thus the window) at the edges. Runs
  // before paint, so there's no visible jump.
  useLayoutEffect(() => {
    if (hover === null) return;
    const wrap = wrapRef.current;
    const tip = tipRef.current;
    if (!wrap || !tip) return;
    const wrapW = wrap.clientWidth;
    const tipW = tip.offsetWidth;
    const pad = 4;
    const pointX = (xFor(hover) / VB_W) * wrapW;
    const left = Math.max(pad, Math.min(pointX - tipW / 2, wrapW - tipW - pad));
    setTipLeft(left);
    // xFor depends on n/M/VB_W; those are captured in this render's closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, VB_W, n, rangeDays]);

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
        {showRanges && (
          <div className="ml-auto">
            <Select
              ariaLabel="Chart time range"
              value={rangeDays === null ? "all" : String(rangeDays)}
              onChange={(v) => {
                setRangeDays(v === "all" ? null : Number(v));
                setHover(null);
              }}
              options={ranges.map((r) => ({ value: r.value, label: r.label }))}
            />
          </div>
        )}
      </div>

      <div ref={wrapRef} className="relative mt-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full touch-pan-y"
            role="img"
            aria-label="Followers and following over time"
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={() => setHover(null)}
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

            {/* Lines */}
            <path
              d={linePath("following")}
              fill="none"
              stroke={c.following}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={linePath("followers")}
              fill="none"
              stroke={c.followers}
              strokeWidth={3}
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

            {/* Markers — only the hovered point gets dots; the rest stay clean. */}
            {hover !== null && (
              <g>
                <circle
                  cx={xFor(hover)}
                  cy={yFor(points[hover].following)}
                  r={5}
                  fill={c.following}
                  stroke="#fff"
                  strokeWidth={2}
                />
                <circle
                  cx={xFor(hover)}
                  cy={yFor(points[hover].followers)}
                  r={5}
                  fill={c.followers}
                  stroke="#fff"
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>

          {/* Tooltip */}
          {hover !== null && (
            <div
              ref={tipRef}
              className="pointer-events-none absolute top-2 z-10 max-w-[calc(100%-0.5rem)] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-slate-900"
              style={{ left: tipLeft }}
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
    </div>
  );
}
