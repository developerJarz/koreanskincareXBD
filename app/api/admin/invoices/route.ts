import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import type { Types } from "mongoose";

import { Invoice, nextSequence, Order } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { createdAtMatch, resolveRange } from "@/server/admin/range";
import {
  cleanInvoiceInput,
  formatInvoiceNumber,
  getInvoiceTemplate,
  invoiceFromOrder,
} from "@/server/invoices";
import { escapeRegex, isObjectId } from "@/server/security/validation";
import { computeInvoiceTotals, formatMoney, paymentStatusFor } from "@/lib/invoice";

/** GET — Invoices with totals by status. ?q= &status=draft|issued|partially_paid|paid|void|overdue &range= &order=<orderId> &page= */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "invoices.view");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const range = resolveRange(sp, "all");
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const pageSize = Math.min(100, Math.max(10, Math.floor(Number(sp.get("pageSize")) || 20)));

    const base: Record<string, unknown> = createdAtMatch(range, "issueDate");
    const order = sp.get("order");
    if (isObjectId(order)) base.order = order;
    const q = sp.get("q")?.trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      base.$or = [
        { invoiceNumber: rx },
        { orderNumber: rx },
        { "customer.name": rx },
        { "customer.email": rx },
        { "customer.phone": rx },
      ];
    }

    const filter: Record<string, unknown> = { ...base };
    const status = sp.get("status");
    const now = new Date();
    if (status === "overdue") {
      Object.assign(filter, { status: { $in: ["issued", "partially_paid"] }, dueDate: { $lt: now } });
    } else if (status && ["draft", "issued", "partially_paid", "paid", "void"].includes(status)) {
      filter.status = status;
    }

    await connectDB();
    const [items, total, byStatus, overdue] = await Promise.all([
      Invoice.find(filter)
        .sort({ issueDate: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("-payments -items -terms -notes")
        .lean(),
      Invoice.countDocuments(filter),
      Invoice.aggregate([
        { $match: base },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            total: { $sum: "$total" },
            paid: { $sum: "$amountPaid" },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: { ...base, status: { $in: ["issued", "partially_paid"] }, dueDate: { $lt: now } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            due: { $sum: { $subtract: ["$total", "$amountPaid"] } },
          },
        },
      ]),
    ]);

    const stats: Record<string, { count: number; total: number; paid: number }> = {};
    for (const row of byStatus) stats[row._id] = { count: row.count, total: row.total, paid: row.paid };
    const live = ["issued", "partially_paid", "paid"].map((s) => stats[s] ?? { count: 0, total: 0, paid: 0 });

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats: {
        byStatus: stats,
        invoiced: live.reduce((s, r) => s + r.total, 0),
        collected: live.reduce((s, r) => s + r.paid, 0),
        outstanding: live.reduce((s, r) => s + (r.total - r.paid), 0),
        overdueCount: overdue[0]?.count ?? 0,
        overdueAmount: overdue[0]?.due ?? 0,
      },
    });
  } catch (err) {
    return serverError("List invoices error", err, "Couldn't load invoices.");
  }
}

/**
 * POST — Create an invoice.
 *   { orderId }            from a shop order (returns the existing one unless `force: true`)
 *   { customer, items, …}  written by hand; `status: "draft"` saves without issuing
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "invoices.manage");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    await connectDB();
    const template = await getInvoiceTemplate();

    let input;
    let orderRef: { order?: Types.ObjectId; orderNumber?: string } = {};
    let payments: { amount: number; method: string; reference?: string; date: Date }[] = [];

    if (body.orderId !== undefined) {
      if (!isObjectId(body.orderId)) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }
      const order = await Order.findById(body.orderId).populate("user", "name email").lean();
      if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

      if (!body.force) {
        const existing = await Invoice.findOne({ order: order._id, status: { $ne: "void" } }).lean();
        if (existing) {
          return NextResponse.json({ invoice: JSON.parse(JSON.stringify(existing)), existing: true });
        }
      }

      const fromOrder = invoiceFromOrder(order, template);
      const totals = computeInvoiceTotals(fromOrder.items, fromOrder.shipping, fromOrder.discount);
      input = { ...fromOrder, ...totals };
      orderRef = { order: order._id as Types.ObjectId, orderNumber: order.orderNumber };
      if (order.paymentStatus === "paid") {
        payments = [
          {
            amount: totals.total,
            method: order.paymentMethod,
            reference: order.paymentTransactionId || undefined,
            date: order.updatedAt ?? new Date(),
          },
        ];
      }
    } else {
      const result = cleanInvoiceInput(body);
      if (!result.ok) {
        return NextResponse.json({ error: result.error, fields: result.fields }, { status: 400 });
      }
      input = result.value;
      if (!input.dueDate) {
        input.dueDate = new Date(input.issueDate.getTime() + template.defaultDueDays * 86_400_000);
      }
    }

    const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
    const requested = body.status === "draft" ? "draft" : "issued";
    const invoiceNumber = formatInvoiceNumber(await nextSequence("invoice"), template);

    const { lines: _lines, ...values } = input as typeof input & { lines?: unknown };
    const invoice = await Invoice.create({
      ...values,
      ...orderRef,
      invoiceNumber,
      payments,
      amountPaid,
      status: paymentStatusFor(input.total, amountPaid, requested),
      currency: "BDT",
      createdBy: auth.user._id,
      createdByName: auth.user.name,
    });

    audit(request, auth.user, {
      action: "invoice.create",
      summary: `Created invoice ${invoiceNumber} for ${invoice.customer.name} (${formatMoney(invoice.total)})${
        orderRef.orderNumber ? ` from order ${orderRef.orderNumber}` : ""
      }`,
      entity: "Invoice",
      entityId: invoice._id.toString(),
    });

    return NextResponse.json({ invoice: invoice.toJSON(), existing: false }, { status: 201 });
  } catch (err) {
    return serverError("Create invoice error", err, "Couldn't create the invoice.");
  }
}
