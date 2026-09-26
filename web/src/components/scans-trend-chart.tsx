"use client";

import { useState, useRef, useId, useMemo } from "react";
import * as d3 from "d3";
import { cx } from "@/lib/cx";

export type TrendScan = {
  id: string;
  status: string;
  profile: string;
  phase: string | null;
  progress_pct: number;
  created_at: string;
};

type DayBucket = {
  date: Date;
  dateKey: string;
  label: string;
  fullDate: string;
  successful: number;
  failed: number;
  total: number;
  successRate: number;
};

export function ScansTrendChart({ scans }: { scans: TrendScan[] }) {
  const [filterMode, setFilterMode] = useState<"all" | "successful" | "failed">("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgId = useId();

  // Dimensions
  const width = 840;
  const height = 240;
  const margin = { top: 20, right: 30, bottom: 36, left: 38 };

  // Aggregate scans into 30 daily buckets (T-29 up to today)
  const { days, stats } = useMemo(() => {
    const now = new Date();
    // Normalize to midnight
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const buckets: DayBucket[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const fullDate = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      buckets.push({
        date: d,
        dateKey,
        label,
        fullDate,
        successful: 0,
        failed: 0,
        total: 0,
        successRate: 100,
      });
    }

    // Map scans into buckets
    for (const scan of scans) {
      if (!scan.created_at) continue;
      const sDate = new Date(scan.created_at);
      const sKey = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, "0")}-${String(sDate.getDate()).padStart(2, "0")}`;
      const bucket = buckets.find((b) => b.dateKey === sKey);
      if (bucket) {
        if (scan.status === "completed") {
          bucket.successful += 1;
          bucket.total += 1;
        } else if (scan.status === "failed" || scan.status === "timeout") {
          bucket.failed += 1;
          bucket.total += 1;
        }
      }
    }

    // Compute rates
    let totalAll = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let peakDayTotal = 0;
    let peakDayLabel = "";

    for (const b of buckets) {
      totalAll += b.total;
      totalSuccess += b.successful;
      totalFailed += b.failed;
      b.successRate = b.total > 0 ? Math.round((b.successful / b.total) * 100) : 100;
      if (b.total > peakDayTotal) {
        peakDayTotal = b.total;
        peakDayLabel = b.label;
      }
    }

    const overallSuccessPct = totalAll > 0 ? ((totalSuccess / totalAll) * 100).toFixed(1) : "100.0";
    const overallFailPct = totalAll > 0 ? ((totalFailed / totalAll) * 100).toFixed(1) : "0.0";

    return {
      days: buckets,
      stats: {
        totalAll,
        totalSuccess,
        totalFailed,
        overallSuccessPct,
        overallFailPct,
        peakDayTotal,
        peakDayLabel,
      },
    };
  }, [scans]);

  // D3 Scales
  const xScale = useMemo(() => {
    return d3
      .scaleTime()
      .domain([days[0].date, days[days.length - 1].date])
      .range([margin.left, width - margin.right]);
  }, [days, margin.left, margin.right, width]);

  const maxVal = useMemo(() => {
    const highest = d3.max(days, (d) => Math.max(d.successful, d.failed)) ?? 0;
    return Math.max(4, highest + 1);
  }, [days]);

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, maxVal])
      .nice()
      .range([height - margin.bottom, margin.top]);
  }, [maxVal, height, margin.bottom, margin.top]);

  // D3 Line & Area Generators
  const successLine = useMemo(() => {
    return d3
      .line<DayBucket>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.successful))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const failedLine = useMemo(() => {
    return d3
      .line<DayBucket>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.failed))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const successArea = useMemo(() => {
    return d3
      .area<DayBucket>()
      .x((d) => xScale(d.date))
      .y0(yScale(0))
      .y1((d) => yScale(d.successful))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const failedArea = useMemo(() => {
    return d3
      .area<DayBucket>()
      .x((d) => xScale(d.date))
      .y0(yScale(0))
      .y1((d) => yScale(d.failed))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  // Y-axis Ticks
  const yTicks = useMemo(() => {
    return yScale.ticks(4);
  }, [yScale]);

  // X-axis Ticks (5 evenly spaced across 30 days)
  const xTicks = useMemo(() => {
    const indices = [0, 7, 14, 21, 29];
    return indices.map((idx) => days[idx]).filter(Boolean);
  }, [days]);

  // Mouse tracking for crosshair & tooltip
  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;

    // Constrain to chart bounds
    const clampedX = Math.max(margin.left, Math.min(width - margin.right, svgX));
    const hoveredDate = xScale.invert(clampedX);

    // Find closest day
    let closestIdx = 0;
    let minDiff = Infinity;
    days.forEach((d, idx) => {
      const diff = Math.abs(d.date.getTime() - hoveredDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoveredIndex(closestIdx);
  }

  function handlePointerLeave() {
    setHoveredIndex(null);
  }

  const activeDay = hoveredIndex !== null ? days[hoveredIndex] : null;

  return (
    <div className="border border-line bg-canvas font-mono text-xs text-ink">
      {/* Top Header & Toggles */}
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-canvas">
              D3 Trend
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              30-Day Historical Scan Outcomes
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">
            Daily frequency trend comparing successful completions vs. failures/timeouts over the last 30 days.
          </p>
        </div>

        {/* Outcome Filter Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={cx(
              "border px-2.5 py-1 text-[11px] font-bold uppercase transition-colors",
              filterMode === "all"
                ? "border-ink bg-ink text-canvas"
                : "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
            )}
          >
            All Outcomes
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("successful")}
            className={cx(
              "border px-2.5 py-1 text-[11px] font-bold uppercase transition-colors",
              filterMode === "successful"
                ? "border-ink bg-ink text-canvas"
                : "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
            )}
          >
            Successful (Solid)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("failed")}
            className={cx(
              "border px-2.5 py-1 text-[11px] font-bold uppercase transition-colors",
              filterMode === "failed"
                ? "border-ink bg-ink text-canvas"
                : "border-line bg-canvas text-muted hover:border-ink hover:text-ink",
            )}
          >
            Failed (Dashed)
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 divide-x divide-y divide-line border-b border-line sm:grid-cols-4 sm:divide-y-0 bg-subtle/20">
        <div className="p-3">
          <span className="block text-[10px] uppercase text-muted">30-Day Total Scans</span>
          <span className="text-base font-bold text-ink">{stats.totalAll}</span>
          <span className="block text-[10px] text-faint">Executed pipeline jobs</span>
        </div>
        <div className="p-3">
          <span className="block text-[10px] uppercase text-muted">Successful Outcomes</span>
          <span className="text-base font-bold text-ink">
            {stats.totalSuccess}{" "}
            <span className="text-xs font-normal text-muted">({stats.overallSuccessPct}%)</span>
          </span>
          <span className="block text-[10px] text-faint">Completed report phase</span>
        </div>
        <div className="p-3">
          <span className="block text-[10px] uppercase text-muted">Failed / Timed Out</span>
          <span className="text-base font-bold text-ink">
            {stats.totalFailed}{" "}
            <span className="text-xs font-normal text-muted">({stats.overallFailPct}%)</span>
          </span>
          <span className="block text-[10px] text-faint">Terminated prematurely</span>
        </div>
        <div className="p-3">
          <span className="block text-[10px] uppercase text-muted">Peak Daily Load</span>
          <span className="text-base font-bold text-ink">
            {stats.peakDayTotal > 0 ? `${stats.peakDayTotal} scans` : "0"}
          </span>
          <span className="block text-[10px] text-faint">
            {stats.peakDayLabel ? `Peak on ${stats.peakDayLabel}` : "No recorded spikes"}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="relative w-full p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full overflow-visible select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* Subtle hatch pattern for failed area */}
            <pattern id={`${svgId}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M0 6 L6 0" stroke="currentColor" strokeWidth="0.8" className="text-line" />
            </pattern>
          </defs>

          {/* Horizontal Grid Lines & Y Ticks */}
          {yTicks.map((tick) => {
            const y = yScale(tick);
            return (
              <g key={tick} className="text-muted">
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="2,3"
                  className="text-line opacity-80"
                />
                <text
                  x={margin.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-faint font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X Axis Baseline */}
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={height - margin.bottom}
            y2={height - margin.bottom}
            stroke="currentColor"
            className="text-line"
          />

          {/* X Axis Date Labels */}
          {xTicks.map((d) => {
            const x = xScale(d.date);
            return (
              <g key={d.dateKey} className="text-muted">
                <line
                  x1={x}
                  x2={x}
                  y1={height - margin.bottom}
                  y2={height - margin.bottom + 4}
                  stroke="currentColor"
                  className="text-line"
                />
                <text
                  x={x}
                  y={height - margin.bottom + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-muted font-mono"
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* AREA FILLS */}
          {/* Successful Area Fill */}
          {(filterMode === "all" || filterMode === "successful") && (
            <path
              d={successArea(days) ?? ""}
              fill="currentColor"
              className="text-line fill-current opacity-25"
            />
          )}

          {/* Failed Area Fill */}
          {(filterMode === "all" || filterMode === "failed") && (
            <path
              d={failedArea(days) ?? ""}
              fill={`url(#${svgId}-hatch)`}
              opacity={0.4}
            />
          )}

          {/* LINE 1: SUCCESSFUL SCANS (Solid Black Line) */}
          {(filterMode === "all" || filterMode === "successful") && (
            <path
              d={successLine(days) ?? ""}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="text-ink"
            />
          )}

          {/* LINE 2: FAILED SCANS (Dashed High-Contrast Line) */}
          {(filterMode === "all" || filterMode === "failed") && (
            <path
              d={failedLine(days) ?? ""}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="5,4"
              className="text-ink"
            />
          )}

          {/* DATA POINTS */}
          {days.map((d, i) => {
            const cxPos = xScale(d.date);
            const cySuccess = yScale(d.successful);
            const cyFailed = yScale(d.failed);
            const isHovered = hoveredIndex === i;

            return (
              <g key={d.dateKey}>
                {/* Successful Dot (Solid Circle) */}
                {(filterMode === "all" || filterMode === "successful") && d.successful > 0 && (
                  <circle
                    cx={cxPos}
                    cy={cySuccess}
                    r={isHovered ? 4.5 : 2.5}
                    stroke="currentColor"
                    strokeWidth={isHovered ? 2 : 1}
                    className={cx("text-ink", isHovered ? "fill-canvas" : "fill-ink")}
                  />
                )}

                {/* Failed Dot (Hollow Square / Diamond) */}
                {(filterMode === "all" || filterMode === "failed") && d.failed > 0 && (
                  <rect
                    x={cxPos - (isHovered ? 4 : 2.5)}
                    y={cyFailed - (isHovered ? 4 : 2.5)}
                    width={isHovered ? 8 : 5}
                    height={isHovered ? 8 : 5}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className={cx("text-ink", isHovered ? "fill-ink" : "fill-canvas")}
                  />
                )}
              </g>
            );
          })}

          {/* INTERACTIVE CROSSHAIR */}
          {activeDay && (
            <g className="pointer-events-none">
              <line
                x1={xScale(activeDay.date)}
                x2={xScale(activeDay.date)}
                y1={margin.top}
                y2={height - margin.bottom}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="2,2"
                className="text-ink"
              />

              {/* Active Marker Highlights */}
              {(filterMode === "all" || filterMode === "successful") && (
                <circle
                  cx={xScale(activeDay.date)}
                  cy={yScale(activeDay.successful)}
                  r={5}
                  stroke="currentColor"
                  strokeWidth={2}
                  className="fill-canvas text-ink"
                />
              )}

              {(filterMode === "all" || filterMode === "failed") && (
                <rect
                  x={xScale(activeDay.date) - 4.5}
                  y={yScale(activeDay.failed) - 4.5}
                  width={9}
                  height={9}
                  stroke="currentColor"
                  strokeWidth={2}
                  className="fill-ink text-canvas"
                />
              )}
            </g>
          )}
        </svg>

        {/* FLOATING HOVER TOOLTIP */}
        {activeDay && (
          <div
            style={{
              left: `${Math.min(
                Math.max(margin.left, xScale(activeDay.date) - 80),
                width - margin.right - 180,
              )}px`,
              top: `${margin.top + 8}px`,
            }}
            className="pointer-events-none absolute z-10 border border-ink bg-canvas p-2.5 font-mono shadow-md text-ink min-w-44"
          >
            <div className="border-b border-line pb-1.5 mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-bold text-ink">{activeDay.fullDate}</span>
              <span className="border border-line bg-subtle px-1 py-0.2 text-[9px] text-muted">
                {activeDay.total} total
              </span>
            </div>

            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full bg-ink inline-block" />
                  Successful:
                </span>
                <strong className="text-ink">{activeDay.successful}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 border border-ink bg-canvas inline-block" />
                  Failed / Timeout:
                </span>
                <strong className="text-ink">{activeDay.failed}</strong>
              </div>

              <div className="border-t border-line/60 pt-1 mt-0.5 flex items-center justify-between text-[10px] text-faint">
                <span>Success Rate:</span>
                <span className="font-bold text-ink">{activeDay.successRate}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend & Interactive Guidance */}
      <div className="flex flex-col gap-2 border-t border-line bg-subtle/30 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between text-[11px]">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-5 bg-ink inline-block" />
            <span className="font-bold text-ink">Successful Scans (Solid)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-0.5 w-5 border-b-2 border-dashed border-ink inline-block" />
            <span className="font-bold text-ink">Failed / Timed Out Scans (Dashed)</span>
          </div>
        </div>

        <div className="text-[10px] text-muted">
          Hover over data points to inspect daily scan breakdown and success percentages.
        </div>
      </div>
    </div>
  );
}
