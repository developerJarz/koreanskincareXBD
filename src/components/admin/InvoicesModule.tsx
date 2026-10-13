"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  CircleDollarSign,
  Copy,
  ExternalLink,
  FilePlus2,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { InvoiceDocument, type InvoiceView } from "@/components/invoice/InvoiceDocument";
import {
  computeInvoiceTotals,
  DEFAULT_INVOICE_TEMPLATE,
  INVOICE_LAYOUTS,
  INVOICE_STATUS_LABELS,
  isOverdue,
  PAPER_SIZES,
  type InvoiceLine,
  type InvoiceStatusKey,
  type InvoiceTemplate,
} from "@/lib/invoice";
import {
  api,
  ApiError,
  Field,
  iconButton,
  inputClass,
  Modal,
  primaryButton,
  secondaryButton,
  Switch,
  textareaClass,
} from "./catalog/ui";
import { ImageUploader } from "./catalog/ImageUploader";
import {
  EmptyState,
  ErrorNotice,
  fmtDate,
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
  StatTile,
  todayInput,
  useAccess,
  useAdminData,
  useDebounced,
  type RangeValue,
} from "./shared";

type InvoiceRow = {
  _id: string;
  invoiceNumber: string;
  orderNumber?: string;
  customer: { name: string; email?: string; phone?: string };
  total: number;
  amountPaid: number;
  status: InvoiceStatusKey;
  issueDate: string;
  dueDate?: string;
};

type FullInvoice = InvoiceRow &
  InvoiceView & {
    order?: string;
    createdByName?: string;
    createdAt: string;
  };

type ListResponse = {
  items: InvoiceRow[];
  total: number;
  totalPages: number;
  stats: {
    byStatus: Record<string, { count: number; total: number; paid: number }>;
    invoiced: number;
    collected: number;
    outstanding: number;
    overdueCount: number;
    overdueAmount: number;
  };
};

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank transfer", "Card", "COD (courier)"];

function StatusPill({ status, dueDate }: { status: InvoiceStatusKey; dueDate?: string | null }) {
  if (isOverdue(status, dueDate)) return <Pill tone="bad">Overdue</Pill>;
  const tone = {
    draft: "neutral",
    issued: "warn",
    partially_paid: "info",
    paid: "good",
    void: "neutral",
  } as const;
  return <Pill tone={tone[status]}>{INVOICE_STATUS_LABELS[status]}</Pill>;
}

function useTemplate() {
  return useAdminData<InvoiceTemplate>("/api/admin/invoices/template");
}

export function InvoicesModule({
  initialSearch = "",
  openOrderId,
  onOrderHandled,
}: {
  initialSearch?: string;
  /** Create (or open the existing) invoice for this order */
  openOrderId?: string | null;
  onOrderHandled?: () => void;
}) {
  const { can } = useAccess();
  const [tab, setTab] = useState<"list" | "design">("list");
  const template = useTemplate();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        description="Create invoices from orders or by hand, record payments, and print them on your own invoice design."
      />
      <Segmented
        label="Invoice sections"
        value={tab}
        onChange={setTab}
        options={[
          { value: "list", label: "Invoices" },
          { value: "design", label: "Invoice design" },
        ]}
      />
      {template.error && <ErrorNotice message={template.error} onRetry={template.reload} />}
      {tab === "list" &&
        (template.data ? (
          <InvoiceList
            template={template.data}
            initialSearch={initialSearch}
            openOrderId={openOrderId}
            onOrderHandled={onOrderHandled}
          />
        ) : (
          <Skeleton className="h-96" />
        ))}
      {tab === "design" &&
        (template.data ? (
          <DesignStudio
            initial={template.data}
            canEdit={can("invoices.design")}
            onSaved={(t) => template.setData(t)}
          />
        ) : (
          <Skeleton className="h-96" />
        ))}
    </div>
  );
}

// ─── List ───

function InvoiceList({
  template,
  initialSearch,
  openOrderId,
  onOrderHandled,
}: {
  template: InvoiceTemplate;
  initialSearch: string;
  openOrderId?: string | null;
  onOrderHandled?: () => void;
}) {
  const { can } = useAccess();
  const manage = can("invoices.manage");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const [range, setRange] = useState<RangeValue>({ key: "all" });
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  useEffect(() => setPage(1), [status, q, range]);
  useEffect(() => setSearch(initialSearch), [initialSearch]);

  const { data, error, loading, reload } = useAdminData<ListResponse>(
    `/api/admin/invoices${qs({ ...rangeQuery(range), status: status === "all" ? "" : status, q, page })}`,
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ invoice: FullInvoice | null; copy?: boolean } | null>(
    null,
  );
  const [fromOrder, setFromOrder] = useState(false);

  // Opened from an order ("Create invoice" in Orders). The ref stops a second request (and a
  // duplicate invoice) when React runs the effect twice in development.
  const handledOrder = useRef<string | null>(null);
  useEffect(() => {
    if (!openOrderId || !manage || handledOrder.current === openOrderId) return;
    handledOrder.current = openOrderId;
    onOrderHandled?.();
    api<{ invoice: FullInvoice; existing: boolean }>("/api/admin/invoices", {
      method: "POST",
      json: { orderId: openOrderId },
    })
      .then((r) => {
        toast.success(
          r.existing
            ? `This order already has invoice ${r.invoice.invoiceNumber}.`
            : `Invoice ${r.invoice.invoiceNumber} created.`,
        );
        setOpenId(r.invoice._id);
        reload();
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Couldn't create the invoice."),
      );
  }, [openOrderId, manage, reload, onOrderHandled]);

  const s = data?.stats;
  return (
    <div className="space-y-5">
      {s && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Invoiced"
            value={fmtTaka(s.invoiced)}
            hint="unpaid, part paid and paid"
          />
          <StatTile
            label="Collected"
            value={fmtTaka(s.collected)}
            hint={`${s.byStatus.paid?.count ?? 0} paid in full`}
          />
          <StatTile
            label="Outstanding"
            value={fmtTaka(s.outstanding)}
            hint={`${(s.byStatus.issued?.count ?? 0) + (s.byStatus.partially_paid?.count ?? 0)} invoices open`}
          />
          <StatTile
            label="Overdue"
            value={fmtTaka(s.overdueAmount)}
            hint={`${s.overdueCount} past the due date`}
          />
        </div>
      )}

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented
            label="Invoice status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "issued", label: "Unpaid" },
              { value: "partially_paid", label: "Part paid" },
              { value: "overdue", label: "Overdue" },
              { value: "paid", label: "Paid" },
              { value: "draft", label: "Drafts" },
              { value: "void", label: "Void" },
            ]}
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Invoice, order, customer, phone"
              aria-label="Search invoices"
              className={`${inputClass} h-9 w-64 pl-8`}
            />
          </div>
          <RangePicker
            value={range}
            onChange={setRange}
            options={["30d", "90d", "year", "all", "custom"]}
          />
          {manage && (
            <div className="ml-auto flex gap-2">
              <button type="button" className={secondaryButton} onClick={() => setFromOrder(true)}>
                <ShoppingBag className="h-4 w-4" /> From an order
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => setEditing({ invoice: null })}
              >
                <Plus className="h-4 w-4" /> New invoice
              </button>
            </div>
          )}
        </div>

        {error && <ErrorNotice message={error} onRetry={reload} />}
        {!data && !error && <Skeleton className="h-64" />}
        {data && data.items.length === 0 && (
          <EmptyState
            icon={ReceiptText}
            title={q || status !== "all" ? "No invoices match." : "No invoices yet"}
          >
            Create one from an order (Orders → invoice button, or “From an order” above) or write
            one by hand.
          </EmptyState>
        )}
        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table
              className={`w-full min-w-[48rem] text-left text-xs ${loading ? "opacity-60" : ""}`}
            >
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Invoice</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Due</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="py-2 pl-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((inv) => (
                  <tr
                    key={inv._id}
                    className="cursor-pointer hover:bg-secondary/40"
                    onClick={() => setOpenId(inv._id)}
                  >
                    <td className="py-2.5 pr-3">
                      <span className="font-mono font-semibold text-foreground">
                        {inv.invoiceNumber}
                      </span>
                      {inv.orderNumber && (
                        <span className="block text-[11px] text-muted-foreground">
                          Order {inv.orderNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {inv.customer.name}
                      <span className="block text-[11px] text-muted-foreground">
                        {inv.customer.phone ?? inv.customer.email}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(inv.issueDate)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(inv.dueDate)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtTaka(inv.total)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {inv.status === "void"
                        ? "—"
                        : fmtTaka(Math.max(0, inv.total - inv.amountPaid))}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={inv.status} dueDate={inv.dueDate} />
                    </td>
                    <td className="py-2.5 pl-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`/admin/invoices/${inv._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className={iconButton}
                        aria-label={`Print ${inv.invoiceNumber}`}
                        title="Print"
                      >
                        <Printer className="h-4 w-4" />
                      </a>
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
            label="invoices"
          />
        )}
      </Panel>

      {openId && (
        <InvoiceDrawer
          id={openId}
          template={template}
          onClose={() => setOpenId(null)}
          onChanged={reload}
          onEdit={(invoice, copy) => setEditing({ invoice, copy })}
        />
      )}
      {editing && (
        <InvoiceEditor
          template={template}
          invoice={editing.invoice}
          copy={editing.copy}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            setEditing(null);
            reload();
            setOpenId(id);
          }}
        />
      )}
      {fromOrder && (
        <OrderPicker
          onClose={() => setFromOrder(false)}
          onCreated={(id) => {
            setFromOrder(false);
            reload();
            setOpenId(id);
          }}
        />
      )}
    </div>
  );
}

// ─── Create from order ───

function OrderPicker({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, loading } = useAdminData<{ items: any[] }>(`/api/orders${qs({ q, pageSize: 10 })}`);
  const [busy, setBusy] = useState<string | null>(null);

  const create = async (orderId: string, force = false) => {
    setBusy(orderId);
    try {
      const r = await api<{ invoice: FullInvoice; existing: boolean }>("/api/admin/invoices", {
        method: "POST",
        json: { orderId, force },
      });
      toast.success(
        r.existing
          ? `Opened existing invoice ${r.invoice.invoiceNumber}.`
          : `Invoice ${r.invoice.invoiceNumber} created.`,
      );
      onCreated(r.invoice._id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the invoice.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal title="Invoice from an order" onClose={onClose}>
      <input
        type="search"
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Order number, name or phone"
        aria-label="Search orders"
        className={inputClass}
      />
      <ul className="divide-y divide-border rounded-xl border border-border">
        {(data?.items ?? []).map((o) => (
          <li key={o._id} className="flex items-center justify-between gap-3 p-3 text-xs">
            <span className="min-w-0">
              <span className="block font-mono font-semibold">{o.orderNumber}</span>
              <span className="block truncate text-muted-foreground">
                {o.shippingAddress?.fullName} · {fmtTaka(o.total)} · {o.status} ·{" "}
                {fmtDate(o.createdAt)}
              </span>
            </span>
            <button
              type="button"
              className={secondaryButton}
              disabled={busy !== null}
              onClick={() => create(o._id)}
            >
              {busy === o._id ? "Creating…" : "Create invoice"}
            </button>
          </li>
        ))}
        {data && data.items.length === 0 && (
          <li className="p-4 text-center text-xs text-muted-foreground">No orders match.</li>
        )}
        {!data && loading && (
          <li className="p-4 text-center text-xs text-muted-foreground">Loading…</li>
        )}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        If an order already has an invoice, that invoice opens instead of a duplicate.
      </p>
    </Modal>
  );
}

// ─── Drawer: view, pay, void ───

function InvoiceDrawer({
  id,
  template,
  onClose,
  onChanged,
  onEdit,
}: {
  id: string;
  template: InvoiceTemplate;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (invoice: FullInvoice, copy?: boolean) => void;
}) {
  const { can } = useAccess();
  const manage = can("invoices.manage");
  const {
    data: invoice,
    error,
    reload,
    setData,
  } = useAdminData<FullInvoice>(`/api/admin/invoices/${id}`);
  const [paying, setPaying] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !paying && !voiding && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, paying, voiding]);

  const action = async (body: Record<string, unknown>, message: string) => {
    setBusy(true);
    try {
      const updated = await api<FullInvoice>(`/api/admin/invoices/${id}`, {
        method: "PATCH",
        json: body,
      });
      setData(updated);
      toast.success(message);
      onChanged();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the invoice.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/invoices/${id}`, { method: "DELETE" });
      toast.success("Draft deleted.");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setBusy(false);
    }
  };

  const balance = invoice
    ? Math.max(0, Math.round((invoice.total - invoice.amountPaid) * 100) / 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invoice"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-3xl flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <div className="mr-auto">
            <h3 className="font-mono text-lg font-semibold">
              {invoice?.invoiceNumber ?? "Invoice"}
            </h3>
            {invoice && (
              <p className="text-xs text-muted-foreground">
                Created by {invoice.createdByName ?? "—"} · {fmtDate(invoice.createdAt)}
              </p>
            )}
          </div>
          {invoice && (
            <>
              <a
                href={`/admin/invoices/${id}?print=1`}
                target="_blank"
                rel="noreferrer"
                className={secondaryButton}
              >
                <Printer className="h-4 w-4" /> Print / PDF
              </a>
              {manage && invoice.status !== "void" && balance > 0 && invoice.status !== "draft" && (
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => setPaying(true)}
                  disabled={busy}
                >
                  <CircleDollarSign className="h-4 w-4" /> Record payment
                </button>
              )}
              {manage && invoice.status === "draft" && (
                <button
                  type="button"
                  className={primaryButton}
                  disabled={busy}
                  onClick={() => action({ action: "issue" }, "Invoice issued.")}
                >
                  Issue invoice
                </button>
              )}
            </>
          )}
          <button type="button" onClick={onClose} className={iconButton} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-secondary/40 p-4">
          {error && <ErrorNotice message={error} onRetry={reload} />}
          {!invoice && !error && <Skeleton className="h-96" />}
          {invoice && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusPill status={invoice.status} dueDate={invoice.dueDate} />
                <span className="text-muted-foreground">
                  Total {fmtTaka(invoice.total)} · paid {fmtTaka(invoice.amountPaid)} · balance{" "}
                  {fmtTaka(balance)}
                </span>
                {manage && (
                  <span className="ml-auto flex flex-wrap gap-1">
                    {invoice.status !== "void" && (
                      <button
                        type="button"
                        className={secondaryButton}
                        onClick={() => onEdit(invoice)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => onEdit(invoice, true)}
                    >
                      <Copy className="h-3.5 w-3.5" /> Duplicate
                    </button>
                    {invoice.status === "draft" ? (
                      <button
                        type="button"
                        className={`${secondaryButton} text-destructive`}
                        onClick={remove}
                        disabled={busy}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete draft
                      </button>
                    ) : (
                      invoice.status !== "void" && (
                        <button
                          type="button"
                          className={`${secondaryButton} text-destructive`}
                          onClick={() => setVoiding(true)}
                        >
                          <Ban className="h-3.5 w-3.5" /> Void
                        </button>
                      )
                    )}
                  </span>
                )}
              </div>

              {(invoice.payments?.length ?? 0) > 0 && manage && (
                <div className="rounded-xl border border-border bg-card p-3 text-xs">
                  <p className="mb-1.5 font-medium">Payments</p>
                  <ul className="divide-y divide-border">
                    {(invoice.payments ?? []).map((p, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                        <span>
                          {fmtDate(p.date)} · {p.method}
                          {p.reference ? ` · ${p.reference}` : ""}
                          {p.note ? (
                            <span className="text-muted-foreground"> — {p.note}</span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold tabular-nums">{fmtTaka(p.amount)}</span>
                          {invoice.status !== "void" && (
                            <button
                              type="button"
                              className={iconButton}
                              aria-label="Remove payment"
                              title="Remove payment"
                              onClick={() =>
                                action({ action: "remove_payment", index: i }, "Payment removed.")
                              }
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                <InvoiceDocument invoice={invoice} template={template} />
              </div>
              {invoice.order && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ExternalLink className="h-3 w-3" /> Linked to order {invoice.orderNumber}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {paying && invoice && (
        <PaymentDialog
          balance={balance}
          onClose={() => setPaying(false)}
          onSave={async (body) => {
            if (
              await action(
                { action: "payment", ...body },
                `Payment of ${fmtTaka(body.amount)} recorded.`,
              )
            )
              setPaying(false);
          }}
        />
      )}
      {voiding && invoice && (
        <VoidDialog
          number={invoice.invoiceNumber}
          onClose={() => setVoiding(false)}
          onVoid={async (reason) => {
            if (await action({ action: "void", reason }, `${invoice.invoiceNumber} voided.`))
              setVoiding(false);
          }}
        />
      )}
    </div>
  );
}

function PaymentDialog({
  balance,
  onClose,
  onSave,
}: {
  balance: number;
  onClose: () => void;
  onSave: (body: {
    amount: number;
    method: string;
    reference: string;
    date: string;
    note: string;
  }) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(todayInput());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Modal
        title="Record payment"
        onClose={onClose}
        footer={
          <>
            <button type="button" className={secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={primaryButton}
              disabled={saving || !(Number(amount) > 0)}
              onClick={async () => {
                setSaving(true);
                await onSave({ amount: Number(amount), method, reference, date, note });
                setSaving(false);
              }}
            >
              {saving ? "Saving…" : "Save payment"}
            </button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Amount received (৳)"
            htmlFor="p-amount"
            hint={`Balance due ${fmtTaka(balance)}`}
          >
            <input
              id="p-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Date" htmlFor="p-date">
            <input
              id="p-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Method" htmlFor="p-method">
            <select
              id="p-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={inputClass}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Transaction ID / reference" htmlFor="p-ref">
            <input
              id="p-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Note" htmlFor="p-note">
          <input
            id="p-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Modal>
    </div>
  );
}

function VoidDialog({
  number,
  onClose,
  onVoid,
}: {
  number: string;
  onClose: () => void;
  onVoid: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Modal
        title={`Void ${number}`}
        onClose={onClose}
        footer={
          <>
            <button type="button" className={secondaryButton} onClick={onClose}>
              Keep it
            </button>
            <button type="button" className={primaryButton} onClick={() => onVoid(reason)}>
              Void invoice
            </button>
          </>
        }
      >
        <p className="text-sm">
          The invoice stays on record (marked VOID) so your invoice numbers have no gaps. It can't
          be edited afterwards.
        </p>
        <Field label="Reason (printed in the notes)" htmlFor="v-reason">
          <input
            id="v-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Modal>
    </div>
  );
}

// ─── Editor with live preview ───

type Draft = {
  customer: { name: string; email: string; phone: string; address: string };
  items: {
    description: string;
    sku: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    taxRate: string;
  }[];
  shipping: string;
  discount: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  terms: string;
};

const blankLine = (taxRate: number) => ({
  description: "",
  sku: "",
  quantity: "1",
  unitPrice: "",
  discount: "0",
  taxRate: String(taxRate),
});

function toInput(date?: string | Date | null) {
  if (!date) return "";
  return new Date(new Date(date).getTime() + 6 * 3_600_000).toISOString().slice(0, 10);
}

function InvoiceEditor({
  template,
  invoice,
  copy,
  onClose,
  onSaved,
}: {
  template: InvoiceTemplate;
  invoice: FullInvoice | null;
  copy?: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const editingExisting = Boolean(invoice && !copy);
  const [draft, setDraft] = useState<Draft>(() =>
    invoice
      ? {
          customer: {
            name: invoice.customer.name,
            email: invoice.customer.email ?? "",
            phone: invoice.customer.phone ?? "",
            address: invoice.customer.address ?? "",
          },
          items: invoice.items.map((i) => ({
            description: i.description,
            sku: i.sku ?? "",
            quantity: String(i.quantity),
            unitPrice: String(i.unitPrice),
            discount: String(i.discount ?? 0),
            taxRate: String(i.taxRate ?? 0),
          })),
          shipping: String(invoice.shipping ?? 0),
          discount: String(invoice.discount ?? 0),
          issueDate: copy ? todayInput() : toInput(invoice.issueDate),
          dueDate: copy ? todayInput(template.defaultDueDays) : toInput(invoice.dueDate),
          notes: invoice.notes ?? "",
          terms: invoice.terms ?? "",
        }
      : {
          customer: { name: "", email: "", phone: "", address: "" },
          items: [blankLine(template.defaultTaxRate)],
          shipping: "0",
          discount: "0",
          issueDate: todayInput(),
          dueDate: todayInput(template.defaultDueDays),
          notes: template.defaultNotes,
          terms: template.defaultTerms,
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const lines: InvoiceLine[] = draft.items.map((i) => ({
    description: i.description,
    sku: i.sku || undefined,
    quantity: Number(i.quantity) || 0,
    unitPrice: Number(i.unitPrice) || 0,
    discount: Number(i.discount) || 0,
    taxRate: Number(i.taxRate) || 0,
  }));
  const totals = computeInvoiceTotals(
    lines,
    Number(draft.shipping) || 0,
    Number(draft.discount) || 0,
  );

  const preview: InvoiceView = {
    invoiceNumber: editingExisting
      ? invoice!.invoiceNumber
      : `${template.prefix}${"0".repeat(Math.max(0, template.numberDigits - 1))}?`,
    status: editingExisting ? invoice!.status : "draft",
    issueDate: draft.issueDate || new Date(),
    dueDate: draft.dueDate || null,
    orderNumber: editingExisting ? invoice!.orderNumber : undefined,
    customer: { ...draft.customer, name: draft.customer.name || "Customer name" },
    items: lines.filter((l) => l.description || l.unitPrice),
    shipping: Number(draft.shipping) || 0,
    discount: Number(draft.discount) || 0,
    amountPaid: editingExisting ? invoice!.amountPaid : 0,
    payments: editingExisting ? invoice!.payments : [],
    notes: draft.notes,
    terms: draft.terms,
  };

  const setItem = (index: number, patch: Partial<Draft["items"][number]>) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));

  const save = async (issue: boolean) => {
    setSaving(true);
    setErrors({});
    const body = { ...draft, status: issue ? "issued" : "draft" };
    try {
      const result = editingExisting
        ? await api<FullInvoice>(`/api/admin/invoices/${invoice!._id}`, {
            method: "PUT",
            json: body,
          })
        : (
            await api<{ invoice: FullInvoice }>("/api/admin/invoices", {
              method: "POST",
              json: body,
            })
          ).invoice;
      toast.success(
        editingExisting ? "Invoice saved." : `Invoice ${result.invoiceNumber} created.`,
      );
      onSaved(result._id);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const wasDraft = !editingExisting || invoice!.status === "draft";

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invoice editor"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-7xl flex-col overflow-hidden bg-card sm:rounded-2xl sm:border sm:border-border"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <h2 className="mr-auto font-serif text-xl">
            {editingExisting
              ? `Edit ${invoice!.invoiceNumber}`
              : copy
                ? "Duplicate invoice"
                : "New invoice"}
          </h2>
          <button
            type="button"
            className={`${secondaryButton} xl:hidden`}
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          {wasDraft && (
            <button
              type="button"
              className={secondaryButton}
              disabled={saving}
              onClick={() => save(false)}
            >
              Save draft
            </button>
          )}
          <button
            type="button"
            className={primaryButton}
            disabled={saving}
            onClick={() => save(true)}
          >
            {saving ? "Saving…" : wasDraft ? "Save & issue" : "Save changes"}
          </button>
          <button type="button" className={iconButton} onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5 overflow-y-auto p-5">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Customer</h3>
                <CustomerLookup
                  onPick={(c) =>
                    setDraft((d) => ({
                      ...d,
                      customer: {
                        name: c.name,
                        email: c.email ?? "",
                        phone: c.phone ?? "",
                        address: d.customer.address,
                      },
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" htmlFor="c-name" error={errors["customer.name"]}>
                  <input
                    id="c-name"
                    value={draft.customer.name}
                    onChange={(e) =>
                      setDraft({ ...draft, customer: { ...draft.customer, name: e.target.value } })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone" htmlFor="c-phone">
                  <input
                    id="c-phone"
                    value={draft.customer.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, customer: { ...draft.customer, phone: e.target.value } })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Email" htmlFor="c-email" error={errors["customer.email"]}>
                  <input
                    id="c-email"
                    type="email"
                    value={draft.customer.email}
                    onChange={(e) =>
                      setDraft({ ...draft, customer: { ...draft.customer, email: e.target.value } })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Address" htmlFor="c-address">
                  <input
                    id="c-address"
                    value={draft.customer.address}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        customer: { ...draft.customer, address: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Items</h3>
                <ProductLookup
                  onPick={(p) =>
                    setDraft((d) => {
                      const items = d.items.filter((i) => i.description || i.unitPrice);
                      return {
                        ...d,
                        items: [
                          ...items,
                          {
                            ...blankLine(template.defaultTaxRate),
                            description: p.name,
                            sku: p.sku ?? "",
                            unitPrice: String(p.price),
                          },
                        ],
                      };
                    })
                  }
                />
              </div>
              {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}
              <div className="space-y-2">
                {draft.items.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 rounded-xl border border-border p-2"
                  >
                    <input
                      aria-label="Description"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => setItem(i, { description: e.target.value })}
                      aria-invalid={Boolean(errors[`items.${i}.description`])}
                      className={`${inputClass} col-span-12 h-9 sm:col-span-6`}
                    />
                    <input
                      aria-label="SKU"
                      placeholder="SKU"
                      value={item.sku}
                      onChange={(e) => setItem(i, { sku: e.target.value })}
                      className={`${inputClass} col-span-4 h-9 sm:col-span-2`}
                    />
                    <input
                      aria-label="Quantity"
                      type="number"
                      min={0}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => setItem(i, { quantity: e.target.value })}
                      aria-invalid={Boolean(errors[`items.${i}.quantity`])}
                      className={`${inputClass} col-span-3 h-9 sm:col-span-1`}
                    />
                    <input
                      aria-label="Unit price"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => setItem(i, { unitPrice: e.target.value })}
                      aria-invalid={Boolean(errors[`items.${i}.unitPrice`])}
                      className={`${inputClass} col-span-5 h-9 sm:col-span-3`}
                    />
                    <label className="col-span-5 flex items-center gap-1 text-[11px] text-muted-foreground sm:col-span-4">
                      Discount ৳
                      <input
                        aria-label="Line discount"
                        type="number"
                        min={0}
                        value={item.discount}
                        onChange={(e) => setItem(i, { discount: e.target.value })}
                        className={`${inputClass} h-8 text-xs`}
                      />
                    </label>
                    <label className="col-span-4 flex items-center gap-1 text-[11px] text-muted-foreground sm:col-span-3">
                      Tax %
                      <input
                        aria-label="Tax rate"
                        type="number"
                        min={0}
                        max={100}
                        value={item.taxRate}
                        onChange={(e) => setItem(i, { taxRate: e.target.value })}
                        className={`${inputClass} h-8 text-xs`}
                      />
                    </label>
                    <span className="col-span-2 flex items-center justify-end text-xs font-semibold tabular-nums sm:col-span-4">
                      {fmtTaka(totals.lines[i]?.amount ?? 0)}
                    </span>
                    <button
                      type="button"
                      className={`${iconButton} col-span-1 justify-self-end`}
                      aria-label="Remove item"
                      disabled={draft.items.length === 1}
                      onClick={() =>
                        setDraft((d) => ({ ...d, items: d.items.filter((_, j) => j !== i) }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={secondaryButton}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    items: [...d.items, blankLine(template.defaultTaxRate)],
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Add line
              </button>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <Field label="Delivery charge (৳)" htmlFor="i-ship" error={errors.shipping}>
                <input
                  id="i-ship"
                  type="number"
                  min={0}
                  value={draft.shipping}
                  onChange={(e) => setDraft({ ...draft, shipping: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Invoice discount (৳)" htmlFor="i-disc" error={errors.discount}>
                <input
                  id="i-disc"
                  type="number"
                  min={0}
                  value={draft.discount}
                  onChange={(e) => setDraft({ ...draft, discount: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Invoice date" htmlFor="i-date">
                <input
                  id="i-date"
                  type="date"
                  value={draft.issueDate}
                  onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Due date" htmlFor="i-due" error={errors.dueDate}>
                <input
                  id="i-due"
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Notes" htmlFor="i-notes" className="sm:col-span-2">
                <textarea
                  id="i-notes"
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className={textareaClass}
                />
              </Field>
              <Field label="Terms" htmlFor="i-terms" className="sm:col-span-2">
                <textarea
                  id="i-terms"
                  rows={2}
                  value={draft.terms}
                  onChange={(e) => setDraft({ ...draft, terms: e.target.value })}
                  className={textareaClass}
                />
              </Field>
            </section>

            <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3 text-sm">
              <span className="text-muted-foreground">
                Subtotal {fmtTaka(totals.subtotal)}
                {totals.taxTotal ? ` · tax ${fmtTaka(totals.taxTotal)}` : ""}
              </span>
              <span className="font-semibold">Total {fmtTaka(totals.total)}</span>
            </div>
          </div>

          <div
            className={`${showPreview ? "block" : "hidden"} overflow-y-auto border-l border-border bg-secondary/40 p-5 xl:block`}
          >
            <p className="mb-2 text-xs text-muted-foreground">
              Live preview — uses your invoice design
            </p>
            <div className="overflow-hidden rounded-xl border border-border shadow-sm">
              <InvoiceDocument invoice={preview} template={template} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerLookup({
  onPick,
}: {
  onPick: (c: { name: string; email?: string; phone?: string }) => void;
}) {
  const { can } = useAccess();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data } = useAdminData<{
    items: { id: string; name: string; email: string; phone: string; orders: number }[];
  }>(open && q.length >= 2 ? `/api/admin/customers${qs({ q, pageSize: 10, role: "all" })}` : null);
  if (!can("customers.view")) return null;
  return (
    <div className="relative">
      <button
        type="button"
        className="text-xs font-medium text-primary hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        Pick a customer
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-72 rounded-xl border border-border bg-popover p-2 shadow-lg">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email or phone"
            className={`${inputClass} h-9`}
            aria-label="Search customers"
          />
          <ul className="mt-1 max-h-60 overflow-y-auto">
            {(data?.items ?? []).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-secondary"
                  onClick={() => {
                    onPick(c);
                    setOpen(false);
                  }}
                >
                  <span className="block font-medium">{c.name}</span>
                  <span className="block text-muted-foreground">
                    {c.email} · {c.orders} orders
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProductLookup({
  onPick,
}: {
  onPick: (p: { name: string; sku?: string; price: number }) => void;
}) {
  const { can } = useAccess();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data } = useAdminData<{
    items: { _id: string; name: string; sku?: string; price: number; stock: number }[];
  }>(open && q.length >= 2 ? `/api/admin/products${qs({ q, pageSize: 8 })}` : null);
  if (!can("catalog.view")) return null;
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        <FilePlus2 className="h-3.5 w-3.5" /> Add a product
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-80 rounded-xl border border-border bg-popover p-2 shadow-lg">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product name or SKU"
            className={`${inputClass} h-9`}
            aria-label="Search products"
          />
          <ul className="mt-1 max-h-60 overflow-y-auto">
            {(data?.items ?? []).map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-secondary"
                  onClick={() => {
                    onPick(p);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="block font-medium">{p.name}</span>
                  <span className="block text-muted-foreground">
                    {fmtTaka(p.price)} · {p.stock} in stock{p.sku ? ` · ${p.sku}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Design studio ───

const SAMPLE: InvoiceView = {
  invoiceNumber: "INV-00042",
  status: "partially_paid",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 7 * 86_400_000),
  orderNumber: "NB-000128",
  customer: {
    name: "Ayesha Rahman",
    phone: "01711-000000",
    email: "ayesha@example.com",
    address: "House 12, Road 4, Dhanmondi, Dhaka 1205",
  },
  items: [
    {
      description: "Low pH Good Morning Gel Cleanser 150ml",
      sku: "KS-CL-150",
      quantity: 2,
      unitPrice: 950,
      discount: 100,
      taxRate: 0,
    },
    {
      description: "Snail Mucin Essence 96%",
      sku: "KS-ES-96",
      quantity: 1,
      unitPrice: 1450,
      discount: 0,
      taxRate: 0,
    },
    {
      description: "Sunscreen SPF50+ PA++++",
      quantity: 1,
      unitPrice: 1200,
      discount: 0,
      taxRate: 0,
    },
  ],
  shipping: 70,
  discount: 150,
  amountPaid: 2000,
  payments: [{ amount: 2000, method: "bKash", reference: "TRX8KD72", date: new Date() }],
  notes: "",
  terms: "",
};

const ACCENTS = [
  "#be185d",
  "#2a78d6",
  "#0f766e",
  "#7c3aed",
  "#d97706",
  "#1c1917",
  "#b91c1c",
  "#15803d",
];

function DesignStudio({
  initial,
  canEdit,
  onSaved,
}: {
  initial: InvoiceTemplate;
  canEdit: boolean;
  onSaved: (t: InvoiceTemplate) => void;
}) {
  const { can } = useAccess();
  const [t, setT] = useState<InvoiceTemplate>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(t) !== JSON.stringify(initial), [t, initial]);
  const set = <K extends keyof InvoiceTemplate>(key: K, value: InvoiceTemplate[K]) =>
    setT((prev) => ({ ...prev, [key]: value }));

  const save = async (reset = false) => {
    setSaving(true);
    try {
      const saved = await api<InvoiceTemplate>("/api/admin/invoices/template", {
        method: "PUT",
        json: reset ? { reset: true } : t,
      });
      setT(saved);
      onSaved(saved);
      toast.success(reset ? "Invoice design reset." : "Invoice design saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the design.");
    } finally {
      setSaving(false);
    }
  };

  const sample = {
    ...SAMPLE,
    notes: t.defaultNotes,
    terms: t.defaultTerms,
    invoiceNumber: `${t.prefix}${String(42).padStart(t.numberDigits, "0")}`,
  };
  const text = (key: keyof InvoiceTemplate, label: string, multiline = false, hint?: string) => (
    <Field label={label} htmlFor={`t-${key}`} hint={hint}>
      {multiline ? (
        <textarea
          id={`t-${key}`}
          rows={2}
          disabled={!canEdit}
          value={String(t[key] ?? "")}
          onChange={(e) => set(key, e.target.value as never)}
          className={textareaClass}
        />
      ) : (
        <input
          id={`t-${key}`}
          disabled={!canEdit}
          value={String(t[key] ?? "")}
          onChange={(e) => set(key, e.target.value as never)}
          className={inputClass}
        />
      )}
    </Field>
  );
  const toggle = (key: keyof InvoiceTemplate, label: string) => (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span>{label}</span>
      <Switch
        label={label}
        checked={Boolean(t[key])}
        disabled={!canEdit}
        onChange={(v) => set(key, v as never)}
      />
    </div>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="space-y-4">
        {!canEdit && (
          <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
            You can view the invoice design. Ask an admin for “Design invoice page” to change it.
          </p>
        )}
        <Panel title="Layout">
          <div className="grid grid-cols-2 gap-2">
            {INVOICE_LAYOUTS.map((l) => (
              <button
                key={l}
                type="button"
                disabled={!canEdit}
                onClick={() => set("layout", l)}
                className={`rounded-xl border p-3 text-left text-xs capitalize ${t.layout === l ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-secondary/50"}`}
              >
                <span className="block font-semibold">{l}</span>
                <span className="text-[11px] text-muted-foreground">
                  {
                    {
                      classic: "Accent rule under the header",
                      modern: "Coloured header band",
                      minimal: "Quiet, lots of white space",
                      compact: "Narrow receipt style",
                    }[l]
                  }
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Paper" htmlFor="t-paper">
              <select
                id="t-paper"
                disabled={!canEdit}
                value={t.paperSize}
                onChange={(e) => set("paperSize", e.target.value as InvoiceTemplate["paperSize"])}
                className={inputClass}
              >
                {PAPER_SIZES.map((p) => (
                  <option key={p} value={p}>
                    {p === "80mm" ? "80 mm receipt printer" : p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Font" htmlFor="t-font">
              <select
                id="t-font"
                disabled={!canEdit}
                value={t.fontStyle}
                onChange={(e) => set("fontStyle", e.target.value as InvoiceTemplate["fontStyle"])}
                className={inputClass}
              >
                <option value="sans">Modern sans</option>
                <option value="serif">Classic serif</option>
              </select>
            </Field>
          </div>
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium">Accent colour</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={!canEdit}
                  aria-label={`Accent ${c}`}
                  onClick={() => set("accentColor", c)}
                  className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-card ${t.accentColor === c ? "ring-2 ring-foreground" : ""}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                aria-label="Custom accent colour"
                disabled={!canEdit}
                value={t.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Your business">
          <div className="space-y-3">
            {toggle("showLogo", "Show logo")}
            {t.showLogo && canEdit && can("storefront.manage") && (
              <ImageUploader
                label="Logo"
                folder="site"
                max={1}
                withAlt={false}
                value={t.logoUrl ? [{ url: t.logoUrl, alt: "" }] : []}
                onChange={(items) => set("logoUrl", items[0]?.url ?? "")}
              />
            )}
            {t.showLogo &&
              text("logoUrl", "Logo link", false, "Uses your website logo unless you change it.")}
            {text("companyName", "Business name")}
            {text("companyTagline", "Tagline")}
            {text("companyAddress", "Address", true)}
            <div className="grid grid-cols-2 gap-3">
              {text("companyPhone", "Phone")}
              {text("companyEmail", "Email")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {text("companyWebsite", "Website")}
              {text("taxId", "BIN / VAT number")}
            </div>
          </div>
        </Panel>

        <Panel title="Numbers & defaults">
          <div className="grid grid-cols-2 gap-3">
            {text("title", "Heading", false, "e.g. Invoice, Tax invoice, Receipt")}
            {text("currencySymbol", "Currency symbol")}
            {text(
              "prefix",
              "Number prefix",
              false,
              `Next looks like ${t.prefix}${"1".padStart(t.numberDigits, "0")}`,
            )}
            <Field label="Digits" htmlFor="t-digits">
              <input
                id="t-digits"
                type="number"
                min={3}
                max={8}
                disabled={!canEdit}
                value={t.numberDigits}
                onChange={(e) => set("numberDigits", Number(e.target.value) || 5)}
                className={inputClass}
              />
            </Field>
            <Field label="Default tax / VAT %" htmlFor="t-tax">
              <input
                id="t-tax"
                type="number"
                min={0}
                max={100}
                disabled={!canEdit}
                value={t.defaultTaxRate}
                onChange={(e) => set("defaultTaxRate", Number(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
            <Field label="Due after (days)" htmlFor="t-due">
              <input
                id="t-due"
                type="number"
                min={0}
                max={365}
                disabled={!canEdit}
                value={t.defaultDueDays}
                onChange={(e) => set("defaultDueDays", Number(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="What to show">
          <div className="divide-y divide-border">
            {toggle("showSku", "SKU under each item")}
            {toggle("showDiscountColumn", "Discount column (when used)")}
            {toggle("showTaxColumn", "Tax column (when used)")}
            {toggle("showPaymentHistory", "Payments received")}
            {toggle("showPaidStamp", "“PAID” stamp on paid invoices")}
            {toggle("showSignature", "Signature line")}
          </div>
          {t.showSignature && (
            <div className="mt-2">{text("signatureLabel", "Signature label")}</div>
          )}
        </Panel>

        <Panel title="Wording">
          <div className="space-y-3">
            {text("paymentInstructions", "How to pay", true, "Shown while money is still due")}
            {text("defaultNotes", "Default notes", true)}
            {text("defaultTerms", "Default terms", true)}
            {text("footerText", "Footer")}
          </div>
        </Panel>

        {canEdit && (
          <div className="sticky bottom-0 flex gap-2 rounded-xl border border-border bg-card p-3 shadow-lg">
            <button
              type="button"
              className={secondaryButton}
              disabled={saving}
              onClick={() => save(true)}
            >
              Reset to default
            </button>
            <button
              type="button"
              className={`${secondaryButton}`}
              disabled={!dirty || saving}
              onClick={() => setT(initial)}
            >
              Undo changes
            </button>
            <button
              type="button"
              className={`${primaryButton} ml-auto`}
              disabled={!dirty || saving}
              onClick={() => save()}
            >
              {saving ? "Saving…" : "Save design"}
            </button>
          </div>
        )}
      </div>

      <div className="xl:sticky xl:top-20 xl:self-start">
        <p className="mb-2 text-xs text-muted-foreground">
          Preview with sample data · {t.paperSize}
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-neutral-200 p-4 shadow-sm">
          <div
            className="mx-auto bg-white shadow"
            style={{ maxWidth: t.paperSize === "80mm" || t.layout === "compact" ? 340 : 860 }}
          >
            <InvoiceDocument invoice={sample} template={t} />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Default design: {DEFAULT_INVOICE_TEMPLATE.layout} layout, A4.
        </p>
      </div>
    </div>
  );
}
