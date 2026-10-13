import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AdminDashboardClient, { type AdminCounts } from "./AdminDashboardClient";
import { connectDB } from "@/server/db/connection";
import { Category, Invoice, Order, Product, Review, Settings, Vendor } from "@/server/db/models";
import { getSessionUserFromCookies, STAFF_ROLES } from "@/server/auth/session";
import { getAccessProfile } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard — koreanskincare.bd",
  description: "Store operations, sales, site activity, invoices and team management.",
  robots: { index: false, follow: false },
};

const zero = Promise.resolve(0);

export default async function AdminPage() {
  // Server-side guard: nothing below is rendered for non-staff visitors
  const sessionUser = await getSessionUserFromCookies();
  if (!sessionUser) redirect("/auth/login");
  if (!STAFF_ROLES.includes(sessionUser.role)) redirect("/");

  const { permissions, roleName } = await getAccessProfile(sessionUser);
  const can = (p: (typeof permissions)[number]) => permissions.includes(p);

  await connectDB();
  const now = new Date();
  // Only the counts this team member is allowed to see are queried
  const [
    pendingOrders,
    lowStock,
    pendingVendorProducts,
    pendingVendors,
    pendingReviews,
    refundsDue,
    overdueInvoices,
    categories,
    settingsDoc,
  ] = await Promise.all([
    can("orders.view") ? Order.countDocuments({ status: "pending" }) : zero,
    can("catalog.view")
      ? Product.countDocuments({
          status: "active",
          trackInventory: { $ne: false },
          $expr: { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] },
        })
      : zero,
    can("vendors.view")
      ? Product.countDocuments({ vendor: { $ne: null }, approvalStatus: "pending", status: { $ne: "archived" } })
      : zero,
    can("vendors.view") ? Vendor.countDocuments({ status: "pending" }) : zero,
    can("reviews.manage") ? Review.countDocuments({ status: "pending" }) : zero,
    can("returns.manage")
      ? Order.countDocuments({ status: "returned", paymentStatus: { $nin: ["refunded", "partially_refunded"] } })
      : zero,
    can("invoices.view")
      ? Invoice.countDocuments({ status: { $in: ["issued", "partially_paid"] }, dueDate: { $lt: now } })
      : zero,
    can("vendors.view") ? Category.find().select("name").sort({ name: 1 }).lean() : Promise.resolve([]),
    can("settings.manage") ? Settings.findOne().select("siteDescription shipping").lean() : Promise.resolve(null),
  ]);

  const counts: AdminCounts = {
    pendingOrders,
    lowStock,
    pendingVendorProducts,
    pendingVendors,
    pendingReviews,
    refundsDue,
    overdueInvoices,
  };

  return (
    <AdminDashboardClient
      viewer={{
        id: sessionUser._id.toString(),
        name: sessionUser.name,
        role: sessionUser.role,
        roleName,
      }}
      permissions={permissions}
      counts={counts}
      categories={categories.map((c) => ({ _id: String(c._id), name: c.name }))}
      settings={
        settingsDoc
          ? {
              siteDescription: settingsDoc.siteDescription ?? "",
              freeShippingThreshold: settingsDoc.shipping?.freeShippingThreshold ?? 2000,
              insideDhakaCost: settingsDoc.shipping?.insideDhakaCost ?? 70,
              outsideDhakaCost: settingsDoc.shipping?.outsideDhakaCost ?? 120,
            }
          : null
      }
    />
  );
}
