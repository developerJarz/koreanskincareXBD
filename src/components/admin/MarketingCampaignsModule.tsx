"use client";

import React, { useState } from "react";
import { Copy, Plus, Tag, Trash2 } from "lucide-react";
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
  Switch,
} from "./catalog/ui";
import {
  EmptyState,
  ErrorNotice,
  fmtDate,
  fmtNumber,
  fmtRelative,
  fmtTaka,
  PageHeader,
  Panel,
  Pill,
  Skeleton,
  StatTile,
  todayInput,
  useAdminData,
} from "./shared";

type Coupon = {
  _id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping" | "first_order" | "buy_x_get_y";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  orders: number;
  discountGiven: number;
  revenue: number;
  lastUsedAt: string | null;
};

function describe(c: Coupon) {
  if (c.type === "free_shipping") return "Free delivery";
  if (c.type === "fixed") return `${fmtTaka(c.value)} off`;
  return `${c.value}% off${c.maxDiscount ? ` (max ${fmtTaka(c.maxDiscount)})` : ""}`;
}

function state(c: Coupon): { label: string; tone: "good" | "neutral" | "warn" | "bad" } {
  const now = Date.now();
  if (!c.isActive) return { label: "Off", tone: "neutral" };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now)
    return { label: "Expired", tone: "bad" };
  if (new Date(c.startsAt).getTime() > now) return { label: "Scheduled", tone: "warn" };
  if (c.usageLimit && c.usageCount >= c.usageLimit) return { label: "Used up", tone: "bad" };
  return { label: "Live", tone: "good" };
}

/** Coupon codes customers can use at checkout, with real usage from orders. */
export function MarketingCampaignsModule() {
  const { data, error, reload, setData } = useAdminData<Coupon[]>("/api/admin/coupons");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const toggle = async (c: Coupon, isActive: boolean) => {
    try {
      await api("/api/admin/coupons", { method: "PATCH", json: { id: c._id, isActive } });
      setData((list) => list?.map((x) => (x._id === c._id ? { ...x, isActive } : x)) ?? null);
      toast.success(`${c.code} ${isActive ? "switched on" : "switched off"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update.");
    }
  };
  const remove = async () => {
    if (!deleting) return;
    try {
      await api(`/api/admin/coupons?id=${deleting._id}`, { method: "DELETE" });
      toast.success(`${deleting.code} deleted.`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete.");
    }
  };

  const live = data?.filter((c) => state(c).label === "Live") ?? [];
  return (
    <div className="space-y-5">
      <PageHeader
        title="Promotions"
        description="Coupon codes customers enter in the cart. Discounts are checked again when the order is placed."
        actions={
          <button type="button" className={primaryButton} onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New coupon
          </button>
        }
      />
      {error && !data && <ErrorNotice message={error} onRetry={reload} />}
      {!data && !error && <Skeleton className="h-80" />}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Live coupons"
              value={fmtNumber(live.length)}
              hint={`${data.length} in total`}
            />
            <StatTile
              label="Orders with a coupon"
              value={fmtNumber(data.reduce((s, c) => s + c.orders, 0))}
            />
            <StatTile
              label="Discount given"
              value={fmtTaka(data.reduce((s, c) => s + c.discountGiven, 0))}
            />
            <StatTile
              label="Revenue from coupon orders"
              value={fmtTaka(data.reduce((s, c) => s + c.revenue, 0))}
            />
          </div>
          <Panel>
            {data.length === 0 ? (
              <EmptyState icon={Tag} title="No coupons yet">
                Create a code like EID15 for 15% off, or FREESHIP for free delivery.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3 font-medium">Code</th>
                      <th className="px-3 py-2 font-medium">Discount</th>
                      <th className="px-3 py-2 font-medium">Rules</th>
                      <th className="px-3 py-2 font-medium">Valid</th>
                      <th className="px-3 py-2 text-right font-medium">Orders</th>
                      <th className="px-3 py-2 text-right font-medium">Discount given</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="py-2 pl-3 text-right font-medium">On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.map((c) => {
                      const st = state(c);
                      return (
                        <tr key={c._id}>
                          <td className="py-2.5 pr-3">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-mono font-semibold hover:text-primary"
                              onClick={() => {
                                navigator.clipboard.writeText(c.code);
                                toast.success(`${c.code} copied.`);
                              }}
                            >
                              {c.code}{" "}
                              <Copy className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            </button>
                          </td>
                          <td className="px-3 py-2.5">{describe(c)}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {c.minOrderAmount ? `Min ${fmtTaka(c.minOrderAmount)}` : "Any order"}
                            <span className="block">
                              {c.usageLimit
                                ? `${c.usageCount} of ${c.usageLimit} uses`
                                : `${c.usageCount} uses`}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                            {fmtDate(c.startsAt)} → {c.expiresAt ? fmtDate(c.expiresAt) : "no end"}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {fmtNumber(c.orders)}
                            {c.lastUsedAt && (
                              <span className="block text-[11px] text-muted-foreground">
                                last {fmtRelative(c.lastUsedAt)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {fmtTaka(c.discountGiven)}
                          </td>
                          <td className="px-3 py-2.5">
                            <Pill tone={st.tone}>{st.label}</Pill>
                          </td>
                          <td className="whitespace-nowrap py-2.5 pl-3 text-right">
                            <span className="inline-flex items-center gap-1">
                              <Switch
                                label={`Coupon ${c.code}`}
                                checked={c.isActive}
                                onChange={(v) => toggle(c, v)}
                              />
                              <button
                                type="button"
                                className={`${iconButton} text-destructive`}
                                aria-label={`Delete ${c.code}`}
                                onClick={() => setDeleting(c)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
      {creating && <CouponEditor onClose={() => setCreating(false)} onSaved={reload} />}
      {deleting && (
        <Modal
          title="Delete coupon"
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
            Delete {deleting.code}? Customers won't be able to use it. Past orders keep their
            discount. Switching it off instead keeps its history here.
          </p>
        </Modal>
      )}
    </div>
  );
}

function CouponEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "10",
    minOrderAmount: "",
    maxDiscount: "",
    usageLimit: "",
    startsAt: todayInput(),
    expiresAt: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api("/api/admin/coupons", { method: "POST", json: form });
      toast.success(`${form.code.toUpperCase()} created — customers can use it now.`);
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Couldn't create the coupon.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="New coupon"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="coupon-form" className={primaryButton} disabled={saving}>
            {saving ? "Creating…" : "Create coupon"}
          </button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={save} className="space-y-3">
        <Field
          label="Code"
          htmlFor="cp-code"
          error={errors.code}
          hint="Letters and numbers, e.g. EID15"
        >
          <input
            id="cp-code"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            className={`${inputClass} font-mono uppercase`}
            autoFocus
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type" htmlFor="cp-type">
            <select
              id="cp-type"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={inputClass}
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
              <option value="free_shipping">Free delivery</option>
            </select>
          </Field>
          {form.type !== "free_shipping" && (
            <Field
              label={form.type === "fixed" ? "Amount off (৳)" : "Percent off"}
              htmlFor="cp-value"
              error={errors.value}
            >
              <input
                id="cp-value"
                type="number"
                min={0}
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Minimum order (৳)" htmlFor="cp-min" hint="Leave empty for any order">
            <input
              id="cp-min"
              type="number"
              min={0}
              value={form.minOrderAmount}
              onChange={(e) => set("minOrderAmount", e.target.value)}
              className={inputClass}
            />
          </Field>
          {form.type === "percentage" && (
            <Field label="Maximum discount (৳)" htmlFor="cp-max" hint="Optional cap">
              <input
                id="cp-max"
                type="number"
                min={0}
                value={form.maxDiscount}
                onChange={(e) => set("maxDiscount", e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Total uses allowed" htmlFor="cp-limit" hint="Leave empty for unlimited">
            <input
              id="cp-limit"
              type="number"
              min={0}
              value={form.usageLimit}
              onChange={(e) => set("usageLimit", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Starts" htmlFor="cp-start">
            <input
              id="cp-start"
              type="date"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Ends (last day)" htmlFor="cp-end" error={errors.expiresAt} hint="Optional">
            <input
              id="cp-end"
              type="date"
              min={form.startsAt}
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
