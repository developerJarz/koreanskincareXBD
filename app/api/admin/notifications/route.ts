import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent, Invoice, Order, Product, Review, Vendor } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { formatMoney } from "@/lib/invoice";

type Item = {
  id: string;
  type: "order" | "inventory" | "refund" | "security" | "system";
  title: string;
  message: string;
  at: string;
  tab: string;
};

/**
 * GET — The bell menu: things that happened recently or need someone, built from the database
 * and filtered to what the viewer's role can act on. "Read" state is kept in the browser.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, [], "all");
    if (!auth.ok) return auth.response;
    const can = (p: Parameters<typeof auth.permissions.includes>[0]) => auth.permissions.includes(p);

    await connectDB();
    const since = new Date(Date.now() - 3 * 86_400_000);
    const now = new Date();

    const [orders, lowStock, pendingReviews, vendorProducts, vendors, overdue, returns, failed] =
      await Promise.all([
        can("orders.view")
          ? Order.find({ createdAt: { $gte: since } })
              .sort({ createdAt: -1 })
              .limit(12)
              .select("orderNumber total paymentMethod status shippingAddress.fullName shippingAddress.district createdAt")
              .lean()
          : [],
        can("catalog.view")
          ? Product.find({
              status: "active",
              trackInventory: { $ne: false },
              $expr: { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] },
            })
              .sort({ stock: 1 })
              .limit(8)
              .select("name stock updatedAt")
              .lean()
          : [],
        can("reviews.manage") ? Review.countDocuments({ status: "pending" }) : 0,
        can("vendors.view")
          ? Product.countDocuments({ vendor: { $ne: null }, approvalStatus: "pending", status: { $ne: "archived" } })
          : 0,
        can("vendors.view") ? Vendor.countDocuments({ status: "pending" }) : 0,
        can("invoices.view")
          ? Invoice.find({ status: { $in: ["issued", "partially_paid"] }, dueDate: { $lt: now } })
              .sort({ dueDate: 1 })
              .limit(5)
              .select("invoiceNumber total amountPaid customer.name dueDate")
              .lean()
          : [],
        can("returns.manage")
          ? Order.find({ status: "returned", paymentStatus: { $nin: ["refunded", "partially_refunded"] } })
              .sort({ updatedAt: -1 })
              .limit(5)
              .select("orderNumber total updatedAt shippingAddress.fullName")
              .lean()
          : [],
        can("audit.view") || can("activity.view")
          ? ActivityEvent.countDocuments({ type: "login_failed", createdAt: { $gte: new Date(Date.now() - 86_400_000) } })
          : 0,
      ]);

    const items: Item[] = [];
    for (const o of orders as any[]) {
      items.push({
        id: `order:${o._id}`,
        type: "order",
        title: `New order ${o.orderNumber}`,
        message: `${o.shippingAddress?.fullName ?? "Customer"} · ${formatMoney(o.total)} · ${o.paymentMethod}${
          o.shippingAddress?.district ? ` · ${o.shippingAddress.district}` : ""
        }${o.status !== "pending" ? ` · now ${o.status}` : ""}`,
        at: new Date(o.createdAt).toISOString(),
        tab: "orders",
      });
    }
    for (const p of lowStock as any[]) {
      items.push({
        id: `stock:${p._id}:${p.stock}`,
        type: "inventory",
        title: p.stock <= 0 ? `Out of stock: ${p.name}` : `Low stock: ${p.name}`,
        message: p.stock <= 0 ? "Customers can't order this product." : `Only ${p.stock} left.`,
        at: new Date(p.updatedAt ?? now).toISOString(),
        tab: "inventory",
      });
    }
    for (const r of returns as any[]) {
      items.push({
        id: `return:${r._id}`,
        type: "refund",
        title: `Refund due: ${r.orderNumber}`,
        message: `${r.shippingAddress?.fullName ?? "Customer"} returned ${formatMoney(r.total)} — refund not marked as paid yet.`,
        at: new Date(r.updatedAt).toISOString(),
        tab: "returns",
      });
    }
    for (const inv of overdue as any[]) {
      items.push({
        id: `invoice:${inv._id}`,
        type: "system",
        title: `Overdue invoice ${inv.invoiceNumber}`,
        message: `${inv.customer?.name ?? "Customer"} owes ${formatMoney(inv.total - inv.amountPaid)}.`,
        at: new Date(inv.dueDate).toISOString(),
        tab: "invoices",
      });
    }
    if (pendingReviews) {
      items.push({
        id: `reviews:${pendingReviews}`,
        type: "system",
        title: `${pendingReviews} review${pendingReviews === 1 ? "" : "s"} waiting`,
        message: "Approve or reject them so they show on product pages.",
        at: now.toISOString(),
        tab: "reviews_abandoned",
      });
    }
    if (vendorProducts || vendors) {
      items.push({
        id: `vendors:${vendorProducts}:${vendors}`,
        type: "system",
        title: "Vendor approvals waiting",
        message: [
          vendorProducts ? `${vendorProducts} product${vendorProducts === 1 ? "" : "s"}` : "",
          vendors ? `${vendors} store${vendors === 1 ? "" : "s"}` : "",
        ]
          .filter(Boolean)
          .join(" and "),
        at: now.toISOString(),
        tab: "vendors",
      });
    }
    if (failed >= 5) {
      items.push({
        id: `security:${failed}`,
        type: "security",
        title: `${failed} failed sign-in attempts today`,
        message: "Check Team & security for the IP addresses involved.",
        at: now.toISOString(),
        tab: "security_rbac",
      });
    }

    items.sort((a, b) => b.at.localeCompare(a.at));
    return NextResponse.json({ items: items.slice(0, 40) });
  } catch (err) {
    return serverError("Notifications error", err, "Couldn't load notifications.");
  }
}
