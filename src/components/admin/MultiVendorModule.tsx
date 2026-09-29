"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

// ─── Types (shapes returned by /api/admin/vendors and /api/admin/vendors/products) ───

type VendorStatus = "pending" | "approved" | "suspended";

type VendorRow = {
  _id: string;
  storeName: string;
  contactName: string;
  email: string;
  phone?: string;
  district?: string;
  pickupAddress?: string;
  description?: string;
  status: VendorStatus;
  suspendedReason?: string;
  commissionRate: number;
  adminNotes?: string;
  createdAt: string;
  limits: {
    maxProducts: number;
    maxDiscountPercent: number;
    requireProductApproval: boolean;
    allowedCategories: string[];
  };
  products: { total: number; live: number; pending: number };
  sales?: { orders: number; gross: number; commission: number; earnings: number };
};

type ReviewProduct = {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  status: string;
  approvalStatus: "pending" | "approved" | "rejected";
  reviewNote?: string;
  vendorActive?: boolean;
  vendor?: { _id: string; storeName: string };
  category?: { name: string };
  updatedAt: string;
};

type Category = { _id: string; name: string };

const taka = (n: number) => `৳${new Intl.NumberFormat("en-US").format(Math.round(n || 0))}`;
const date = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(new Date(iso));
const discountOf = (p: { price: number; compareAtPrice?: number }) =>
  p.compareAtPrice && p.compareAtPrice > p.price
    ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
    : 0;

const STATUS_STYLE: Record<VendorStatus, { label: string; className: string }> = {
  approved: {
    label: "Approved",
    className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  },
  pending: {
    label: "Waiting approval",
    className: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  suspended: { label: "Suspended", className: "bg-destructive/10 text-destructive" },
};

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}

export function MultiVendorModule({
  categories,
  canManage,
}: {
  categories: Category[];
  /** Admins manage vendor accounts; staff can view and review products */
  canManage: boolean;
}) {
  const [vendors, setVendors] = useState<VendorRow[] | null>(null);
  const [queue, setQueue] = useState<ReviewProduct[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VendorStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, pending] = await Promise.all([
        api<{ items: VendorRow[] }>("/api/admin/vendors"),
        api<ReviewProduct[]>("/api/admin/vendors/products?status=pending"),
      ]);
      setVendors(list.items);
      setQueue(pending);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load vendors.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const list = vendors ?? [];
    return {
      total: list.length,
      approved: list.filter((v) => v.status === "approved").length,
      pending: list.filter((v) => v.status === "pending").length,
      suspended: list.filter((v) => v.status === "suspended").length,
      gross: list.reduce((sum, v) => sum + (v.sales?.gross ?? 0), 0),
      commission: list.reduce((sum, v) => sum + (v.sales?.commission ?? 0), 0),
    };
  }, [vendors]);

  const shown = (vendors ?? []).filter((v) => {
    const q = query.trim().toLowerCase();
    const matches =
      !q ||
      v.storeName.toLowerCase().includes(q) ||
      v.contactName.toLowerCase().includes(q) ||
      v.email.includes(q);
    return matches && (statusFilter === "all" || v.status === statusFilter);
  });

  const selected = vendors?.find((v) => v._id === selectedId) ?? null;

  const review = async (product: ReviewProduct, decision: "approve" | "reject", note?: string) => {
    try {
      await api("/api/admin/vendors/products", {
        method: "PATCH",
        body: JSON.stringify({ productId: product._id, decision, note }),
      });
      setQueue((q) => q.filter((p) => p._id !== product._id));
      toast.success(
        decision === "approve"
          ? `"${product.name}" is now live`
          : "Sent back to the vendor with your note",
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the review.");
    }
  };

  if (loadError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-semibold text-destructive">{loadError}</p>
        <button
          onClick={load}
          className="mt-3 h-9 px-3.5 rounded-lg border border-border text-xs font-semibold bg-card"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!vendors) {
    return (
      <div
        className="h-72 rounded-2xl border border-border bg-card animate-pulse"
        aria-label="Loading vendors"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl">Marketplace vendors</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sellers who list products in your shop, the rules they sell under, and what
              they&apos;ve earned.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" /> Add vendor
            </button>
          )}
        </div>
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-4 gap-y-4">
          {[
            ["Vendors", String(summary.total)],
            ["Approved", String(summary.approved)],
            ["Waiting approval", String(summary.pending)],
            ["Suspended", String(summary.suspended)],
            ["Vendor sales", taka(summary.gross)],
            ["Commission earned", taka(summary.commission)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Review queue */}
      {queue.length > 0 && (
        <section
          className="rounded-2xl border border-border bg-card"
          aria-labelledby="review-heading"
        >
          <div className="p-5 sm:p-6 pb-3">
            <h2 id="review-heading" className="text-sm font-semibold font-sans tracking-normal">
              Products waiting for review ({queue.length})
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Nothing here is visible to customers until you approve it. Check the price, the
              discount and the photos.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {queue.map((p) => (
              <ReviewRow key={p._id} product={p} onDecide={review} />
            ))}
          </ul>
        </section>
      )}

      {/* Vendor list */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-52">
            <span className="sr-only">Search vendors</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by store, contact or email"
              className={`${inputClass} pl-9`}
            />
          </label>
          <label className="sr-only" htmlFor="vendor-status-filter">
            Filter by status
          </label>
          <select
            id="vendor-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Waiting approval</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {vendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <h3 className="font-serif text-2xl">No vendors yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Add a vendor to give a seller their own dashboard. You decide how many products they
              can list, their commission, and whether you review their products first.
            </p>
            {canManage && (
              <button
                onClick={() => setCreating(true)}
                className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> Add vendor
              </button>
            )}
          </div>
        ) : (
          <div className="relative rounded-2xl border border-border bg-card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-medium p-3 pl-4">Store</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-right font-medium p-3">Products</th>
                  <th className="text-right font-medium p-3">Sales</th>
                  <th className="text-right font-medium p-3">Commission</th>
                  <th className="text-left font-medium p-3 pr-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((v) => (
                  <tr
                    key={v._id}
                    className="hover:bg-secondary/50 cursor-pointer"
                    onClick={() => setSelectedId(v._id)}
                  >
                    <td className="p-3 pl-4">
                      <button
                        className="text-left font-medium hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(v._id);
                        }}
                      >
                        {v.storeName}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {v.contactName}, {v.email}
                      </p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLE[v.status].className}`}
                      >
                        {STATUS_STYLE[v.status].label}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap">
                      {v.products.live} live
                      <span className="block text-xs text-muted-foreground">
                        {v.products.total} of {v.limits.maxProducts}
                        {v.products.pending ? `, ${v.products.pending} in review` : ""}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap">
                      {taka(v.sales?.gross ?? 0)}
                      <span className="block text-xs text-muted-foreground">
                        {v.sales?.orders ?? 0} {v.sales?.orders === 1 ? "order" : "orders"}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums">{v.commissionRate}%</td>
                    <td className="p-3 pr-4 whitespace-nowrap text-muted-foreground">
                      {date(v.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No vendors match your search.
              </p>
            )}
          </div>
        )}
      </section>

      {selected && (
        <VendorPanel
          vendor={selected}
          categories={categories}
          canManage={canManage}
          onClose={() => setSelectedId(null)}
          onChanged={load}
          onReview={review}
        />
      )}

      {creating && (
        <CreateVendorDialog
          categories={categories}
          onClose={() => setCreating(false)}
          onCreated={() => {
            load();
          }}
        />
      )}
    </div>
  );
}

// ─── Review queue row ───

function ReviewRow({
  product,
  onDecide,
}: {
  product: ReviewProduct;
  onDecide: (p: ReviewProduct, decision: "approve" | "reject", note?: string) => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const discount = discountOf(product);

  const decide = async (decision: "approve" | "reject") => {
    setBusy(true);
    await onDecide(product, decision, note);
    setBusy(false);
  };

  return (
    <li className="p-4 sm:px-6 flex flex-wrap gap-4 items-start">
      <img
        src={product.images?.[0]}
        alt=""
        width={64}
        height={64}
        className="w-16 h-16 rounded-lg object-cover bg-secondary shrink-0"
      />
      <div className="flex-1 min-w-52">
        <p className="font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.vendor?.storeName ?? "Vendor"}, {product.category?.name ?? "No category"},
          updated {date(product.updatedAt)}
        </p>
        <p className="mt-1 text-sm tabular-nums">
          {taka(product.price)}
          {product.compareAtPrice ? (
            <span className="ml-2 text-xs text-muted-foreground">
              was <span className="line-through">{taka(product.compareAtPrice)}</span> ({discount}%
              off)
            </span>
          ) : null}
          <span className="ml-2 text-xs text-muted-foreground">{product.stock} in stock</span>
        </p>
        {rejecting && (
          <label className="mt-3 block space-y-1">
            <span className="text-xs font-medium">What should the vendor change?</span>
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Photo is blurry, please upload a clearer one"
              className={inputClass}
            />
          </label>
        )}
      </div>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        {rejecting ? (
          <>
            <button
              onClick={() => setRejecting(false)}
              className="h-9 px-3 rounded-lg border border-border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => decide("reject")}
              disabled={busy || note.trim().length < 5}
              className="h-9 px-3.5 rounded-lg bg-destructive text-white text-xs font-semibold disabled:opacity-50"
            >
              Send back
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setRejecting(true)}
              className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary"
            >
              Reject
            </button>
            <button
              onClick={() => decide("approve")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
          </>
        )}
      </div>
    </li>
  );
}

// ─── Vendor detail panel: status, limits, notes and products ───

function VendorPanel({
  vendor,
  categories,
  canManage,
  onClose,
  onChanged,
  onReview,
}: {
  vendor: VendorRow;
  categories: Category[];
  canManage: boolean;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
  onReview: (p: ReviewProduct, decision: "approve" | "reject", note?: string) => Promise<void>;
}) {
  const [limits, setLimits] = useState({
    maxProducts: String(vendor.limits.maxProducts),
    maxDiscountPercent: String(vendor.limits.maxDiscountPercent),
    requireProductApproval: vendor.limits.requireProductApproval,
    allowedCategories: vendor.limits.allowedCategories.map(String),
    commissionRate: String(vendor.commissionRate),
    adminNotes: vendor.adminNotes ?? "",
  });
  const [suspendReason, setSuspendReason] = useState("");
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ReviewProduct[] | null>(null);

  const loadProducts = useCallback(() => {
    api<ReviewProduct[]>(`/api/admin/vendors/products?status=all&vendor=${vendor._id}`)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [vendor._id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = async (body: Record<string, unknown>, success: string) => {
    setSaving(true);
    try {
      await api("/api/admin/vendors", {
        method: "PATCH",
        body: JSON.stringify({ id: vendor._id, ...body }),
      });
      toast.success(success);
      await onChanged();
      loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const saveRules = () =>
    patch(
      {
        commissionRate: limits.commissionRate,
        adminNotes: limits.adminNotes,
        limits: {
          maxProducts: Number(limits.maxProducts),
          maxDiscountPercent: Number(limits.maxDiscountPercent),
          requireProductApproval: limits.requireProductApproval,
          allowedCategories: limits.allowedCategories,
        },
      },
      "Selling rules saved",
    );

  const toggleCategory = (id: string) =>
    setLimits((l) => ({
      ...l,
      allowedCategories: l.allowedCategories.includes(id)
        ? l.allowedCategories.filter((c) => c !== id)
        : [...l.allowedCategories, id],
    }));

  const sales = vendor.sales ?? { orders: 0, gross: 0, commission: 0, earnings: 0 };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-panel-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl h-full overflow-y-auto bg-card border-l border-border"
      >
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="vendor-panel-title" className="font-serif text-2xl truncate">
              {vendor.storeName}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {vendor.contactName}, {vendor.email}
              {vendor.phone ? `, ${vendor.phone}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Status */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[vendor.status].className}`}
              >
                {STATUS_STYLE[vendor.status].label}
              </span>
              {vendor.status === "suspended" && vendor.suspendedReason && (
                <span className="text-xs text-muted-foreground">
                  Reason: {vendor.suspendedReason}
                </span>
              )}
            </div>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                {vendor.status !== "approved" && (
                  <button
                    disabled={saving}
                    onClick={() => patch({ status: "approved" }, `${vendor.storeName} is approved`)}
                    className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                  >
                    {vendor.status === "suspended" ? "Reactivate store" : "Approve store"}
                  </button>
                )}
                {vendor.status !== "suspended" && !confirmSuspend && (
                  <button
                    onClick={() => setConfirmSuspend(true)}
                    className="h-9 px-3.5 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10"
                  >
                    Suspend store
                  </button>
                )}
              </div>
            )}
            {confirmSuspend && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <p className="text-sm">
                  Suspending hides all of this vendor&apos;s products from the shop straight away
                  and stops them from editing. You can reactivate the store at any time.
                </p>
                <input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Reason the vendor will see (optional)"
                  className={inputClass}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setConfirmSuspend(false)}
                    className="h-9 px-3 rounded-lg border border-border text-xs font-semibold bg-card"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    onClick={async () => {
                      await patch(
                        { status: "suspended", suspendedReason: suspendReason },
                        `${vendor.storeName} is suspended`,
                      );
                      setConfirmSuspend(false);
                    }}
                    className="h-9 px-3.5 rounded-lg bg-destructive text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Suspend store
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Sales */}
          <section>
            <h3 className="text-sm font-semibold font-sans tracking-normal">Sales</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <dt className="text-xs text-muted-foreground">Orders</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{sales.orders}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sales</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{taka(sales.gross)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Your commission</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{taka(sales.commission)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Owed to vendor</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{taka(sales.earnings)}</dd>
              </div>
            </dl>
          </section>

          {/* Selling rules */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold font-sans tracking-normal">Selling rules</h3>
              <p className="text-xs text-muted-foreground">
                Checked by the server every time this vendor saves a product.
              </p>
            </div>
            <fieldset disabled={!canManage} className="space-y-4 disabled:opacity-70">
              <div className="grid grid-cols-3 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">Product limit</span>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={limits.maxProducts}
                    onChange={(e) => setLimits({ ...limits, maxProducts: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium">Max discount %</span>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={limits.maxDiscountPercent}
                    onChange={(e) => setLimits({ ...limits, maxDiscountPercent: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium">Commission %</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={limits.commissionRate}
                    onChange={(e) => setLimits({ ...limits, commissionRate: e.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={limits.requireProductApproval}
                  onChange={(e) =>
                    setLimits({ ...limits, requireProductApproval: e.target.checked })
                  }
                />
                <span>
                  Review new and edited products before they go live
                  <span className="block text-xs text-muted-foreground">
                    Recommended. Stock and visibility changes never need review.
                  </span>
                </span>
              </label>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium">
                  Categories they can sell in{" "}
                  <span className="font-normal text-muted-foreground">
                    (none selected = all categories)
                  </span>
                </legend>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {categories.map((c) => (
                    <label key={c._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={limits.allowedCategories.includes(c._id)}
                        onChange={() => toggleCategory(c._id)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block space-y-1">
                <span className="text-xs font-medium">Internal notes</span>
                <textarea
                  rows={3}
                  value={limits.adminNotes}
                  onChange={(e) => setLimits({ ...limits, adminNotes: e.target.value })}
                  placeholder="Only your team sees this"
                  className={`${inputClass} h-auto py-2`}
                />
              </label>
            </fieldset>
            {canManage && (
              <div className="flex justify-end">
                <button
                  disabled={saving}
                  onClick={saveRules}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save rules"}
                </button>
              </div>
            )}
          </section>

          {/* Products */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold font-sans tracking-normal">
              Products ({vendor.products.total} of {vendor.limits.maxProducts})
            </h3>
            {!products ? (
              <div className="h-24 rounded-xl bg-secondary animate-pulse" />
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This vendor hasn&apos;t added any products yet.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {products.map((p) => (
                  <li key={p._id} className="p-3 flex items-center gap-3">
                    <img
                      src={p.images?.[0]}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-md object-cover bg-secondary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {taka(p.price)}, {p.stock} in stock
                        {p.approvalStatus === "rejected" && p.reviewNote
                          ? `. Note: ${p.reviewNote}`
                          : ""}
                      </p>
                    </div>
                    {p.approvalStatus === "pending" ? (
                      <button
                        onClick={async () => {
                          await onReview(p, "approve");
                          loadProducts();
                        }}
                        className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                      >
                        Approve
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {p.approvalStatus === "rejected"
                          ? "Sent back"
                          : p.vendorActive === false
                            ? "Hidden (suspended)"
                            : p.status === "draft"
                              ? "Hidden by vendor"
                              : "Live"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

// ─── Create vendor ───

function CreateVendorDialog({
  categories,
  onClose,
  onCreated,
}: {
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    storeName: "",
    contactName: "",
    email: "",
    phone: "",
    district: "",
    commissionRate: "10",
    maxProducts: "50",
    maxDiscountPercent: "40",
    requireProductApproval: true,
    status: "approved" as VendorStatus,
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    email: string;
    password?: string;
    linked: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({
        ...f,
        [key]:
          e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
      }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await api<{ temporaryPassword?: string; linkedExistingAccount: boolean }>(
        "/api/admin/vendors",
        {
          method: "POST",
          body: JSON.stringify({
            storeName: form.storeName,
            contactName: form.contactName,
            email: form.email,
            phone: form.phone,
            district: form.district,
            commissionRate: form.commissionRate,
            status: form.status,
            password: form.password || undefined,
            limits: {
              maxProducts: Number(form.maxProducts),
              maxDiscountPercent: Number(form.maxDiscountPercent),
              requireProductApproval: form.requireProductApproval,
              allowedCategories: [],
            },
          }),
        },
      );
      setCreated({
        email: form.email,
        password: data.temporaryPassword,
        linked: data.linkedExistingAccount,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the vendor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-vendor-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="create-vendor-title" className="font-serif text-2xl">
            {created ? "Vendor added" : "Add vendor"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {created ? (
          <div className="mt-4 space-y-4 text-sm">
            {created.password ? (
              <>
                <p>Send these sign-in details to the vendor. The password is shown only once.</p>
                <div className="rounded-xl bg-secondary p-4 space-y-1 font-mono text-sm break-all">
                  <p>{created.email}</p>
                  <p>{created.password}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Email: ${created.email}\nPassword: ${created.password}\nSign in: ${window.location.origin}/auth/login`,
                    );
                    setCopied(true);
                  }}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border text-xs font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy sign-in details"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Ask them to change it from their account page after signing in.
                </p>
              </>
            ) : created.linked ? (
              <p>
                {created.email} already had a customer account, so it was turned into a vendor
                account. They sign in with their existing password.
              </p>
            ) : (
              <p>The vendor can sign in with the password you set.</p>
            )}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-medium">Store name</span>
                <input
                  required
                  value={form.storeName}
                  onChange={set("storeName")}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium">Contact person</span>
                <input
                  required
                  value={form.contactName}
                  onChange={set("contactName")}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium">Email (used to sign in)</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium">Phone</span>
                <input
                  value={form.phone}
                  onChange={set("phone")}
                  inputMode="tel"
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium">District</span>
                <input value={form.district} onChange={set("district")} className={inputClass} />
              </label>
            </div>

            <fieldset className="space-y-3 rounded-xl border border-border p-4">
              <legend className="px-1 text-xs font-medium">Selling rules</legend>
              <div className="grid grid-cols-3 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">Product limit</span>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={form.maxProducts}
                    onChange={set("maxProducts")}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium">Max discount %</span>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={form.maxDiscountPercent}
                    onChange={set("maxDiscountPercent")}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium">Commission %</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.commissionRate}
                    onChange={set("commissionRate")}
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.requireProductApproval}
                  onChange={set("requireProductApproval")}
                />
                Review their products before they go live
              </label>
              {categories.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  You can limit which categories they sell in after adding them.
                </p>
              )}
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium">Status</span>
                <select value={form.status} onChange={set("status")} className={inputClass}>
                  <option value="approved">Approved, can start selling</option>
                  <option value="pending">Waiting approval</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium">Password</span>
                <input
                  type="text"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Leave empty to generate one"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Adding…" : "Add vendor"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
