"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Eye, EyeOff, Key, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { useRequireAuth } from "@/hooks/use-require-auth";
import type { Permission } from "@/lib/permissions";
import type { UserRole } from "@/types";
import type { AdminNotification, AdminTab } from "@/components/admin/types";
import { canOpenTab, navFor } from "@/components/admin/nav";
import { AccessProvider } from "@/components/admin/shared";

// Shell components load with the page; each module is split out and loaded when its tab opens
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GlobalCommandPalette } from "@/components/admin/GlobalCommandPalette";
import { NotificationDrawer } from "@/components/admin/NotificationDrawer";
import type { AttentionItem } from "@/components/admin/OverviewModule";

function ModuleLoading() {
  return <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" aria-hidden="true" />;
}

const load = <T,>(loader: () => Promise<T>) => dynamic(loader as any, { loading: ModuleLoading }) as any;

const OverviewModule = load(() => import("@/components/admin/OverviewModule").then((m) => m.OverviewModule));
const SalesAnalyticsModule = load(() => import("@/components/admin/SalesAnalyticsModule").then((m) => m.SalesAnalyticsModule));
const OrderManagementModule = load(() => import("@/components/admin/OrderManagementModule").then((m) => m.OrderManagementModule));
const InvoicesModule = load(() => import("@/components/admin/InvoicesModule").then((m) => m.InvoicesModule));
const CustomerCrmModule = load(() => import("@/components/admin/CustomerCrmModule").then((m) => m.CustomerCrmModule));
const InventoryWarehouseModule = load(() => import("@/components/admin/InventoryWarehouseModule").then((m) => m.InventoryWarehouseModule));
const ProductManagerModule = load(() => import("@/components/admin/catalog/ProductManagerModule").then((m) => m.ProductManagerModule));
const BrandManagerModule = load(() => import("@/components/admin/catalog/BrandManagerModule").then((m) => m.BrandManagerModule));
const CategoryManagerModule = load(() => import("@/components/admin/catalog/CategoryManagerModule").then((m) => m.CategoryManagerModule));
const MultiVendorModule = load(() => import("@/components/admin/MultiVendorModule").then((m) => m.MultiVendorModule));
const ReturnsRefundsModule = load(() => import("@/components/admin/ReturnsRefundsModule").then((m) => m.ReturnsRefundsModule));
const CouriersPaymentsModule = load(() => import("@/components/admin/CouriersPaymentsModule").then((m) => m.CouriersPaymentsModule));
const MarketingCampaignsModule = load(() => import("@/components/admin/MarketingCampaignsModule").then((m) => m.MarketingCampaignsModule));
const AiStudioModule = load(() => import("@/components/admin/AiStudioModule").then((m) => m.AiStudioModule));
const FinancialReportsModule = load(() => import("@/components/admin/FinancialReportsModule").then((m) => m.FinancialReportsModule));
const SecurityRbacModule = load(() => import("@/components/admin/SecurityRbacModule").then((m) => m.SecurityRbacModule));
const CmsBlogSeoModule = load(() => import("@/components/admin/CmsBlogSeoModule").then((m) => m.CmsBlogSeoModule));
const ReviewsAbandonedCartsModule = load(() => import("@/components/admin/ReviewsAbandonedCartsModule").then((m) => m.ReviewsAbandonedCartsModule));
const MediaLibraryModule = load(() => import("@/components/admin/MediaLibraryModule").then((m) => m.MediaLibraryModule));
const ApiWebhooksHealthModule = load(() => import("@/components/admin/ApiWebhooksHealthModule").then((m) => m.ApiWebhooksHealthModule));
const StorefrontModule = load(() => import("@/components/admin/storefront/StorefrontModule").then((m) => m.StorefrontModule));
const ActivityModule = load(() => import("@/components/admin/ActivityModule").then((m) => m.ActivityModule));
const RolesModule = load(() => import("@/components/admin/RolesModule").then((m) => m.RolesModule));

export type AdminCounts = {
  pendingOrders: number;
  lowStock: number;
  pendingVendorProducts: number;
  pendingVendors: number;
  pendingReviews: number;
  refundsDue: number;
  overdueInvoices: number;
};

type AdminDashboardClientProps = {
  viewer: { id: string; name: string; role: UserRole; roleName: string };
  permissions: Permission[];
  counts: AdminCounts;
  categories: { _id: string; name: string }[];
  settings: { siteDescription: string; freeShippingThreshold: number; insideDhakaCost: number; outsideDhakaCost: number } | null;
};

const READ_KEY = "admin-notifications-read-at";

export default function AdminDashboardClient({ viewer, permissions, counts, categories, settings }: AdminDashboardClientProps) {
  useRequireAuth({ roles: ["super_admin", "admin", "staff"] });

  const groups = useMemo(() => navFor(permissions), [permissions]);
  const firstTab = groups[0]?.items[0]?.tab ?? "security_rbac";
  const [activeTab, setActiveTabState] = useState<AdminTab>(canOpenTab("overview", permissions) ? "overview" : firstTab);
  // Pre-fills a tab's search box when opened from search or another tab
  const [focus, setFocus] = useState<{ tab: AdminTab; query: string; nonce: number } | null>(null);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const setActiveTab = useCallback(
    (tab: AdminTab, query?: string) => {
      const next = canOpenTab(tab, permissions) ? tab : firstTab;
      setActiveTabState(next);
      setFocus(query ? { tab: next, query, nonce: Date.now() } : null);
      if (typeof window !== "undefined") {
        history.replaceState(null, "", `#${next}`);
        window.scrollTo({ top: 0 });
      }
    },
    [permissions, firstTab],
  );

  // Open the tab named in the URL (#orders), so refreshing or sharing a link keeps your place
  useEffect(() => {
    const fromHash = window.location.hash.slice(1) as AdminTab;
    if (fromHash && canOpenTab(fromHash, permissions)) setActiveTabState(fromHash);
  }, [permissions]);

  // Ctrl/⌘ K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Notifications come from the database; "read" is remembered in this browser
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { items: Omit<AdminNotification, "isRead">[] };
      let readAt = 0;
      try {
        readAt = Number(localStorage.getItem(READ_KEY)) || 0;
      } catch {
        readAt = 0;
      }
      setNotifications(body.items.map((n) => ({ ...n, isRead: new Date(n.at).getTime() <= readAt })));
    } catch {
      // Keep the last list on a network blip
    } finally {
      setNotificationsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadNotifications();
    const t = setInterval(() => document.visibilityState === "visible" && loadNotifications(), 60_000);
    return () => clearInterval(t);
  }, [loadNotifications]);

  const markAllRead = () => {
    const latest = Math.max(Date.now(), ...notifications.map((n) => new Date(n.at).getTime()));
    try {
      localStorage.setItem(READ_KEY, String(latest));
    } catch {
      // Private mode: read state lasts for this page only
    }
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const clearInvoiceOrder = useCallback(() => setInvoiceOrderId(null), []);
  const can = (p: Permission) => permissions.includes(p);
  const firstName = viewer.name.trim().split(/\s+/)[0] || "there";

  // Only real, actionable counts this role can act on; each links to where it gets resolved
  const attention: AttentionItem[] = (
    [
      can("orders.view") && { key: "orders", count: counts.pendingOrders, singular: "order is waiting to be confirmed", plural: "orders are waiting to be confirmed", action: "Review orders", tab: "orders" },
      can("catalog.view") && { key: "stock", count: counts.lowStock, singular: "product is low or out of stock", plural: "products are low or out of stock", action: "Check stock", tab: "inventory" },
      can("returns.manage") && counts.refundsDue > 0 && { key: "refunds", count: counts.refundsDue, singular: "returned order still needs a refund decision", plural: "returned orders still need a refund decision", action: "Open returns", tab: "returns" },
      can("invoices.view") && counts.overdueInvoices > 0 && { key: "invoices", count: counts.overdueInvoices, singular: "invoice is overdue", plural: "invoices are overdue", action: "See invoices", tab: "invoices" },
      can("reviews.manage") && counts.pendingReviews > 0 && { key: "reviews", count: counts.pendingReviews, singular: "review is waiting for approval", plural: "reviews are waiting for approval", action: "Moderate", tab: "reviews_abandoned" },
      can("vendors.view") && counts.pendingVendorProducts > 0 && { key: "vproducts", count: counts.pendingVendorProducts, singular: "vendor product is waiting for your review", plural: "vendor products are waiting for your review", action: "Review products", tab: "vendors" },
      can("vendors.view") && counts.pendingVendors > 0 && { key: "vendors", count: counts.pendingVendors, singular: "vendor store is waiting for approval", plural: "vendor stores are waiting for approval", action: "Review vendors", tab: "vendors" },
    ] as (AttentionItem | false)[]
  ).filter((x): x is AttentionItem => Boolean(x));

  const focusFor = (tab: AdminTab) => (focus?.tab === tab ? focus.query : "");

  return (
    <AccessProvider value={{ permissions, userId: viewer.id, role: viewer.role }}>
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
        >
          Skip to content
        </a>

        <GlobalCommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectTab={(tab, query) => setActiveTab(tab, query)}
          groups={groups}
        />

        <NotificationDrawer
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          loading={notificationsLoading}
          onRefresh={loadNotifications}
          onMarkAllAsRead={markAllRead}
          onSelectTab={(tab) => setActiveTab(tab)}
        />

        <AdminSidebar
          groups={groups}
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          pendingOrdersCount={counts.pendingOrders}
          lowStockCount={counts.lowStock}
          vendorsCount={counts.pendingVendorProducts + counts.pendingVendors}
        />

        <div className="flex min-w-0 flex-col">
          <AdminHeader
            activeTab={activeTab}
            sidebarOpen={sidebarOpen}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onChangePassword={() => setShowChangePasswordModal(true)}
            notifications={notifications}
            setActiveTab={(tab) => setActiveTab(tab)}
            roleName={viewer.roleName}
            canAddProduct={can("catalog.manage")}
          />

          <main id="admin-main" className="w-full max-w-[1440px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {activeTab === "overview" && <OverviewModule firstName={firstName} attention={attention} onOpen={(tab: AdminTab) => setActiveTab(tab)} />}
            {activeTab === "analytics" && <SalesAnalyticsModule />}
            {activeTab === "orders" && (
              <OrderManagementModule
                key={focus?.tab === "orders" ? focus.nonce : "orders"}
                initialSearch={focusFor("orders")}
                onCreateInvoice={(orderId: string) => {
                  setInvoiceOrderId(orderId);
                  setActiveTab("invoices");
                }}
              />
            )}
            {activeTab === "invoices" && (
              <InvoicesModule
                key={focus?.tab === "invoices" ? focus.nonce : "invoices"}
                initialSearch={focusFor("invoices")}
                openOrderId={invoiceOrderId}
                onOrderHandled={clearInvoiceOrder}
              />
            )}
            {activeTab === "products" && <ProductManagerModule />}
            {activeTab === "brands" && <BrandManagerModule canManage={can("catalog.structure")} />}
            {activeTab === "categories" && <CategoryManagerModule canManage={can("catalog.structure")} />}
            {activeTab === "inventory" && <InventoryWarehouseModule />}
            {activeTab === "customers" && <CustomerCrmModule key={focus?.tab === "customers" ? focus.nonce : "customers"} initialSearch={focusFor("customers")} />}
            {activeTab === "vendors" && <MultiVendorModule categories={categories} canManage={can("vendors.manage")} />}
            {activeTab === "returns" && <ReturnsRefundsModule />}
            {activeTab === "couriers_payments" && <CouriersPaymentsModule />}
            {activeTab === "marketing" && <MarketingCampaignsModule />}
            {activeTab === "ai_studio" && <AiStudioModule />}
            {activeTab === "finance" && <FinancialReportsModule />}
            {activeTab === "cms_blog" && <CmsBlogSeoModule />}
            {activeTab === "reviews_abandoned" && <ReviewsAbandonedCartsModule />}
            {activeTab === "media" && <MediaLibraryModule />}
            {activeTab === "security_rbac" && <SecurityRbacModule onChangePassword={() => setShowChangePasswordModal(true)} />}
            {activeTab === "api_health" && <ApiWebhooksHealthModule />}
            {activeTab === "storefront" && <StorefrontModule />}
            {activeTab === "activity" && <ActivityModule />}
            {activeTab === "roles" && <RolesModule />}
            {activeTab === "settings" && settings && <StoreSettings initial={settings} onOpenDesign={() => setActiveTab("storefront")} />}
          </main>
        </div>

        {showChangePasswordModal && <ChangePasswordModal userId={viewer.id} onClose={() => setShowChangePasswordModal(false)} />}
      </div>
    </AccessProvider>
  );
}

function StoreSettings({
  initial,
  onOpenDesign,
}: {
  initial: NonNullable<AdminDashboardClientProps["settings"]>;
  onOpenDesign: () => void;
}) {
  const [siteDescription, setSiteDescription] = useState(initial.siteDescription);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(initial.freeShippingThreshold));
  const [insideDhakaFee, setInsideDhakaFee] = useState(String(initial.insideDhakaCost));
  const [outsideDhakaFee, setOutsideDhakaFee] = useState(String(initial.outsideDhakaCost));
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteDescription,
          shipping: {
            freeShippingThreshold: Number(freeShippingThreshold),
            insideDhakaCost: Number(insideDhakaFee),
            outsideDhakaCost: Number(outsideDhakaFee),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      toast.success("Settings saved — checkout uses the new delivery charges now.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
  return (
    <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="font-serif text-2xl">Store settings & delivery charges</h2>
        <p className="text-sm text-muted-foreground">The search description, and the delivery charges the cart, checkout and order system use.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <p className="text-sm">Store name, logo, contact details, social links, homepage and footer are in <strong>Website design</strong>.</p>
        <button type="button" onClick={onOpenDesign} className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90">
          Open Website design
        </button>
      </div>
      <form onSubmit={save} className="space-y-4 text-sm">
        <div>
          <label htmlFor="site-description" className="mb-1 block text-xs font-medium">
            Store description (shown to Google and when links are shared)
          </label>
          <textarea id="site-description" rows={3} maxLength={1000} value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} className={field} />
        </div>
        <fieldset className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
          <legend className="px-1 text-xs font-semibold">Delivery charges</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["inside", "Inside Dhaka (৳)", insideDhakaFee, setInsideDhakaFee],
              ["outside", "Outside Dhaka (৳)", outsideDhakaFee, setOutsideDhakaFee],
              ["free", "Free delivery from (৳)", freeShippingThreshold, setFreeShippingThreshold],
            ].map(([id, label, value, set]) => (
              <div key={id as string}>
                <label htmlFor={`ship-${id}`} className="mb-1 block text-xs font-medium">{label as string}</label>
                <input
                  id={`ship-${id}`}
                  type="number"
                  min={0}
                  value={value as string}
                  onChange={(e) => (set as (v: string) => void)(e.target.value)}
                  className={`${field} font-semibold`}
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Set “free delivery from” to 0 to always charge delivery.</p>
        </fieldset>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}

function ChangePasswordModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 10) return toast.error("Password must be at least 10 characters long");
    if (next !== confirm) return toast.error("Passwords do not match");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      toast.success("Password changed. Other devices have been signed out.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const strength = next.length >= 14 ? "Strong" : next.length >= 10 ? "Good" : "Too short";
  const input = "w-full rounded-lg border border-border bg-background p-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Change your password" onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg">Change your password</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3 text-sm">
          <div>
            <label htmlFor="pw-current" className="mb-1 block text-xs font-medium">Current password</label>
            <div className="relative">
              <input id="pw-current" type={showCurrent ? "text" : "password"} required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showCurrent ? "Hide password" : "Show password"}>
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="pw-new" className="mb-1 block text-xs font-medium">New password</label>
            <div className="relative">
              <input id="pw-new" type={showNext ? "text" : "password"} required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={`${input} font-mono`} />
              <button type="button" onClick={() => setShowNext((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showNext ? "Hide password" : "Show password"}>
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {next && <p className={`mt-1 text-[11px] font-medium ${next.length >= 10 ? "text-emerald-600" : "text-rose-600"}`}>{strength} · use 3 of: lowercase, uppercase, number, symbol</p>}
          </div>
          <div>
            <label htmlFor="pw-confirm" className="mb-1 block text-xs font-medium">Confirm new password</label>
            <input id="pw-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${input} font-mono`} />
            {confirm && confirm !== next && <p className="mt-1 text-[11px] font-medium text-rose-600">Passwords do not match</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary">Cancel</button>
            <button type="submit" disabled={saving || !next || next !== confirm} className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
