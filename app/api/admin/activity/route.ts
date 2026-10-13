import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent, ACTIVITY_TYPES, type ActivityType } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { bucketFormat, bucketLabels, createdAtMatch, resolveRange, TIMEZONE } from "@/server/admin/range";

/**
 * GET — Site activity summary for a date range (?range=today|24h|7d|30d|90d|year|all|custom).
 * One $facet pass over the range computes every widget on the overview.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "activity.view");
    if (!auth.ok) return auth.response;

    const range = resolveRange(new URL(request.url).searchParams, "7d");
    await connectDB();

    const match = createdAtMatch(range);
    const fmt = bucketFormat(range.bucket);
    const isView = { $eq: ["$type", "page_view"] };
    const countIf = (type: ActivityType) => ({ $sum: { $cond: [{ $eq: ["$type", type] }, 1, 0] } });
    const top = (field: string, limit = 10, extraMatch: Record<string, unknown> = {}) => [
      { $match: { type: "page_view", [field]: { $nin: [null, ""] }, ...extraMatch } },
      { $group: { _id: { k: `$${field}`, s: "$sessionId" } } },
      { $group: { _id: "$_id.k", sessions: { $sum: 1 } } },
      { $sort: { sessions: -1 as const } },
      { $limit: limit },
    ];

    const liveSince = new Date(Date.now() - 5 * 60_000);

    const [facets, live, recent] = await Promise.all([
      ActivityEvent.aggregate([
        { $match: match },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  events: { $sum: 1 },
                  pageViews: countIf("page_view"),
                  addToCarts: countIf("add_to_cart"),
                  removeFromCarts: countIf("remove_from_cart"),
                  purchases: countIf("purchase"),
                  searches: countIf("search"),
                  logins: countIf("login"),
                  failedLogins: countIf("login_failed"),
                  signups: countIf("signup"),
                  revenue: { $sum: { $cond: [{ $eq: ["$type", "purchase"] }, "$value", 0] } },
                  cartValue: { $sum: { $cond: [{ $eq: ["$type", "add_to_cart"] }, "$value", 0] } },
                  visitors: { $addToSet: { $cond: [isView, "$visitorId", "$$REMOVE"] } },
                  members: { $addToSet: { $ifNull: ["$user", "$$REMOVE"] } },
                },
              },
              {
                $project: {
                  _id: 0,
                  events: 1,
                  pageViews: 1,
                  addToCarts: 1,
                  removeFromCarts: 1,
                  purchases: 1,
                  searches: 1,
                  logins: 1,
                  failedLogins: 1,
                  signups: 1,
                  revenue: 1,
                  cartValue: 1,
                  visitors: { $size: "$visitors" },
                  signedInVisitors: { $size: "$members" },
                },
              },
            ],
            sessions: [
              {
                $group: {
                  _id: "$sessionId",
                  views: { $sum: { $cond: [isView, 1, 0] } },
                  duration: { $sum: { $ifNull: ["$durationMs", 0] } },
                },
              },
              { $match: { views: { $gt: 0 } } },
              {
                $group: {
                  _id: null,
                  sessions: { $sum: 1 },
                  bounces: { $sum: { $cond: [{ $lte: ["$views", 1] }, 1, 0] } },
                  totalDuration: { $sum: "$duration" },
                  totalViews: { $sum: "$views" },
                },
              },
            ],
            series: [
              {
                $group: {
                  _id: { $dateToString: { format: fmt, date: "$createdAt", timezone: TIMEZONE } },
                  pageViews: countIf("page_view"),
                  addToCarts: countIf("add_to_cart"),
                  purchases: countIf("purchase"),
                  visitors: { $addToSet: { $cond: [isView, "$visitorId", "$$REMOVE"] } },
                },
              },
              {
                $project: {
                  pageViews: 1,
                  addToCarts: 1,
                  purchases: 1,
                  visitors: { $size: "$visitors" },
                },
              },
            ],
            topPages: [
              { $match: { type: "page_view" } },
              {
                $group: {
                  _id: "$path",
                  views: { $sum: 1 },
                  visitors: { $addToSet: "$visitorId" },
                  avgDuration: { $avg: "$durationMs" },
                  title: { $last: "$title" },
                },
              },
              { $sort: { views: -1 } },
              { $limit: 20 },
              {
                $project: {
                  views: 1,
                  title: 1,
                  avgDuration: 1,
                  visitors: { $size: "$visitors" },
                },
              },
            ],
            topProductsViewed: [
              { $match: { type: "page_view", productSlug: { $nin: [null, ""] } } },
              {
                $group: {
                  _id: "$productSlug",
                  views: { $sum: 1 },
                  visitors: { $addToSet: "$visitorId" },
                  title: { $last: "$title" },
                },
              },
              { $sort: { views: -1 } },
              { $limit: 10 },
              { $project: { views: 1, title: 1, visitors: { $size: "$visitors" } } },
            ],
            topCartProducts: [
              { $match: { type: "add_to_cart" } },
              {
                $group: {
                  _id: { $ifNull: ["$productSlug", "$productName"] },
                  name: { $last: "$productName" },
                  adds: { $sum: 1 },
                  quantity: { $sum: { $ifNull: ["$quantity", 1] } },
                  value: { $sum: { $ifNull: ["$value", 0] } },
                  visitors: { $addToSet: "$visitorId" },
                },
              },
              { $sort: { adds: -1 } },
              { $limit: 10 },
              {
                $project: { name: 1, adds: 1, quantity: 1, value: 1, visitors: { $size: "$visitors" } },
              },
            ],
            topSearches: [
              { $match: { type: "search", searchTerm: { $nin: [null, ""] } } },
              { $group: { _id: { $toLower: "$searchTerm" }, count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            referrers: top("referrerHost"),
            campaigns: top("utmSource"),
            devices: top("device", 5),
            browsers: top("browser", 8),
            os: top("os", 8),
            countries: top("country", 10),
            funnel: [
              {
                $group: {
                  _id: null,
                  visitors: { $addToSet: { $cond: [isView, "$visitorId", "$$REMOVE"] } },
                  productViewers: {
                    $addToSet: {
                      $cond: [
                        { $and: [isView, { $gt: [{ $ifNull: ["$productSlug", ""] }, ""] }] },
                        "$visitorId",
                        "$$REMOVE",
                      ],
                    },
                  },
                  carters: {
                    $addToSet: {
                      $cond: [{ $eq: ["$type", "add_to_cart"] }, "$visitorId", "$$REMOVE"],
                    },
                  },
                  checkouts: {
                    $addToSet: {
                      $cond: [
                        {
                          $and: [
                            isView,
                            { $eq: [{ $substrCP: [{ $ifNull: ["$path", ""] }, 0, 9] }, "/checkout"] },
                          ],
                        },
                        "$visitorId",
                        "$$REMOVE",
                      ],
                    },
                  },
                  buyers: {
                    $addToSet: { $cond: [{ $eq: ["$type", "purchase"] }, "$visitorId", "$$REMOVE"] },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  visitors: { $size: "$visitors" },
                  productViewers: { $size: "$productViewers" },
                  carters: { $size: "$carters" },
                  checkouts: { $size: "$checkouts" },
                  buyers: { $size: "$buyers" },
                },
              },
            ],
          },
        },
      ]).allowDiskUse(true),
      ActivityEvent.aggregate([
        { $match: { createdAt: { $gte: liveSince }, type: "page_view" } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$visitorId",
            path: { $first: "$path" },
            title: { $first: "$title" },
            at: { $first: "$createdAt" },
            sessionId: { $first: "$sessionId" },
            userName: { $first: "$userName" },
            device: { $first: "$device" },
            country: { $first: "$country" },
            views: { $sum: 1 },
          },
        },
        { $sort: { at: -1 } },
        { $limit: 50 },
      ]),
      ActivityEvent.find(match)
        .sort({ createdAt: -1 })
        .limit(25)
        .select("type path title productName productSlug searchTerm value quantity userName userEmail sessionId visitorId device browser country city ip orderNumber label createdAt")
        .lean(),
    ]);

    const f = facets[0] ?? {};
    const totals = f.totals?.[0] ?? {
      events: 0,
      pageViews: 0,
      addToCarts: 0,
      removeFromCarts: 0,
      purchases: 0,
      searches: 0,
      logins: 0,
      failedLogins: 0,
      signups: 0,
      revenue: 0,
      cartValue: 0,
      visitors: 0,
      signedInVisitors: 0,
    };
    const s = f.sessions?.[0] ?? { sessions: 0, bounces: 0, totalDuration: 0, totalViews: 0 };

    // Fill empty buckets so the chart shows quiet days as zero
    const firstEvent =
      range.from ??
      ((await ActivityEvent.findOne(match).sort({ createdAt: 1 }).select("createdAt").lean())
        ?.createdAt as Date | undefined) ??
      range.to;
    const byLabel = new Map<string, any>((f.series ?? []).map((row: any) => [row._id, row]));
    const series = bucketLabels(firstEvent, range.to, range.bucket).map((label) => {
      const row = byLabel.get(label);
      return {
        label,
        pageViews: row?.pageViews ?? 0,
        visitors: row?.visitors ?? 0,
        addToCarts: row?.addToCarts ?? 0,
        purchases: row?.purchases ?? 0,
      };
    });

    const rows = (list: any[] | undefined, key = "sessions") =>
      (list ?? []).map((r) => ({ name: r._id ?? "Unknown", value: r[key] }));

    return NextResponse.json({
      range: { key: range.key, from: range.from, to: range.to, bucket: range.bucket },
      totals: {
        ...totals,
        sessions: s.sessions,
        bounceRate: s.sessions ? (s.bounces / s.sessions) * 100 : 0,
        avgSessionMs: s.sessions ? s.totalDuration / s.sessions : 0,
        pagesPerSession: s.sessions ? s.totalViews / s.sessions : 0,
        conversionRate: totals.visitors ? ((f.funnel?.[0]?.buyers ?? 0) / totals.visitors) * 100 : 0,
      },
      series,
      topPages: (f.topPages ?? []).map((p: any) => ({
        path: p._id,
        title: p.title,
        views: p.views,
        visitors: p.visitors,
        avgDurationMs: p.avgDuration ?? null,
      })),
      topProductsViewed: (f.topProductsViewed ?? []).map((p: any) => ({
        slug: p._id,
        title: p.title,
        views: p.views,
        visitors: p.visitors,
      })),
      topCartProducts: (f.topCartProducts ?? []).map((p: any) => ({
        key: p._id,
        name: p.name ?? p._id,
        adds: p.adds,
        quantity: p.quantity,
        value: p.value,
        visitors: p.visitors,
      })),
      topSearches: rows(f.topSearches, "count"),
      referrers: rows(f.referrers),
      campaigns: rows(f.campaigns),
      devices: rows(f.devices),
      browsers: rows(f.browsers),
      os: rows(f.os),
      countries: rows(f.countries),
      funnel: f.funnel?.[0] ?? { visitors: 0, productViewers: 0, carters: 0, checkouts: 0, buyers: 0 },
      live: live.map((v: any) => ({
        visitorId: v._id,
        sessionId: v.sessionId,
        path: v.path,
        title: v.title,
        at: v.at,
        userName: v.userName,
        device: v.device,
        country: v.country,
        views: v.views,
      })),
      recent: JSON.parse(JSON.stringify(recent)),
    });
  } catch (err) {
    return serverError("Activity summary error", err, "Couldn't load site activity.");
  }
}

/**
 * DELETE — Remove activity data now.
 *   { mode: "older_than", days }   everything older than N days
 *   { mode: "range", from, to }    a date range (YYYY-MM-DD, inclusive)
 *   { mode: "type", type }         one kind of event
 *   { mode: "all", confirm: "DELETE" }
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "activity.manage");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    await connectDB();

    let filter: Record<string, unknown>;
    let summary: string;
    switch (body.mode) {
      case "older_than": {
        const days = Math.floor(Number(body.days));
        if (!Number.isFinite(days) || days < 0 || days > 3650) {
          return NextResponse.json({ error: "Choose how many days of activity to keep." }, { status: 400 });
        }
        filter = { createdAt: { $lt: new Date(Date.now() - days * 86_400_000) } };
        summary = days === 0 ? "Deleted all activity before today" : `Deleted activity older than ${days} days`;
        break;
      }
      case "range": {
        const from = new Date(`${String(body.from).slice(0, 10)}T00:00:00+06:00`);
        const to = new Date(`${String(body.to).slice(0, 10)}T23:59:59.999+06:00`);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
          return NextResponse.json({ error: "Choose a valid date range." }, { status: 400 });
        }
        filter = { createdAt: { $gte: from, $lte: to } };
        summary = `Deleted activity from ${String(body.from).slice(0, 10)} to ${String(body.to).slice(0, 10)}`;
        break;
      }
      case "type": {
        if (!ACTIVITY_TYPES.includes(body.type)) {
          return NextResponse.json({ error: "Unknown activity type." }, { status: 400 });
        }
        filter = { type: body.type };
        summary = `Deleted all "${body.type}" activity`;
        break;
      }
      case "all": {
        if (body.confirm !== "DELETE") {
          return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
        }
        filter = {};
        summary = "Deleted all site activity data";
        break;
      }
      default:
        return NextResponse.json({ error: "Choose what to delete." }, { status: 400 });
    }

    const { deletedCount } = await ActivityEvent.deleteMany(filter);
    audit(request, auth.user, {
      action: "activity.purge",
      summary: `${summary} (${deletedCount.toLocaleString("en-US")} records)`,
      entity: "ActivityEvent",
      meta: { mode: body.mode, deletedCount },
    });
    return NextResponse.json({ deleted: deletedCount });
  } catch (err) {
    return serverError("Activity purge error", err, "Couldn't delete activity data.");
  }
}
