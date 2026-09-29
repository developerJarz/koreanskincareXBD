import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import VendorDashboardClient from "./VendorDashboardClient";
import { connectDB } from "@/server/db/connection";
import { Category, Order, Product, Vendor } from "@/server/db/models";
import { getSessionUserFromCookies, STAFF_ROLES } from "@/server/auth/session";
import { getVendorSales, toVendorOrders } from "@/server/marketplace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller dashboard — koreanskincare.bd",
};

export default async function VendorPage() {
  const sessionUser = await getSessionUserFromCookies();
  if (!sessionUser) redirect("/auth/login");
  if (sessionUser.role !== "vendor") {
    redirect(STAFF_ROLES.includes(sessionUser.role) ? "/admin" : "/account");
  }

  await connectDB();
  const vendor = await Vendor.findOne({ user: sessionUser._id }).lean();

  if (!vendor) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl">No store is linked to this account</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your seller account exists, but its store hasn&apos;t been set up yet. Contact the
            koreanskincare.bd team and they will finish it for you.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary underline">
            Go to the shop
          </Link>
        </div>
      </main>
    );
  }

  const allowed = vendor.limits?.allowedCategories ?? [];
  const [products, orders, allCategories, salesMap] = await Promise.all([
    Product.find({ vendor: vendor._id, status: { $ne: "archived" } })
      .sort({ updatedAt: -1 })
      .select(
        "name slug description price compareAtPrice stock images category status approvalStatus reviewNote vendorActive totalSold createdAt updatedAt",
      )
      .lean(),
    Order.find({ "items.vendor": vendor._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .select("orderNumber status paymentStatus paymentMethod createdAt items shippingAddress")
      .lean(),
    Category.find().sort({ sortOrder: 1, name: 1 }).select("name isActive").lean(),
    getVendorSales([vendor]),
  ]);

  // Vendors may only choose from their allowed categories, but existing products keep showing
  // their category name even if the admin later removes it from the allowed list
  const allowedIds = new Set(allowed.map(String));
  const categories = allCategories.filter((c) =>
    allowed.length ? allowedIds.has(String(c._id)) : c.isActive !== false,
  );

  // Internal admin notes are never sent to the vendor
  const { adminNotes: _internal, ...vendorForClient } = JSON.parse(JSON.stringify(vendor));

  return (
    <VendorDashboardClient
      vendor={vendorForClient}
      initialProducts={JSON.parse(JSON.stringify(products))}
      orders={toVendorOrders(orders, vendor._id)}
      categories={categories.map((c) => ({ id: String(c._id), name: c.name }))}
      categoryLabels={Object.fromEntries(allCategories.map((c) => [String(c._id), c.name]))}
      restrictedCategories={allowed.length > 0}
      sales={
        salesMap.get(String(vendor._id)) ?? { orders: 0, gross: 0, commission: 0, earnings: 0 }
      }
    />
  );
}
