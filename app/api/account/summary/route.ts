import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Order } from "@/server/db/models";
import { requireAuth, serverError } from "@/server/auth/session";

const ACTIVE = ["pending", "confirmed", "processing", "shipped"];

// GET — the signed-in customer's dashboard numbers (always their own account, from the session)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    await connectDB();
    const user = auth.user;

    const [agg] = await Order.aggregate<{
      orders: number;
      spent: number;
      active: number;
      delivered: number;
    }>([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          // Cancelled/refunded orders don't count as money spent
          spent: {
            $sum: {
              $cond: [{ $in: ["$status", ["cancelled", "refunded", "returned"]] }, 0, "$total"],
            },
          },
          active: { $sum: { $cond: [{ $in: ["$status", ACTIVE] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        },
      },
    ]);

    return NextResponse.json(
      {
        walletBalance: user.walletBalance ?? 0,
        rewardPoints: user.rewardPoints ?? 0,
        memberSince: (user as { createdAt?: Date }).createdAt ?? null,
        orders: agg?.orders ?? 0,
        spent: agg?.spent ?? 0,
        activeOrders: agg?.active ?? 0,
        deliveredOrders: agg?.delivered ?? 0,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return serverError("Account summary error", err, "Couldn't load your account.");
  }
}
