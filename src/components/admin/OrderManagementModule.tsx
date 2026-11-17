"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CheckCheck,
  Clock3,
  Download,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  OrderDetails,
  OrderStatusBadge as StatusBadge,
  OrderPaymentBadge as PaymentBadge,
} from "./orders/OrderDetails";
import type { AdminOrder as Order } from "./orders/types";
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/lib/constants";
import { api, iconButton, inputClass, Modal, primaryButton, secondaryButton } from "./catalog/ui";
import {
  downloadCsv,
  EmptyState,
  ErrorNotice,
  fmtDateTime,
  fmtRelative,
  fmtTaka,
  PageHeader,
  Pagination,
  Panel,
  qs,
  rangeQuery,
  RangePicker,
  Segmented,
  Skeleton,
  useAccess,
  useAdminData,
  useDebounced,
  type RangeValue,
} from "./shared";

type ListResponse = {
  items: Order[];
  total: number;
  totalPages: number;
  statusCounts?: Record<string, number>;
};

const STATUSES = Object.keys(ORDER_STATUS_CONFIG) as Order["status"][];
const LEAVES_SALE = ["cancelled", "returned", "refunded"];

export function OrderManagementModule({
  initialSearch = "",
  onCreateInvoice,
}: {
  initialSearch?: string;
  /** Opens the Invoices tab with an invoice for this order */
  onCreateInvoice?: (orderId: string) => void;
}) {
  const { can } = useAccess();
  const manage = can("orders.manage");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const backButton = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState(initialSearch);
  const [range, setRange] = useState<RangeValue>({ key: "all" });
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ ids: string[]; status: string } | null>(null);
  const q = useDebounced(search);
  useEffect(() => setSearch(initialSearch), [initialSearch]);
  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [status, payment, paymentStatus, q, range, sort]);

  const url = `/api/orders${qs({
    status: status === "all" ? "" : status,
    payment,
    paymentStatus,
    q,
    sort,
    page,
    pageSize: 25,
    counts: 1,
    ...(range.key === "all" ? {} : rangeQuery(range)),
  })}`;
  const { data, error, loading, reload, setData } = useAdminData<ListResponse>(url);
  const {
    data: detail,
    error: detailError,
    reload: reloadDetail,
    setData: setDetail,
  } = useAdminData<Order>(openId ? `/api/orders/${openId}` : null);

  const patchOrder = async (id: string, body: Record<string, unknown>) => {
    const updated = await api<Order>(`/api/orders/${id}`, { method: "PATCH", json: body });
    setData((d) =>
      d
        ? {
            ...d,
            items: d.items.map((o) => (o._id === id ? { ...o, ...updated, user: o.user } : o)),
          }
        : d,
    );
    setDetail((current) =>
      current?._id === id ? { ...current, ...updated, user: current.user } : current,
    );
    return updated;
  };

  const changeStatus = async (ids: string[], next: string, restock = false) => {
    if (updating) return;
    setUpdating(true);
    let ok = 0;
    for (const id of ids) {
      try {
        await patchOrder(id, { status: next, restock });
        ok += 1;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update an order.");
      }
    }
    if (ok) toast.success(ok === 1 ? `Order marked ${next}.` : `${ok} orders marked ${next}.`);
    setSelected([]);
    setUpdating(false);
    reload();
  };

  const requestStatus = (ids: string[], next: string) => {
    if (LEAVES_SALE.includes(next)) setCancelTarget({ ids, status: next });
    else changeStatus(ids, next);
  };

  const counts = data?.statusCounts ?? {};
  const openOrder = openId
    ? detail?._id === openId
      ? detail
      : data?.items.find((o) => o._id === openId)
    : undefined;
  const openDetails = (id: string) => {
    setOpenId(id);
  };
  const backToOrders = () => {
    setOpenId(null);
    reload();
    requestAnimationFrame(() => backButton.current?.focus());
  };
  const hasFilters =
    status !== "all" ||
    payment ||
    paymentStatus ||
    search ||
    range.key !== "all" ||
    sort !== "newest";
  const resetFilters = () => {
    setStatus("all");
    setPayment("");
    setPaymentStatus("");
    setSearch("");
    setRange({ key: "all" });
    setSort("newest");
  };
  const allCount = Object.values(counts).reduce((s, n) => s + n, 0);
  const pageIds = data?.items.map((o) => o._id) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`orders-page-${page}.csv`, [
      [
        "Order",
        "Date",
        "Customer",
        "Phone",
        "District",
        "Checkout city (approximate)",
        "Checkout country",
        "Items",
        "Total",
        "Payment",
        "Payment status",
        "Status",
        "Courier",
        "Tracking",
      ],
      ...data.items.map((o) => [
        o.orderNumber,
        fmtDateTime(o.createdAt),
        o.shippingAddress?.fullName,
        o.shippingAddress?.phone,
        o.shippingAddress?.district,
        o.orderLocation?.city,
        o.orderLocation?.country ?? o.orderLocation?.countryCode,
        o.items.map((i) => `${i.quantity}× ${i.productName}`).join("; "),
        o.total,
        o.paymentMethod,
        o.paymentStatus,
        o.status,
        o.courierName,
        o.trackingId,
      ]),
    ]);
  };

  return (
    <div className="flex min-w-0 flex-col gap-5" aria-busy={updating}>
      {!openId && (
        <>
          <PageHeader
            title="Orders"
            description="Follow every order from checkout to delivery."
            actions={
              <>
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={reload}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={exportCsv}
                  disabled={!data?.items.length}
                >
                  <Download className="h-4 w-4" /> Export
                </button>
              </>
            }
          />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Order overview">
            {[
              { label: "All orders", count: allCount, value: "all", icon: ShoppingBag },
              {
                label: "Awaiting confirmation",
                count: counts.pending ?? 0,
                value: "pending",
                icon: Clock3,
              },
              { label: "In transit", count: counts.shipped ?? 0, value: "shipped", icon: Truck },
              {
                label: "Delivered",
                count: counts.delivered ?? 0,
                value: "delivered",
                icon: CheckCheck,
              },
            ].map(({ label, count, value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => setStatus(value)}
                className={`group flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring ${status === value ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}`}
              >
                <span className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                  <span>{label}</span>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span className="text-2xl font-semibold tabular-nums">
                    {!data && loading ? "?" : count}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>

          <Segmented
            label="Order status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: `All (${allCount})` },
              ...STATUSES.map((s) => ({
                value: s,
                label: `${ORDER_STATUS_CONFIG[s].label} (${counts[s] ?? 0})`,
              })),
            ]}
          />

          <Panel>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[14rem] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Order number, name, phone, district, product, tracking or transaction ID"
                  aria-label="Search orders"
                  className={`${inputClass} h-9 pl-8`}
                />
              </div>
              <select
                aria-label="Payment method"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className={cn(inputClass, "h-9 w-auto max-w-full")}
              >
                <option value="">All payments</option>
                <option value="COD">Cash on delivery</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="SSLCommerz">Card / SSLCommerz</option>
              </select>
              <select
                aria-label="Sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={cn(inputClass, "h-9 w-auto max-w-full")}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="total_desc">Highest total</option>
                <option value="total_asc">Lowest total</option>
              </select>
              <select
                aria-label="Filter by payment status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className={cn(inputClass, "h-9 w-auto max-w-full")}
              >
                <option value="">All payment statuses</option>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
              {hasFilters && (
                <button type="button" className={secondaryButton} onClick={resetFilters}>
                  Reset filters
                </button>
              )}
              <div className="min-w-0 max-w-full [&_input[type=date]]:min-w-0 [&_input[type=date]]:max-w-full">
                <RangePicker
                  value={range}
                  onChange={setRange}
                  options={["today", "7d", "30d", "90d", "all", "custom"]}
                />
              </div>
            </div>

            {manage && selected.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-primary/8 p-2.5 text-xs">
                <span className="font-semibold text-primary">{selected.length} selected</span>
                {(["confirmed", "processing", "shipped", "delivered", "cancelled"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${secondaryButton} h-8 px-3 text-xs`}
                      onClick={() => requestStatus(selected, s)}
                    >
                      Mark {ORDER_STATUS_CONFIG[s].label.toLowerCase()}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => setSelected([])}
                >
                  Clear
                </button>
              </div>
            )}

            {error && <ErrorNotice message={error} onRetry={reload} />}
            {!data && !error && <Skeleton className="h-80" />}
            {data && data.items.length === 0 && (
              <EmptyState icon={ShoppingBag} title="No orders match these filters.">
                <p className="mb-3">Try another search or reset the filters to see your orders.</p>
                {hasFilters && (
                  <button type="button" className={secondaryButton} onClick={resetFilters}>
                    Reset filters
                  </button>
                )}
              </EmptyState>
            )}
            {data && data.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[60rem] text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      {manage && (
                        <th className="w-8 py-2 pr-2">
                          <input
                            type="checkbox"
                            aria-label="Select all on this page"
                            checked={allSelected}
                            onChange={(e) => setSelected(e.target.checked ? pageIds : [])}
                          />
                        </th>
                      )}
                      <th className="py-2 pr-3 font-medium">Order</th>
                      <th className="px-3 py-2 font-medium">Customer</th>
                      <th className="px-3 py-2 font-medium">Items</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                      <th className="px-3 py-2 font-medium">Payment</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="py-2 pl-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.items.map((o) => (
                      <tr
                        key={o._id}
                        className={`align-top hover:bg-secondary/40 ${selected.includes(o._id) ? "bg-primary/5" : ""}`}
                      >
                        {manage && (
                          <td className="py-3 pr-2">
                            <input
                              type="checkbox"
                              aria-label={`Select ${o.orderNumber}`}
                              checked={selected.includes(o._id)}
                              onChange={() =>
                                setSelected((s) =>
                                  s.includes(o._id) ? s.filter((x) => x !== o._id) : [...s, o._id],
                                )
                              }
                            />
                          </td>
                        )}
                        <td className="py-3 pr-3">
                          <button
                            type="button"
                            onClick={() => openDetails(o._id)}
                            ref={data.items[0]._id === o._id ? backButton : undefined}
                            className="font-semibold text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                          >
                            {o.orderNumber}
                          </button>
                          <span
                            className="block text-[11px] text-muted-foreground"
                            title={fmtDateTime(o.createdAt)}
                          >
                            {fmtRelative(o.createdAt)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="block font-medium text-foreground">
                            {o.shippingAddress?.fullName ?? o.user?.name ?? "—"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Phone className="h-3 w-3" />{" "}
                            {o.shippingAddress?.phone ?? o.guestPhone ?? "—"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />{" "}
                            {[o.shippingAddress?.area, o.shippingAddress?.district]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </span>
                        </td>
                        <td className="max-w-[14rem] px-3 py-3">
                          <span className="font-medium">
                            {o.items.reduce((s, i) => s + i.quantity, 0)} items
                          </span>
                          <span
                            className="block truncate text-[11px] text-muted-foreground"
                            title={o.items.map((i) => i.productName).join(", ")}
                          >
                            {o.items.map((i) => i.productName).join(", ")}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums">
                          {fmtTaka(o.total)}
                          {o.discount > 0 && (
                            <span className="block text-[11px] font-normal text-muted-foreground">
                              −{fmtTaka(o.discount)} {o.couponCode}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="block font-medium">{o.paymentMethod}</span>
                          <PaymentBadge status={o.paymentStatus} />
                        </td>
                        <td className="px-3 py-3">
                          {manage ? (
                            <select
                              aria-label={`Status of ${o.orderNumber}`}
                              disabled={updating}
                              value={o.status}
                              onChange={(e) => requestStatus([o._id], e.target.value)}
                              className={cn(inputClass, "h-8 w-32 text-xs")}
                              style={{ color: ORDER_STATUS_CONFIG[o.status]?.color }}
                            >
                              {STATUSES.map((s) => (
                                <option
                                  key={s}
                                  value={s}
                                  disabled={
                                    (s === "returned" || s === "refunded") && !can("returns.manage")
                                  }
                                >
                                  {ORDER_STATUS_CONFIG[s].label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <StatusBadge status={o.status} />
                          )}
                          {o.trackingId && (
                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              {o.courierName} · {o.trackingId}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-3 pl-3 text-right">
                          <button
                            type="button"
                            className={iconButton}
                            title="View order details"
                            aria-label={`Open ${o.orderNumber}`}
                            onClick={() => openDetails(o._id)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </button>
                          {onCreateInvoice && can("invoices.manage") && (
                            <button
                              type="button"
                              className={iconButton}
                              title="Create invoice"
                              aria-label={`Create invoice for ${o.orderNumber}`}
                              onClick={() => onCreateInvoice(o._id)}
                            >
                              <ReceiptText className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data && (
              <Pagination
                page={page}
                totalPages={data.totalPages}
                total={data.total}
                onPage={setPage}
                label="orders"
              />
            )}
          </Panel>
        </>
      )}

      {openId &&
        !openOrder &&
        (detailError ? (
          <ErrorNotice message={detailError} onRetry={reloadDetail} />
        ) : (
          <Skeleton className="h-96" />
        ))}
      {openId && !openOrder && (
        <button type="button" className={secondaryButton} onClick={backToOrders}>
          Back to orders
        </button>
      )}
      {openOrder && (
        <OrderDetails
          key={openOrder._id}
          updating={updating}
          order={openOrder}
          canManage={manage}
          canRefund={can("returns.manage")}
          onBack={backToOrders}
          onPatch={(body) => patchOrder(openOrder._id, body)}
          onStatus={(s) => requestStatus([openOrder._id], s)}
          onCreateInvoice={
            onCreateInvoice && can("invoices.manage")
              ? () => onCreateInvoice(openOrder._id)
              : undefined
          }
        />
      )}

      {cancelTarget && (
        <Modal
          title={`Mark ${cancelTarget.ids.length > 1 ? `${cancelTarget.ids.length} orders` : "order"} ${cancelTarget.status}`}
          onClose={() => setCancelTarget(null)}
          footer={
            <>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setCancelTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  changeStatus(cancelTarget.ids, cancelTarget.status, false);
                  setCancelTarget(null);
                }}
              >
                Don't restock
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  changeStatus(cancelTarget.ids, cancelTarget.status, true);
                  setCancelTarget(null);
                }}
              >
                Put items back in stock
              </button>
            </>
          }
        >
          <p className="text-sm">
            These items were taken out of stock when the order was placed. Put them back so they can
            be sold again?
          </p>
          <p className="text-xs text-muted-foreground">
            Choose “Don't restock” if the goods are damaged or were never returned.
          </p>
        </Modal>
      )}
    </div>
  );
}
