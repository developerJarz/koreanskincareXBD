"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  CreditCard,
  Eye,
  LineChart as LineChartIcon,
  MapPin,
  Package,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import type { AdminTab } from "./types";
import { TimeSeriesChart } from "./charts";
import {
  fmtNumber,
  fmtPercent,
  fmtRelative,
  fmtTaka,
  Panel,
  Skeleton,
  StatTile,
  useAccess,
  useAdminData,
} from "./shared";
import type { SalesStats } from "./SalesAnalyticsModule";

export type AttentionItem = {
  key: string;
  count: number;
  singular: string;
  plural: string;
  action: string;
  tab: AdminTab;
};

type LiveSummary = {
  live: { visitorId: string }[];
  totals: { visitors: number; pageViews: number; addToCarts: number };
};

const ATTENTION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  orders: {
    icon: ShoppingBag,
    color: "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  stock: {
    icon: AlertTriangle,
    color: "bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  refunds: {
    icon: RotateCcw,
    color: "bg-purple-500/12 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  invoices: {
    icon: ReceiptText,
    color: "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/20",
  },
  reviews: {
    icon: Sparkles,
    color: "bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  vproducts: {
    icon: Package,
    color: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  vendors: {
    icon: Store,
    color: "bg-teal-500/12 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
};

type ChartMetric = "revenue" | "orders";
type ChartStyle = "area" | "bar";

/** First page after sign-in: what needs doing, and how today is going — all from MongoDB. */
export function OverviewModule({
  firstName,
  attention,
  onOpen,
}: {
  firstName: string;
  attention: AttentionItem[];
  onOpen: (tab: AdminTab) => void;
}) {
  const { can } = useAccess();
  const canSales = can("analytics.view") || can("dashboard.view");
  const today = useAdminData<SalesStats>(canSales ? "/api/admin/stats?range=today" : null);
  const month = useAdminData<SalesStats>(canSales ? "/api/admin/stats?range=30d" : null);
  const activity = useAdminData<LiveSummary>(
    can("activity.view") ? "/api/admin/activity?range=today" : null,
  );
  const orders = useAdminData<{ items: any[] }>(
    can("orders.view") ? "/api/orders?pageSize=6" : null,
  );

  const [chartMetric, setChartMetric] = useState<ChartMetric>("revenue");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("area");

  const open = attention.filter((a) => a.count > 0);
  const t = today.data?.totals;
  const m = month.data;

  // Time-aware greeting based on Dhaka time (UTC+6)
  const greeting = useMemo(() => {
    const dhakaHour = (new Date().getUTCHours() + 6) % 24;
    if (dhakaHour < 12) return "Good morning";
    if (dhakaHour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Asia/Dhaka",
      }).format(new Date());
    } catch {
      return "Today";
    }
  }, []);

  // Compute highest sales revenue among top products for progress bar
  const maxProductRevenue = useMemo(() => {
    if (!m?.topProducts?.length) return 1;
    return Math.max(...m.topProducts.map((p) => p.revenue || 1));
  }, [m]);

  // Compute highest division revenue for regional breakdown
  const maxDivisionRevenue = useMemo(() => {
    if (!m?.byDivision?.length) return 1;
    return Math.max(...m.byDivision.map((d) => d.revenue || 1));
  }, [m]);

  // Peak day revenue from series
  const peakDayStat = useMemo(() => {
    if (!m?.series?.length) return null;
    let peak = m.series[0];
    for (const day of m.series) {
      if ((day.revenue || 0) > (peak.revenue || 0)) peak = day;
    }
    return peak;
  }, [m]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ─── Hero Overview: Attention + Today's Live Stats ─── */}
      <section className="grid gap-4 sm:gap-5 grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {/* Welcome & Actionable Attention Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4.5 sm:p-6 shadow-xs min-w-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5 sm:pb-4">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">
                  {greeting}
                </span>
                <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
                  {firstName}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{todayFormatted}</span>
              </div>
            </div>

            <div className="mt-3.5 sm:mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Action required today
                </h3>
                {open.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-rose/10 px-2 py-0.5 text-[11px] font-bold text-rose">
                    {open.reduce((acc, curr) => acc + curr.count, 0)} items
                  </span>
                )}
              </div>

              {open.length === 0 ? (
                <div className="mt-3.5 flex items-center gap-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-foreground">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-emerald-500" />
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      All caught up!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No orders, returns, or stock alerts require immediate attention right now.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-border/60">
                  {open.map((item) => {
                    const meta = ATTENTION_ICONS[item.key] || {
                      icon: AlertTriangle,
                      color: "bg-primary/10 text-primary border-primary/20",
                    };
                    const ItemIcon = meta.icon;
                    return (
                      <li
                        key={item.key}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 py-3 first:pt-1 last:pb-1"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-8.5 w-8.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}
                          >
                            <ItemIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-serif text-base sm:text-lg font-bold tabular-nums text-foreground">
                                {item.count}
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                {item.count === 1 ? item.singular : item.plural}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpen(item.tab)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/80 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all duration-150 hover:border-primary/50 hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <span>{item.action}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Today's Live Pulse Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4.5 sm:p-6 shadow-xs min-w-0">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <h3 className="font-sans text-xs sm:text-sm font-bold tracking-tight text-foreground">
                  Today So Far
                </h3>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                Dhaka Realtime
              </span>
            </div>

            {canSales && !t ? (
              <Skeleton className="mt-4 h-40" />
            ) : (
              <div className="mt-3.5 sm:mt-4 grid grid-cols-2 gap-2.5 sm:gap-3.5">
                {t && (
                  <>
                    <div className="rounded-xl border border-border/80 bg-secondary/40 p-3 sm:p-3.5 min-w-0">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium">Revenue</span>
                        <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
                      </div>
                      <p className="mt-1 sm:mt-1.5 text-base sm:text-xl font-bold tracking-tight tabular-nums text-foreground truncate">
                        {fmtTaka(t.revenue)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-secondary/40 p-3 sm:p-3.5 min-w-0">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium">Orders</span>
                        <ShoppingBag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      </div>
                      <p className="mt-1 sm:mt-1.5 text-base sm:text-xl font-bold tracking-tight tabular-nums text-foreground truncate">
                        {fmtNumber(t.orders)}
                      </p>
                    </div>
                  </>
                )}

                {activity.data && (
                  <>
                    <div className="rounded-xl border border-border/80 bg-secondary/40 p-3 sm:p-3.5 min-w-0">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[11px] sm:text-xs font-medium">Visitors</span>
                        <Eye className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      </div>
                      <p className="mt-1 sm:mt-1.5 text-base sm:text-xl font-bold tracking-tight tabular-nums text-foreground truncate">
                        {fmtNumber(activity.data.totals.visitors)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-3.5 min-w-0">
                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                        <span className="text-[11px] sm:text-xs font-semibold">Live Now</span>
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                      </div>
                      <p className="mt-1 sm:mt-1.5 text-base sm:text-xl font-bold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-300 truncate">
                        {fmtNumber(activity.data.live.length)} online
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="mt-3.5 text-[10px] sm:text-[11px] text-muted-foreground/80">
            Revenue excludes cancelled and refunded orders. Resets automatically at 00:00 Dhaka time.
          </p>
        </div>
      </section>

      {/* ─── 30-Day Performance Stat Cards ─── */}
      {m && (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
            <StatTile
              label="Revenue (30d)"
              value={fmtTaka(m.totals.revenue)}
              change={m.change?.revenue}
              hint="vs previous 30d"
              icon={TrendingUp}
            />
            <StatTile
              label="Orders (30d)"
              value={fmtNumber(m.totals.orders)}
              change={m.change?.orders}
              hint="completed orders"
              icon={ShoppingBag}
            />
            <StatTile
              label="Avg. Order Value"
              value={fmtTaka(m.totals.aov)}
              change={m.change?.aov}
              hint="per customer"
              icon={Tag}
            />
            <StatTile
              label="Visitor Conversion"
              value={m.totals.conversionRate == null ? "—" : fmtPercent(m.totals.conversionRate)}
              hint={
                m.totals.visitors
                  ? `${fmtNumber(m.totals.visitors)} visits`
                  : "Needs activity"
              }
              icon={Users}
            />
          </div>

          {/* ─── Main Graph Section: Interactive Sales & Orders Visualizer ─── */}
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)]">
            <Panel
              title={
                <div className="flex flex-wrap items-center gap-2">
                  <span>Sales Trend (Last 30 Days)</span>
                  <div className="flex items-center gap-1 rounded-lg bg-secondary/80 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setChartMetric("revenue")}
                      className={`rounded-md px-2 py-0.5 font-semibold transition-colors ${
                        chartMetric === "revenue"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Revenue
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric("orders")}
                      className={`rounded-md px-2 py-0.5 font-semibold transition-colors ${
                        chartMetric === "orders"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Orders
                    </button>
                  </div>
                </div>
              }
              description="Daily revenue performance and volume across Bangladesh"
              action={
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 rounded-lg bg-secondary/60 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setChartStyle("area")}
                      title="Area Chart"
                      className={`rounded-md p-1 transition-colors ${
                        chartStyle === "area"
                          ? "bg-card text-primary shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LineChartIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartStyle("bar")}
                      title="Bar Chart"
                      className={`rounded-md p-1 transition-colors ${
                        chartStyle === "bar"
                          ? "bg-card text-primary shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {can("analytics.view") && (
                    <button
                      type="button"
                      onClick={() => onOpen("analytics")}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                    >
                      <span>Analytics</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              }
            >
              {/* Quick Chart KPI Summaries */}
              <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 gap-2 border-b border-border/50 pb-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">30-Day Period</span>
                  <span className="font-semibold text-foreground text-sm tabular-nums">
                    {chartMetric === "revenue" ? fmtTaka(m.totals.revenue) : `${fmtNumber(m.totals.orders)} orders`}
                  </span>
                </div>
                {peakDayStat && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Peak Day</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                      {chartMetric === "revenue" ? fmtTaka(peakDayStat.revenue) : `${peakDayStat.orders} orders`}
                    </span>
                  </div>
                )}
                <div className="hidden sm:block">
                  <span className="text-muted-foreground block text-[11px]">Daily Average</span>
                  <span className="font-semibold text-foreground text-sm tabular-nums">
                    {chartMetric === "revenue"
                      ? fmtTaka(Math.round(m.totals.revenue / (m.series.length || 30)))
                      : `${(m.totals.orders / (m.series.length || 30)).toFixed(1)} / day`}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <TimeSeriesChart
                  ariaLabel="30-day performance trend"
                  data={m.series}
                  kind={chartStyle}
                  series={
                    chartMetric === "revenue"
                      ? [{ key: "revenue", label: "Revenue (৳)", color: "var(--viz-1)" }]
                      : [{ key: "orders", label: "Orders", color: "var(--viz-2)" }]
                  }
                  format={chartMetric === "revenue" ? fmtTaka : fmtNumber}
                  height={240}
                />
              </div>
            </Panel>

            {/* Best Sellers Card */}
            <Panel
              title="Best Sellers"
              description="Top performing products (30 days)"
              action={
                can("catalog.view") ? (
                  <button
                    type="button"
                    onClick={() => onOpen("products")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View Catalog
                  </button>
                ) : undefined
              }
            >
              {m.topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground">
                  <Package className="mb-2 h-8 w-8 opacity-30" />
                  <p>No sales recorded in this period.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {m.topProducts.slice(0, 6).map((p, i) => {
                    const percent = Math.min(
                      100,
                      Math.round(((p.revenue || 0) / maxProductRevenue) * 100),
                    );
                    const medalBg =
                      i === 0
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : i === 1
                          ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30"
                          : i === 2
                            ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"
                            : "bg-secondary text-muted-foreground border-border";

                    return (
                      <div key={p.id ?? p.name} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${medalBg}`}
                            >
                              {i + 1}
                            </span>
                            <span className="truncate font-medium text-foreground">
                              {p.name}
                            </span>
                          </div>
                          <span className="shrink-0 font-semibold tabular-nums text-foreground">
                            {fmtTaka(p.revenue)}{" "}
                            <span className="font-normal text-muted-foreground">
                              ({p.quantity})
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              i === 0 ? "bg-primary" : "bg-primary/60"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          {/* ─── Regional & Payment Analytics Breakdown Grids ─── */}
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
            {/* Sales by Division / Region */}
            <Panel
              title={
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>Sales by Region / Division</span>
                </div>
              }
              description="Customer distribution across Bangladesh"
              action={
                can("analytics.view") ? (
                  <button
                    type="button"
                    onClick={() => onOpen("analytics")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Regional Report
                  </button>
                ) : undefined
              }
            >
              {!m.byDivision || m.byDivision.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No regional data for this period.
                </p>
              ) : (
                <div className="space-y-3 pt-1">
                  {m.byDivision.slice(0, 6).map((d) => {
                    const percent = Math.min(
                      100,
                      Math.round(((d.revenue || 0) / maxDivisionRevenue) * 100),
                    );
                    return (
                      <div key={d.name} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground truncate">{d.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            <span className="font-semibold text-foreground">{fmtTaka(d.revenue)}</span>
                            {" · "}
                            {d.orders} orders
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary/75 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            {/* Payment Method Distribution */}
            <Panel
              title={
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Payment Channels</span>
                </div>
              }
              description="Breakdown between COD and digital payment"
              action={
                can("payments.view") ? (
                  <button
                    type="button"
                    onClick={() => onOpen("couriers_payments")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Gateway Settings
                  </button>
                ) : undefined
              }
            >
              {!m.byPayment || m.byPayment.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No payment data for this period.
                </p>
              ) : (
                <div className="space-y-3 pt-1">
                  {m.byPayment.map((p) => {
                    const totalRevenue = m.totals.revenue || 1;
                    const percent = Math.min(100, Math.round(((p.revenue || 0) / totalRevenue) * 100));
                    return (
                      <div key={p.name} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground capitalize truncate">
                            {p.name.replace(/_/g, " ")}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            <span className="font-semibold text-foreground">{fmtTaka(p.revenue)}</span>
                            {" · "}
                            {p.orders} orders ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-emerald-500/80 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      {/* ─── Latest Orders Section ─── */}
      {orders.data && orders.data.items.length > 0 && (
        <Panel
          title="Recent Orders"
          description="Live stream of recent customer purchases"
          action={
            <button
              type="button"
              onClick={() => onOpen("orders")}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <span>All Orders</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <ul className="divide-y divide-border/60 text-xs min-w-0">
              {orders.data.items.map((o) => {
                const statusMeta =
                  ORDER_STATUS_CONFIG[o.status as keyof typeof ORDER_STATUS_CONFIG] || {
                    label: o.status,
                    color: "#888888",
                  };
                const initials = (o.shippingAddress?.fullName || "Guest")
                  .trim()
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <li
                    key={o._id}
                    onClick={() => onOpen("orders")}
                    className="flex cursor-pointer flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 px-2 rounded-xl transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-bold text-muted-foreground">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">
                            {o.orderNumber}
                          </span>
                          <span className="text-muted-foreground truncate font-medium">
                            {o.shippingAddress?.fullName}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {o.shippingAddress?.district || "Dhaka"} · {o.paymentMethod?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-10.5 sm:pl-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: statusMeta.color }}
                          aria-hidden="true"
                        />
                        <span>{statusMeta.label}</span>
                      </span>

                      <span className="font-serif text-xs sm:text-sm font-bold tabular-nums text-foreground">
                        {fmtTaka(o.total)}
                      </span>

                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {fmtRelative(o.createdAt)}
                      </span>

                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 hidden sm:block shrink-0" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Panel>
      )}
    </div>
  );
}
