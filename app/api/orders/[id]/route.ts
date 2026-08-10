import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Order } from "@/server/db/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const order = isObjectId
      ? await Order.findById(id).populate("user", "name email").lean()
      : await Order.findOne({ orderNumber: id }).populate("user", "name email").lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(order)));
  } catch (err: any) {
    console.error("Get order error:", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    await connectDB();

    const updates: Record<string, unknown> = {};
    if (data.status) updates.status = data.status;
    if (data.paymentStatus) updates.paymentStatus = data.paymentStatus;
    if (data.trackingId) updates.trackingId = data.trackingId;
    if (data.courierName) updates.courierName = data.courierName;
    if (data.notes) updates.notes = data.notes;
    if (data.status === "delivered") updates.deliveredAt = new Date();
    if (data.status === "cancelled") updates.cancelledAt = new Date();

    const order = await Order.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(order)));
  } catch (err: any) {
    console.error("Update order error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
