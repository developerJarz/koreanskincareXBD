"use client";

import React, { useState } from "react";
import { AlertTriangle, Download, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import {
  api,
  ApiError,
  Field,
  iconButton,
  inputClass,
  Modal,
  primaryButton,
  secondaryButton,
  textareaClass,
} from "./catalog/ui";
import { TimeSeriesChart } from "./charts";
import {
  BarList,
  downloadCsv,
  EmptyState,
  ErrorNotice,
  fmtDate,
  fmtPercent,
  fmtTaka,
  PageHeader,
  Panel,
  qs,
  rangeQuery,
  RangePicker,
  Skeleton,
  StatTile,
  todayInput,
  useAccess,
  useAdminData,
  type RangeValue,
} from "./shared";

const CATEGORIES: Record<string, string> = {
  marketing: "Marketing & ads",
  packaging: "Packaging",
  salaries: "Salaries",
  delivery: "Delivery & courier",
  rent_utilities: "Rent & utilities",
  software: "Software & hosting",
  stock_purchase: "Stock purchase",
  other: "Other",
};
const METHODS = ["Cash", "bKash", "Nagad", "Bank transfer", "Card"];

type Expense = {
  _id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidVia: string;
  notes?: string;
};

type FinanceData = {
  range: { key: string; bucket: string };
  pnl: {
    revenue: number;
    productSales: number;
    shippingCollected: number;
    discounts: number;
    refundsAndReturns: number;
    cogs: number;
    costCoveragePercent: number;
    uncostedProducts: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    netMarginPercent: number | null;
    collected: number;
  };
  revenueSeries: { label: string; revenue: number; orders: number }[];
  expensesByCategory: { category: string; amount: number; count: number }[];
  byPayment: { name: string; revenue: number; paid: number; orders: number }[];
  expenses: Expense[];
};

export function FinancialReportsModule() {
  const { can } = useAccess();
  const [range, setRange] = useState<RangeValue>({ key: "30d" });
  const { data, error, loading, reload } = useAdminData<FinanceData>(
    `/api/admin/finance${qs(rangeQuery(range))}`,
  );
  const [editing, setEditing] = useState<Expense | "new" | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const p = data?.pnl;
  const exportCsv = () => {
    if (!data || !p) return;
    downloadCsv(`profit-and-loss-${range.key}.csv`, [
      ["Profit & loss", range.key],
      ["Product sales", Math.round(p.productSales)],
      ["Delivery charges collected", Math.round(p.shippingCollected)],
      ["Coupon discounts", -Math.round(p.discounts)],
      ["Revenue", Math.round(p.revenue)],
      ["Cost of goods sold", -Math.round(p.cogs)],
      ["Gross profit", Math.round(p.grossProfit)],
      ["Expenses", -Math.round(p.expenses)],
      ["Net profit", Math.round(p.netProfit)],
      [],
      ["Date", "Expense", "Category", "Paid via", "Amount", "Notes"],
      ...data.expenses.map((e) => [
        fmtDate(e.date),
        e.title,
        CATEGORIES[e.category] ?? e.category,
        e.paidVia,
        e.amount,
        e.notes ?? "",
      ]),
    ]);
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api(`/api/admin/expenses/${deleting._id}`, { method: "DELETE" });
      toast.success("Expense deleted.");
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete.");
    }
  };

  return (
    <div className={`space-y-5 ${loading && data ? "opacity-70" : ""}`}>
      <PageHeader
        title="Finance"
        description="Profit & loss from real orders, product cost prices and the expenses you record here."
        actions={
          <>
            <RangePicker value={range} onChange={setRange} />
            <button type="button" className={secondaryButton} onClick={exportCsv} disabled={!data}>
              <Download className="h-4 w-4" /> Export
            </button>
          </>
        }
      />
      {error && !data && <ErrorNotice message={error} onRetry={reload} />}
      {!data && !error && <Skeleton className="h-96" />}
      {data && p && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Revenue"
              value={fmtTaka(p.revenue)}
              hint={`${fmtTaka(p.collected)} marked as paid`}
            />
            <StatTile
              label="Gross profit"
              value={fmtTaka(p.grossProfit)}
              hint={`after ${fmtTaka(p.cogs)} cost of goods`}
            />
            <StatTile
              label="Expenses"
              value={fmtTaka(p.expenses)}
              hint={`${data.expenses.length} recorded`}
            />
            <StatTile
              label="Net profit"
              value={fmtTaka(p.netProfit)}
              hint={
                p.netMarginPercent == null
                  ? undefined
                  : `${fmtPercent(p.netMarginPercent)} of revenue`
              }
            />
          </div>

          {p.costCoveragePercent < 99.5 && p.revenue > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Only {fmtPercent(p.costCoveragePercent, 0)} of sales have a product cost price, so
                profit is overstated. Add a cost price to {p.uncostedProducts} product
                {p.uncostedProducts === 1 ? "" : "s"} (Products → edit → Pricing) for exact figures.
              </span>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <Panel title="Profit & loss statement">
              <dl className="space-y-1.5 text-xs">
                {(
                  [
                    ["Product sales", p.productSales, false],
                    ["Delivery charges collected", p.shippingCollected, false],
                    ["Coupon discounts", -p.discounts, false],
                    ["Revenue", p.revenue, true],
                    ["Cost of goods sold", -p.cogs, false],
                    ["Gross profit", p.grossProfit, true],
                    ...data.expensesByCategory.map(
                      (c) => [CATEGORIES[c.category] ?? c.category, -c.amount, false] as const,
                    ),
                    ["Net profit", p.netProfit, true],
                  ] as const
                ).map(([label, value, strong], i) => (
                  <div
                    key={`${label}-${i}`}
                    className={`flex justify-between gap-3 ${strong ? "border-t border-border pt-1.5 font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    <dt>{label}</dt>
                    <dd className={`tabular-nums ${value < 0 ? "" : ""}`}>
                      {value < 0 ? `−${fmtTaka(-value)}` : fmtTaka(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              {p.refundsAndReturns > 0 && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Not counted: {fmtTaka(p.refundsAndReturns)} of returned or refunded orders.
                </p>
              )}
            </Panel>
            <Panel title="Revenue over time">
              <TimeSeriesChart
                ariaLabel="Revenue over time"
                data={data.revenueSeries}
                kind={data.revenueSeries.length <= 31 ? "bar" : "area"}
                series={[{ key: "revenue", label: "Revenue" }]}
                format={fmtTaka}
              />
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <Panel title="Expenses by category">
              <BarList
                rows={data.expensesByCategory.map((c) => ({
                  name: CATEGORIES[c.category] ?? c.category,
                  value: c.amount,
                }))}
                format={fmtTaka}
                empty="No expenses recorded in this period."
              />
            </Panel>
            <Panel
              title="Expenses"
              action={
                can("finance.manage") ? (
                  <button type="button" className={primaryButton} onClick={() => setEditing("new")}>
                    <Plus className="h-4 w-4" /> Add expense
                  </button>
                ) : undefined
              }
            >
              {data.expenses.length === 0 ? (
                <EmptyState icon={Wallet} title="No expenses in this period">
                  Record ad spend, packaging, salaries and other costs to see your real net profit.
                </EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-left text-xs">
                    <thead className="text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="py-2 pr-3 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Expense</th>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 font-medium">Paid via</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                        <th className="py-2 pl-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.expenses.map((e) => (
                        <tr key={e._id}>
                          <td className="whitespace-nowrap py-2 pr-3">{fmtDate(e.date)}</td>
                          <td className="px-3 py-2">
                            {e.title}
                            {e.notes && (
                              <span className="block text-[11px] text-muted-foreground">
                                {e.notes}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">{CATEGORIES[e.category] ?? e.category}</td>
                          <td className="px-3 py-2">{e.paidVia}</td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums">
                            {fmtTaka(e.amount)}
                          </td>
                          <td className="whitespace-nowrap py-2 pl-3 text-right">
                            {can("finance.manage") && (
                              <>
                                <button
                                  type="button"
                                  className={iconButton}
                                  aria-label={`Edit ${e.title}`}
                                  onClick={() => setEditing(e)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className={`${iconButton} text-destructive`}
                                  aria-label={`Delete ${e.title}`}
                                  onClick={() => setDeleting(e)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      {editing && (
        <ExpenseEditor
          expense={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
      {deleting && (
        <Modal
          title="Delete expense"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button type="button" className={primaryButton} onClick={remove}>
                Delete
              </button>
            </>
          }
        >
          <p className="text-sm">
            Delete “{deleting.title}” ({fmtTaka(deleting.amount)})?
          </p>
        </Modal>
      )}
    </div>
  );
}

function ExpenseEditor({
  expense,
  onClose,
  onSaved,
}: {
  expense: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: expense?.title ?? "",
    amount: expense ? String(expense.amount) : "",
    category: expense?.category ?? "marketing",
    date: expense
      ? new Date(new Date(expense.date).getTime() + 6 * 3_600_000).toISOString().slice(0, 10)
      : todayInput(),
    paidVia: expense?.paidVia ?? "Cash",
    notes: expense?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api(expense ? `/api/admin/expenses/${expense._id}` : "/api/admin/expenses", {
        method: expense ? "PUT" : "POST",
        json: form,
      });
      toast.success(expense ? "Expense saved." : "Expense added.");
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={expense ? "Edit expense" : "Add expense"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="expense-form" className={primaryButton} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="expense-form" onSubmit={save} className="space-y-3">
        <Field label="What was it for?" htmlFor="e-title" error={errors.title}>
          <input
            id="e-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
            autoFocus
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount (৳)" htmlFor="e-amount" error={errors.amount}>
            <input
              id="e-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Date" htmlFor="e-date" error={errors.date}>
            <input
              id="e-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field
            label="Category"
            htmlFor="e-cat"
            error={errors.category}
            hint={
              form.category === "stock_purchase"
                ? "Products with a cost price are already counted as cost of goods when they sell — recording stock here too counts it twice."
                : undefined
            }
          >
            <select
              id="e-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Paid via" htmlFor="e-via">
            <select
              id="e-via"
              value={form.paidVia}
              onChange={(e) => setForm({ ...form, paidVia: e.target.value })}
              className={inputClass}
            >
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notes" htmlFor="e-notes">
          <textarea
            id="e-notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={textareaClass}
          />
        </Field>
      </form>
    </Modal>
  );
}
