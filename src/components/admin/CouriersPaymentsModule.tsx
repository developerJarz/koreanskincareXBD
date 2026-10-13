"use client";

import React, { useState } from "react";
import { CreditCard, Search, Truck } from "lucide-react";
import { toast } from "sonner";

import { api, inputClass, primaryButton, Switch } from "./catalog/ui";
import {
  EmptyState,
  ErrorNotice,
  fmtDate,
  fmtNumber,
  fmtTaka,
  PageHeader,
  Panel,
  Pill,
  qs,
  rangeQuery,
  RangePicker,
  Skeleton,
  StatTile,
  useAccess,
  useAdminData,
  type RangeValue,
} from "./shared";

type Data = {
  methods: {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
    available: boolean;
    credentialsSet: boolean | null;
    orders: number;
    revenue: number;
    paid: number;
    failed: number;
  }[];
  couriers: {
    name: string;
    enabled: boolean;
    credentialsSet: boolean | null;
    orders: number;
    delivered: number;
    returned: number;
    inTransit: number;
    value: number;
    custom?: boolean;
  }[];
  codOutstanding: {
    orders: number;
    amount: number;
    byCourier: { courier: string; orders: number; amount: number }[];
  };
  pendingOnline: { orders: number; amount: number };
};

export function CouriersPaymentsModule() {
  const { can } = useAccess();
  const manage = can("payments.manage");
  const [range, setRange] = useState<RangeValue>({ key: "30d" });
  const { data, error, reload, setData } = useAdminData<Data>(
    `/api/admin/payments${qs(rangeQuery(range))}`,
  );
  const [lookup, setLookup] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  const toggleMethod = async (id: string, enabled: boolean) => {
    if (!data) return;
    const next = data.methods.map((m) => (m.id === id ? { ...m, enabled } : m));
    try {
      await api("/api/admin/payments", {
        method: "PUT",
        json: { methods: next.map((m) => ({ id: m.id, enabled: m.enabled })) },
      });
      setData({ ...data, methods: next });
      toast.success(
        `${next.find((m) => m.id === id)?.title} ${enabled ? "is now offered at checkout" : "is hidden from checkout"}.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    }
  };
  const toggleCourier = async (name: string, enabled: boolean) => {
    if (!data) return;
    const next = data.couriers.map((c) => (c.name === name ? { ...c, enabled } : c));
    try {
      await api("/api/admin/payments", {
        method: "PUT",
        json: {
          couriers: next
            .filter((c) => !c.custom)
            .map((c) => ({ name: c.name, enabled: c.enabled })),
        },
      });
      setData({ ...data, couriers: next });
      toast.success(`${name} ${enabled ? "switched on" : "switched off"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    }
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lookup.trim().length < 3) return;
    setSearching(true);
    try {
      const r = await api<{ results: any[] }>(
        `/api/admin/payments${qs({ lookup: lookup.trim() })}`,
      );
      setResults(r.results);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Delivery & payments"
        description="Switch payment methods on or off at checkout and see how each method and courier is performing."
        actions={
          <RangePicker
            value={range}
            onChange={setRange}
            options={["7d", "30d", "90d", "year", "all"]}
          />
        }
      />
      {error && !data && <ErrorNotice message={error} onRetry={reload} />}
      {!data && !error && <Skeleton className="h-96" />}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="COD cash with couriers"
              value={fmtTaka(data.codOutstanding.amount)}
              hint={`${data.codOutstanding.orders} delivered, not marked paid`}
            />
            <StatTile
              label="Online payments pending"
              value={fmtTaka(data.pendingOnline.amount)}
              hint={`${data.pendingOnline.orders} orders not confirmed paid`}
            />
            <StatTile
              label="Payment methods on"
              value={`${data.methods.filter((m) => m.enabled).length} of ${data.methods.length}`}
            />
            <StatTile
              label="Orders with a courier"
              value={fmtNumber(data.couriers.reduce((s, c) => s + c.orders, 0))}
              hint="in this period"
            />
          </div>

          <Panel
            title="Payment methods"
            description="What customers can choose at checkout (saved to Settings, used by the order API)"
          >
            <ul className="divide-y divide-border">
              {data.methods.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-3 text-xs">
                  <CreditCard className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-[12rem] flex-1">
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-muted-foreground">{m.description}</p>
                    {!m.available ? (
                      <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                        Not offered at checkout: the website has no card-payment integration yet.
                      </p>
                    ) : (
                      m.id !== "COD" && (
                        <p className="mt-0.5 text-muted-foreground">
                          Confirmed by hand: check the customer's transaction ID, then set the
                          order's payment to “paid”.
                        </p>
                      )
                    )}
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-semibold">{fmtTaka(m.revenue)}</p>
                    <p className="text-muted-foreground">
                      {fmtNumber(m.orders)} orders · {fmtTaka(m.paid)} paid
                      {m.failed ? ` · ${m.failed} failed` : ""}
                    </p>
                  </div>
                  <Switch
                    label={`Offer ${m.title}`}
                    checked={m.enabled}
                    disabled={!manage || !m.available}
                    onChange={(v) => toggleMethod(m.id, v)}
                  />
                </li>
              ))}
            </ul>
            {!manage && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Only admins can switch payment methods.
              </p>
            )}
          </Panel>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <Panel
              title="Couriers"
              description="Performance from the courier recorded on each order"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3 font-medium">Courier</th>
                      <th className="px-3 py-2 text-right font-medium">Orders</th>
                      <th className="px-3 py-2 text-right font-medium">In transit</th>
                      <th className="px-3 py-2 text-right font-medium">Delivered</th>
                      <th className="px-3 py-2 text-right font-medium">Returned</th>
                      <th className="py-2 pl-3 text-right font-medium">In use</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.couriers.map((c) => (
                      <tr key={c.name}>
                        <td className="py-2 pr-3">
                          <span className="flex items-center gap-2 font-medium">
                            <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            {c.name}
                            {c.custom && <Pill>typed on orders</Pill>}
                            {c.credentialsSet && <Pill tone="good">API keys set</Pill>}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtNumber(c.orders)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmtNumber(c.inTransit)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmtNumber(c.delivered)}
                          {c.orders > 0 && (
                            <span className="block text-[11px] text-muted-foreground">
                              {Math.round((c.delivered / c.orders) * 100)}%
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmtNumber(c.returned)}
                        </td>
                        <td className="py-2 pl-3 text-right">
                          {!c.custom && (
                            <Switch
                              label={`Use ${c.name}`}
                              checked={c.enabled}
                              disabled={!manage}
                              onChange={(v) => toggleCourier(c.name, v)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel
              title="Cash on delivery to collect"
              description="Delivered COD orders not yet marked paid, by courier"
            >
              {data.codOutstanding.byCourier.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nothing outstanding.
                </p>
              ) : (
                <ul className="divide-y divide-border text-xs">
                  {data.codOutstanding.byCourier.map((r) => (
                    <li key={r.courier} className="flex justify-between gap-3 py-2">
                      <span>{r.courier}</span>
                      <span className="tabular-nums">
                        <span className="font-semibold">{fmtTaka(r.amount)}</span> · {r.orders}{" "}
                        orders
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11px] text-muted-foreground">
                When a courier pays you, open the order and set Payment → paid.
              </p>
            </Panel>
          </div>
        </>
      )}

      <Panel
        title="Find a payment or parcel"
        description="Search orders by transaction ID, order number, tracking ID or phone"
      >
        <form onSubmit={search} className="flex flex-wrap gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="e.g. 8N7A6D5C or NB-000123 or 01711…"
              aria-label="Lookup"
              className={`${inputClass} pl-8`}
            />
          </div>
          <button
            type="submit"
            className={primaryButton}
            disabled={searching || lookup.trim().length < 3}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {results && (
          <div className="mt-4">
            {results.length === 0 ? (
              <EmptyState icon={Search} title="No orders found" />
            ) : (
              <ul className="divide-y divide-border text-xs">
                {results.map((o) => (
                  <li key={o._id} className="flex flex-wrap justify-between gap-3 py-2">
                    <span>
                      <span className="font-mono font-semibold">{o.orderNumber}</span> ·{" "}
                      {o.shippingAddress?.fullName} · {o.shippingAddress?.phone}
                      <span className="block text-muted-foreground">
                        {o.paymentMethod}{" "}
                        {o.paymentTransactionId ? `· trx ${o.paymentTransactionId}` : ""}{" "}
                        {o.courierName ? `· ${o.courierName}` : ""}{" "}
                        {o.trackingId ? `· ${o.trackingId}` : ""} · {fmtDate(o.createdAt)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums">{fmtTaka(o.total)}</span>
                      <span className="text-muted-foreground">
                        {o.status} · payment {o.paymentStatus}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
