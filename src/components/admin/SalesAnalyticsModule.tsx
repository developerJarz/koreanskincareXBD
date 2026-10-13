"use client";

import React, { useState } from "react";
import { Download, TrendingUp } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image";
import { secondaryButton } from "./catalog/ui";
import { TimeSeriesChart } from "./charts";
import {
  BarList,
  downloadCsv,
  EmptyState,
  ErrorNotice,
  fmtNumber,
  fmtPercent,
  fmtTaka,
  PageHeader,
  Panel,
  qs,
  rangeQuery,
  RangePicker,
  Segmented,
  Skeleton,
  StatTile,
  type RangeValue,
  useAdminData,
} from "./shared";

export type SalesStats = {
  range: { key: string; from: string | null; to: string; bucket: string };
  totals: {
    allOrders: number;
    orders: number;
    revenue: number;
    subtotal: number;
    shipping: number;
    discounts: number;
    paidRevenue: number;
    cancelled: number;
    cancelledValue: number;
    returned: number;
    returnedValue: number;
    pending: number;
    delivered: number;
    customers: number;
    aov: number;
    itemsSold: number;
    newCustomers: number;
    visitors: number;
    conversionRate: number | null;
    repeatCustomerRate: number;
    cancelRate: number;
  };
  profit: {
    itemRevenue: number;
    cogs: number;
    costedRevenue: number;
    grossProfit: number;
    marginPercent: number | null;
    coveragePercent: number;
    uncostedProducts: number;
  };
  change: null | {
    revenue: number | null;
    orders: number | null;
    aov: number | null;
    customers: number | null;
  };
  series: { label: string; revenue: number; orders: number }[];
  byDivision: { name: string; orders: number; revenue: number }[];
  byDistrict: { name: string; orders: number; revenue: number }[];
  byPayment: { name: string; orders: number; revenue: number; paid: number }[];
  byStatus: { name: string; orders: number; value: number }[];
  byCourier: { name: string; orders: number; value: number }[];
  topProducts: {
    id: string | null;
    name: string;
    image?: string;
    slug: string | null;
    stock: number | null;
    quantity: number;
    revenue: number;
    orders: number;
    profit: number | null;
  }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

/** Sales report — every figure is aggregated from orders in MongoDB for the chosen period. */
export function SalesAnalyticsModule({ embedded = false }: { embedded?: boolean }) {
  const [range, setRange] = useState<RangeValue>({ key: "30d" });
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const { data, error, loading, reload } = useAdminData<SalesStats>(
    `/api/admin/stats${qs(rangeQuery(range))}`,
  );

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`sales-${range.key}.csv`, [
      ["Period", "Revenue (BDT)", "Orders"],
      ...data.series.map((s) => [s.label, Math.round(s.revenue), s.orders]),
      [],
      ["Product", "Units", "Revenue (BDT)", "Orders", "Gross profit (BDT)"],
      ...data.topProducts.map((p) => [
        p.name,
        p.quantity,
        Math.round(p.revenue),
        p.orders,
        p.profit == null ? "" : Math.round(p.profit),
      ]),
    ]);
  };

  const header = (
    <PageHeader
      title={embedded ? "Sales" : "Sales report"}
      description="Revenue counts orders that are not cancelled, returned or refunded."
      actions={
        <>
          <RangePicker value={range} onChange={setRange} />
          {!embedded && (
            <button type="button" className={secondaryButton} onClick={exportCsv} disabled={!data}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </>
      }
    />
  );

  if (error && !data) {
    return (
      <div className="space-y-5">
        {header}
        <ErrorNotice message={error} onRetry={reload} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-5">
        {header}
        <Skeleton className="h-96" />
      </div>
    );
  }

  const t = data.totals;
  const p = data.profit;
  const ch = data.change;
  const totalDivisionRevenue = data.byDivision.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className={`space-y-5 ${loading ? "opacity-70 transition-opacity" : ""}`}>
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Revenue"
          value={fmtTaka(t.revenue)}
          change={ch ? ch.revenue : undefined}
          hint={ch ? "vs previous period" : undefined}
        />
        <StatTile
          label="Orders"
          value={fmtNumber(t.orders)}
          change={ch ? ch.orders : undefined}
          hint={`${fmtNumber(t.allOrders)} placed in total`}
        />
        <StatTile
          label="Average order"
          value={fmtTaka(t.aov)}
          change={ch ? ch.aov : undefined}
          hint={`${fmtNumber(t.itemsSold)} items sold`}
        />
        <StatTile
          label="Customers"
          value={fmtNumber(t.customers)}
          change={ch ? ch.customers : undefined}
          hint={`${fmtNumber(t.newCustomers)} new sign-ups`}
        />
      </div>
      {!embedded && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Gross profit"
            value={p.costedRevenue ? fmtTaka(p.grossProfit) : "—"}
            hint={
              p.costedRevenue
                ? `${fmtPercent(p.marginPercent)} margin · cost known for ${fmtPercent(p.coveragePercent, 0)} of sales`
                : "Add cost prices to products to see profit"
            }
          />
          <StatTile
            label="Visitor → order"
            value={t.conversionRate == null ? "—" : fmtPercent(t.conversionRate)}
            hint={
              t.visitors
                ? `${fmtNumber(t.visitors)} visitors (Site activity)`
                : "Needs site activity data"
            }
          />
          <StatTile
            label="Repeat customers"
            value={fmtPercent(t.repeatCustomerRate)}
            hint="ordered 2+ times in this period"
          />
          <StatTile
            label="Cancelled & returned"
            value={fmtNumber(t.cancelled + t.returned)}
            hint={`${fmtTaka(t.cancelledValue + t.returnedValue)} · ${fmtPercent(t.cancelRate)} cancel rate`}
          />
        </div>
      )}

      <Panel
        title={metric === "revenue" ? "Revenue over time" : "Orders over time"}
        description={`Grouped by ${data.range.bucket} · Bangladesh time`}
        action={
          <Segmented
            label="Chart metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "revenue", label: "Revenue" },
              { value: "orders", label: "Orders" },
            ]}
          />
        }
      >
        {t.allOrders === 0 ? (
          <EmptyState icon={TrendingUp} title="No orders in this period" />
        ) : (
          <TimeSeriesChart
            ariaLabel={metric === "revenue" ? "Revenue over time" : "Orders over time"}
            data={data.series}
            kind={data.series.length <= 31 ? "bar" : "area"}
            series={[{ key: metric, label: metric === "revenue" ? "Revenue" : "Orders" }]}
            format={metric === "revenue" ? fmtTaka : fmtNumber}
          />
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Sales by division" description="Where orders are delivered">
          <BarList
            rows={data.byDivision.map((d) => ({ name: d.name, value: d.revenue }))}
            format={fmtTaka}
            sub={(r) =>
              `${fmtNumber(data.byDivision.find((d) => d.name === r.name)?.orders)} orders`
            }
          />
          {totalDivisionRevenue > 0 && data.byDistrict.length > 0 && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer font-medium text-primary">Top districts</summary>
              <div className="mt-3">
                <BarList
                  rows={data.byDistrict.map((d) => ({ name: d.name, value: d.revenue }))}
                  format={fmtTaka}
                  max={10}
                />
              </div>
            </details>
          )}
        </Panel>
        <Panel title="Payment methods" description="Revenue by how customers chose to pay">
          <BarList
            rows={data.byPayment.map((d) => ({ name: d.name, value: d.revenue }))}
            format={fmtTaka}
            sub={(r) => {
              const row = data.byPayment.find((d) => d.name === r.name);
              return row
                ? `${fmtNumber(row.orders)} orders · ${fmtTaka(row.paid)} marked paid`
                : null;
            }}
          />
        </Panel>
      </div>

      <Panel
        title="Top products"
        description="By revenue in this period (profit shown where a cost price is set)"
      >
        {data.topProducts.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No products sold in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 text-right font-medium">Units</th>
                  <th className="px-3 py-2 text-right font-medium">Orders</th>
                  <th className="px-3 py-2 text-right font-medium">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium">Gross profit</th>
                  <th className="py-2 pl-3 text-right font-medium">In stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topProducts.map((prod, i) => (
                  <tr key={prod.id ?? prod.name}>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2.5">
                        {prod.image && (
                          <img
                            src={optimizedImageUrl(prod.image, 80)}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-md object-cover"
                            loading="lazy"
                          />
                        )}
                        {prod.slug ? (
                          <a
                            href={`/product/${prod.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {prod.name}
                          </a>
                        ) : (
                          <span className="font-medium">{prod.name}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtNumber(prod.quantity)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtNumber(prod.orders)}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {fmtTaka(prod.revenue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {prod.profit == null ? (
                        <span className="text-muted-foreground">no cost price</span>
                      ) : (
                        fmtTaka(prod.profit)
                      )}
                    </td>
                    <td className="py-2 pl-3 text-right tabular-nums">{prod.stock ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {!embedded && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Orders by status" description="All orders placed in this period">
            <BarList
              rows={data.byStatus.map((s) => ({
                name: STATUS_LABEL[s.name] ?? s.name,
                value: s.orders,
              }))}
              format={fmtNumber}
            />
          </Panel>
          <Panel title="Money breakdown">
            <dl className="space-y-2 text-xs">
              {[
                ["Product sales", t.subtotal],
                ["Delivery charges collected", t.shipping],
                ["Coupon discounts given", -t.discounts],
                ["Revenue", t.revenue],
                ["Marked as paid", t.paidRevenue],
                ["Still to collect", t.revenue - t.paidRevenue],
              ].map(([k, v]) => (
                <div
                  key={k as string}
                  className="flex justify-between gap-3 border-b border-border pb-1.5 last:border-0"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold tabular-nums">{fmtTaka(v as number)}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="Couriers used">
            <BarList
              rows={data.byCourier.map((c) => ({ name: c.name, value: c.orders }))}
              format={(n) => `${fmtNumber(n)} orders`}
              empty="No courier recorded on orders yet."
            />
          </Panel>
        </div>
      )}
    </div>
  );
}
