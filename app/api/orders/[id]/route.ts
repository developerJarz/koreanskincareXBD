import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Order, Product } from "@/server/db/models";
import { getSessionUser, serverError, STAFF_ROLES } from "@/server/auth/session";
import { getAccessProfile, requirePermission } from "@/server/auth/permissions";
import { audit } from "@/server/audit";
import { revalidateCatalog } from "@/server/catalog";
import { cleanString, isObjectId } from "@/server/security/validation";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "partially_refunded"];
const NOT_SOLD = ["cancelled", "returned", "refunded"];

function tokenMatches(token: string | null, storedHash: string | undefined): boolean {
  if (!token || !storedHash) return false;
  const given = Buffer.from(crypto.createHash("sha256").update(token).digest("hex"));
  const stored = Buffer.from(storedHash);
  return given.length === stored.length && crypto.timingSafeEqual(given, stored);
}

// GET — Visible to staff who can view orders, to the signed-in owner, or to whoever holds the
// checkout access token
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get("t");
    await connectDB();

    const filter = isObjectId(id) ? { _id: id } : { orderNumber: String(id).slice(0, 40) };
    const order = await Order.findOne(filter)
      .select("+accessTokenHash")
      .populate("user", "name email");

    const notFound = NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order) return notFound;

    const viewer = await getSessionUser(request);
    const isStaff =
      viewer && STAFF_ROLES.includes(viewer.role)
        ? (await getAccessProfile(viewer)).permissions.includes("orders.view")
        : false;
    const ownerId = (order.user as any)?._id?.toString?.() ?? order.user?.toString?.();
    const isOwner = Boolean(viewer && ownerId && ownerId === viewer._id.toString());

    // Same 404 as a missing order, so order numbers cannot be probed
    if (!isStaff && !isOwner && !tokenMatches(token, order.accessTokenHash)) return notFound;

    return NextResponse.json(order.toJSON(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError("Get order error", err, "Failed to fetch order");
  }
}

const TEXT_FIELDS: [field: string, max: number, label: string][] = [
  ["trackingId", 100, "tracking"],
  ["courierName", 60, "courier"],
  ["trackingUrl", 500, "tracking link"],
  ["paymentTransactionId", 100, "transaction ID"],
  ["notes", 2000, "note"],
  ["cancelReason", 500, "cancel reason"],
];

/**
 * PATCH — Update fulfilment and payment details. Needs "Update orders"; marking returns and
 * refunds needs "Returns & refunds".
 * { status?, paymentStatus?, courierName?, trackingId?, trackingUrl?, paymentTransactionId?,
 *   notes?, cancelReason?, restock?: true }
 * `restock: true` puts the items back in stock when the order is cancelled or returned.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json().catch(() => ({}));
    const touchesRefund =
      ["returned", "refunded"].includes(data.status) ||
      ["refunded", "partially_refunded"].includes(data.paymentStatus);
    const auth = await requirePermission(request, touchesRefund ? "returns.manage" : "orders.manage");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await connectDB();
    const before = await Order.findById(id).select("orderNumber status paymentStatus items").lean();
    if (!before) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    const changes: string[] = [];

    if (data.status !== undefined) {
      if (!ORDER_STATUSES.includes(data.status)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }
      if (data.status !== before.status) {
        updates.status = data.status;
        changes.push(`status ${before.status} → ${data.status}`);
        if (data.status === "delivered") updates.deliveredAt = new Date();
        if (data.status === "cancelled") updates.cancelledAt = new Date();
      }
    }
    if (data.paymentStatus !== undefined) {
      if (!PAYMENT_STATUSES.includes(data.paymentStatus)) {
        return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
      }
      if (data.paymentStatus !== before.paymentStatus) {
        updates.paymentStatus = data.paymentStatus;
        changes.push(`payment ${before.paymentStatus} → ${data.paymentStatus}`);
      }
    }
    for (const [field, max, label] of TEXT_FIELDS) {
      if (data[field] === undefined) continue;
      const value = cleanString(data[field], max);
      if (field === "trackingUrl" && value && !/^https?:\/\//i.test(value)) {
        return NextResponse.json(
          { error: "The tracking link must start with https://" },
          { status: 400 },
        );
      }
      if (value) updates[field] = value;
      else unset[field] = 1;
      changes.push(`${label} ${value ? `“${value.slice(0, 40)}”` : "cleared"}`);
    }

    if (!changes.length) {
      return NextResponse.json(JSON.parse(JSON.stringify(await Order.findById(id).lean())));
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: updates, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true },
    ).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only once, when the order first leaves the "sold" states
    const leavingSale =
      typeof updates.status === "string" &&
      NOT_SOLD.includes(updates.status) &&
      !NOT_SOLD.includes(before.status);
    if (data.restock === true && leavingSale) {
      for (const item of before.items ?? []) {
        await Product.updateOne(
          { _id: item.product, trackInventory: { $ne: false } },
          { $inc: { stock: item.quantity, totalSold: -item.quantity } },
        );
      }
      changes.push("items put back in stock");
      revalidateCatalog();
    }

    audit(request, auth.user, {
      action: "order.update",
      summary: `Order ${before.orderNumber}: ${changes.join(", ")}`,
      entity: "Order",
      entityId: id,
    });

    return NextResponse.json(JSON.parse(JSON.stringify(order)));
  } catch (err) {
    return serverError("Update order error", err, "Failed to update order");
  }
}
