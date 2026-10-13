import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Expense } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { createdAtMatch, resolveRange, TIMEZONE } from "@/server/admin/range";
import { getSalesStats } from "@/server/admin/sales-stats";

/**
 * GET — Profit & loss for a date range: sales (from orders), cost of goods (from product cost
 * prices), recorded expenses, and the expense list.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "finance.view");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const range = resolveRange(sp, "30d");
    await connectDB();

    const expenseMatch = createdAtMatch(range, "date");
    const [sales, expenseTotals, expenses] = await Promise.all([
      getSalesStats(range),
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $facet: {
            byCategory: [
              { $group: { _id: "$category", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
              { $sort: { amount: -1 } },
            ],
            byMonth: [
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m", date: "$date", timezone: TIMEZONE } },
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { _id: 1 } },
            ],
            total: [{ $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } }],
          },
        },
      ]),
      Expense.find(expenseMatch).sort({ date: -1, createdAt: -1 }).limit(500).lean(),
    ]);

    const e = expenseTotals[0] ?? {};
    const expenseTotal = e.total?.[0]?.amount ?? 0;
    const revenue = sales.totals.revenue;
    const cogs = sales.profit.cogs;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenseTotal;

    return NextResponse.json({
      range: sales.range,
      pnl: {
        revenue,
        productSales: sales.totals.subtotal,
        shippingCollected: sales.totals.shipping,
        discounts: sales.totals.discounts,
        refundsAndReturns: sales.totals.returnedValue,
        cogs,
        costCoveragePercent: sales.profit.coveragePercent,
        uncostedProducts: sales.profit.uncostedProducts,
        grossProfit,
        expenses: expenseTotal,
        netProfit,
        netMarginPercent: revenue ? (netProfit / revenue) * 100 : null,
        collected: sales.totals.paidRevenue,
      },
      revenueSeries: sales.series,
      expensesByCategory: (e.byCategory ?? []).map((r: any) => ({
        category: r._id,
        amount: r.amount,
        count: r.count,
      })),
      expensesByMonth: (e.byMonth ?? []).map((r: any) => ({ month: r._id, amount: r.amount })),
      byPayment: sales.byPayment,
      expenses: JSON.parse(JSON.stringify(expenses)),
    });
  } catch (err) {
    return serverError("Finance report error", err, "Couldn't load the finance report.");
  }
}
