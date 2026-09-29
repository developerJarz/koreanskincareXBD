"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/store/auth.store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { optimizedImageUrl } from "@/lib/image";
import { ImageUploader, type MediaItem } from "@/components/admin/catalog/ImageUploader";

// ─── Types (shapes produced by app/vendor/page.tsx) ───

type VendorInfo = {
  _id: string;
  storeName: string;
  contactName: string;
  email: string;
  phone?: string;
  district?: string;
  pickupAddress?: string;
  description?: string;
  status: "pending" | "approved" | "suspended";
  suspendedReason?: string;
  commissionRate: number;
  limits: {
    maxProducts: number;
    maxDiscountPercent: number;
    requireProductApproval: boolean;
    allowedCategories: string[];
  };
};

type VendorProduct = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  category: string;
  status: "active" | "draft" | "archived";
  approvalStatus?: "approved" | "pending" | "rejected";
  reviewNote?: string;
  vendorActive?: boolean;
  totalSold?: number;
  updatedAt?: string;
};

type VendorOrder = {
  _id: string;
  orderNumber?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  customer: string;
  area: string;
  items: Array<{ productName: string; quantity: number; price: number; total: number }>;
  vendorTotal: number;
};

type Sales = { orders: number; gross: number; commission: number; earnings: number };

type Tab = "overview" | "products" | "orders" | "profile";

const NAV: Array<{ tab: Tab; label: string; icon: React.ElementType; description: string }> = [
  {
    tab: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Your store at a glance",
  },
  { tab: "products", label: "Products", icon: Package, description: "Add and edit what you sell" },
  {
    tab: "orders",
    label: "Orders",
    icon: ShoppingBag,
    description: "Orders that include your products",
  },
  {
    tab: "profile",
    label: "Store profile",
    icon: Store,
    description: "Contact and pickup details",
  },
];

// ─── Formatting (fixed locale + time zone so server and browser render the same text) ───

const taka = (n: number) => `৳${new Intl.NumberFormat("en-US").format(Math.round(n))}`;
const number = (n: number) => new Intl.NumberFormat("en-US").format(n);
const date = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(new Date(iso));

function productState(p: VendorProduct): { label: string; className: string } {
  if (p.vendorActive === false)
    return { label: "Hidden: store suspended", className: "bg-secondary text-muted-foreground" };
  if (p.approvalStatus === "rejected")
    return { label: "Needs changes", className: "bg-destructive/10 text-destructive" };
  if (p.approvalStatus === "pending")
    return { label: "In review", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" };
  if (p.status === "draft")
    return { label: "Hidden", className: "bg-secondary text-muted-foreground" };
  return { label: "Live", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" };
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

export default function VendorDashboardClient({
  vendor: initialVendor,
  initialProducts,
  orders,
  categories,
  restrictedCategories,
  categoryLabels,
  sales,
}: {
  vendor: VendorInfo;
  initialProducts: VendorProduct[];
  orders: VendorOrder[];
  categories: Array<{ id: string; name: string }>;
  restrictedCategories: boolean;
  /** Names for every category id, including ones the vendor may no longer choose */
  categoryLabels: Record<string, string>;
  sales: Sales;
}) {
  useRequireAuth({ roles: ["vendor"] });
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [vendor, setVendor] = useState(initialVendor);
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<VendorProduct | "new" | null>(null);

  const canEdit = vendor.status === "approved";
  const limitReached = products.length >= vendor.limits.maxProducts;
  const current = NAV.find((n) => n.tab === tab)!;
  const categoryName = useMemo(() => new Map(Object.entries(categoryLabels)), [categoryLabels]);

  const counts = useMemo(
    () => ({
      live: products.filter((p) => productState(p).label === "Live").length,
      review: products.filter((p) => p.approvalStatus === "pending").length,
      rejected: products.filter((p) => p.approvalStatus === "rejected").length,
      lowStock: products.filter((p) => p.stock <= 5).length,
    }),
    [products],
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeMenu();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  const signOut = () => {
    logout();
    router.replace("/auth/login");
  };

  const addBlockedReason = !canEdit
    ? vendor.status === "pending"
      ? "Your store is waiting for approval."
      : "Your store is suspended."
    : limitReached
      ? `You've used all ${vendor.limits.maxProducts} product slots.`
      : null;

  const deleteProduct = async (p: VendorProduct) => {
    if (!confirm(`Delete "${p.name}" from your store? Customers will no longer see it.`)) return;
    const res = await fetch(`/api/vendor/products?id=${p._id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "Couldn't delete the product.");
    setProducts((list) => list.filter((x) => x._id !== p._id));
    toast.success("Product deleted");
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <aside
        id="vendor-nav"
        aria-label="Seller dashboard sections"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-sidebar-border">
          <Logo variant="footer" size="sm" />
          <button
            onClick={closeMenu}
            className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] text-sidebar-muted">Seller</p>
          <p className="text-sm font-semibold truncate">{vendor.storeName}</p>
        </div>
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = tab === item.tab;
              const badge = item.tab === "products" && counts.rejected > 0 ? counts.rejected : 0;
              return (
                <li key={item.tab}>
                  <button
                    onClick={() => {
                      setTab(item.tab);
                      closeMenu();
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-sidebar-foreground ${
                      active
                        ? "bg-sidebar-accent font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-rose"
                        : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                    {badge ? (
                      <span
                        className="ml-auto min-w-5 px-1.5 rounded-full bg-rose text-sidebar text-[11px] font-bold leading-5 text-center"
                        aria-label={`${badge} need changes`}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-0.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            View shop
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 bg-card/95 backdrop-blur border-b border-border px-3 sm:px-4 lg:px-8 flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center justify-center w-9 h-9 -ml-1 rounded-lg hover:bg-secondary lg:hidden"
            aria-label="Open menu"
            aria-controls="vendor-nav"
            aria-expanded={menuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-semibold leading-tight truncate font-sans tracking-normal">
              {current.label}
            </h1>
            <p className="hidden sm:block text-xs text-muted-foreground truncate">
              {current.description}
            </p>
          </div>
          {tab === "products" && (
            <button
              onClick={() => setEditing("new")}
              disabled={Boolean(addBlockedReason)}
              title={addBlockedReason ?? undefined}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" /> Add product
            </button>
          )}
        </header>

        <main className="flex-1 w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {vendor.status !== "approved" && (
            <div
              role="status"
              className={`rounded-2xl border p-4 text-sm ${
                vendor.status === "suspended"
                  ? "border-destructive/30 bg-destructive/5 text-destructive"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
              }`}
            >
              {vendor.status === "pending" ? (
                <>
                  <strong>Your store is waiting for approval.</strong> You can look around and
                  update your store profile. Adding products unlocks once the koreanskincare.bd team
                  approves your store.
                </>
              ) : (
                <>
                  <strong>Your store is suspended.</strong> Your products are hidden from the shop
                  and editing is turned off.
                  {vendor.suspendedReason ? ` Reason: ${vendor.suspendedReason}` : ""} Contact the
                  shop team to resolve this.
                </>
              )}
            </div>
          )}

          {tab === "overview" && (
            <Overview
              vendor={vendor}
              counts={counts}
              productCount={products.length}
              sales={sales}
              categoryNames={restrictedCategories ? categories.map((c) => c.name) : null}
              goTo={setTab}
            />
          )}

          {tab === "products" && (
            <ProductsTab
              products={products}
              categoryName={categoryName}
              canEdit={canEdit}
              addBlockedReason={addBlockedReason}
              limit={vendor.limits.maxProducts}
              onAdd={() => setEditing("new")}
              onEdit={(p) => setEditing(p)}
              onDelete={deleteProduct}
            />
          )}

          {tab === "orders" && <OrdersTab orders={orders} />}

          {tab === "profile" && <ProfileTab vendor={vendor} onSaved={setVendor} />}
        </main>
      </div>

      {editing && (
        <ProductDialog
          vendor={vendor}
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setProducts((list) =>
              isNew ? [saved, ...list] : list.map((p) => (p._id === saved._id ? saved : p)),
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Overview ───

function Overview({
  vendor,
  counts,
  productCount,
  sales,
  categoryNames,
  goTo,
}: {
  vendor: VendorInfo;
  counts: { live: number; review: number; rejected: number; lowStock: number };
  productCount: number;
  sales: Sales;
  categoryNames: string[] | null;
  goTo: (tab: Tab) => void;
}) {
  const firstName = vendor.contactName.trim().split(/\s+/)[0];
  const usedPct = vendor.limits.maxProducts
    ? Math.min(100, Math.round((productCount / vendor.limits.maxProducts) * 100))
    : 100;

  const attention = [
    {
      count: counts.rejected,
      text:
        counts.rejected === 1
          ? "product needs changes before it can go live"
          : "products need changes before they can go live",
      tab: "products" as Tab,
      action: "Fix products",
    },
    {
      count: counts.review,
      text:
        counts.review === 1
          ? "product is being reviewed by the shop team"
          : "products are being reviewed by the shop team",
      tab: "products" as Tab,
      action: "View",
    },
    {
      count: counts.lowStock,
      text:
        counts.lowStock === 1
          ? "product has 5 or fewer left in stock"
          : "products have 5 or fewer left in stock",
      tab: "products" as Tab,
      action: "Update stock",
    },
  ].filter((a) => a.count > 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-2xl sm:text-3xl">Hello, {firstName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {attention.length
            ? "A few things need your attention."
            : `${number(counts.live)} of your products are live in the shop.`}
        </p>
        {attention.length > 0 && (
          <ul className="mt-4 divide-y divide-border">
            {attention.map((a) => (
              <li
                key={a.text}
                className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 py-3"
              >
                <span className="w-10 shrink-0 font-serif text-3xl leading-none text-primary tabular-nums">
                  {a.count}
                </span>
                <p className="flex-1 min-w-40 text-sm">{a.text}</p>
                <button
                  onClick={() => goTo(a.tab)}
                  className="ml-14 sm:ml-0 h-9 px-3.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary"
                >
                  {a.action}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold font-sans tracking-normal">Sales</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <dt className="text-xs text-muted-foreground">Orders</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{number(sales.orders)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sales</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{taka(sales.gross)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Shop commission ({vendor.commissionRate}%)
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{taka(sales.commission)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Your earnings</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-primary">
                {taka(sales.earnings)}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-muted-foreground">
            Cancelled and refunded orders are not counted.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold font-sans tracking-normal">Your selling rules</h2>
          <p className="mt-1 text-xs text-muted-foreground">Set by the koreanskincare.bd team.</p>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Products</dt>
                <dd className="font-semibold tabular-nums">
                  {number(productCount)} of {number(vendor.limits.maxProducts)}
                </dd>
              </div>
              <div
                className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden"
                role="progressbar"
                aria-valuenow={usedPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Product slots used"
              >
                <div
                  className={`h-full rounded-full ${usedPct >= 100 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Largest discount allowed</dt>
              <dd className="font-semibold">{vendor.limits.maxDiscountPercent}%</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">New products</dt>
              <dd className="font-semibold text-right">
                {vendor.limits.requireProductApproval
                  ? "Reviewed before going live"
                  : "Go live straight away"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Categories</dt>
              <dd className="font-semibold text-right">
                {categoryNames ? categoryNames.join(", ") || "None" : "All categories"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

// ─── Products ───

function ProductsTab({
  products,
  categoryName,
  canEdit,
  addBlockedReason,
  limit,
  onAdd,
  onEdit,
  onDelete,
}: {
  products: VendorProduct[];
  categoryName: Map<string, string>;
  canEdit: boolean;
  addBlockedReason: string | null;
  limit: number;
  onAdd: () => void;
  onEdit: (p: VendorProduct) => void;
  onDelete: (p: VendorProduct) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h2 className="font-serif text-2xl">Add your first product</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          You can list up to {number(limit)} products. Each one needs a name, price, category and at
          least one image link.
        </p>
        <button
          onClick={onAdd}
          disabled={Boolean(addBlockedReason)}
          className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add product
        </button>
        {addBlockedReason && (
          <p className="mt-3 text-xs text-muted-foreground">{addBlockedReason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-52">
          <span className="sr-only">Search your products</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your products"
            className={`${inputClass} pl-9`}
          />
        </label>
        <p className="text-xs text-muted-foreground tabular-nums">
          {number(products.length)} of {number(limit)} product slots used
        </p>
      </div>
      {addBlockedReason && <p className="text-xs text-muted-foreground">{addBlockedReason}</p>}

      <div className="relative rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left font-medium p-3 pl-4">Product</th>
              <th className="text-right font-medium p-3">Price</th>
              <th className="text-right font-medium p-3">Stock</th>
              <th className="text-left font-medium p-3">Status</th>
              <th className="p-3 pr-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((p) => {
              const state = productState(p);
              return (
                <tr key={p._id} className="align-top">
                  <td className="p-3 pl-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={optimizedImageUrl(p.images?.[0], 96)}
                        alt=""
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-lg object-cover bg-secondary shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-72">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryName.get(String(p.category)) ?? "Category"}
                        </p>
                        {p.approvalStatus === "rejected" && p.reviewNote && (
                          <p className="mt-1 text-xs text-destructive max-w-80">
                            Shop team: {p.reviewNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right tabular-nums whitespace-nowrap">
                    {taka(p.price)}
                    {p.compareAtPrice ? (
                      <span className="block text-xs text-muted-foreground line-through">
                        {taka(p.compareAtPrice)}
                      </span>
                    ) : null}
                  </td>
                  <td
                    className={`p-3 text-right tabular-nums ${p.stock <= 5 ? "text-destructive font-semibold" : ""}`}
                  >
                    {number(p.stock)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${state.className}`}
                    >
                      {state.label}
                    </span>
                  </td>
                  <td className="p-3 pr-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(p)}
                        disabled={!canEdit}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary disabled:opacity-40"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        disabled={!canEdit}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-destructive/10 text-destructive disabled:opacity-40"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No products match “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}

function ProductDialog({
  vendor,
  product,
  categories,
  onClose,
  onSaved,
}: {
  vendor: VendorInfo;
  product: VendorProduct | null;
  categories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: (p: VendorProduct, isNew: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    category: product ? String(product.category) : (categories[0]?.id ?? ""),
    price: product ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : "",
    stock: product ? String(product.stock) : "10",
    images: (product?.images ?? []).map((url) => ({ url, alt: "" })) as MediaItem[],
    description: product?.description ?? "",
    status: product?.status === "draft" ? "draft" : "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const price = Number(form.price);
  const was = Number(form.compareAtPrice);
  const discount =
    was > 0 && price > 0 && was > price ? Math.round(((was - price) / was) * 100) : 0;
  const overDiscount = discount > vendor.limits.maxDiscountPercent;

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.images.length === 0) {
      setError("Add at least one product image.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/products", {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product?._id,
          name: form.name,
          category: form.category,
          price: form.price,
          compareAtPrice: form.compareAtPrice,
          stock: Number(form.stock),
          images: form.images.map((m) => m.url),
          description: form.description,
          status: form.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save the product.");
        return;
      }
      onSaved(data, !product);
      toast.success(
        data.approvalStatus === "pending"
          ? "Saved. The shop team will review it before it goes live."
          : "Product saved",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
        className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="product-dialog-title" className="font-serif text-2xl">
            {product ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {vendor.limits.requireProductApproval && (
          <p className="text-xs text-muted-foreground">
            {product
              ? "Changing the name, price, category, images or description sends the product back for review. Stock and visibility changes don't."
              : "The shop team reviews new products before they appear in the shop."}
          </p>
        )}

        <label className="block space-y-1">
          <span className="text-xs font-medium">Product name</span>
          <input
            required
            minLength={3}
            value={form.name}
            onChange={set("name")}
            className={inputClass}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium">Category</span>
          <select required value={form.category} onChange={set("category")} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium">Price (৳)</span>
            <input
              required
              type="number"
              min={1}
              step="1"
              inputMode="numeric"
              value={form.price}
              onChange={set("price")}
              className={inputClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium">Was (৳)</span>
            <input
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              value={form.compareAtPrice}
              onChange={set("compareAtPrice")}
              placeholder="Optional"
              className={inputClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium">Stock</span>
            <input
              required
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              value={form.stock}
              onChange={set("stock")}
              className={inputClass}
            />
          </label>
        </div>
        {discount > 0 && (
          <p
            className={`text-xs ${overDiscount ? "text-destructive font-medium" : "text-muted-foreground"}`}
          >
            {discount}% discount. Your account allows up to {vendor.limits.maxDiscountPercent}%.
          </p>
        )}

        <div className="space-y-1">
          <span className="text-xs font-medium">Product images</span>
          <ImageUploader
            value={form.images}
            onChange={(images) => setForm((f) => ({ ...f, images }))}
            folder="products"
            max={8}
            label="Product images"
            withAlt={false}
          />
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium">Description</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={set("description")}
            className={`${inputClass} h-auto py-2`}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium">Visibility</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="status"
              value="active"
              checked={form.status === "active"}
              onChange={set("status")}
            />
            Show in the shop {vendor.limits.requireProductApproval ? "once approved" : ""}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={form.status === "draft"}
              onChange={set("status")}
            />
            Keep hidden for now
          </label>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || overDiscount}
            className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Orders ───

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Waiting for confirmation",
  confirmed: "Confirmed",
  processing: "Being packed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

function OrdersTab({ orders }: { orders: VendorOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h2 className="font-serif text-2xl">No orders yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Orders that include your products will appear here as soon as customers buy them.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        The shop team handles delivery, so you see each buyer&apos;s first name and area only.
      </p>
      <div className="relative rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left font-medium p-3 pl-4">Order</th>
              <th className="text-left font-medium p-3">Buyer</th>
              <th className="text-left font-medium p-3">Your items</th>
              <th className="text-right font-medium p-3">Your total</th>
              <th className="text-left font-medium p-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o._id} className="align-top">
                <td className="p-3 pl-4 whitespace-nowrap">
                  <p className="font-medium">{o.orderNumber ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{date(o.createdAt)}</p>
                </td>
                <td className="p-3">
                  <p>{o.customer}</p>
                  <p className="text-xs text-muted-foreground">{o.area}</p>
                </td>
                <td className="p-3">
                  {o.items.map((item, i) => (
                    <p key={i} className="text-xs">
                      {item.quantity} × {item.productName}
                    </p>
                  ))}
                </td>
                <td className="p-3 text-right tabular-nums whitespace-nowrap">
                  {taka(o.vendorTotal)}
                </td>
                <td className="p-3 pr-4 whitespace-nowrap">
                  {ORDER_STATUS_LABEL[o.status] ?? o.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Profile ───

function ProfileTab({ vendor, onSaved }: { vendor: VendorInfo; onSaved: (v: VendorInfo) => void }) {
  const [form, setForm] = useState({
    contactName: vendor.contactName,
    phone: vendor.phone ?? "",
    district: vendor.district ?? "",
    pickupAddress: vendor.pickupAddress ?? "",
    description: vendor.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data.error || "Couldn't save your store details.");
      onSaved({ ...vendor, ...data });
      toast.success("Store details saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4"
    >
      <div>
        <p className="text-xs text-muted-foreground">Store name</p>
        <p className="font-serif text-2xl">{vendor.storeName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          To change your store name, commission or limits, contact the shop team.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium">Contact name</span>
          <input
            required
            value={form.contactName}
            onChange={set("contactName")}
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
        <label className="block space-y-1">
          <span className="text-xs font-medium">Email</span>
          <input value={vendor.email} disabled className={`${inputClass} opacity-70`} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Pickup address</span>
        <input
          value={form.pickupAddress}
          onChange={set("pickupAddress")}
          placeholder="Where couriers collect your parcels"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium">About your store</span>
        <textarea
          rows={4}
          value={form.description}
          onChange={set("description")}
          className={`${inputClass} h-auto py-2`}
        />
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save store details"}
        </button>
      </div>
    </form>
  );
}
