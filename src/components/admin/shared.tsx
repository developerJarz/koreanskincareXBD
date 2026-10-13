"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import type { Permission } from "@/lib/permissions";
import { iconButton, inputClass, secondaryButton } from "./catalog/ui";

/** Building blocks shared by the admin modules that load their own data. */

// ─── Access (who is viewing, what they may do) ───

type Access = { permissions: Permission[]; userId: string; role: string };
const AccessContext = createContext<Access>({ permissions: [], userId: "", role: "staff" });

export function AccessProvider({ value, children }: { value: Access; children: React.ReactNode }) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const access = useContext(AccessContext);
  const can = useCallback((p: Permission) => access.permissions.includes(p), [access.permissions]);
  return { ...access, can };
}

// ─── Data loading ───

/**
 * Loads JSON from an admin API. Keeps showing the previous result while a new one loads
 * (no flashing on filter changes) and cancels requests that are no longer needed.
 * Pass null to skip loading.
 */
export function useAdminData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [version, setVersion] = useState(0);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!url) return;
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setLoading(true);
    fetch(url, { cache: "no-store", signal: ac.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Couldn't load this section.");
        setData(body as T);
        setError(null);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, loading, reload, setData };
}

/** Debounced copy of a value (for search boxes). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ─── Formatting ───

const nf = new Intl.NumberFormat("en-US");
export const fmtNumber = (n: number | null | undefined) =>
  n == null ? "—" : nf.format(Math.round(n));
export const fmtTaka = (n: number | null | undefined) =>
  n == null ? "—" : `৳${nf.format(Math.round(n))}`;
export const fmtPercent = (n: number | null | undefined, digits = 1) =>
  n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(digits)}%`;

export function fmtDuration(ms: number | null | undefined): string {
  if (!ms || ms < 1000) return ms ? "<1s" : "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const dtf = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});
const df = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

export const fmtDateTime = (iso?: string | Date | null) => (iso ? dtf.format(new Date(iso)) : "—");
export const fmtDate = (iso?: string | Date | null) => (iso ? df.format(new Date(iso)) : "—");

export function fmtRelative(iso?: string | Date | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return fmtDate(iso);
}

/** "2026-10-13" in Dhaka time, for date inputs. */
export function todayInput(offsetDays = 0) {
  const d = new Date(Date.now() + 6 * 3_600_000 + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Labels from the API ("2026-10-13", "2026-10-13 14:00", "2026-10") to short chart labels. */
export function shortBucket(label: string): string {
  const [date, hour] = label.split(" ");
  const parts = date.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (parts.length === 2) return `${months[Number(parts[1]) - 1]} ${parts[0].slice(2)}`;
  if (hour) return hour;
  return `${Number(parts[2])} ${months[Number(parts[1]) - 1]}`;
}

// ─── Layout pieces ───

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold font-sans tracking-normal text-foreground">
                {title}
              </h3>
            )}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function ChangeBadge({
  value,
  invert = false,
}: {
  value: number | null | undefined;
  invert?: boolean;
}) {
  if (value == null || !Number.isFinite(value)) {
    return <span className="text-[11px] text-muted-foreground">no earlier data</span>;
  }
  const up = value >= 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
        Math.abs(value) < 0.05
          ? "bg-secondary text-muted-foreground"
          : good
            ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
            : "bg-rose-500/12 text-rose-700 dark:text-rose-400"
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  change,
  invertChange,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  change?: number | null;
  invertChange?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {(hint || change !== undefined) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {change !== undefined && <ChangeBadge value={change} invert={invertChange} />}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
      <span className="flex-1 text-foreground">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className={secondaryButton}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon?: React.ElementType;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      {Icon && <Icon className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children && <div className="max-w-md text-xs text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = "h-40" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-card ${className}`}
      aria-hidden="true"
    />
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
  label = "results",
}: {
  page: number;
  totalPages: number;
  total?: number;
  onPage: (page: number) => void;
  label?: string;
}) {
  if (totalPages <= 1 && total === undefined) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground">
      <span>
        {total !== undefined ? `${fmtNumber(total)} ${label}` : ""}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={iconButton}
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Pill-style tab switcher. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full overflow-x-auto rounded-lg border border-border bg-secondary/60 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
            value === o.value
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Date range ───

export type RangeKey = "today" | "24h" | "7d" | "30d" | "90d" | "year" | "all" | "custom";
export type RangeValue = { key: RangeKey; from?: string; to?: string };

const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  "24h": "24 h",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  year: "12 months",
  all: "All time",
  custom: "Custom",
};

export function rangeQuery(r: RangeValue) {
  return r.key === "custom" ? { range: "custom", from: r.from, to: r.to } : { range: r.key };
}

export function RangePicker({
  value,
  onChange,
  options = ["today", "7d", "30d", "90d", "year", "all", "custom"],
}: {
  value: RangeValue;
  onChange: (r: RangeValue) => void;
  options?: RangeKey[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        label="Date range"
        value={value.key}
        onChange={(key) =>
          onChange(
            key === "custom"
              ? { key, from: value.from ?? todayInput(-29), to: value.to ?? todayInput() }
              : { key },
          )
        }
        options={options.map((k) => ({ value: k, label: RANGE_LABELS[k] }))}
      />
      {value.key === "custom" && (
        <div className="flex items-center gap-1.5 text-xs">
          <input
            type="date"
            aria-label="From"
            className={`${inputClass} h-8 w-auto text-xs`}
            value={value.from ?? ""}
            max={value.to}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            aria-label="To"
            className={`${inputClass} h-8 w-auto text-xs`}
            value={value.to ?? ""}
            min={value.from}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars with the value written next to each (no colour-only meaning). */
export function BarList({
  rows,
  format = fmtNumber,
  empty = "No data for this period.",
  max: maxRows = 8,
  sub,
}: {
  rows: { name: string; value: number; href?: string }[];
  format?: (n: number) => string;
  empty?: string;
  max?: number;
  sub?: (row: { name: string; value: number }) => React.ReactNode;
}) {
  const list = rows.slice(0, maxRows);
  const max = Math.max(1, ...list.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!list.length)
    return <p className="py-6 text-center text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {list.map((r) => (
        <li key={r.name} className="text-xs">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-foreground" title={r.name}>
              {r.name}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{format(r.value)}</span>
              {total > 0 && ` · ${((r.value / total) * 100).toFixed(0)}%`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full"
              style={{ width: `${(r.value / max) * 100}%`, background: "var(--viz-1)" }}
            />
          </div>
          {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub(r)}</div>}
        </li>
      ))}
    </ul>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info" | "accent";
}) {
  const tones = {
    neutral: "bg-secondary text-muted-foreground",
    good: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    warn: "bg-amber-500/15 text-amber-800 dark:text-amber-400",
    bad: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
    info: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
    accent: "bg-primary/12 text-primary",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
