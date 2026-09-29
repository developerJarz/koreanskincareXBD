import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AdminDashboardClient, { type AdminSummary, type AdminUserRow } from "./AdminDashboardClient";
import { connectDB } from "@/server/db/connection";
import { User, Order, Product, Coupon, Category, Settings, Vendor } from "@/server/db/models";
import { ADMIN_ROLES, getSessionUserFromCookies, STAFF_ROLES } from "@/server/auth/session";
import { escapeRegex } from "@/server/security/validation";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard — koreanskincare.bd",
  description:
    "Enterprise store operations, sales analytics, multi-warehouse & catalog management.",
};

const allowedRoles: UserRole[] = ["super_admin", "admin", "staff", "customer", "vendor"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  // Server-side guard: the dashboard data below must never be rendered for non-staff visitors
  const sessionUser = await getSessionUserFromCookies();
  if (!sessionUser) redirect("/auth/login");
  if (!STAFF_ROLES.includes(sessionUser.role)) redirect("/");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = resolvedSearchParams.q?.trim().slice(0, 100) ?? "";
  const role = allowedRoles.includes(resolvedSearchParams.role as UserRole)
    ? (resolvedSearchParams.role as UserRole)
    : "all";
  const page = Math.max(1, Number(resolvedSearchParams.page ?? "1") || 1);
  const pageSize = 15;

  await connectDB();

  const query: Record<string, unknown> = {};
  if (role !== "all") {
    query.role = role;
  }
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    query.$or = [{ name: pattern }, { email: pattern }];
  }

  const [
    totalUsers,
    activeUsers,
    verifiedUsers,
    admins,
    staff,
    customers,
    users,
    totalOrders,
    pendingOrders,
    allOrders,
    totalProducts,
    lowStockProducts,
    allProducts,
    allCoupons,
    allCategories,
    settingsDoc,
    filteredTotal,
    revenueAgg,
    pendingVendorProducts,
    pendingVendors,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ emailVerified: true }),
    User.countDocuments({ role: { $in: ["super_admin", "admin"] } }),
    User.countDocuments({ role: "staff" }),
    User.countDocuments({ role: "customer" }),
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Order.countDocuments(),
    Order.countDocuments({ status: "pending" }),
    Order.find().sort({ createdAt: -1 }).limit(100).lean(),
    Product.countDocuments(),
    Product.countDocuments({ stock: { $lte: 5 } }),
    Product.find().sort({ createdAt: -1 }).populate("category", "name slug").limit(100).lean(),
    Coupon.find().sort({ createdAt: -1 }).lean(),
    Category.find().sort({ sortOrder: 1, createdAt: -1 }).lean(),
    // Gateway configuration is only for admins, not staff
    ADMIN_ROLES.includes(sessionUser.role) ? Settings.findOne().lean() : null,
    User.countDocuments(query),
    // Summed in MongoDB over every order, not just the latest 100 loaded for the tables
    Order.aggregate<{ sum: number }>([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, sum: { $sum: "$total" } } },
    ]),
    Product.countDocuments({
      vendor: { $ne: null },
      approvalStatus: "pending",
      status: { $ne: "archived" },
    }),
    Vendor.countDocuments({ status: "pending" }),
  ]);

  const totalRevenue = revenueAgg[0]?.sum ?? 0;

  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

  return (
    <AdminDashboardClient
      users={serializeUsers(users)}
      summary={{ totalUsers, activeUsers, verifiedUsers, admins, staff, customers }}
      filters={{ q: search, role, page, pageSize }}
      total={filteredTotal}
      totalPages={totalPages}
      orderStats={{
        totalOrders,
        pendingOrders,
        totalRevenue,
        recentOrders: JSON.parse(JSON.stringify(allOrders)),
      }}
      productStats={{
        totalProducts,
        lowStockProducts,
        productsList: JSON.parse(JSON.stringify(allProducts)),
      }}
      initialCoupons={JSON.parse(JSON.stringify(allCoupons))}
      initialCategories={JSON.parse(JSON.stringify(allCategories))}
      initialSettings={JSON.parse(JSON.stringify(settingsDoc || {}))}
      viewerName={sessionUser.name}
      viewerRole={sessionUser.role}
      marketplaceStats={{ pendingProducts: pendingVendorProducts, pendingVendors }}
    />
  );
}

type LeanUserRecord = {
  _id: { toString(): string } | string;
  name?: string;
  email?: string;
  role?: UserRole;
  avatar?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  walletBalance?: number;
  rewardPoints?: number;
  createdAt?: Date | string | null;
  lastLoginAt?: Date | string | null;
};

function serializeUsers(users: LeanUserRecord[]): AdminUserRow[] {
  return users.map((user) => ({
    id: typeof user._id === "string" ? user._id : user._id.toString(),
    name: String(user.name ?? "Unnamed user"),
    email: String(user.email ?? ""),
    role: (user.role as UserRole) ?? "customer",
    avatar: typeof user.avatar === "string" ? user.avatar : undefined,
    emailVerified: Boolean(user.emailVerified),
    isActive: Boolean(user.isActive),
    walletBalance: Number(user.walletBalance ?? 0),
    rewardPoints: Number(user.rewardPoints ?? 0),
    createdAt: user.createdAt ? new Date(String(user.createdAt)).toISOString() : null,
    lastLoginAt: user.lastLoginAt ? new Date(String(user.lastLoginAt)).toISOString() : null,
  }));
}
