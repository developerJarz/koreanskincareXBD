import { ActivityEvent, Order, User } from "@/server/db/models";
import {
  bucketFormat,
  bucketLabels,
  createdAtMatch,
  percentChange,
  TIMEZONE,
  type ResolvedRange,
} from "@/server/admin/range";

/**
 * Sales figures for the Overview, Sales and Finance tabs — all computed in MongoDB from orders.
 *
 * Revenue counts orders that are not cancelled, returned or refunded (the money the shop
 * actually keeps). Cost of goods uses each product's current "cost price"; products without a
 * cost price are reported separately rather than guessed.
 */

export const NOT_COUNTED_STATUSES = ["cancelled", "returned", "refunded"];
const counted = { status: { $nin: NOT_COUNTED_STATUSES } };

async function periodTotals(range: { from: Date | null; to: Date }) {
  const [row] = await Order.aggregate([
    { $match: { ...createdAtMatch(range), ...counted } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: "$total" },
        customers: {
          $addToSet: { $ifNull: ["$user", { $ifNull: ["$guestEmail", "$shippingAddress.phone"] }] },
        },
      },
    },
    { $project: { _id: 0, orders: 1, revenue: 1, customers: { $size: "$customers" } } },
  ]);
  return row ?? { orders: 0, revenue: 0, customers: 0 };
}

export async function getSalesStats(range: ResolvedRange) {
  const match = createdAtMatch(range);
  const fmt = bucketFormat(range.bucket);

  const [facetRows, previous, newCustomers, visitorRows] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                allOrders: { $sum: 1 },
                orders: { $sum: { $cond: [{ $in: ["$status", NOT_COUNTED_STATUSES] }, 0, 1] } },
                revenue: {
                  $sum: { $cond: [{ $in: ["$status", NOT_COUNTED_STATUSES] }, 0, "$total"] },
                },
                subtotal: {
                  $sum: { $cond: [{ $in: ["$status", NOT_COUNTED_STATUSES] }, 0, "$subtotal"] },
                },
                shipping: {
                  $sum: { $cond: [{ $in: ["$status", NOT_COUNTED_STATUSES] }, 0, "$shippingCost"] },
                },
                discounts: {
                  $sum: { $cond: [{ $in: ["$status", NOT_COUNTED_STATUSES] }, 0, "$discount"] },
                },
                paidRevenue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $not: [{ $in: ["$status", NOT_COUNTED_STATUSES] }] },
                          { $eq: ["$paymentStatus", "paid"] },
                        ],
                      },
                      "$total",
                      0,
                    ],
                  },
                },
                cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                cancelledValue: {
                  $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, "$total", 0] },
                },
                returned: {
                  $sum: { $cond: [{ $in: ["$status", ["returned", "refunded"]] }, 1, 0] },
                },
                returnedValue: {
                  $sum: { $cond: [{ $in: ["$status", ["returned", "refunded"]] }, "$total", 0] },
                },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
                customers: {
                  $addToSet: {
                    $cond: [
                      { $in: ["$status", NOT_COUNTED_STATUSES] },
                      "$$REMOVE",
                      {
                        $ifNull: ["$user", { $ifNull: ["$guestEmail", "$shippingAddress.phone"] }],
                      },
                    ],
                  },
                },
              },
            },
            { $project: { _id: 0 } },
          ],
          series: [
            { $match: counted },
            {
              $group: {
                _id: { $dateToString: { format: fmt, date: "$createdAt", timezone: TIMEZONE } },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
              },
            },
          ],
          byDivision: [
            { $match: counted },
            {
              $group: {
                _id: { $ifNull: ["$shippingAddress.division", "Unknown"] },
                orders: { $sum: 1 },
                revenue: { $sum: "$total" },
              },
            },
            { $sort: { revenue: -1 } },
          ],
          byDistrict: [
            { $match: counted },
            {
              $group: {
                _id: { $ifNull: ["$shippingAddress.district", "Unknown"] },
                orders: { $sum: 1 },
                revenue: { $sum: "$total" },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
          ],
          byPayment: [
            { $match: counted },
            {
              $group: {
                _id: { $ifNull: ["$paymentMethod", "Unknown"] },
                orders: { $sum: 1 },
                revenue: { $sum: "$total" },
                paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] } },
              },
            },
            { $sort: { revenue: -1 } },
          ],
          byStatus: [
            { $group: { _id: "$status", orders: { $sum: 1 }, value: { $sum: "$total" } } },
            { $sort: { orders: -1 } },
          ],
          byCourier: [
            { $match: { ...counted, courierName: { $nin: [null, ""] } } },
            { $group: { _id: "$courierName", orders: { $sum: 1 }, value: { $sum: "$total" } } },
            { $sort: { orders: -1 } },
          ],
          topProducts: [
            { $match: counted },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.product",
                name: { $last: "$items.productName" },
                image: { $last: "$items.productImage" },
                quantity: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.total" },
                orders: { $sum: 1 },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product",
                pipeline: [{ $project: { slug: 1, stock: 1, costPrice: 1 } }],
              },
            },
            { $set: { product: { $first: "$product" } } },
          ],
          costs: [
            { $match: counted },
            { $unwind: "$items" },
            {
              $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "p",
                pipeline: [{ $project: { costPrice: 1 } }],
              },
            },
            { $set: { cost: { $ifNull: [{ $first: "$p.costPrice" }, 0] } } },
            {
              $group: {
                _id: null,
                itemsSold: { $sum: "$items.quantity" },
                itemRevenue: { $sum: "$items.total" },
                cogs: {
                  $sum: {
                    $cond: [{ $gt: ["$cost", 0] }, { $multiply: ["$cost", "$items.quantity"] }, 0],
                  },
                },
                costedRevenue: { $sum: { $cond: [{ $gt: ["$cost", 0] }, "$items.total", 0] } },
                uncostedProducts: {
                  $addToSet: { $cond: [{ $gt: ["$cost", 0] }, "$$REMOVE", "$items.product"] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                itemsSold: 1,
                itemRevenue: 1,
                cogs: 1,
                costedRevenue: 1,
                uncostedProducts: { $size: "$uncostedProducts" },
              },
            },
          ],
          repeat: [
            { $match: counted },
            {
              $group: {
                _id: { $ifNull: ["$user", { $ifNull: ["$guestEmail", "$shippingAddress.phone"] }] },
                orders: { $sum: 1 },
              },
            },
            {
              $group: {
                _id: null,
                customers: { $sum: 1 },
                repeat: { $sum: { $cond: [{ $gte: ["$orders", 2] }, 1, 0] } },
              },
            },
          ],
        },
      },
    ]).allowDiskUse(true),
    range.previous ? periodTotals(range.previous) : Promise.resolve(null),
    User.countDocuments({ role: "customer", ...match }),
    ActivityEvent.aggregate([
      { $match: { ...match, type: "page_view" } },
      { $group: { _id: "$visitorId" } },
      { $count: "visitors" },
    ]),
  ]);

  const f = facetRows[0] ?? {};
  const t = f.totals?.[0] ?? {};
  const totals = {
    allOrders: t.allOrders ?? 0,
    orders: t.orders ?? 0,
    revenue: t.revenue ?? 0,
    subtotal: t.subtotal ?? 0,
    shipping: t.shipping ?? 0,
    discounts: t.discounts ?? 0,
    paidRevenue: t.paidRevenue ?? 0,
    cancelled: t.cancelled ?? 0,
    cancelledValue: t.cancelledValue ?? 0,
    returned: t.returned ?? 0,
    returnedValue: t.returnedValue ?? 0,
    pending: t.pending ?? 0,
    delivered: t.delivered ?? 0,
    customers: Array.isArray(t.customers) ? t.customers.length : 0,
  };
  const aov = totals.orders ? totals.revenue / totals.orders : 0;
  const c = f.costs?.[0] ?? {
    itemsSold: 0,
    itemRevenue: 0,
    cogs: 0,
    costedRevenue: 0,
    uncostedProducts: 0,
  };
  const visitors = visitorRows[0]?.visitors ?? 0;
  const rep = f.repeat?.[0] ?? { customers: 0, repeat: 0 };

  // Chart buckets from the first order when "all time" is selected
  const firstOrder = range.from
    ? range.from
    : (((await Order.findOne(match).sort({ createdAt: 1 }).select("createdAt").lean())
        ?.createdAt as Date | undefined) ?? range.to);
  const byLabel = new Map<string, any>((f.series ?? []).map((r: any) => [r._id, r]));
  const series = bucketLabels(firstOrder, range.to, range.bucket).map((label) => ({
    label,
    revenue: byLabel.get(label)?.revenue ?? 0,
    orders: byLabel.get(label)?.orders ?? 0,
  }));

  const prevAov = previous && previous.orders ? previous.revenue / previous.orders : 0;
  return {
    range: { key: range.key, from: range.from, to: range.to, bucket: range.bucket },
    totals: {
      ...totals,
      aov,
      itemsSold: c.itemsSold,
      newCustomers,
      visitors,
      conversionRate: visitors ? (totals.orders / visitors) * 100 : null,
      repeatCustomerRate: rep.customers ? (rep.repeat / rep.customers) * 100 : 0,
      cancelRate: totals.allOrders ? (totals.cancelled / totals.allOrders) * 100 : 0,
    },
    profit: {
      itemRevenue: c.itemRevenue,
      cogs: c.cogs,
      costedRevenue: c.costedRevenue,
      grossProfit: c.costedRevenue - c.cogs,
      marginPercent: c.costedRevenue ? ((c.costedRevenue - c.cogs) / c.costedRevenue) * 100 : null,
      /** Share of item revenue whose products have a cost price */
      coveragePercent: c.itemRevenue ? (c.costedRevenue / c.itemRevenue) * 100 : 0,
      uncostedProducts: c.uncostedProducts,
    },
    change: previous
      ? {
          revenue: percentChange(totals.revenue, previous.revenue),
          orders: percentChange(totals.orders, previous.orders),
          aov: percentChange(aov, prevAov),
          customers: percentChange(totals.customers, previous.customers),
          previous: { ...previous, aov: prevAov },
        }
      : null,
    series,
    byDivision: (f.byDivision ?? []).map((r: any) => ({
      name: r._id,
      orders: r.orders,
      revenue: r.revenue,
    })),
    byDistrict: (f.byDistrict ?? []).map((r: any) => ({
      name: r._id,
      orders: r.orders,
      revenue: r.revenue,
    })),
    byPayment: (f.byPayment ?? []).map((r: any) => ({
      name: r._id,
      orders: r.orders,
      revenue: r.revenue,
      paid: r.paid,
    })),
    byStatus: (f.byStatus ?? []).map((r: any) => ({
      name: r._id,
      orders: r.orders,
      value: r.value,
    })),
    byCourier: (f.byCourier ?? []).map((r: any) => ({
      name: r._id,
      orders: r.orders,
      value: r.value,
    })),
    topProducts: (f.topProducts ?? []).map((p: any) => ({
      id: p._id ? String(p._id) : null,
      name: p.name,
      image: p.image,
      slug: p.product?.slug ?? null,
      stock: p.product?.stock ?? null,
      quantity: p.quantity,
      revenue: p.revenue,
      orders: p.orders,
      profit: p.product?.costPrice > 0 ? p.revenue - p.product.costPrice * p.quantity : null,
    })),
  };
}
