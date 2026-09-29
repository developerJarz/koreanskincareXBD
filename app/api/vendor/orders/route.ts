import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Order } from "@/server/db/models";
import { serverError } from "@/server/auth/session";
import { requireVendor } from "@/server/auth/vendor";
import { toVendorOrders } from "@/server/marketplace";

// GET — Orders that include this vendor's products, showing only their items
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = await requireVendor(request);
    if (!auth.ok) return auth.response;

    const orders = await Order.find({ "items.vendor": auth.vendor._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .select("orderNumber status paymentStatus paymentMethod createdAt items shippingAddress")
      .lean();

    return NextResponse.json(toVendorOrders(orders, auth.vendor._id));
  } catch (err) {
    return serverError("Vendor orders error", err, "Failed to load your orders");
  }
}
