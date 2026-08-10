"use client";

import Link from "next/link";
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

import { useRequireAuth } from "@/hooks/use-require-auth";
import type { UserRole } from "@/types";

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

  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "products" | "categories" | "coupons" | "customization" | "users" | "reports"
  >("overview");

  // State Management for Interactive Admin Features
  const [usersList, setUsersList] = useState<AdminUserRow[]>(initialUsers);
  const [orders, setOrders] = useState(orderStats.recentOrders);
  const [products, setProducts] = useState(productStats.productsList);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [categories, setCategories] = useState(initialCategories);

  // Store Customization & Settings State
  const [siteName, setSiteName] = useState(initialSettings.siteName || "Noors.bd");
  const [siteDescription, setSiteDescription] = useState(
    initialSettings.siteDescription || "Premium accessories for the modern woman of Bangladesh"
  );
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail || "hello@noors.bd");
  const [contactPhone, setContactPhone] = useState(initialSettings.contactPhone || "+880 1711-223344");
  const [storeAddress, setStoreAddress] = useState(
    initialSettings.address || "House 42, Road 11, Banani, Dhaka 1213, Bangladesh"
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    String(initialSettings.shipping?.freeShippingThreshold ?? 2000)
  );
  const [insideDhakaFee, setInsideDhakaFee] = useState(
    String(initialSettings.shipping?.insideDhakaCost ?? 70)
  );
  const [outsideDhakaFee, setOutsideDhakaFee] = useState(
    String(initialSettings.shipping?.outsideDhakaCost ?? 120)
  );
  const [instagramUrl, setInstagramUrl] = useState(
    initialSettings.socialLinks?.instagram || "https://instagram.com/noorsbd"
  );
  const [facebookUrl, setFacebookUrl] = useState(
    initialSettings.socialLinks?.facebook || "https://facebook.com/noorsbd"
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialSettings.socialLinks?.whatsapp || "+8801711223344"
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modals & Form States
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
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

  // Form inputs for Add Coupon
  const [cpCode, setCpCode] = useState("");
  const [cpType, setCpType] = useState("percentage");
  const [cpValue, setCpValue] = useState("");
  const [cpMinOrder, setCpMinOrder] = useState("1000");
  const [isSubmittingCp, setIsSubmittingCp] = useState(false);

  // Order filter state
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
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

      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      toast.error("Failed to update user role");
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
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
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
            images: prodImage ? [prodImage] : ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"],
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
    setProdCategory(typeof product.category === "object" ? product.category?._id : product.category || "");
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

  // --- Handlers for Coupon Management ---
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpCode || !cpValue) {
      toast.error("Coupon code and value are required");
      return;
    }

    setIsSubmittingCp(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cpCode,
          type: cpType,
          value: Number(cpValue),
          minOrderAmount: cpMinOrder ? Number(cpMinOrder) : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create coupon");
      const newCp = await res.json();

      setCoupons((prev) => [newCp, ...prev]);
      toast.success(`Coupon ${newCp.code} created!`);
      setShowAddCouponModal(false);
      setCpCode("");
      setCpValue("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    } finally {
      setIsSubmittingCp(false);
    }
  };

  const handleToggleCoupon = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });

      if (!res.ok) throw new Error("Failed to toggle coupon");

      setCoupons((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: !currentStatus } : c))
      );
      toast.success("Coupon status updated!");
    } catch (err) {
      toast.error("Failed to update coupon status");
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

  // --- Handlers for Database Seeding ---
  const handleSeedDatabase = async () => {
    if (!confirm("This will initialize/refresh sample products, categories, coupons, orders, and test users in MongoDB. Proceed?")) {
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

  // Filtered Orders
  const filteredOrders =
    orderStatusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === orderStatusFilter);

  // Calculate Reports Data
  const codOrders = orders.filter((o) => o.paymentMethod === "COD");
  const bkashOrders = orders.filter((o) => o.paymentMethod === "bKash");
  const nagadOrders = orders.filter((o) => o.paymentMethod === "Nagad");
  const avgOrderValue = orders.length > 0 ? Math.round(orderStats.totalRevenue / orders.length) : 0;

  return (
    <div className="min-h-screen bg-background pb-16">
      <section className="container-x py-8 lg:py-12 space-y-8">
        {/* Top Header Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
                Store Operations
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> System Online
              </span>
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl tracking-tight">Admin & Operations Hub</h1>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowCredentialsModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Users className="w-4 h-4 text-primary" /> View Login Credentials
            </button>

            <button
              disabled={isSeedingDb}
              onClick={handleSeedDatabase}
              className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeedingDb ? "animate-spin" : ""}`} />
              {isSeedingDb ? "Populating Database..." : "Seed / Reset DB"}
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-secondary/70 p-1.5 rounded-3xl border border-border overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "orders", label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: "products", label: `Products (${products.length})`, icon: Package },
            { id: "categories", label: `Categories (${categories.length})`, icon: Layers },
            { id: "coupons", label: `Coupons (${coupons.length})`, icon: Tag },
            { id: "customization", label: "Store Customization", icon: Sliders },
            { id: "users", label: `Users & Staff (${summary.totalUsers})`, icon: Users },
            { id: "reports", label: "Sales Analytics", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-up">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total Store Revenue"
                value={`৳${orderStats.totalRevenue.toLocaleString()}`}
                icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                subtext="Accumulated customer sales"
              />
              <MetricCard
                label="Total Orders"
                value={orders.length}
                icon={<ShoppingBag className="h-5 w-5 text-primary" />}
                subtext={`${orders.filter((o) => o.status === "pending").length} pending delivery`}
              />
              <MetricCard
                label="Catalog Products"
                value={products.length}
                icon={<Package className="h-5 w-5 text-amber-600" />}
                subtext={`${productStats.lowStockProducts} low inventory alerts`}
              />
              <MetricCard
                label="Registered Users"
                value={summary.totalUsers}
                icon={<Users className="h-5 w-5 text-indigo-600" />}
                subtext={`${summary.staff + summary.admins} admins & staff`}
              />
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="flex flex-wrap gap-3 p-5 rounded-3xl bg-secondary/30 border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground self-center mr-2">
                Quick Shortcuts:
              </span>
              <button
                onClick={() => {
                  resetProdForm();
                  setEditingProduct(null);
                  setShowAddProductModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatName("");
                  setCatSlug("");
                  setShowAddCategoryModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-card hover:bg-accent text-foreground border border-border text-xs font-medium transition flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-primary" /> Add Category
              </button>
              <button
                onClick={() => setShowAddCouponModal(true)}
                className="px-4 py-2 rounded-xl bg-card hover:bg-accent text-foreground border border-border text-xs font-medium transition flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-primary" /> Create Promo Coupon
              </button>
              <button
                onClick={() => setActiveTab("customization")}
                className="px-4 py-2 rounded-xl bg-card hover:bg-accent text-foreground border border-border text-xs font-medium transition flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-primary" /> Customize Store
              </button>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl">Recent Customer Orders</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Live store transactions & fulfillments</p>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  View all orders <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No customer orders recorded yet. Place an order or click "Seed DB".
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3">Order Ref</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Payment</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.slice(0, 6).map((order) => (
                        <tr key={order._id}>
                          <td className="py-4 font-mono font-bold text-xs">{order.orderNumber}</td>
                          <td className="py-4">
                            <p className="font-medium">{order.shippingAddress?.fullName || order.user?.name || "Guest"}</p>
                            <p className="text-xs text-muted-foreground">{order.shippingAddress?.phone || order.guestPhone}</p>
                          </td>
                          <td className="py-4 font-sans font-bold text-foreground">৳{order.total?.toLocaleString()}</td>
                          <td className="py-4 text-xs font-semibold">{order.paymentMethod}</td>
                          <td className="py-4">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                order.status === "delivered"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : order.status === "cancelled"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: ORDERS MANAGEMENT ─── */}
        {activeTab === "orders" && (
          <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-6 animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="font-serif text-2xl">Customer Orders Fulfillment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage delivery stages, verification and tracking</p>
              </div>

              {/* Filter by status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Filter:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-border bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Orders ({orders.length})</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No orders match the selected filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3">Order Ref</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Customer Details</th>
                      <th className="pb-3">Delivery Destination</th>
                      <th className="pb-3">Order Total</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="py-4 font-mono font-bold text-xs text-primary">{order.orderNumber}</td>
                        <td className="py-4 text-xs text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Live"}
                        </td>
                        <td className="py-4">
                          <p className="font-semibold text-xs text-foreground">
                            {order.shippingAddress?.fullName || "Valued Shopper"}
                          </p>
                          <p className="text-xs text-muted-foreground">{order.shippingAddress?.phone || order.guestPhone}</p>
                        </td>
                        <td className="py-4 text-xs">
                          <p className="font-medium text-foreground">{order.shippingAddress?.area}, {order.shippingAddress?.district}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{order.shippingAddress?.streetAddress}</p>
                        </td>
                        <td className="py-4 font-sans font-bold text-foreground">৳{order.total?.toLocaleString()}</td>
                        <td className="py-4 text-xs font-semibold">
                          <span className="px-2.5 py-1 rounded-full bg-secondary text-foreground">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4">
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order._id}
                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                            className="text-xs px-3 py-1.5 rounded-xl border border-border bg-background font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                          >
                            <option value="pending">🟡 pending</option>
                            <option value="confirmed">🔵 confirmed</option>
                            <option value="processing">🟣 processing</option>
                            <option value="shipped">🚚 shipped</option>
                            <option value="delivered">✅ delivered</option>
                            <option value="cancelled">❌ cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PRODUCTS MANAGEMENT ─── */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
              <div>
                <h2 className="font-serif text-2xl">Store Catalog ({products.length} Products)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage luxury inventory, prices, images & descriptions</p>
              </div>

              <button
                onClick={() => {
                  resetProdForm();
                  setEditingProduct(null);
                  setShowAddProductModal(true);
                }}
                className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add New Product
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="p-4 rounded-3xl border border-border bg-card shadow-sm space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div>
                    {product.images?.[0] && (
                      <div className="relative overflow-hidden rounded-2xl bg-secondary aspect-[4/5] mb-3">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.isFeatured && (
                          <span className="absolute top-2.5 left-2.5 bg-background/90 backdrop-blur text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="font-semibold text-sm truncate text-foreground">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-sans font-bold text-foreground">
                        ৳{product.price?.toLocaleString()}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-xs text-muted-foreground line-through font-sans">
                          ৳{product.compareAtPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2.5 text-xs">
                      <span className="text-muted-foreground">
                        Stock: <strong className="text-foreground">{product.stock ?? 0} units</strong>
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          (product.stock ?? 0) <= 5
                            ? "bg-destructive/10 text-destructive"
                            : "bg-emerald-500/10 text-emerald-600"
                        }`}
                      >
                        {(product.stock ?? 0) <= 5 ? "Low Stock" : "In Stock"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => openEditProductModal(product)}
                      className="flex-1 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold flex items-center justify-center gap-1 border border-border"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 4: CATEGORIES MANAGEMENT ─── */}
        {activeTab === "categories" && (
          <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-6 animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="font-serif text-2xl">Product Categories ({categories.length})</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Customize shop collections, navigation and imagery</p>
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
                className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
              {categories.map((category) => (
                <div
                  key={category._id || category.slug}
                  className="p-5 rounded-2xl border border-border bg-background space-y-4 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-xl font-bold text-foreground">{category.name}</h3>
                      <span className="text-xs font-mono bg-secondary px-2.5 py-0.5 rounded-full text-muted-foreground">
                        /{category.slug}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {category.description || "Collection of handcrafted accessories"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-primary font-medium">
                      <span>✦ Active in Main Navigation & Shop Filter</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setCatName(category.name);
                        setCatSlug(category.slug);
                        setCatImage(category.image || "");
                        setCatDescription(category.description || "");
                        setShowAddCategoryModal(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold flex items-center justify-center gap-1 border border-border"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 5: PROMO COUPONS ─── */}
        {activeTab === "coupons" && (
          <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-6 animate-fade-up">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-serif text-2xl">Promotional Discount Coupons</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage customer promo codes and campaign discounts</p>
              </div>

              <button
                onClick={() => setShowAddCouponModal(true)}
                className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>

            {coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No coupons created yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon._id} className="p-5 rounded-2xl border border-border bg-background space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-lg text-primary">{coupon.code}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          coupon.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Discount Value: <strong className="text-foreground">{coupon.value}% OFF</strong>
                    </p>
                    {coupon.minOrderAmount && (
                      <p className="text-xs text-muted-foreground">
                        Min. Order: <strong className="text-foreground">৳{coupon.minOrderAmount}</strong>
                      </p>
                    )}

                    <button
                      onClick={() => handleToggleCoupon(coupon._id, coupon.isActive)}
                      className="w-full py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold transition"
                    >
                      {coupon.isActive ? "Disable Coupon" : "Enable Coupon"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 6: STORE CUSTOMIZATION & BRANDING ─── */}
        {activeTab === "customization" && (
          <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-8 animate-fade-up">
            <div className="border-b border-border pb-4">
              <h2 className="font-serif text-2xl">Store Customization & Branding Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure store identity, delivery rates, contact info, and social channels
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-8 max-w-3xl">
              {/* Brand Identity */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" /> Store Identity & Branding
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Store Name</label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Brand Tagline</label>
                    <input
                      type="text"
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Rates */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> Shipping & Delivery Configuration
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">
                      Free Delivery Threshold (৳)
                    </label>
                    <input
                      type="number"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">
                      Inside Dhaka Delivery Fee (৳)
                    </label>
                    <input
                      type="number"
                      value={insideDhakaFee}
                      onChange={(e) => setInsideDhakaFee(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">
                      Outside Dhaka Delivery Fee (৳)
                    </label>
                    <input
                      type="number"
                      value={outsideDhakaFee}
                      onChange={(e) => setOutsideDhakaFee(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info & Location */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Contact Details & Address
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Support Email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Support Hotline</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1 font-medium">Store Physical Address</label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
              </div>

              {/* Social Channels */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Social Channels & WhatsApp
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Instagram URL</label>
                    <input
                      type="text"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Facebook Page URL</label>
                    <input
                      type="text"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">WhatsApp Number</label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSavingSettings ? "Saving Settings..." : "Save Store Customizations"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── TAB 7: USERS & STAFF ─── */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard label="Total Users" value={summary.totalUsers} icon={<Users className="h-5 w-5" />} />
              <MetricCard label="Active" value={summary.activeUsers} icon={<UserCheck className="h-5 w-5" />} />
              <MetricCard label="Verified" value={summary.verifiedUsers} icon={<BadgeCheck className="h-5 w-5" />} />
              <MetricCard label="Super Admins" value={summary.admins} icon={<ShieldCheck className="h-5 w-5" />} />
              <MetricCard label="Staff / Mods" value={summary.staff} icon={<Clock3 className="h-5 w-5" />} />
              <MetricCard label="Customers" value={summary.customers} icon={<Mail className="h-5 w-5" />} />
            </div>

            <div className="bg-card rounded-3xl border border-border p-6 lg:p-8 shadow-sm space-y-6">
              <form method="GET" className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search user by name or email..."
                    className="w-full rounded-2xl border border-border bg-background py-3 pl-11 pr-4 text-sm"
                  />
                </div>

                <select
                  name="role"
                  defaultValue={filters.role}
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                >
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
                >
                  Filter
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="pb-3">User Name & Email</th>
                      <th className="pb-3">Assigned Role</th>
                      <th className="pb-3">Account Status</th>
                      <th className="pb-3">Role Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td className="py-4">
                          <p className="font-medium text-sm text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="py-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${roleStyles[u.role]}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 text-xs font-semibold">
                          {u.isActive ? (
                            <span className="text-emerald-600">Active</span>
                          ) : (
                            <span className="text-destructive">Inactive</span>
                          )}
                        </td>
                        <td className="py-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleUserRoleChange(u.id, e.target.value as UserRole)}
                            className="text-xs px-3 py-1.5 rounded-xl border border-border bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="customer">Customer</option>
                            <option value="staff">Staff (Moderator)</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 8: SALES REPORTS & ANALYTICS ─── */}
        {activeTab === "reports" && (
          <div className="space-y-8 animate-fade-up">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-2">
                <p className="text-xs uppercase text-muted-foreground font-medium">Average Order Value (AOV)</p>
                <p className="font-sans text-3xl font-bold text-primary">৳{avgOrderValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Per successful customer checkout</p>
              </div>

              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-2">
                <p className="text-xs uppercase text-muted-foreground font-medium">Cash on Delivery (COD)</p>
                <p className="font-sans text-3xl font-bold text-foreground">{codOrders.length} orders</p>
                <p className="text-xs text-muted-foreground">
                  ৳{codOrders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()} volume
                </p>
              </div>

              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-2">
                <p className="text-xs uppercase text-muted-foreground font-medium">Digital Payments (bKash/Nagad)</p>
                <p className="font-sans text-3xl font-bold text-foreground">
                  {bkashOrders.length + nagadOrders.length} orders
                </p>
                <p className="text-xs text-muted-foreground">
                  ৳{(bkashOrders.concat(nagadOrders)).reduce((s, o) => s + (o.total || 0), 0).toLocaleString()} total volume
                </p>
              </div>
            </div>

            <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <h2 className="font-serif text-2xl">Payment Method Breakdown</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Cash on Delivery (COD)</span>
                    <span>{orders.length > 0 ? Math.round((codOrders.length / orders.length) * 100) : 100}%</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${orders.length > 0 ? (codOrders.length / orders.length) * 100 : 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>bKash Payment</span>
                    <span>{orders.length > 0 ? Math.round((bkashOrders.length / orders.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-pink-600 h-full rounded-full"
                      style={{ width: `${orders.length > 0 ? (bkashOrders.length / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Nagad Payment</span>
                    <span>{orders.length > 0 ? Math.round((nagadOrders.length / orders.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full"
                      style={{ width: `${orders.length > 0 ? (nagadOrders.length / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── MODAL: VIEW LOGIN CREDENTIALS ─── */}
      {showCredentialsModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-border p-6 lg:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-serif text-2xl font-bold">System Login Credentials</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use these credentials to log in and test all dashboard & customer features
                </p>
              </div>
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="p-2 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                {
                  role: "Super Admin",
                  email: "superadmin@noors.bd",
                  pass: "admin123",
                  desc: "Full access to settings, user management, orders & products",
                  badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
                },
                {
                  role: "Admin",
                  email: "admin@noors.bd",
                  pass: "admin123",
                  desc: "Full store management, inventory and coupons",
                  badgeColor: "bg-primary/10 text-primary",
                },
                {
                  role: "Staff (Moderator)",
                  email: "staff@noors.bd",
                  pass: "staff123",
                  desc: "Order processing & status fulfillment updates",
                  badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                },
                {
                  role: "Customer",
                  email: "customer@noors.bd",
                  pass: "customer123",
                  desc: "Shopping, checkout, order tracking and wishlist",
                  badgeColor: "bg-secondary text-foreground",
                },
              ].map((account) => (
                <div
                  key={account.email}
                  className="p-4 rounded-2xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${account.badgeColor}`}>
                        {account.role}
                      </span>
                      <span className="font-mono font-bold text-foreground text-xs">{account.email}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{account.desc}</p>
                    <p className="font-mono text-xs text-foreground font-semibold">Password: <span className="text-primary">{account.pass}</span></p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(`${account.email} / ${account.pass}`, account.email)}
                    className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 border border-border"
                  >
                    {copiedKey === account.email ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Info
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD/EDIT PRODUCT ─── */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-2xl font-bold">
                {editingProduct ? "Edit Store Item" : "Add New Item"}
              </h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Rose Gold Crystal Band"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1 font-medium">Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1 font-medium">Compare Price (৳)</label>
                  <input
                    type="number"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value)}
                    placeholder="3200"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1 font-medium">Stock Inventory</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1 font-medium">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c._id || c.slug} value={c._id || c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Image URL</label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Product Description</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFeatured}
                    onChange={(e) => setProdFeatured(e.target.checked)}
                    className="accent-primary"
                  />
                  Featured Item
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodNewArrival}
                    onChange={(e) => setProdNewArrival(e.target.checked)}
                    className="accent-primary"
                  />
                  New Arrival
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodBestseller}
                    onChange={(e) => setProdBestseller(e.target.checked)}
                    className="accent-primary"
                  />
                  Bestseller
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-3 rounded-full border border-border text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProd}
                  className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {isSubmittingProd ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD/EDIT CATEGORY ─── */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-2xl font-bold">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Brooches & Pins"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Slug (URL identifier)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. brooches"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Description</label>
                <input
                  type="text"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Short description..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 py-3 rounded-full border border-border text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {isSubmittingCat ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE COUPON ─── */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-2xl font-bold">Create Promo Coupon</h3>
              <button
                onClick={() => setShowAddCouponModal(false)}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={cpCode}
                  onChange={(e) => setCpCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Discount Percentage (%) *</label>
                <input
                  type="number"
                  required
                  value={cpValue}
                  onChange={(e) => setCpValue(e.target.value)}
                  placeholder="15"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Minimum Order Amount (৳)</label>
                <input
                  type="number"
                  value={cpMinOrder}
                  onChange={(e) => setCpMinOrder(e.target.value)}
                  placeholder="1000"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddCouponModal(false)}
                  className="flex-1 py-3 rounded-full border border-border text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCp}
                  className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {isSubmittingCp ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  subtext,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  subtext?: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 space-y-2 shadow-sm">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="font-sans text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}