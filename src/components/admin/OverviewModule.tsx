"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

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

  const open = attention.filter((a) => a.count > 0);
  const t = today.data?.totals;
  const m = month.data;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-serif text-2xl text-foreground sm:text-3xl">
            Welcome back, {firstName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {open.length ? "Here is what needs you today." : "Nothing is waiting on you right now."}
          </p>
          <ul className="mt-4 divide-y divide-border">
            {attention.map((item) => (
              <li
                key={item.key}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 sm:flex-nowrap"
              >
                <span
                  className={`w-12 shrink-0 font-serif text-3xl leading-none tabular-nums ${item.count ? "text-primary" : "text-muted-foreground/50"}`}
                >
                  {item.count}
                </span>
                <p className="min-w-40 flex-1 text-sm text-foreground">
                  {item.count === 1 ? item.singular : item.plural}
                </p>
                <button
                  type="button"
                  onClick={() => onOpen(item.tab)}
                  className="ml-16 h-9 shrink-0 rounded-lg border border-border px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring sm:ml-0"
                >
                  {item.action}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-sans text-sm font-semibold tracking-normal text-foreground">
            Today so far
          </h2>
          {canSales && !t ? (
            <Skeleton className="mt-4 h-32" />
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
              {t && (
                <>
                  <div>
                    <dt className="text-xs text-muted-foreground">Revenue</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">
                      {fmtTaka(t.revenue)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Orders</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">
                      {fmtNumber(t.orders)}
                    </dd>
                  </div>
                </>
              )}
              {activity.data && (
                <>
                  <div>
                    <dt className="text-xs text-muted-foreground">Visitors</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">
                      {fmtNumber(activity.data.totals.visitors)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">On the site now</dt>
                    <dd className="mt-1 flex items-center gap-2 text-xl font-semibold tabular-nums">
                      <span
                        className="inline-block h-2 w-2 rounded-full bg-emerald-500"
                        aria-hidden="true"
                      />
                      {fmtNumber(activity.data.live.length)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            Revenue excludes cancelled, returned and refunded orders. Days start at midnight Dhaka
            time.
          </p>
        </div>
      </section>

      {m && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Revenue · 30 days"
              value={fmtTaka(m.totals.revenue)}
              change={m.change?.revenue}
              hint="vs previous 30 days"
            />
            <StatTile
              label="Orders · 30 days"
              value={fmtNumber(m.totals.orders)}
              change={m.change?.orders}
            />
            <StatTile label="Average order" value={fmtTaka(m.totals.aov)} change={m.change?.aov} />
            <StatTile
              label="Visitor → order"
              value={m.totals.conversionRate == null ? "—" : fmtPercent(m.totals.conversionRate)}
              hint={
                m.totals.visitors
                  ? `${fmtNumber(m.totals.visitors)} visitors`
                  : "needs site activity data"
              }
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <Panel
              title="Revenue, last 30 days"
              action={
                can("analytics.view") ? (
                  <button
                    type="button"
                    onClick={() => onOpen("analytics")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Full sales report <ArrowRight className="h-3 w-3" />
                  </button>
                ) : undefined
              }
            >
              <TimeSeriesChart
                ariaLabel="Revenue in the last 30 days"
                data={m.series}
                kind="bar"
                series={[{ key: "revenue", label: "Revenue" }]}
                format={fmtTaka}
                height={220}
              />
            </Panel>
            <Panel title="Best sellers · 30 days">
              {m.topProducts.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No sales yet.</p>
              ) : (
                <ol className="space-y-2 text-xs">
                  {m.topProducts.slice(0, 6).map((p, i) => (
                    <li key={p.id ?? p.name} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate">
                        <span className="mr-2 tabular-nums text-muted-foreground">{i + 1}</span>
                        {p.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        <span className="font-semibold text-foreground">{fmtTaka(p.revenue)}</span>{" "}
                        · {p.quantity} sold
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>
        </>
      )}

      {orders.data && orders.data.items.length > 0 && (
        <Panel
          title="Latest orders"
          action={
            <button
              type="button"
              onClick={() => onOpen("orders")}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              All orders <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          <ul className="divide-y divide-border text-xs">
            {orders.data.items.map((o) => (
              <li key={o._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0">
                  <span className="font-mono font-semibold">{o.orderNumber}</span>
                  <span className="ml-2 text-muted-foreground">
                    {o.shippingAddress?.fullName} · {o.shippingAddress?.district} ·{" "}
                    {o.paymentMethod}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background:
                          ORDER_STATUS_CONFIG[o.status as keyof typeof ORDER_STATUS_CONFIG]?.color,
                      }}
                      aria-hidden="true"
                    />
                    {ORDER_STATUS_CONFIG[o.status as keyof typeof ORDER_STATUS_CONFIG]?.label ??
                      o.status}
                  </span>
                  <span className="font-semibold tabular-nums">{fmtTaka(o.total)}</span>
                  <span className="w-20 text-right text-muted-foreground">
                    {fmtRelative(o.createdAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
