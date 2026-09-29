"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Gift,
  Headphones,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";
import { useCartStore, type CartItemStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { dashboardFor } from "@/lib/dashboard";
import { BD_DISTRICTS, BD_DIVISIONS } from "@/lib/constants";
import { optimizedImageUrl } from "@/lib/image";

type Tab = "overview" | "orders" | "addresses" | "profile" | "security";

type OrderItem = {
  product: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  total: number;
};
type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost?: number;
  discount?: number;
  total: number;
  createdAt: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    area?: string;
    district?: string;
    division?: string;
    streetAddress?: string;
  };
};
type Summary = {
  walletBalance: number;
  rewardPoints: number;
  memberSince: string | null;
  orders: number;
  spent: number;
  activeOrders: number;
  deliveredOrders: number;
};
type Address = {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  streetAddress: string;
  postalCode?: string;
  isDefault: boolean;
};

const TABS: Array<{ id: Tab; label: string; icon: typeof User }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "My orders", icon: ShoppingBag },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Password", icon: Lock },
];

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const STEP_LABELS: Record<string, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  processing: "Packing",
  shipped: "On the way",
  delivered: "Delivered",
};
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  confirmed: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  processing: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  shipped: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  returned: "bg-secondary text-foreground",
  refunded: "bg-secondary text-foreground",
};
const statusLabel = (s: string) => STEP_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

const taka = (n: number) => `৳${new Intl.NumberFormat("en-US").format(Math.round(n || 0))}`;
const dateLabel = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Dhaka",
      }).format(new Date(iso))
    : "";

const field =
  "w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 aria-[invalid=true]:border-destructive";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
        STATUS_STYLE[status] ?? "bg-secondary text-foreground"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

/** Placed → Confirmed → Packing → On the way → Delivered */
function OrderProgress({ status }: { status: string }) {
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);
  if (current < 0) return null;
  return (
    <ol className="flex items-start" aria-label={`Order status: ${statusLabel(status)}`}>
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex-1 flex flex-col items-center text-center relative">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 ${i <= current ? "bg-primary" : "bg-border"}`}
              />
            )}
            <span
              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                done
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-2 border-border text-muted-foreground"
              }`}
            >
              {done ? <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={`mt-1.5 text-[10px] sm:text-[11px] leading-tight ${
                i === current ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {STEP_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, setUser, logout, isAuthenticated, isLoading } = useAuthStore();
  useRequireAuth({ redirectTo: "/auth/login" });

  // Signed-in state comes from browser storage; wait for mount so the first render matches the
  // server HTML (no hydration mismatch)
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    setMounted(true);
    // Open a tab from the link, e.g. /account#orders
    const hash = window.location.hash.slice(1) as Tab;
    if (TABS.some((t) => t.id === hash)) setTab(hash);
  }, []);

  const openTab = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadOrders = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([
        fetch("/api/orders?pageSize=50&mine=1", { cache: "no-store" }),
        fetch("/api/account/summary", { cache: "no-store" }),
      ]);
      if (o.ok) setOrders((await o.json()).items ?? []);
      if (s.ok) setSummary(await s.json());
    } catch {
      // Shown as an empty state; the page stays usable
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) loadOrders();
  }, [user?.id, loadOrders]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    logout();
    toast.info("You're signed out");
    router.push("/auth/login");
  };

  if (!mounted || isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading your account…
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "there";
  const dashboard = dashboardFor(user.role);
  const activeOrder = orders.find((o) =>
    ["pending", "confirmed", "processing", "shipped"].includes(o.status),
  );

  return (
    <div className="min-h-screen bg-secondary/20 py-8 lg:py-12">
      <div className="container-x">
        {/* Welcome */}
        <div className="bg-card p-5 sm:p-7 rounded-3xl border border-border mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/25 to-primary/5 text-primary font-serif font-bold text-2xl flex items-center justify-center border-2 border-primary/30 shrink-0">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl lg:text-3xl truncate">Hi, {firstName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
              {summary?.memberSince && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Member since {dateLabel(summary.memberSince)}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {dashboard && (
              <Link
                href={dashboard.href}
                className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Open{" "}
                {dashboard.label.toLowerCase()}
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="h-10 px-4 rounded-full border border-border text-xs font-medium text-destructive hover:bg-destructive/10 transition inline-flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)] gap-6">
          {/* Navigation: sidebar on desktop, scrollable pills on phones */}
          <nav aria-label="My account" className="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto">
            <ul className="flex lg:flex-col gap-2 w-max lg:w-auto">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => openTab(id)}
                      aria-current={active ? "page" : undefined}
                      className={`w-full text-left px-4 py-2.5 lg:py-3 rounded-2xl text-sm font-medium transition flex items-center gap-3 whitespace-nowrap ${
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                          : "bg-card hover:bg-accent text-foreground border border-border"
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {label}
                      {id === "orders" && (summary?.activeOrders ?? 0) > 0 && (
                        <span
                          className={`ml-auto text-[10px] font-bold px-1.5 rounded-full ${active ? "bg-primary-foreground/20" : "bg-primary/15 text-primary"}`}
                        >
                          {summary!.activeOrders}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">
            {tab === "overview" && (
              <div className="space-y-6 animate-fade-up">
                <dl className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    {
                      label: "Orders",
                      value: String(summary?.orders ?? orders.length),
                      icon: Package,
                    },
                    { label: "Total spent", value: taka(summary?.spent ?? 0), icon: ShoppingBag },
                    {
                      label: "Reward points",
                      value: `${summary?.rewardPoints ?? 0} pts`,
                      icon: Star,
                    },
                    { label: "Wallet", value: taka(summary?.walletBalance ?? 0), icon: Wallet },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="bg-card p-4 sm:p-5 rounded-2xl border border-border"
                    >
                      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className="w-4 h-4 text-primary" aria-hidden="true" /> {label}
                      </dt>
                      <dd className="mt-2 text-xl sm:text-2xl font-bold tabular-nums">
                        {summary || !loadingOrders ? value : "—"}
                      </dd>
                    </div>
                  ))}
                </dl>

                {activeOrder && (
                  <section className="bg-card p-5 sm:p-6 rounded-3xl border border-border space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Your latest order</p>
                        <h2 className="font-mono font-bold">{activeOrder.orderNumber}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {dateLabel(activeOrder.createdAt)} · {activeOrder.items.length} item
                          {activeOrder.items.length === 1 ? "" : "s"} · {taka(activeOrder.total)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openTab("orders")}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        See details
                      </button>
                    </div>
                    <OrderProgress status={activeOrder.status} />
                    {activeOrder.trackingId && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Truck className="w-4 h-4" aria-hidden="true" />
                        {activeOrder.courierName ?? "Courier"} tracking:{" "}
                        <span className="font-mono text-foreground">{activeOrder.trackingId}</span>
                      </p>
                    )}
                  </section>
                )}

                <section className="bg-card p-5 sm:p-6 rounded-3xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl">Recent orders</h2>
                    {orders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openTab("orders")}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        View all
                      </button>
                    )}
                  </div>
                  {loadingOrders ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Loading orders…
                    </p>
                  ) : orders.length === 0 ? (
                    <EmptyOrders />
                  ) : (
                    <ul className="divide-y divide-border">
                      {orders.slice(0, 3).map((o) => (
                        <li key={o._id} className="py-3 flex items-center gap-3">
                          <div className="flex -space-x-3 shrink-0">
                            {o.items.slice(0, 3).map((it, i) => (
                              <img
                                key={i}
                                src={optimizedImageUrl(it.productImage, 96) || undefined}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover border-2 border-card bg-secondary"
                              />
                            ))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm font-semibold truncate">
                              {o.orderNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dateLabel(o.createdAt)} · {taka(o.total)}
                            </p>
                          </div>
                          <StatusBadge status={o.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { href: "/products", label: "Continue shopping", icon: ShoppingBag },
                    { href: "/track-order", label: "Track a parcel", icon: Truck },
                    { href: "/contact", label: "Get help", icon: Headphones },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition text-sm font-semibold"
                    >
                      <span className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      {label}
                    </Link>
                  ))}
                </div>

                {(summary?.rewardPoints ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-primary" aria-hidden="true" />
                    You have {summary!.rewardPoints} reward points to use on a future order.
                  </p>
                )}
              </div>
            )}

            {tab === "orders" && <OrdersTab orders={orders} loading={loadingOrders} />}

            {tab === "addresses" && <AddressesTab />}

            {tab === "profile" && (
              <ProfileTab user={user} setUser={setUser} memberSince={summary?.memberSince} />
            )}

            {tab === "security" && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="py-10 text-center space-y-3">
      <Package className="w-12 h-12 text-muted-foreground mx-auto" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
      <Link
        href="/products"
        className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-semibold"
      >
        Start shopping
      </Link>
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

const ORDER_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "In progress" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled / returned" },
] as const;

function OrdersTab({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const [filter, setFilter] = useState<(typeof ORDER_FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  const shown = useMemo(
    () =>
      orders.filter((o) => {
        if (q && !o.orderNumber.toLowerCase().includes(q.trim().toLowerCase())) return false;
        if (filter === "active")
          return ["pending", "confirmed", "processing", "shipped"].includes(o.status);
        if (filter === "delivered") return o.status === "delivered";
        if (filter === "cancelled") return ["cancelled", "returned", "refunded"].includes(o.status);
        return true;
      }),
    [orders, filter, q],
  );

  const buyAgain = async (order: Order) => {
    setReordering(order._id);
    try {
      const res = await fetch(`/api/account/reorder?order=${order._id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load that order.");
      (data.items as CartItemStore[]).forEach((item) => addItem(item));
      if (data.items.length) {
        toast.success(
          `${data.items.length} item${data.items.length === 1 ? "" : "s"} added to your bag`,
        );
        openCart();
      }
      if (data.unavailable.length)
        toast.info(`Not available right now: ${data.unavailable.join(", ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add the items.");
    } finally {
      setReordering(null);
    }
  };

  return (
    <div className="bg-card p-5 sm:p-6 rounded-3xl border border-border space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">My orders</h2>
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Search by order number</span>
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order number"
            className={`${field} h-10 pl-9`}
          />
        </label>
      </div>
      <div
        className="flex gap-2 overflow-x-auto -mx-1 px-1"
        role="tablist"
        aria-label="Filter orders"
      >
        {ORDER_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-semibold border transition ${
              filter === f.id
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading orders…</p>
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No orders match.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => {
            const expanded = open === o._id;
            return (
              <li key={o._id} className="rounded-2xl border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : o._id)}
                  aria-expanded={expanded}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-secondary/40 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm">{o.orderNumber}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dateLabel(o.createdAt)} · {o.items.length} item
                      {o.items.length === 1 ? "" : "s"} ·{" "}
                      <span className="font-semibold text-foreground">{taka(o.total)}</span>
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {expanded && (
                  <div className="border-t border-border p-4 space-y-5">
                    <OrderProgress status={o.status} />

                    <ul className="space-y-3">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <img
                            src={optimizedImageUrl(it.productImage, 120) || undefined}
                            alt=""
                            className="w-14 h-14 rounded-xl object-cover bg-secondary shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium line-clamp-2">{it.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {it.quantity} × {taka(it.price)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums">{taka(it.total)}</p>
                        </li>
                      ))}
                    </ul>

                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="rounded-xl bg-secondary/40 p-3 space-y-1">
                        <p className="font-semibold text-foreground">Delivery</p>
                        <p className="text-muted-foreground">
                          {o.shippingAddress?.fullName} · {o.shippingAddress?.phone}
                        </p>
                        <p className="text-muted-foreground">
                          {[
                            o.shippingAddress?.streetAddress,
                            o.shippingAddress?.area,
                            o.shippingAddress?.district,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {o.trackingId && (
                          <p className="pt-1">
                            {o.courierName ?? "Courier"}:{" "}
                            {o.trackingUrl ? (
                              <a
                                href={o.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-primary hover:underline"
                              >
                                {o.trackingId}
                              </a>
                            ) : (
                              <span className="font-mono">{o.trackingId}</span>
                            )}
                          </p>
                        )}
                      </div>
                      <dl className="rounded-xl bg-secondary/40 p-3 space-y-1">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Subtotal</dt>
                          <dd>{taka(o.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Delivery</dt>
                          <dd>{o.shippingCost ? taka(o.shippingCost) : "Free"}</dd>
                        </div>
                        {(o.discount ?? 0) > 0 && (
                          <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                            <dt>Discount</dt>
                            <dd>−{taka(o.discount!)}</dd>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border">
                          <dt>Total</dt>
                          <dd>{taka(o.total)}</dd>
                        </div>
                        <div className="flex justify-between pt-1">
                          <dt className="text-muted-foreground">Payment</dt>
                          <dd>
                            {o.paymentMethod}
                            {o.paymentStatus ? ` · ${o.paymentStatus}` : ""}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => buyAgain(o)}
                        disabled={reordering === o._id}
                        className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {reordering === o._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        )}
                        Buy again
                      </button>
                      <Link
                        href={`/order-confirmation/${o._id}`}
                        className="h-10 px-4 rounded-full border border-border text-xs font-semibold inline-flex items-center hover:bg-secondary"
                      >
                        Receipt
                      </Link>
                      <Link
                        href="/contact"
                        className="h-10 px-4 rounded-full border border-border text-xs font-semibold inline-flex items-center hover:bg-secondary"
                      >
                        Need help?
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Addresses ────────────────────────────────────────────────────────────────

const EMPTY_ADDRESS: Omit<Address, "_id"> = {
  label: "Home",
  fullName: "",
  phone: "",
  division: "",
  district: "",
  area: "",
  streetAddress: "",
  postalCode: "",
  isDefault: false,
};

function AddressesTab() {
  const [items, setItems] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<(Omit<Address, "_id"> & { _id?: string }) | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/addresses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const send = async (method: string, body?: unknown, query = "") => {
    const res = await fetch(`/api/account/addresses${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.fields) setErrors(data.fields);
      throw new Error(data.error || "Something went wrong.");
    }
    setItems(data);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setErrors({});
    try {
      await send(editing._id ? "PUT" : "POST", { ...editing, id: editing._id });
      toast.success("Address saved");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<Omit<Address, "_id">>) => {
    setEditing((a) => (a ? { ...a, ...patch } : a));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  };

  if (editing) {
    const districts = BD_DISTRICTS[editing.division] ?? [];
    const input = (
      key: keyof Omit<Address, "_id" | "isDefault">,
      label: string,
      props: React.InputHTMLAttributes<HTMLInputElement> = {},
    ) => (
      <div className="space-y-1">
        <label htmlFor={`addr-${key}`} className="text-xs font-medium">
          {label}
        </label>
        <input
          id={`addr-${key}`}
          value={(editing[key] as string) ?? ""}
          onChange={(e) => set({ [key]: e.target.value })}
          aria-invalid={Boolean(errors[key]) || undefined}
          className={field}
          {...props}
        />
        {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
      </div>
    );
    return (
      <form
        onSubmit={save}
        className="bg-card p-5 sm:p-6 rounded-3xl border border-border space-y-4 animate-fade-up"
      >
        <h2 className="font-serif text-2xl">{editing._id ? "Edit address" : "New address"}</h2>
        <div className="flex gap-2">
          {["Home", "Office", "Other"].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set({ label: l })}
              aria-pressed={editing.label === l}
              className={`h-8 px-3.5 rounded-full text-xs font-semibold border ${
                editing.label === l
                  ? "bg-foreground text-background border-foreground"
                  : "border-border"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {input("fullName", "Receiver's name", { autoComplete: "name" })}
          {input("phone", "Mobile number", {
            autoComplete: "tel",
            inputMode: "tel",
            placeholder: "01711223344",
          })}
          <div className="space-y-1">
            <label htmlFor="addr-division" className="text-xs font-medium">
              Division
            </label>
            <select
              id="addr-division"
              value={editing.division}
              onChange={(e) => set({ division: e.target.value, district: "" })}
              aria-invalid={Boolean(errors.division) || undefined}
              className={field}
            >
              <option value="">Choose division</option>
              {BD_DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.division && <p className="text-xs text-destructive">{errors.division}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="addr-district" className="text-xs font-medium">
              District
            </label>
            <select
              id="addr-district"
              value={editing.district}
              onChange={(e) => set({ district: e.target.value })}
              disabled={!editing.division}
              aria-invalid={Boolean(errors.district) || undefined}
              className={field}
            >
              <option value="">Choose district</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.district && <p className="text-xs text-destructive">{errors.district}</p>}
          </div>
          {input("area", "Area / thana")}
          {input("postalCode", "Postal code (optional)", { inputMode: "numeric", maxLength: 4 })}
        </div>
        {input("streetAddress", "House, road, street", { autoComplete: "street-address" })}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editing.isDefault}
            onChange={(e) => set({ isDefault: e.target.checked })}
            className="w-4 h-4 accent-[var(--primary)]"
          />
          Use as my default delivery address
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />} Save address
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setErrors({});
            }}
            className="h-11 px-6 rounded-full border border-border text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-card p-5 sm:p-6 rounded-3xl border border-border space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Addresses</h2>
          <p className="text-xs text-muted-foreground">Saved places for faster checkout.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY_ADDRESS, isDefault: !items?.length })}
          className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Add address
        </button>
      </div>
      {items === null ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {items.map((a) => (
            <li
              key={a._id}
              className={`rounded-2xl border p-4 space-y-2 ${a.isDefault ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">{a.label}</span>
                {a.isDefault && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">
                {a.fullName} · {a.phone}
              </p>
              <p className="text-xs text-muted-foreground">
                {[a.streetAddress, a.area, a.district, a.division, a.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <div className="flex flex-wrap gap-3 pt-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditing({ ...a })}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                </button>
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() =>
                      send("PUT", { ...a, id: a._id, isDefault: true })
                        .then(() => toast.success("Default address updated"))
                        .catch((err) => toast.error(err.message))
                    }
                    className="text-foreground hover:underline"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this address?"))
                      send("DELETE", undefined, `?id=${a._id}`)
                        .then(() => toast.success("Address deleted"))
                        .catch((err) => toast.error(err.message));
                  }}
                  className="inline-flex items-center gap-1 text-destructive hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileTab({
  user,
  setUser,
  memberSince,
}: {
  user: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>;
  setUser: ReturnType<typeof useAuthStore.getState>["setUser"];
  memberSince?: string | null;
}) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const changed = name.trim() !== (user.name || "") || phone.trim() !== (user.phone || "");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter your name");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Couldn't save your profile");
      setUser({ ...user, name: updated.name, phone: updated.phone });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="bg-card p-5 sm:p-6 rounded-3xl border border-border space-y-4 animate-fade-up max-w-2xl"
    >
      <div>
        <h2 className="font-serif text-2xl">Profile</h2>
        <p className="text-xs text-muted-foreground">
          Your name and phone are used for deliveries.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="pf-name" className="text-xs font-medium">
            Full name
          </label>
          <input
            id="pf-name"
            required
            value={name}
            maxLength={100}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="pf-phone" className="text-xs font-medium">
            Mobile number
          </label>
          <input
            id="pf-phone"
            type="tel"
            value={phone}
            maxLength={20}
            autoComplete="tel"
            placeholder="01711223344"
            onChange={(e) => setPhone(e.target.value)}
            className={field}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="pf-email" className="text-xs font-medium">
          Email
        </label>
        <input
          id="pf-email"
          type="email"
          disabled
          value={user.email}
          className={`${field} bg-secondary/50 text-muted-foreground cursor-not-allowed`}
        />
        <p className="text-[11px] text-muted-foreground">
          {user.emailVerified ? "Verified" : "Not verified"} · contact us to change your email.
          {memberSince && ` Member since ${dateLabel(memberSince)}.`}
        </p>
      </div>
      <button
        type="submit"
        disabled={saving || !changed}
        className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />} Save changes
      </button>
    </form>
  );
}

// ─── Password ─────────────────────────────────────────────────────────────────

const MIN_PASSWORD = 10;

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className={`${field} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const valid = current && next.length >= MIN_PASSWORD && next === confirm && next !== current;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't change your password");
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change your password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="bg-card p-5 sm:p-6 rounded-3xl border border-border space-y-4 animate-fade-up max-w-xl"
    >
      <div>
        <h2 className="font-serif text-2xl">Change password</h2>
        <p className="text-xs text-muted-foreground">
          Enter your current password to confirm it's you.
        </p>
      </div>
      <PasswordInput
        id="pw-current"
        label="Current password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
      />
      <PasswordInput
        id="pw-new"
        label={`New password (at least ${MIN_PASSWORD} characters)`}
        value={next}
        onChange={setNext}
        autoComplete="new-password"
      />
      {next && next.length < MIN_PASSWORD && (
        <p className="text-xs text-destructive -mt-2">
          {MIN_PASSWORD - next.length} more character{MIN_PASSWORD - next.length === 1 ? "" : "s"}{" "}
          needed
        </p>
      )}
      <PasswordInput
        id="pw-confirm"
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />
      {confirm && next !== confirm && (
        <p className="text-xs text-destructive -mt-2">Passwords don't match</p>
      )}
      {next && next === current && (
        <p className="text-xs text-destructive -mt-2">Choose a password you haven't used here</p>
      )}
      <button
        type="submit"
        disabled={!valid || saving}
        className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />} Update password
      </button>
    </form>
  );
}
