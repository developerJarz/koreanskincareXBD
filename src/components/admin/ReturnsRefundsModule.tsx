"use client";

import React, { useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import {
  api,
  Field,
  inputClass,
  Modal,
  primaryButton,
  secondaryButton,
  textareaClass,
} from "./catalog/ui";
import {
  EmptyState,
  ErrorNotice,
  fmtDate,
  fmtNumber,
  fmtTaka,
  PageHeader,
  Pagination,
  Panel,
  Pill,
  qs,
  Segmented,
  Skeleton,
  StatTile,
  useAdminData,
  useDebounced,
} from "./shared";

type Order = {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentTransactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  shippingAddress: { fullName: string; phone: string; district: string };
  items: { productName: string; quantity: number }[];
};
type List = {
  items: Order[];
  total: number;
  totalPages: number;
  statusCounts?: Record<string, number>;
};

const REFUND_METHODS = [
  "bKash",
  "Nagad",
  "Bank transfer",
  "Cash",
  "Store credit",
  "Exchange (no refund)",
];

/** Returns and refunds — real orders with status "returned" / "refunded". */
export function ReturnsRefundsModule() {
  const [view, setView] = useState<"returned" | "refunded" | "start">("returned");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  useEffect(() => setPage(1), [view, q]);

  const status = view === "start" ? "delivered,shipped" : view;
  const { data, error, loading, reload } = useAdminData<List>(
    `/api/orders${qs({ status, q, page, pageSize: 20, counts: 1 })}`,
  );
  const returnedValue = useAdminData<List>(
    `/api/orders${qs({ status: "returned", paymentStatus: "paid", pageSize: 1 })}`,
  );
  const [refunding, setRefunding] = useState<Order | null>(null);
  const [returning, setReturning] = useState<Order | null>(null);

  const counts = data?.statusCounts ?? {};

  return (
    <div className="space-y-5">
      <PageHeader
        title="Returns & refunds"
        description="Orders that came back, and whether the customer has been refunded."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Returned"
          value={fmtNumber(counts.returned ?? 0)}
          hint="waiting for a refund decision"
        />
        <StatTile
          label="Refunded"
          value={fmtNumber(counts.refunded ?? 0)}
          hint="refund paid and recorded"
        />
        <StatTile
          label="Paid but returned"
          value={fmtNumber(returnedValue.data?.total ?? 0)}
          hint="customer paid — refund likely due"
        />
        <StatTile
          label="Delivered orders"
          value={fmtNumber(counts.delivered ?? 0)}
          hint="can still be returned"
        />
      </div>

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented
            label="Returns view"
            value={view}
            onChange={setView}
            options={[
              { value: "returned", label: `Returned (${counts.returned ?? 0})` },
              { value: "refunded", label: `Refunded (${counts.refunded ?? 0})` },
              { value: "start", label: "Record a return" },
            ]}
          />
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order number, name or phone"
              aria-label="Search"
              className={`${inputClass} h-9 pl-8`}
            />
          </div>
        </div>
        {view === "start" && (
          <p className="mb-3 text-xs text-muted-foreground">
            Shipped and delivered orders. Choose “Record return” when a parcel comes back.
          </p>
        )}
        {error && <ErrorNotice message={error} onRetry={reload} />}
        {!data && !error && <Skeleton className="h-64" />}
        {data && data.items.length === 0 && (
          <EmptyState
            icon={RotateCcw}
            title={
              view === "returned"
                ? "No returned orders"
                : view === "refunded"
                  ? "No refunds recorded"
                  : "No orders match"
            }
          />
        )}
        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table
              className={`w-full min-w-[46rem] text-left text-xs ${loading ? "opacity-60" : ""}`}
            >
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Items</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="py-2 pl-3 text-right font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((o) => (
                  <tr key={o._id} className="align-top">
                    <td className="py-2.5 pr-3">
                      <span className="font-mono font-semibold">{o.orderNumber}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {view === "start"
                          ? `ordered ${fmtDate(o.createdAt)}`
                          : `updated ${fmtDate(o.updatedAt)}`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {o.shippingAddress?.fullName}
                      <span className="block text-[11px] text-muted-foreground">
                        {o.shippingAddress?.phone}
                      </span>
                    </td>
                    <td className="max-w-[16rem] px-3 py-2.5">
                      <span className="block truncate">
                        {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                      </span>
                      {o.notes && (
                        <span
                          className="block truncate text-[11px] text-muted-foreground"
                          title={o.notes}
                        >
                          {o.notes.split("\n").at(-1)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {fmtTaka(o.total)}
                    </td>
                    <td className="px-3 py-2.5">
                      {o.paymentMethod}{" "}
                      <Pill
                        tone={
                          o.paymentStatus === "paid"
                            ? "warn"
                            : o.paymentStatus.includes("refund")
                              ? "good"
                              : "neutral"
                        }
                      >
                        {o.paymentStatus.replace("_", " ")}
                      </Pill>
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      {view === "start" && (
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => setReturning(o)}
                        >
                          Record return
                        </button>
                      )}
                      {view === "returned" && (
                        <button
                          type="button"
                          className={primaryButton}
                          onClick={() => setRefunding(o)}
                        >
                          Mark refunded
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

      {returning && (
        <ReturnDialog
          order={returning}
          onClose={() => setReturning(null)}
          onDone={() => {
            setReturning(null);
            reload();
            returnedValue.reload();
          }}
        />
      )}
      {refunding && (
        <RefundDialog
          order={refunding}
          onClose={() => setRefunding(null)}
          onDone={() => {
            setRefunding(null);
            reload();
            returnedValue.reload();
          }}
        />
      )}
    </div>
  );
}

function appendNote(existing: string | undefined, line: string) {
  return [existing, line].filter(Boolean).join("\n").slice(-2000);
}

function ReturnDialog({
  order,
  onClose,
  onDone,
}: {
  order: Order;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [saving, setSaving] = useState(false);
  return (
    <Modal
      title={`Return ${order.orderNumber}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await api(`/api/orders/${order._id}`, {
                  method: "PATCH",
                  json: {
                    status: "returned",
                    restock,
                    notes: appendNote(
                      order.notes,
                      `Returned ${new Date().toLocaleDateString("en-GB")}${reason ? `: ${reason}` : ""}`,
                    ),
                  },
                });
                toast.success(`${order.orderNumber} marked as returned.`);
                onDone();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Couldn't save.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Mark returned"}
          </button>
        </>
      }
    >
      <p className="text-sm">
        {order.shippingAddress?.fullName} · {fmtTaka(order.total)}
      </p>
      <Field label="Reason" htmlFor="r-reason">
        <textarea
          id="r-reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Damaged in transit, wrong shade"
          className={textareaClass}
        />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
        Put the items back in stock (untick if damaged)
      </label>
    </Modal>
  );
}

function RefundDialog({
  order,
  onClose,
  onDone,
}: {
  order: Order;
  onClose: () => void;
  onDone: () => void;
}) {
  const [method, setMethod] = useState("bKash");
  const [amount, setAmount] = useState(String(order.total));
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const partial = Number(amount) > 0 && Number(amount) < order.total;
  return (
    <Modal
      title={`Refund ${order.orderNumber}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={saving || !(Number(amount) >= 0)}
            onClick={async () => {
              setSaving(true);
              try {
                await api(`/api/orders/${order._id}`, {
                  method: "PATCH",
                  json: {
                    status: "refunded",
                    paymentStatus: partial ? "partially_refunded" : "refunded",
                    notes: appendNote(
                      order.notes,
                      `Refunded ৳${Number(amount).toLocaleString("en-US")} via ${method}${reference ? ` (${reference})` : ""} on ${new Date().toLocaleDateString("en-GB")}`,
                    ),
                  },
                });
                toast.success(`Refund recorded for ${order.orderNumber}.`);
                onDone();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Couldn't save.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Record refund"}
          </button>
        </>
      }
    >
      <p className="text-xs text-muted-foreground">
        Customer paid via {order.paymentMethod} ({order.paymentStatus}). Send the money first, then
        record it here.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount refunded (৳)" htmlFor="rf-amount">
          <input
            id="rf-amount"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Refunded via" htmlFor="rf-method">
          <select
            id="rf-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={inputClass}
          >
            {REFUND_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Transaction ID / reference" htmlFor="rf-ref">
        <input
          id="rf-ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className={inputClass}
        />
      </Field>
    </Modal>
  );
}
