import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent, Address, Order, Review, User, Wishlist } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { NOT_COUNTED_STATUSES } from "@/server/admin/sales-stats";
import { isObjectId } from "@/server/security/validation";

/** GET — One customer: account, addresses, every order, reviews, wishlist size and recent site activity. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission(request, "customers.view");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    await connectDB();
    const user = await User.findById(id).lean();
    if (!user) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const canSeeActivity = auth.permissions.includes("activity.view");
    const [addresses, orders, reviews, wishlist, activity] = await Promise.all([
      Address.find({ user: id }).sort({ isDefault: -1 }).lean(),
      Order.find({ user: id })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("orderNumber total status paymentStatus paymentMethod items.productName items.quantity createdAt shippingAddress.district")
        .lean(),
      Review.countDocuments({ user: id }),
      Wishlist.findOne({ user: id }).select("items").lean(),
      canSeeActivity
        ? ActivityEvent.find({ user: id })
            .sort({ createdAt: -1 })
            .limit(40)
            .select("type path title productName searchTerm value orderNumber device browser city country ip sessionId createdAt")
            .lean()
        : Promise.resolve(null),
    ]);

    const counted = orders.filter((o) => !NOT_COUNTED_STATUSES.includes(o.status));
    const spent = counted.reduce((s, o) => s + (o.total ?? 0), 0);
    const productCounts = new Map<string, number>();
    for (const o of counted) {
      for (const item of o.items ?? []) {
        productCounts.set(item.productName, (productCounts.get(item.productName) ?? 0) + item.quantity);
      }
    }

    return NextResponse.json({
      customer: {
        id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        provider: user.provider,
        walletBalance: user.walletBalance ?? 0,
        rewardPoints: user.rewardPoints ?? 0,
        createdAt: user.createdAt ?? null,
        lastLoginAt: user.lastLoginAt ?? null,
      },
      stats: {
        orders: counted.length,
        allOrders: orders.length,
        spent,
        avgOrder: counted.length ? spent / counted.length : 0,
        firstOrderAt: orders.at(-1)?.createdAt ?? null,
        lastOrderAt: orders[0]?.createdAt ?? null,
        reviews,
        wishlist: wishlist?.items?.length ?? 0,
        favouriteProducts: [...productCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, quantity]) => ({ name, quantity })),
      },
      addresses: JSON.parse(JSON.stringify(addresses)),
      orders: JSON.parse(JSON.stringify(orders)),
      activity: activity ? JSON.parse(JSON.stringify(activity)) : null,
    });
  } catch (err) {
    return serverError("Customer detail error", err, "Couldn't load this customer.");
  }
}
