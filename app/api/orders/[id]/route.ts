import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Order } from "@/server/db/models";
import { getSessionUser, requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
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

function tokenMatches(token: string | null, storedHash: string | undefined): boolean {
  if (!token || !storedHash) return false;
  const given = Buffer.from(crypto.createHash("sha256").update(token).digest("hex"));
  const stored = Buffer.from(storedHash);
  return given.length === stored.length && crypto.timingSafeEqual(given, stored);
}

// GET — Visible to staff, to the signed-in owner, or to whoever holds the checkout access token
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
    const isStaff = viewer ? STAFF_ROLES.includes(viewer.role) : false;
    const ownerId = (order.user as any)?._id?.toString?.() ?? order.user?.toString?.();
    const isOwner = Boolean(viewer && ownerId && ownerId === viewer._id.toString());

    // Same 404 as a missing order, so order numbers cannot be probed
    if (!isStaff && !isOwner && !tokenMatches(token, order.accessTokenHash)) return notFound;

    return NextResponse.json(order.toJSON(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError("Get order error", err, "Failed to fetch order");
  }
}

// PATCH — Update fulfilment / payment status (staff only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = await request.json().catch(() => ({}));
    await connectDB();

    const updates: Record<string, unknown> = {};
    if (data.status !== undefined) {
      if (!ORDER_STATUSES.includes(data.status)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }
      updates.status = data.status;
      if (data.status === "delivered") updates.deliveredAt = new Date();
      if (data.status === "cancelled") updates.cancelledAt = new Date();
    }
    if (data.paymentStatus !== undefined) {
      if (!PAYMENT_STATUSES.includes(data.paymentStatus)) {
        return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
      }
      updates.paymentStatus = data.paymentStatus;
    }
    const trackingId = cleanString(data.trackingId, 100);
    if (trackingId) updates.trackingId = trackingId;
    const courierName = cleanString(data.courierName, 60);
    if (courierName) updates.courierName = courierName;
    const notes = cleanString(data.notes, 2000);
    if (notes) updates.notes = notes;

    const order = await Order.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(order)));
  } catch (err) {
    return serverError("Update order error", err, "Failed to update order");
  }
}
