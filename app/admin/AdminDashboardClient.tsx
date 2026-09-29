"use client";

import Link from "next/link";
import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Clock3,
  Mail,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  Truck,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Tag,
  BarChart3,
  X,
  Sliders,
  Settings as SettingsIcon,
  Layers,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Store,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Percent,
  Flame,
  Key,
  Boxes,
  RotateCcw,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/types";
import type { AdminTab, BDSeasonalTheme, AdminNotification } from "@/components/admin/types";

// Shell components load with the page; each module is split out and loaded when its tab opens
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GlobalCommandPalette } from "@/components/admin/GlobalCommandPalette";
import { NotificationDrawer } from "@/components/admin/NotificationDrawer";

function ModuleLoading() {
  return (
    <div
      className="h-72 rounded-2xl border border-border bg-card animate-pulse"
      aria-hidden="true"
    />
  );
}

const SalesAnalyticsModule = dynamic(
  () => import("@/components/admin/SalesAnalyticsModule").then((mod) => mod.SalesAnalyticsModule),
  { loading: ModuleLoading },
);
const OrderManagementModule = dynamic(
  () => import("@/components/admin/OrderManagementModule").then((mod) => mod.OrderManagementModule),
  { loading: ModuleLoading },
);
const CustomerCrmModule = dynamic(
  () => import("@/components/admin/CustomerCrmModule").then((mod) => mod.CustomerCrmModule),
  { loading: ModuleLoading },
);
const InventoryWarehouseModule = dynamic(
  () =>
    import("@/components/admin/InventoryWarehouseModule").then(
      (mod) => mod.InventoryWarehouseModule,
    ),
  { loading: ModuleLoading },
);
const ProductManagerModule = dynamic(
  () =>
    import("@/components/admin/catalog/ProductManagerModule").then(
      (mod) => mod.ProductManagerModule,
    ),
  { loading: ModuleLoading },
);
const BrandManagerModule = dynamic(
  () =>
    import("@/components/admin/catalog/BrandManagerModule").then((mod) => mod.BrandManagerModule),
  { loading: ModuleLoading },
);
const CategoryManagerModule = dynamic(
  () =>
    import("@/components/admin/catalog/CategoryManagerModule").then(
      (mod) => mod.CategoryManagerModule,
    ),
  { loading: ModuleLoading },
);
const MultiVendorModule = dynamic(
  () => import("@/components/admin/MultiVendorModule").then((mod) => mod.MultiVendorModule),
  { loading: ModuleLoading },
);
const ReturnsRefundsModule = dynamic(
  () => import("@/components/admin/ReturnsRefundsModule").then((mod) => mod.ReturnsRefundsModule),
  { loading: ModuleLoading },
);
const CouriersPaymentsModule = dynamic(
  () =>
    import("@/components/admin/CouriersPaymentsModule").then((mod) => mod.CouriersPaymentsModule),
  { loading: ModuleLoading },
);
const MarketingCampaignsModule = dynamic(
  () =>
    import("@/components/admin/MarketingCampaignsModule").then(
      (mod) => mod.MarketingCampaignsModule,
    ),
  { loading: ModuleLoading },
);
const AiStudioModule = dynamic(
  () => import("@/components/admin/AiStudioModule").then((mod) => mod.AiStudioModule),
  { loading: ModuleLoading },
);
const FinancialReportsModule = dynamic(
  () =>
    import("@/components/admin/FinancialReportsModule").then((mod) => mod.FinancialReportsModule),
  { loading: ModuleLoading },
);
const SecurityRbacModule = dynamic(
  () => import("@/components/admin/SecurityRbacModule").then((mod) => mod.SecurityRbacModule),
  { loading: ModuleLoading },
);
const CmsBlogSeoModule = dynamic(
  () => import("@/components/admin/CmsBlogSeoModule").then((mod) => mod.CmsBlogSeoModule),
  { loading: ModuleLoading },
);
const ReviewsAbandonedCartsModule = dynamic(
  () =>
    import("@/components/admin/ReviewsAbandonedCartsModule").then(
      (mod) => mod.ReviewsAbandonedCartsModule,
    ),
  { loading: ModuleLoading },
);
const MediaLibraryModule = dynamic(
  () => import("@/components/admin/MediaLibraryModule").then((mod) => mod.MediaLibraryModule),
  { loading: ModuleLoading },
);
const ApiWebhooksHealthModule = dynamic(
  () =>
    import("@/components/admin/ApiWebhooksHealthModule").then((mod) => mod.ApiWebhooksHealthModule),
  { loading: ModuleLoading },
);
const StorefrontModule = dynamic(
  () =>
    import("@/components/admin/storefront/StorefrontModule").then((mod) => mod.StorefrontModule),
  { loading: ModuleLoading },
);

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  isActive: boolean;
  walletBalance: number;
  rewardPoints: number;
  createdAt: string | null;
  lastLoginAt: string | null;
};

export type AdminSummary = {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  admins: number;
  staff: number;
  customers: number;
};

export type AdminOrderStats = {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  recentOrders: any[];
};

export type AdminProductStats = {
  totalProducts: number;
  lowStockProducts: number;
  productsList: any[];
};

type AdminDashboardClientProps = {
  users: AdminUserRow[];
  summary: AdminSummary;
  filters: {
    q: string;
    role: string;
    page: number;
    pageSize: number;
  };
  total: number;
  totalPages: number;
  orderStats: AdminOrderStats;
  productStats: AdminProductStats;
  initialCoupons?: any[];
  initialCategories?: any[];
  initialSettings?: any;
  viewerName: string;
  viewerRole: UserRole;
  marketplaceStats: { pendingProducts: number; pendingVendors: number };
};

const roleOptions: Array<{ label: string; value: string }> = [
  { label: "All roles", value: "all" },
  { label: "Super admin", value: "super_admin" },
  { label: "Admin", value: "admin" },
  { label: "Staff (Moderator)", value: "staff" },
  { label: "Customer", value: "customer" },
  { label: "Vendor", value: "vendor" },
];

const roleStyles: Record<UserRole, string> = {
  super_admin: "bg-purple-500/15 text-purple-700 dark:text-purple-400 font-bold",
  admin: "bg-primary text-primary-foreground font-bold",
  staff: "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold",
  customer: "bg-secondary text-foreground",
  vendor: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold",
};

export default function AdminDashboardClient({
  users: initialUsers,
  summary,
  filters,
  total,
  totalPages,
  orderStats,
  productStats,
  initialCoupons = [],
  initialCategories = [],
  initialSettings = {},
  viewerName,
  viewerRole,
  marketplaceStats,
}: AdminDashboardClientProps) {
  useRequireAuth({ roles: ["super_admin", "admin", "staff"] });

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [seasonalTheme, setSeasonalTheme] = useState<BDSeasonalTheme>("standard");

  // Notifications State
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: "notif_1",
      title: "New bKash Order #ORD-2026-8802",
      message: "Ayesha Rahman placed an order for Gold Pavé Ring Stack (৳1,890) from Dhanmondi.",
      type: "order",
      timestamp: "5 mins ago",
      isRead: false,
    },
    {
      id: "notif_2",
      title: "Low Stock Alert: Ivory Classic Watch",
      message: "Only 3 units remaining in Dhaka Central Hub. Reorder recommended.",
      type: "inventory",
      timestamp: "20 mins ago",
      isRead: false,
    },
    {
      id: "notif_3",
      title: "Refund Request: ORD-2026-8798",
      message: "Customer requested bKash refund due to transit size replacement.",
      type: "refund",
      timestamp: "1 hour ago",
      isRead: true,
    },
  ]);

  // State Management for Interactive Admin Features
  const [usersList, setUsersList] = useState<AdminUserRow[]>(initialUsers);
  const [orders, setOrders] = useState(orderStats.recentOrders);
  const [products, setProducts] = useState(productStats.productsList);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [categories, setCategories] = useState(initialCategories);

  // Store Customization & Settings State
  const [siteDescription, setSiteDescription] = useState(
    initialSettings.siteDescription ||
      "Authentic Korean skincare, beauty & lifestyle accessories for Bangladesh",
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    String(initialSettings.shipping?.freeShippingThreshold ?? 2000),
  );
  const [insideDhakaFee, setInsideDhakaFee] = useState(
    String(initialSettings.shipping?.insideDhakaCost ?? 70),
  );
  const [outsideDhakaFee, setOutsideDhakaFee] = useState(
    String(initialSettings.shipping?.outsideDhakaCost ?? 120),
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modals & Form States
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [adminCurrentPassword, setAdminCurrentPassword] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [showAdminNewPass, setShowAdminNewPass] = useState(false);
  const [showAdminCurrPass, setShowAdminCurrPass] = useState(false);
  const [isUpdatingAdminPassword, setIsUpdatingAdminPassword] = useState(false);

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewPassword || adminNewPassword.length < 10) {
      toast.error("Password must be at least 10 characters long");
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setIsUpdatingAdminPassword(true);
    try {
      const res = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: adminCurrentPassword,
          newPassword: adminNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      toast.success("Password updated successfully in database!");
      setShowChangePasswordModal(false);
      setAdminCurrentPassword("");
      setAdminNewPassword("");
      setAdminConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingAdminPassword(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read!");
  };

  // --- Handlers for User Role Updates ---
  const handleUserRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update user role");

      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      toast.error("Failed to update user role");
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Optimistically update UI
    setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u)));
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update user status");
      toast.success(`User status updated to ${newStatus ? "ACTIVE" : "SUSPENDED"}`);
    } catch (err) {
      // Revert on failure
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: currentStatus } : u)),
      );
      toast.error("Failed to update user status");
    }
  };

  // --- Handlers for Order Status Updates ---
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // --- Handlers for Store Settings & Customization ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Name, logo, contact details and social links are edited in "Website design"
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
      toast.success("Store settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --- Handler for Inventory Stock Updates ---
  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!res.ok) throw new Error("Failed to update stock");

      // Sync the products list in the parent state too
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, stock: newStock } : p)));
    } catch (err) {
      toast.error("Failed to save stock update to database");
      throw err; // Re-throw so the inventory module can handle revert
    }
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  // Brands and categories can be changed by admins; staff can view them and manage products
  const canManageCatalog = viewerRole === "super_admin" || viewerRole === "admin";

  const firstName = viewerName.trim().split(/\s+/)[0] || "there";
  const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

  // Only real, actionable counts — each row links to the place where it gets resolved
  const allAttentionItems: Array<{
    count: number;
    singular: string;
    plural: string;
    action: string;
    tab: AdminTab;
    /** Hidden when zero, so the list only grows when the marketplace needs attention */
    optional?: boolean;
  }> = [
    {
      count: orderStats.pendingOrders,
      singular: "order is waiting to be confirmed",
      plural: "orders are waiting to be confirmed",
      action: "Review orders",
      tab: "orders",
    },
    {
      count: productStats.lowStockProducts,
      singular: "product has 5 or fewer left in stock",
      plural: "products have 5 or fewer left in stock",
      action: "Check stock",
      tab: "inventory",
    },
    {
      count: marketplaceStats.pendingProducts,
      singular: "vendor product is waiting for your review",
      plural: "vendor products are waiting for your review",
      action: "Review products",
      tab: "vendors",
      optional: true,
    },
    {
      count: marketplaceStats.pendingVendors,
      singular: "vendor store is waiting for approval",
      plural: "vendor stores are waiting for approval",
      action: "Review vendors",
      tab: "vendors",
      optional: true,
    },
  ];
  const attentionItems = allAttentionItems.filter((item) => !item.optional || item.count > 0);
  const hasAttention = attentionItems.some((item) => item.count > 0);

  const glance = [
    { label: "Revenue", value: `৳${formatNumber(orderStats.totalRevenue)}` },
    { label: "Orders", value: formatNumber(orderStats.totalOrders) },
    { label: "Products", value: formatNumber(productStats.totalProducts) },
    { label: "Customers", value: formatNumber(summary.customers) },
  ];

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      <GlobalCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        products={products}
        orders={orders}
        users={usersList}
      />

      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        pendingOrdersCount={orderStats.pendingOrders}
        lowStockCount={productStats.lowStockProducts}
        vendorsCount={marketplaceStats.pendingProducts + marketplaceStats.pendingVendors}
      />

      <div className="min-w-0 flex flex-col">
        <AdminHeader
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onChangePassword={() => setShowChangePasswordModal(true)}
          notifications={notifications}
          setActiveTab={setActiveTab}
        />

        <main
          id="admin-main"
          className="flex-1 w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 py-6 space-y-6"
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              <section
                aria-labelledby="today-heading"
                className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"
              >
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <h2
                    id="today-heading"
                    className="font-serif text-2xl sm:text-3xl text-foreground"
                  >
                    Welcome back, {firstName}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hasAttention
                      ? "Here is what needs you today."
                      : "Nothing is waiting on you right now."}
                  </p>

                  <ul className="mt-4 divide-y divide-border">
                    {attentionItems.map((item) => (
                      <li
                        key={item.tab}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 py-3.5"
                      >
                        <span
                          className={`w-12 shrink-0 font-serif text-3xl leading-none tabular-nums ${
                            item.count ? "text-primary" : "text-muted-foreground/50"
                          }`}
                        >
                          {item.count}
                        </span>
                        <p className="flex-1 min-w-40 text-sm text-foreground">
                          {item.count === 1 ? item.singular : item.plural}
                        </p>
                        <button
                          onClick={() => setActiveTab(item.tab)}
                          className="ml-16 sm:ml-0 shrink-0 h-9 px-3.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {item.action}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <h2 className="text-sm font-semibold text-foreground font-sans tracking-normal">
                    Store at a glance
                  </h2>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                    {glance.map((g) => (
                      <div key={g.label}>
                        <dt className="text-xs text-muted-foreground">{g.label}</dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                          {g.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-5 text-xs text-muted-foreground">
                    Revenue excludes cancelled orders.
                  </p>
                </div>
              </section>

              <SalesAnalyticsModule
                orders={orders}
                products={products}
                totalRevenue={orderStats.totalRevenue}
              />
            </div>
          )}

          {/* 2. Analytics Tab */}
          {activeTab === "analytics" && (
            <SalesAnalyticsModule
              orders={orders}
              products={products}
              totalRevenue={orderStats.totalRevenue}
            />
          )}

          {/* 3. Orders Tab */}
          {activeTab === "orders" && (
            <OrderManagementModule orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
          )}

          {/* 4–5. Catalog: products, brands, categories (each module loads its own data) */}
          {activeTab === "products" && <ProductManagerModule />}
          {activeTab === "brands" && <BrandManagerModule canManage={canManageCatalog} />}
          {activeTab === "categories" && <CategoryManagerModule canManage={canManageCatalog} />}

          {/* 6. Multi-Warehouse & Inventory Tab */}
          {activeTab === "inventory" && (
            <InventoryWarehouseModule
              products={products}
              onUpdateProductStock={handleUpdateProductStock}
            />
          )}

          {/* 7. Customers CRM Tab */}
          {activeTab === "customers" && (
            <CustomerCrmModule users={usersList} onToggleUserStatus={handleToggleUserStatus} />
          )}

          {/* 8. Multi-Vendor Tab */}
          {activeTab === "vendors" && (
            <MultiVendorModule
              categories={categories.map((c: any) => ({ _id: String(c._id), name: c.name }))}
              canManage={viewerRole === "super_admin" || viewerRole === "admin"}
            />
          )}

          {/* 9. Returns & Refunds Tab */}
          {activeTab === "returns" && <ReturnsRefundsModule />}

          {/* 10. Couriers & Payments BD Tab */}
          {activeTab === "couriers_payments" && <CouriersPaymentsModule />}

          {/* 11. Marketing & Campaigns Tab */}
          {activeTab === "marketing" && (
            <MarketingCampaignsModule
              coupons={coupons}
              seasonalTheme={seasonalTheme}
              setSeasonalTheme={setSeasonalTheme}
            />
          )}

          {/* 12. AI Studio Tab */}
          {activeTab === "ai_studio" && <AiStudioModule />}

          {/* 13. Finance Tab */}
          {activeTab === "finance" && (
            <FinancialReportsModule totalRevenue={orderStats.totalRevenue} />
          )}

          {/* 14. CMS & SEO Tab */}
          {activeTab === "cms_blog" && <CmsBlogSeoModule />}

          {/* 15. Reviews & Abandoned Carts Tab */}
          {activeTab === "reviews_abandoned" && <ReviewsAbandonedCartsModule />}

          {/* 16. Media Library Tab */}
          {activeTab === "media" && <MediaLibraryModule />}

          {/* 17. Security & RBAC Tab */}
          {activeTab === "security_rbac" && <SecurityRbacModule />}

          {/* 18. API & System Health Tab */}
          {activeTab === "api_health" && <ApiWebhooksHealthModule />}

          {/* Website design: logo, homepage, footer, contact */}
          {activeTab === "storefront" && <StorefrontModule />}

          {/* 19. Store Settings Tab */}
          {activeTab === "settings" && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-xs space-y-6 max-w-4xl">
              <div>
                <h2 className="font-serif text-2xl font-bold">Store settings & delivery charges</h2>
                <p className="text-xs text-muted-foreground">
                  Search description and delivery fees used at checkout
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <p className="text-sm text-foreground">
                  Store name, logo, contact details, social links, homepage and footer are now in{" "}
                  <strong>Website design</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("storefront")}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                >
                  Open Website design
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="site-description" className="block font-semibold mb-1">
                    Store description (shown to Google and when links are shared)
                  </label>
                  <textarea
                    id="site-description"
                    rows={3}
                    maxLength={1000}
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                  />
                </div>

                {/* Delivery Charges */}
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                  <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    Bangladeshi Shipping Fees
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Inside Dhaka Fee (৳)
                      </label>
                      <input
                        type="number"
                        value={insideDhakaFee}
                        onChange={(e) => setInsideDhakaFee(e.target.value)}
                        className="w-full p-2 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Outside Dhaka Fee (৳)
                      </label>
                      <input
                        type="number"
                        value={outsideDhakaFee}
                        onChange={(e) => setOutsideDhakaFee(e.target.value)}
                        className="w-full p-2 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Free Delivery Min Spend (৳)
                      </label>
                      <input
                        type="number"
                        value={freeShippingThreshold}
                        onChange={(e) => setFreeShippingThreshold(e.target.value)}
                        className="w-full p-2 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center gap-2 shadow-xs"
                  >
                    {isSavingSettings ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Save settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg">Change Admin Password</h3>
              </div>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="p-1 rounded-xl hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground text-[11px]">
              Update the login security password for <strong>{user?.name || "Admin"}</strong> (
              {user?.email || "admin@koreanskincare.bd"}).
            </p>

            <form onSubmit={handleAdminPasswordSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">
                  Current Password{" "}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminCurrPass ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={adminCurrentPassword}
                    onChange={(e) => setAdminCurrentPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminCurrPass(!showAdminCurrPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAdminCurrPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminNewPass ? "text" : "password"}
                    required
                    placeholder="Min 6-8 chars"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden pr-9 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAdminNewPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {adminNewPassword && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        adminNewPassword.length > 10
                          ? "bg-emerald-500"
                          : adminNewPassword.length >= 6
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                    />
                    <span
                      className={
                        adminNewPassword.length > 10
                          ? "text-emerald-600 font-bold"
                          : adminNewPassword.length >= 6
                            ? "text-amber-600 font-bold"
                            : "text-rose-600 font-bold"
                      }
                    >
                      {adminNewPassword.length > 10
                        ? "Strong"
                        : adminNewPassword.length >= 6
                          ? "Good"
                          : "Too Short"}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden text-xs font-mono"
                />
                {adminConfirmPassword && adminConfirmPassword !== adminNewPassword && (
                  <p className="text-rose-500 text-[10px] mt-1 font-semibold">
                    Passwords do not match
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isUpdatingAdminPassword ||
                    !adminNewPassword ||
                    adminNewPassword !== adminConfirmPassword
                  }
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingAdminPassword ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isUpdatingAdminPassword ? "Saving..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
