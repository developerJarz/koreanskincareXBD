import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { NOT_COUNTED_STATUSES } from "@/server/admin/sales-stats";
import { escapeRegex } from "@/server/security/validation";

const DAY = 86_400_000;
const SEGMENTS = ["all", "vip", "loyal", "new", "at_risk", "no_orders", "inactive"] as const;
const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  spent: { spent: -1, createdAt: -1 },
  orders: { orders: -1, createdAt: -1 },
  last_order: { lastOrderAt: -1, createdAt: -1 },
  name: { name: 1 },
};

/**
 * Segment rules, all based on real orders (cancelled / returned / refunded orders don't count):
 *   VIP       spent ৳20,000+ or 5+ orders
 *   Loyal     2+ orders
 *   New       joined in the last 30 days with at most one order
 *   At risk   has ordered before, but not in the last 90 days
 *   No orders signed up but never ordered
 */
function segmentExpr(now: number) {
  return {
    vip: { $or: [{ $gte: ["$spent", 20000] }, { $gte: ["$orders", 5] }] },
    loyal: { $gte: ["$orders", 2] },
    new: { $and: [{ $lte: ["$orders", 1] }, { $gte: ["$createdAt", new Date(now - 30 * DAY)] }] },
    at_risk: { $and: [{ $gte: ["$orders", 1] }, { $lt: ["$lastOrderAt", new Date(now - 90 * DAY)] }] },
    no_orders: { $eq: ["$orders", 0] },
    inactive: { $eq: ["$isActive", false] },
  };
}

/** GET — Customers with lifetime orders and spend. ?q= &segment= &sort= &role=customer|all &page= */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "customers.view");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const pageSize = Math.min(100, Math.max(10, Math.floor(Number(sp.get("pageSize")) || 25)));
    const segment = SEGMENTS.includes(sp.get("segment") as any) ? (sp.get("segment") as string) : "all";
    const sort = SORTS[sp.get("sort") ?? ""] ?? SORTS.newest;

    const match: Record<string, unknown> = {};
    if (sp.get("role") !== "all") match.role = "customer";
    const q = sp.get("q")?.trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    await connectDB();
    const seg = segmentExpr(Date.now());
    const [result] = await User.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "orders",
          let: { uid: "$_id" },
          as: "stats",
          pipeline: [
            { $match: { $expr: { $eq: ["$user", "$$uid"] } } },
            {
              $group: {
                _id: null,
                orders: { $sum: { $cond: [{ $in: ["$status", NOT_COUNTED_STATUSES] }, 0, 1] } },
                allOrders: { $sum: 1 },
                spent: { $sum: { $cond: [{ $in: ["$status", NOT_COUNTED_STATUSES] }, 0, "$total"] } },
                lastOrderAt: { $max: "$createdAt" },
                firstOrderAt: { $min: "$createdAt" },
                lastDistrict: { $last: "$shippingAddress.district" },
                lastPhone: { $last: "$shippingAddress.phone" },
              },
            },
          ],
        },
      },
      {
        $set: {
          orders: { $ifNull: [{ $first: "$stats.orders" }, 0] },
          allOrders: { $ifNull: [{ $first: "$stats.allOrders" }, 0] },
          spent: { $ifNull: [{ $first: "$stats.spent" }, 0] },
          lastOrderAt: { $first: "$stats.lastOrderAt" },
          firstOrderAt: { $first: "$stats.firstOrderAt" },
          district: { $first: "$stats.lastDistrict" },
          orderPhone: { $first: "$stats.lastPhone" },
        },
      },
      {
        $facet: {
          items: [
            ...(segment !== "all" ? [{ $match: { $expr: (seg as any)[segment] } }] : []),
            { $sort: sort },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
              $project: {
                name: 1,
                email: 1,
                phone: 1,
                avatar: 1,
                role: 1,
                isActive: 1,
                emailVerified: 1,
                walletBalance: 1,
                rewardPoints: 1,
                createdAt: 1,
                lastLoginAt: 1,
                orders: 1,
                allOrders: 1,
                spent: 1,
                lastOrderAt: 1,
                firstOrderAt: 1,
                district: 1,
                orderPhone: 1,
              },
            },
          ],
          total: [
            ...(segment !== "all" ? [{ $match: { $expr: (seg as any)[segment] } }] : []),
            { $count: "n" },
          ],
          segments: [
            {
              $group: {
                _id: null,
                all: { $sum: 1 },
                vip: { $sum: { $cond: [seg.vip, 1, 0] } },
                loyal: { $sum: { $cond: [seg.loyal, 1, 0] } },
                new: { $sum: { $cond: [seg.new, 1, 0] } },
                at_risk: { $sum: { $cond: [seg.at_risk, 1, 0] } },
                no_orders: { $sum: { $cond: [seg.no_orders, 1, 0] } },
                inactive: { $sum: { $cond: [seg.inactive, 1, 0] } },
                lifetimeValue: { $sum: "$spent" },
              },
            },
          ],
        },
      },
    ]).allowDiskUse(true);

    const total = result?.total?.[0]?.n ?? 0;
    const segments = result?.segments?.[0] ?? {
      all: 0, vip: 0, loyal: 0, new: 0, at_risk: 0, no_orders: 0, inactive: 0, lifetimeValue: 0,
    };
    const now = Date.now();
    return NextResponse.json({
      items: (result?.items ?? []).map((u: any) => ({
        id: String(u._id),
        name: u.name ?? "Unnamed",
        email: u.email ?? "",
        phone: u.phone || u.orderPhone || "",
        avatar: u.avatar,
        role: u.role,
        isActive: Boolean(u.isActive),
        emailVerified: Boolean(u.emailVerified),
        walletBalance: u.walletBalance ?? 0,
        rewardPoints: u.rewardPoints ?? 0,
        createdAt: u.createdAt ?? null,
        lastLoginAt: u.lastLoginAt ?? null,
        orders: u.orders,
        allOrders: u.allOrders,
        spent: u.spent,
        avgOrder: u.orders ? u.spent / u.orders : 0,
        lastOrderAt: u.lastOrderAt ?? null,
        district: u.district ?? null,
        segment:
          u.isActive === false
            ? "inactive"
            : u.spent >= 20000 || u.orders >= 5
              ? "vip"
              : u.orders >= 2
                ? "loyal"
                : u.orders >= 1 && u.lastOrderAt && new Date(u.lastOrderAt).getTime() < now - 90 * DAY
                  ? "at_risk"
                  : u.orders <= 1 && u.createdAt && new Date(u.createdAt).getTime() >= now - 30 * DAY
                    ? "new"
                    : u.orders === 0
                      ? "no_orders"
                      : "regular",
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      segments,
    });
  } catch (err) {
    return serverError("List customers error", err, "Couldn't load customers.");
  }
}
