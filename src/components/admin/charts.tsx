"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { shortBucket } from "./shared";

/**
 * Admin charts: one y-axis, thin marks, a recessive grid, a crosshair tooltip on every chart,
 * and a legend whenever there is more than one series. Colours come from --viz-* tokens.
 */

export type Series = { key: string; label: string; color?: string };

const SERIES_COLORS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)"];
const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

function ChartTooltip({
  active,
  payload,
  label,
  series,
  format,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  series: Series[];
  format: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label ? shortBucket(label) : ""}</p>
      {payload.map((p) => {
        const s = series.find((x) => x.key === p.dataKey);
        return (
          <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color }}
              aria-hidden="true"
            />
            <span>{s?.label ?? p.dataKey}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-foreground">
              {format(p.value)}
            </span>
          </p>
        );
      })}
    </div>
  );
}

function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
      {series.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ background: s.color ?? SERIES_COLORS[i] }}
            aria-hidden="true"
          />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export function TimeSeriesChart({
  data,
  series,
  format = (n) => new Intl.NumberFormat("en-US").format(Math.round(n)),
  axisFormat,
  height = 240,
  kind = "area",
  ariaLabel,
}: {
  data: Record<string, any>[];
  series: Series[];
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  height?: number;
  kind?: "area" | "line" | "bar";
  ariaLabel: string;
}) {
  const colors = series.map((s, i) => s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]);
  const compact = (n: number) =>
    axisFormat ? axisFormat(n) : new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeDasharray="0" />
      <XAxis
        dataKey="label"
        tickFormatter={shortBucket}
        tick={axisTick}
        tickLine={false}
        axisLine={false}
        minTickGap={24}
      />
      <YAxis
        tickFormatter={compact}
        tick={axisTick}
        tickLine={false}
        axisLine={false}
        width={44}
        allowDecimals={false}
      />
      <Tooltip
        cursor={
          kind === "bar"
            ? { fill: "var(--secondary)" }
            : { stroke: "var(--muted-foreground)", strokeWidth: 1 }
        }
        content={<ChartTooltip series={series} format={format} />}
      />
    </>
  );

  return (
    <figure aria-label={ariaLabel} className="m-0">
      <Legend series={series} />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {kind === "bar" ? (
            <BarChart {...common} barCategoryGap="25%">
              {axes}
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  fill={colors[i]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ))}
            </BarChart>
          ) : kind === "line" ? (
            <LineChart {...common}>
              {axes}
              {series.map((s, i) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={colors[i]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart {...common}>
              <defs>
                {series.map((s, i) => (
                  <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[i]} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              {axes}
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={colors[i]}
                  strokeWidth={2}
                  fill={`url(#fill-${s.key})`}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** Step-down funnel with counts and the share of the first step written on every bar. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        return (
          <li key={s.label} className="text-xs">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-foreground">{s.label}</span>
              <span className="tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {new Intl.NumberFormat("en-US").format(s.value)}
                </span>
                {" · "}
                {((s.value / top) * 100).toFixed(1)}%
                {prev ? ` (${prev ? ((s.value / prev) * 100).toFixed(0) : 0}% of previous)` : ""}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(1, (s.value / top) * 100)}%`,
                  background: "var(--viz-1)",
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
