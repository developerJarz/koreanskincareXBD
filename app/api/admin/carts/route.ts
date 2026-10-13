import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent, Wishlist } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { createdAtMatch, resolveRange } from "@/server/admin/range";

/**
 * GET — Abandoned carts and wishlist demand.
 *
 * The cart lives in the shopper's browser, so abandoned carts are rebuilt from the activity
 * log: visitors who added items (minus what they removed) and haven't placed an order since,
 * with no activity for at least an hour. Signed-in shoppers show their name and email.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "reviews.manage");
    if (!auth.ok) return auth.response;

    const range = resolveRange(new URL(request.url).searchParams, "7d");
    const quietSince = new Date(Date.now() - 60 * 60_000);
    await connectDB();

    const [carts, wishlistTop, wishlistTotals] = await Promise.all([
      ActivityEvent.aggregate([
        {
          $match: {
            ...createdAtMatch(range),
            type: { $in: ["add_to_cart", "remove_from_cart", "purchase"] },
          },
        },
        { $sort: { createdAt: 1 } },
        {
          $group: {
            _id: "$visitorId",
            lastPurchaseAt: {
              $max: { $cond: [{ $eq: ["$type", "purchase"] }, "$createdAt", null] },
            },
            lastCartAt: {
              $max: { $cond: [{ $ne: ["$type", "purchase"] }, "$createdAt", null] },
            },
            events: {
              $push: {
                type: "$type",
                key: { $ifNull: ["$productSlug", "$productName"] },
                name: "$productName",
                qty: { $ifNull: ["$quantity", 1] },
                value: { $ifNull: ["$value", 0] },
                at: "$createdAt",
              },
            },
            userName: { $max: "$userName" },
            userEmail: { $max: "$userEmail" },
            user: { $max: "$user" },
            sessionId: { $last: "$sessionId" },
            device: { $last: "$device" },
            city: { $last: "$city" },
            country: { $last: "$country" },
          },
        },
        // Still has a cart: last cart action came after their last order, and they've gone quiet
        {
          $match: {
            lastCartAt: { $ne: null, $lt: quietSince },
            $expr: {
              $or: [{ $eq: ["$lastPurchaseAt", null] }, { $gt: ["$lastCartAt", "$lastPurchaseAt"] }],
            },
          },
        },
        { $sort: { lastCartAt: -1 } },
        { $limit: 200 },
      ]).allowDiskUse(true),
      Wishlist.aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.product", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "p",
            pipeline: [{ $project: { name: 1, slug: 1, stock: 1, price: 1, images: { $slice: ["$images", 1] } } }],
          },
        },
        { $set: { p: { $first: "$p" } } },
      ]),
      Wishlist.aggregate([
        { $project: { n: { $size: { $ifNull: ["$items", []] } } } },
        { $group: { _id: null, lists: { $sum: { $cond: [{ $gt: ["$n", 0] }, 1, 0] } }, items: { $sum: "$n" } } },
      ]),
    ]);

    // Replay adds/removes after the last order to get what is still in each cart
    const items = carts
      .map((c: any) => {
        const lines = new Map<string, { name: string; quantity: number; value: number }>();
        for (const e of c.events) {
          if (c.lastPurchaseAt && e.at <= c.lastPurchaseAt) continue;
          if (e.type === "purchase") continue;
          const key = e.key ?? e.name ?? "item";
          const line = lines.get(key) ?? { name: e.name ?? key, quantity: 0, value: 0 };
          const unit = e.qty ? e.value / e.qty : 0;
          if (e.type === "add_to_cart") {
            line.quantity += e.qty;
            line.value += e.value;
          } else {
            line.quantity = Math.max(0, line.quantity - e.qty);
            line.value = Math.max(0, line.value - unit * e.qty);
          }
          lines.set(key, line);
        }
        const cartItems = [...lines.values()].filter((l) => l.quantity > 0);
        return {
          visitorId: c._id,
          sessionId: c.sessionId,
          userId: c.user ? String(c.user) : null,
          userName: c.userName ?? null,
          userEmail: c.userEmail ?? null,
          device: c.device,
          location: [c.city, c.country].filter(Boolean).join(", ") || null,
          lastActivityAt: c.lastCartAt,
          items: cartItems,
          value: cartItems.reduce((s, l) => s + l.value, 0),
          units: cartItems.reduce((s, l) => s + l.quantity, 0),
        };
      })
      .filter((c) => c.items.length > 0);

    return NextResponse.json({
      abandoned: {
        count: items.length,
        value: items.reduce((s, c) => s + c.value, 0),
        identified: items.filter((c) => c.userEmail).length,
        items,
      },
      wishlist: {
        lists: wishlistTotals[0]?.lists ?? 0,
        items: wishlistTotals[0]?.items ?? 0,
        top: wishlistTop.map((w: any) => ({
          id: String(w._id),
          name: w.p?.name ?? "Deleted product",
          slug: w.p?.slug ?? null,
          stock: w.p?.stock ?? null,
          price: w.p?.price ?? null,
          image: w.p?.images?.[0] ?? null,
          count: w.count,
        })),
      },
    });
  } catch (err) {
    return serverError("Abandoned carts error", err, "Couldn't load abandoned carts.");
  }
}
