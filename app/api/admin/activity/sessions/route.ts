import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { createdAtMatch, resolveRange } from "@/server/admin/range";
import { escapeRegex } from "@/server/security/validation";

/**
 * GET — Visits (sessions) in a date range, most recent first. Each row summarises one visit:
 * landing and exit page, pages seen, time on site, cart adds and whether it ended in an order.
 * ?range= &filter=all|cart|purchased|abandoned|members &q= &page= &pageSize=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "activity.view");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const range = resolveRange(sp, "7d");
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const pageSize = Math.min(100, Math.max(10, Math.floor(Number(sp.get("pageSize")) || 25)));
    const filter = sp.get("filter") ?? "all";
    const q = sp.get("q")?.trim().slice(0, 100);

    const after: Record<string, unknown> = {};
    if (filter === "cart") after.addToCarts = { $gt: 0 };
    if (filter === "purchased") after.purchases = { $gt: 0 };
    if (filter === "abandoned") Object.assign(after, { addToCarts: { $gt: 0 }, purchases: 0 });
    if (filter === "members") after.userName = { $nin: [null, ""] };
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      after.$or = [
        { userName: rx },
        { userEmail: rx },
        { ip: rx },
        { landing: rx },
        { referrerHost: rx },
        { _id: q },
        { visitorId: q },
      ];
    }

    await connectDB();
    const [result] = await ActivityEvent.aggregate([
      { $match: createdAtMatch(range) },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$sessionId",
          visitorId: { $first: "$visitorId" },
          start: { $first: "$createdAt" },
          end: { $last: "$createdAt" },
          events: { $sum: 1 },
          pageViews: { $sum: { $cond: [{ $eq: ["$type", "page_view"] }, 1, 0] } },
          addToCarts: { $sum: { $cond: [{ $eq: ["$type", "add_to_cart"] }, 1, 0] } },
          cartValue: {
            $sum: { $cond: [{ $eq: ["$type", "add_to_cart"] }, { $ifNull: ["$value", 0] }, 0] },
          },
          purchases: { $sum: { $cond: [{ $eq: ["$type", "purchase"] }, 1, 0] } },
          revenue: {
            $sum: { $cond: [{ $eq: ["$type", "purchase"] }, { $ifNull: ["$value", 0] }, 0] },
          },
          duration: { $sum: { $ifNull: ["$durationMs", 0] } },
          landing: { $first: "$path" },
          exit: { $last: "$path" },
          referrerHost: { $max: "$referrerHost" },
          utmSource: { $max: "$utmSource" },
          userName: { $max: "$userName" },
          userEmail: { $max: "$userEmail" },
          device: { $first: "$device" },
          browser: { $first: "$browser" },
          os: { $first: "$os" },
          country: { $first: "$country" },
          city: { $first: "$city" },
          ip: { $last: "$ip" },
        },
      },
      ...(Object.keys(after).length ? [{ $match: after }] : []),
      { $sort: { end: -1 } },
      {
        $facet: {
          items: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          total: [{ $count: "n" }],
        },
      },
    ]).allowDiskUse(true);

    const total = result?.total?.[0]?.n ?? 0;
    return NextResponse.json({
      items: (result?.items ?? []).map((s: any) => ({ ...s, sessionId: s._id, _id: undefined })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return serverError("Activity sessions error", err, "Couldn't load visits.");
  }
}
