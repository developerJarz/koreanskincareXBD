"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { COURIER_OPTIONS } from "@/lib/checkout";
import { optimizedImageUrl } from "@/lib/image";
import {
  api,
  Field,
  iconButton,
  inputClass,
  Modal,
  primaryButton,
  secondaryButton,
  textareaClass,
} from "./catalog/ui";
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
  Pill,
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

type Order = {
  _id: string;
  orderNumber: string;
  user?: { _id: string; name: string; email: string } | null;
  guestEmail?: string;
  guestPhone?: string;
  items: {
    product: string;
    productName: string;
    productImage?: string;
    variant?: { sku?: string; color?: string; size?: string };
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: keyof typeof ORDER_STATUS_CONFIG;
  paymentStatus: string;
  paymentMethod: string;
  paymentTransactionId?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    area: string;
    streetAddress: string;
    postalCode?: string;
  };
  deliveryNotes?: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
};

type ListResponse = {
  items: Order[];
  total: number;
  totalPages: number;
  statusCounts?: Record<string, number>;
};

const STATUSES = Object.keys(ORDER_STATUS_CONFIG) as Order["status"][];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "partially_refunded"];
const LEAVES_SALE = ["cancelled", "returned", "refunded"];

function StatusBadge({ status }: { status: Order["status"] }) {
  const cfg = ORDER_STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: cfg?.color ?? "#6b7280" }}
        aria-hidden="true"
      />
      {cfg?.label ?? status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "good"
      : status === "failed"
        ? "bad"
        : status.includes("refund")
          ? "info"
          : "warn";
  return <Pill tone={tone}>{status.replace("_", " ")}</Pill>;
}

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
  }, [status, payment, q, range, sort]);

  const url = `/api/orders${qs({
    status: status === "all" ? "" : status,
    payment,
    q,
    sort,
    page,
    pageSize: 25,
    counts: 1,
    ...(range.key === "all" ? {} : rangeQuery(range)),
  })}`;
  const { data, error, loading, reload, setData } = useAdminData<ListResponse>(url);

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
    return updated;
  };

  const changeStatus = async (ids: string[], next: string, restock = false) => {
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
    reload();
  };

  const requestStatus = (ids: string[], next: string) => {
    if (LEAVES_SALE.includes(next)) setCancelTarget({ ids, status: next });
    else changeStatus(ids, next);
  };

  const counts = data?.statusCounts ?? {};
  // The drawer closes on its own if a filter change removes the order from the list
  const openOrder = openId ? data?.items.find((o) => o._id === openId) : undefined;
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
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Every order in the database — search, filter, update status, book couriers and create invoices."
        actions={
          <>
            <button type="button" className={secondaryButton} onClick={reload} disabled={loading}>
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
            className={`${inputClass} h-9 w-auto`}
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
            className={`${inputClass} h-9 w-auto`}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total_desc">Highest total</option>
            <option value="total_asc">Lowest total</option>
          </select>
          <RangePicker
            value={range}
            onChange={setRange}
            options={["today", "7d", "30d", "90d", "all", "custom"]}
          />
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
          <EmptyState icon={ShoppingBag} title="No orders match these filters." />
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
                        onClick={() => setOpenId(o._id)}
                        className="font-mono font-semibold text-foreground hover:text-primary"
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
                          value={o.status}
                          onChange={(e) => requestStatus([o._id], e.target.value)}
                          className={`${inputClass} h-8 w-32 text-xs`}
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
                        title="Details & courier"
                        aria-label={`Open ${o.orderNumber}`}
                        onClick={() => setOpenId(o._id)}
                      >
                        <Truck className="h-4 w-4" />
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

      {openOrder && (
        <OrderDrawer
          order={openOrder}
          canManage={manage}
          canRefund={can("returns.manage")}
          onClose={() => setOpenId(null)}
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

function OrderDrawer({
  order,
  canManage,
  canRefund,
  onClose,
  onPatch,
  onStatus,
  onCreateInvoice,
}: {
  order: Order;
  canManage: boolean;
  canRefund: boolean;
  onClose: () => void;
  onPatch: (body: Record<string, unknown>) => Promise<Order>;
  onStatus: (status: string) => void;
  onCreateInvoice?: () => void;
}) {
  const [courierName, setCourierName] = useState(order.courierName ?? "");
  const [trackingId, setTrackingId] = useState(order.trackingId ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "");
  const [transactionId, setTransactionId] = useState(order.paymentTransactionId ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [markShipped, setMarkShipped] = useState(
    ["pending", "confirmed", "processing"].includes(order.status),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    try {
      await onPatch({
        courierName,
        trackingId,
        trackingUrl,
        paymentTransactionId: transactionId,
        notes,
        ...(markShipped && trackingId ? { status: "shipped" } : {}),
      });
      toast.success("Order saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const a = order.shippingAddress;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.orderNumber}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="font-mono text-lg font-semibold">{order.orderNumber}</h3>
            <p className="text-xs text-muted-foreground">Placed {fmtDateTime(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            {onCreateInvoice && (
              <button type="button" className={secondaryButton} onClick={onCreateInvoice}>
                <ReceiptText className="h-4 w-4" /> Invoice
              </button>
            )}
            <button type="button" className={iconButton} onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
            {canManage && (
              <select
                aria-label="Payment status"
                value={order.paymentStatus}
                onChange={(e) =>
                  onPatch({ paymentStatus: e.target.value }).then(
                    () => toast.success("Payment status saved."),
                    (err) => toast.error(err.message),
                  )
                }
                className={`${inputClass} ml-auto h-8 w-40 text-xs`}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s} disabled={s.includes("refund") && !canRefund}>
                    Payment: {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            )}
          </div>

          <section className="rounded-xl border border-border p-3">
            <p className="mb-1 font-medium">Deliver to</p>
            <p className="text-foreground">
              {a?.fullName} · {a?.phone}
            </p>
            <p className="text-muted-foreground">
              {[a?.streetAddress, a?.area, a?.district, a?.division, a?.postalCode]
                .filter(Boolean)
                .join(", ")}
            </p>
            {(order.user?.email || order.guestEmail) && (
              <p className="text-muted-foreground">{order.user?.email ?? order.guestEmail}</p>
            )}
            {order.deliveryNotes && (
              <p className="mt-1 rounded-md bg-secondary/60 p-2">
                Customer note: {order.deliveryNotes}
              </p>
            )}
          </section>

          <section>
            <p className="mb-2 font-medium">Items</p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 p-2.5">
                  {it.productImage && (
                    <img
                      src={optimizedImageUrl(it.productImage, 80)}
                      alt=""
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{it.productName}</span>
                    <span className="text-muted-foreground">
                      {[it.variant?.color, it.variant?.size, it.variant?.sku]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="text-right tabular-nums">
                    {it.quantity} × {fmtTaka(it.price)}
                    <span className="block font-semibold">{fmtTaka(it.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1">
              {[
                ["Subtotal", fmtTaka(order.subtotal)],
                order.discount
                  ? [`Discount ${order.couponCode ?? ""}`, `−${fmtTaka(order.discount)}`]
                  : null,
                ["Delivery", order.shippingCost ? fmtTaka(order.shippingCost) : "Free"],
              ]
                .filter(Boolean)
                .map((r) => (
                  <div key={r![0]} className="flex justify-between text-muted-foreground">
                    <dt>{r![0]}</dt>
                    <dd className="tabular-nums">{r![1]}</dd>
                  </div>
                ))}
              <div className="flex justify-between border-t border-border pt-1 text-sm font-semibold">
                <dt>Total ({order.paymentMethod})</dt>
                <dd className="tabular-nums">{fmtTaka(order.total)}</dd>
              </div>
            </dl>
          </section>

          {canManage && (
            <section className="space-y-3 rounded-xl border border-border p-3">
              <p className="font-medium">Courier & payment details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Courier" htmlFor="o-courier">
                  <input
                    id="o-courier"
                    list="courier-list"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className={inputClass}
                  />
                  <datalist id="courier-list">
                    {COURIER_OPTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Tracking / consignment ID" htmlFor="o-tracking">
                  <input
                    id="o-tracking"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Tracking link" htmlFor="o-turl">
                  <input
                    id="o-turl"
                    type="url"
                    placeholder="https://"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Payment transaction ID" htmlFor="o-trx">
                  <input
                    id="o-trx"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Internal note (not shown to the customer)" htmlFor="o-notes">
                <textarea
                  id="o-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={textareaClass}
                />
              </Field>
              {["pending", "confirmed", "processing"].includes(order.status) && (
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={markShipped}
                    onChange={(e) => setMarkShipped(e.target.checked)}
                  />
                  Mark as shipped when a tracking ID is saved
                </label>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                {order.status === "pending" && (
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={() => onStatus("confirmed")}
                  >
                    Confirm order
                  </button>
                )}
                {order.status === "shipped" && (
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={() => onStatus("delivered")}
                  >
                    Mark delivered
                  </button>
                )}
                <button type="button" className={primaryButton} onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save details"}
                </button>
              </div>
            </section>
          )}

          <p className="text-[11px] text-muted-foreground">
            Last updated {fmtDateTime(order.updatedAt)}
            {order.deliveredAt ? ` · delivered ${fmtDateTime(order.deliveredAt)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
