"use client";

import Link from "next/link";
import React, { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

import { useRequireAuth } from "@/hooks/use-require-auth";
import type { UserRole } from "@/types";
import type { AdminTab, BDSeasonalTheme, AdminNotification } from "@/components/admin/types";

// Modular Enterprise Components
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GlobalCommandPalette } from "@/components/admin/GlobalCommandPalette";
import { NotificationDrawer } from "@/components/admin/NotificationDrawer";
import { SalesAnalyticsModule } from "@/components/admin/SalesAnalyticsModule";
import { OrderManagementModule } from "@/components/admin/OrderManagementModule";
import { CustomerCrmModule } from "@/components/admin/CustomerCrmModule";
import { InventoryWarehouseModule } from "@/components/admin/InventoryWarehouseModule";
import { MultiVendorModule } from "@/components/admin/MultiVendorModule";
import { ReturnsRefundsModule } from "@/components/admin/ReturnsRefundsModule";
import { CouriersPaymentsModule } from "@/components/admin/CouriersPaymentsModule";
import { MarketingCampaignsModule } from "@/components/admin/MarketingCampaignsModule";
import { AiStudioModule } from "@/components/admin/AiStudioModule";
import { FinancialReportsModule } from "@/components/admin/FinancialReportsModule";
import { SecurityRbacModule } from "@/components/admin/SecurityRbacModule";
import { CmsBlogSeoModule } from "@/components/admin/CmsBlogSeoModule";
import { ReviewsAbandonedCartsModule } from "@/components/admin/ReviewsAbandonedCartsModule";
import { MediaLibraryModule } from "@/components/admin/MediaLibraryModule";
import { ApiWebhooksHealthModule } from "@/components/admin/ApiWebhooksHealthModule";

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
};

const roleOptions: Array<{ label: string; value: string }> = [
  { label: "All roles", value: "all" },
  { label: "Super admin", value: "super_admin" },
  { label: "Admin", value: "admin" },
  { label: "Staff (Moderator)", value: "staff" },
  { label: "Customer", value: "customer" },
];

const roleStyles: Record<UserRole, string> = {
  super_admin: "bg-purple-500/15 text-purple-700 dark:text-purple-400 font-bold",
  admin: "bg-primary text-primary-foreground font-bold",
  staff: "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold",
  customer: "bg-secondary text-foreground",
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
  const [siteName, setSiteName] = useState(initialSettings.siteName || "Shajgoj.bd");
  const [siteDescription, setSiteDescription] = useState(
    initialSettings.siteDescription ||
      "Premium beauty, jewelry & lifestyle accessories for Bangladesh",
  );
  const [contactEmail, setContactEmail] = useState(
    initialSettings.contactEmail || "hello@shajgoj.bd",
  );
  const [contactPhone, setContactPhone] = useState(
    initialSettings.contactPhone || "+880 1711-223344",
  );
  const [storeAddress, setStoreAddress] = useState(
    initialSettings.address || "House 42, Road 11, Banani, Dhaka 1213, Bangladesh",
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
  const [instagramUrl, setInstagramUrl] = useState(
    initialSettings.socialLinks?.instagram || "https://instagram.com/shajgojbd",
  );
  const [facebookUrl, setFacebookUrl] = useState(
    initialSettings.socialLinks?.facebook || "https://facebook.com/shajgojbd",
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialSettings.socialLinks?.whatsapp || "+8801711223344",
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modals & Form States
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form inputs for Add/Edit Product
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodComparePrice, setProdComparePrice] = useState("");
  const [prodStock, setProdStock] = useState("25");
  const [prodCategory, setProdCategory] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodFeatured, setProdFeatured] = useState(true);
  const [prodNewArrival, setProdNewArrival] = useState(false);
  const [prodBestseller, setProdBestseller] = useState(false);
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);

  // Form inputs for Add/Edit Category
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catImage, setCatImage] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

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

  // --- Handlers for Product Management ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      toast.error("Product name and price are required");
      return;
    }

    setIsSubmittingProd(true);
    try {
      if (editingProduct) {
        // Edit existing product
        const res = await fetch("/api/admin/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct._id,
            name: prodName,
            price: Number(prodPrice),
            compareAtPrice: prodComparePrice ? Number(prodComparePrice) : undefined,
            stock: Number(prodStock),
            category: prodCategory || editingProduct.category?._id || editingProduct.category,
            description: prodDescription,
            images: prodImage ? [prodImage] : editingProduct.images,
            isFeatured: prodFeatured,
            isNewArrival: prodNewArrival,
            isBestseller: prodBestseller,
          }),
        });

        if (!res.ok) throw new Error("Failed to update product");
        const updated = await res.json();

        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        toast.success("Product updated successfully!");
      } else {
        // Create new product
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: prodName,
            price: Number(prodPrice),
            compareAtPrice: prodComparePrice ? Number(prodComparePrice) : undefined,
            stock: Number(prodStock),
            category: prodCategory || categories[0]?._id,
            description: prodDescription,
            images: prodImage
              ? [prodImage]
              : ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"],
            isFeatured: prodFeatured,
            isNewArrival: prodNewArrival,
            isBestseller: prodBestseller,
          }),
        });

        if (!res.ok) throw new Error("Failed to create product");
        const newProd = await res.json();

        setProducts((prev) => [newProd, ...prev]);
        toast.success("New product created successfully!");
      }

      setShowAddProductModal(false);
      setEditingProduct(null);
      resetProdForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setIsSubmittingProd(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");

      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdPrice(String(product.price));
    setProdComparePrice(product.compareAtPrice ? String(product.compareAtPrice) : "");
    setProdStock(String(product.stock ?? 10));
    setProdCategory(
      typeof product.category === "object" ? product.category?._id : product.category || "",
    );
    setProdImage(product.images?.[0] || "");
    setProdDescription(product.description || "");
    setProdFeatured(Boolean(product.isFeatured));
    setProdNewArrival(Boolean(product.isNewArrival));
    setProdBestseller(Boolean(product.isBestseller));
    setShowAddProductModal(true);
  };

  const resetProdForm = () => {
    setProdName("");
    setProdPrice("");
    setProdComparePrice("");
    setProdStock("25");
    setProdCategory(categories[0]?._id || "");
    setProdImage("");
    setProdDescription("");
    setProdFeatured(true);
    setProdNewArrival(false);
    setProdBestseller(false);
  };

  // --- Handlers for Category Management ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) {
      toast.error("Category name is required");
      return;
    }

    setIsSubmittingCat(true);
    try {
      if (editingCategory) {
        const res = await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory._id,
            name: catName,
            slug: catSlug || catName.toLowerCase().replace(/\s+/g, "-"),
            description: catDescription,
            image: catImage,
          }),
        });

        if (!res.ok) throw new Error("Failed to update category");
        const updated = await res.json();
        setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
        toast.success("Category updated successfully!");
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: catName,
            slug: catSlug || catName.toLowerCase().replace(/\s+/g, "-"),
            description: catDescription,
            image: catImage,
          }),
        });

        if (!res.ok) throw new Error("Failed to create category");
        const newCat = await res.json();
        setCategories((prev) => [...prev, newCat]);
        toast.success("New category added!");
      }

      setShowAddCategoryModal(false);
      setEditingCategory(null);
      setCatName("");
      setCatSlug("");
      setCatImage("");
      setCatDescription("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      setCategories((prev) => prev.filter((c) => c._id !== id));
      toast.success("Category removed");
    } catch (err) {
      toast.error("Failed to delete category");
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
        body: JSON.stringify({
          siteName,
          siteDescription,
          contactEmail,
          contactPhone,
          address: storeAddress,
          shipping: {
            freeShippingThreshold: Number(freeShippingThreshold),
            insideDhakaCost: Number(insideDhakaFee),
            outsideDhakaCost: Number(outsideDhakaFee),
          },
          socialLinks: {
            instagram: instagramUrl,
            facebook: facebookUrl,
            whatsapp: whatsappNumber,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Store configuration & custom settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --- Handler for Inventory Stock Updates ---
  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, stock: newStock }),
      });

      if (!res.ok) throw new Error("Failed to update stock");

      // Sync the products list in the parent state too
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, stock: newStock } : p)));
    } catch (err) {
      toast.error("Failed to save stock update to database");
      throw err; // Re-throw so the inventory module can handle revert
    }
  };

  // --- Handlers for Database Seeding ---
  const handleSeedDatabase = async () => {
    if (
      !confirm(
        "This will initialize/refresh sample products, categories, coupons, orders, and test users in MongoDB for Shajgoj.bd. Proceed?",
      )
    ) {
      return;
    }
    setIsSeedingDb(true);
    try {
      const res = await fetch("/api/seed?force=true", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed");

      toast.success("Database seeded with luxury products, categories & user accounts!");
      setShowCredentialsModal(true);
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (err: any) {
      toast.error(err.message || "Database seed failed");
    } finally {
      setIsSeedingDb(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Global Command Palette */}
      <GlobalCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        products={products}
        orders={orders}
        users={usersList}
      />

      {/* Real-time Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Workspace Layout (Sidebar + Content Area) */}
      <div className="flex-1 flex min-h-screen">
        {/* Enterprise Grouped Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          pendingOrdersCount={orderStats.pendingOrders}
          lowStockCount={productStats.lowStockProducts}
          returnsCount={2}
        />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Enterprise Header */}
          <AdminHeader
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenNotifications={() => setNotificationsOpen(true)}
            notifications={notifications}
            seasonalTheme={seasonalTheme}
            setSeasonalTheme={setSeasonalTheme}
            setActiveTab={setActiveTab}
          />

          {/* Main Module Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-6">
            {/* 1. Executive Overview Subview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Hero Summary & Quick Action Bar */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-primary font-bold">
                        Executive Operations
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Live & Connected
                      </span>
                    </div>
                    <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight mt-1">
                      Shajgoj.bd Enterprise Hub
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowCredentialsModal(true)}
                      className="px-3.5 py-2 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span>Test Logins</span>
                    </button>

                    <button
                      disabled={isSeedingDb}
                      onClick={handleSeedDatabase}
                      className="px-3.5 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSeedingDb ? "animate-spin" : ""}`} />
                      <span>{isSeedingDb ? "Seeding..." : "Refresh Seed DB"}</span>
                    </button>
                  </div>
                </div>

                {/* Sales Analytics Overview Component */}
                <SalesAnalyticsModule
                  orders={orders}
                  products={products}
                  totalRevenue={orderStats.totalRevenue}
                />

                {/* Quick Shortcuts to Modules */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="p-5 rounded-3xl bg-card border border-border hover:border-primary/50 text-left transition shadow-xs space-y-2 group"
                  >
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary w-fit group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Orders & Fulfillment</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {orderStats.pendingOrders} pending orders awaiting courier dispatch.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab("inventory")}
                    className="p-5 rounded-3xl bg-card border border-border hover:border-primary/50 text-left transition shadow-xs space-y-2 group"
                  >
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 w-fit group-hover:scale-110 transition-transform">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Multi-Warehouse Stock</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Dhaka, Chattogram and Banani POS hubs stock levels.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab("marketing")}
                    className="p-5 rounded-3xl bg-card border border-border hover:border-primary/50 text-left transition shadow-xs space-y-2 group"
                  >
                    <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 w-fit group-hover:scale-110 transition-transform">
                      <Flame className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Eid & Festive Campaigns</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Launch promotional codes & Greenweb SMS broadcasts.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab("ai_studio")}
                    className="p-5 rounded-3xl bg-card border border-border hover:border-primary/50 text-left transition shadow-xs space-y-2 group"
                  >
                    <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 w-fit group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">AI Studio & Forecaster</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      AI product copywriting, SEO tags & background enhancement.
                    </p>
                  </button>
                </div>
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
              <OrderManagementModule
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {/* 4. Products & Catalog Tab */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
                  <div>
                    <h2 className="font-serif text-2xl font-bold">Catalog & Products</h2>
                    <p className="text-xs text-muted-foreground">
                      Manage luxury jewelry, bags, watches, pricing & variants
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      resetProdForm();
                      setEditingProduct(null);
                      setShowAddProductModal(true);
                    }}
                    className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div
                      key={p._id || p.slug}
                      className="bg-card border border-border rounded-3xl p-4 shadow-xs space-y-3 hover:border-primary/40 transition flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="aspect-square bg-secondary/50 rounded-2xl overflow-hidden relative">
                          <img
                            src={
                              p.images?.[0] ||
                              "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"
                            }
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                            {typeof p.category === "object"
                              ? p.category?.name
                              : p.category || "General"}
                          </span>
                        </div>

                        <h3 className="font-bold text-xs text-foreground line-clamp-1">{p.name}</h3>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-primary text-sm">
                            ৳{p.price?.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            Stock: {p.stock || 0} units
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-border">
                        <button
                          onClick={() => openEditProductModal(p)}
                          className="flex-1 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold flex items-center justify-center gap-1 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="p-1.5 rounded-xl border border-border hover:bg-rose-500/10 text-rose-600 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Categories Tab */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
                  <div>
                    <h2 className="font-serif text-2xl font-bold">Categories & Collections</h2>
                    <p className="text-xs text-muted-foreground">
                      Organize product hierarchy, SEO slugs & promotional badges
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCatName("");
                      setCatSlug("");
                      setCatImage("");
                      setCatDescription("");
                      setShowAddCategoryModal(true);
                    }}
                    className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Category</span>
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((c) => (
                    <div
                      key={c._id || c.slug}
                      className="bg-card border border-border rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif font-bold text-base">{c.name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-secondary border border-border">
                            /{c.slug}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {c.description || "Curated collection"}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCatName(c.name);
                            setCatSlug(c.slug);
                            setCatImage(c.image || "");
                            setCatDescription(c.description || "");
                            setShowAddCategoryModal(true);
                          }}
                          className="px-3 py-1 rounded-xl border border-border hover:bg-secondary text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c._id)}
                          className="p-1 rounded-xl border border-border hover:bg-rose-500/10 text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            {activeTab === "vendors" && <MultiVendorModule />}

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

            {/* 19. Store Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-xs space-y-6 max-w-4xl">
                <div>
                  <h2 className="font-serif text-2xl font-bold">
                    Store Configuration & Delivery Rules
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Customize store name, contact hotline, shipping thresholds & social integrations
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Store Name</label>
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Official Support Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Official Hotline / Phone</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">WhatsApp Hotline Number</label>
                      <input
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">
                      Physical Flagship Store Address
                    </label>
                    <input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
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
                      <span>Save Store Configuration</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-lg">
                {editingProduct ? "Edit Product" : "Add New Catalog Product"}
              </h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-xl hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blush Mini Crossbody Bag"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background font-medium focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Selling Price (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Compare Price (৳)</label>
                  <input
                    type="number"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background capitalize focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c._id || c.slug} value={c._id || c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Initial Stock Level</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Image URL (Cloudinary / Web)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-[11px] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={prodFeatured}
                    onChange={(e) => setProdFeatured(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>Featured Edit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={prodNewArrival}
                    onChange={(e) => setProdNewArrival(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>New Drop</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={prodBestseller}
                    onChange={(e) => setProdBestseller(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>Bestseller</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProd}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center gap-2"
                >
                  {isSubmittingProd ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingProduct ? "Save Changes" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-lg">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 rounded-xl hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g. jewelry, bags"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition"
                >
                  {isSubmittingCat
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Logins Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg">Default Demo Accounts</h3>
              </div>
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="p-1 rounded-xl hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground">
              These pre-seeded accounts let you test different access levels across the platform:
            </p>

            <div className="space-y-2">
              {[
                { role: "Super Admin", email: "superadmin@shajgoj.bd", pass: "admin123" },
                { role: "Store Admin", email: "admin@shajgoj.bd", pass: "admin123" },
                { role: "Store Staff", email: "staff@shajgoj.bd", pass: "staff123" },
                { role: "Customer", email: "customer@shajgoj.bd", pass: "customer123" },
              ].map((acc) => (
                <div
                  key={acc.email}
                  className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-foreground">{acc.role}</span>
                    <div className="text-[11px] text-muted-foreground">
                      {acc.email} · Pass: <strong>{acc.pass}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(acc.email, acc.email)}
                    className="p-1.5 rounded-lg border border-border hover:bg-secondary text-primary transition"
                    title="Copy Email"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
