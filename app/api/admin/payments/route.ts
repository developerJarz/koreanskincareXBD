import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Order, Settings } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { createdAtMatch, resolveRange } from "@/server/admin/range";
import { NOT_COUNTED_STATUSES } from "@/server/admin/sales-stats";
import {
  COURIER_OPTIONS,
  enabledPaymentIds,
  PAYMENT_OPTIONS,
  paymentIdFor,
  revalidateCheckoutConfig,
} from "@/server/checkout-config";
import { escapeRegex } from "@/server/security/validation";

// Which server keys are present (never the values) — shows whether a gateway can go live
const GATEWAY_ENV: Record<string, string[]> = {
  bKash: ["BKASH_APP_KEY", "BKASH_APP_SECRET", "BKASH_USERNAME", "BKASH_PASSWORD"],
  Nagad: ["NAGAD_MERCHANT_ID", "NAGAD_MERCHANT_KEY"],
  SSLCommerz: ["SSLCOMMERZ_STORE_ID", "SSLCOMMERZ_STORE_PASSWORD"],
};
const COURIER_ENV: Record<string, string[]> = {
  Steadfast: ["STEADFAST_API_KEY", "STEADFAST_SECRET_KEY"],
  Pathao: ["PATHAO_CLIENT_ID", "PATHAO_CLIENT_SECRET"],
  RedX: ["REDX_API_KEY"],
};
const hasEnv = (names?: string[]) => (names ? names.every((n) => Boolean(process.env[n])) : null);

/**
 * GET — Payment methods and couriers with real order figures for the range.
 * ?lookup=<transaction id | order number | tracking id | phone> searches orders instead.
 */
export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams;
    const lookup = sp.get("lookup")?.trim().slice(0, 80);

    if (lookup) {
      const auth = await requirePermission(request, ["payments.view", "orders.view"], "all");
      if (!auth.ok) return auth.response;
      await connectDB();
      const rx = new RegExp(escapeRegex(lookup), "i");
      const orders = await Order.find({
        $or: [
          { paymentTransactionId: rx },
          { orderNumber: rx },
          { trackingId: rx },
          { "shippingAddress.phone": rx },
          { guestPhone: rx },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber total status paymentStatus paymentMethod paymentTransactionId courierName trackingId shippingAddress.fullName shippingAddress.phone createdAt")
        .lean();
      return NextResponse.json({ results: JSON.parse(JSON.stringify(orders)) });
    }

    const auth = await requirePermission(request, "payments.view");
    if (!auth.ok) return auth.response;

    const range = resolveRange(sp, "30d");
    await connectDB();
    const match = createdAtMatch(range);
    const [settings, byMethod, byCourier, codOutstanding, pendingOnline] = await Promise.all([
      Settings.findOne().select("paymentGateways courierServices").lean(),
      Order.aggregate([
        { $match: { ...match, status: { $nin: NOT_COUNTED_STATUSES } } },
        {
          $group: {
            _id: "$paymentMethod",
            orders: { $sum: 1 },
            revenue: { $sum: "$total" },
            paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$paymentStatus", "failed"] }, 1, 0] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...match, courierName: { $nin: [null, ""] } } },
        {
          $group: {
            _id: "$courierName",
            orders: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
            returned: { $sum: { $cond: [{ $in: ["$status", ["returned", "refunded"]] }, 1, 0] } },
            inTransit: { $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] } },
            value: { $sum: "$total" },
          },
        },
        { $sort: { orders: -1 } },
      ]),
      // Delivered cash-on-delivery orders whose cash hasn't been marked as received
      Order.aggregate([
        { $match: { paymentMethod: "COD", status: "delivered", paymentStatus: { $ne: "paid" } } },
        { $group: { _id: "$courierName", orders: { $sum: 1 }, amount: { $sum: "$total" } } },
        { $sort: { amount: -1 } },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentMethod: { $ne: "COD" },
            paymentStatus: { $in: ["pending", "failed"] },
            status: { $nin: NOT_COUNTED_STATUSES },
          },
        },
        { $group: { _id: null, orders: { $sum: 1 }, amount: { $sum: "$total" } } },
      ]),
    ]);

    const enabled = enabledPaymentIds(settings?.paymentGateways);
    const methodStats = new Map(byMethod.map((m) => [paymentIdFor(String(m._id)) ?? String(m._id), m]));
    const courierSaved = new Map((settings?.courierServices ?? []).map((c) => [c.name, c.enabled]));
    const courierStats = new Map(byCourier.map((c) => [String(c._id).toLowerCase(), c]));

    return NextResponse.json({
      range: { key: range.key, from: range.from, to: range.to },
      methods: PAYMENT_OPTIONS.map((o) => {
        const s = methodStats.get(o.id);
        return {
          id: o.id,
          title: o.title,
          description: o.description,
          enabled: enabled.includes(o.id),
          available: o.available,
          credentialsSet: hasEnv(GATEWAY_ENV[o.id]),
          orders: s?.orders ?? 0,
          revenue: s?.revenue ?? 0,
          paid: s?.paid ?? 0,
          failed: s?.failed ?? 0,
        };
      }),
      couriers: [
        ...COURIER_OPTIONS.map((name) => {
          const s = courierStats.get(name.toLowerCase());
          courierStats.delete(name.toLowerCase());
          return {
            name,
            enabled: courierSaved.get(name) ?? true,
            credentialsSet: hasEnv(COURIER_ENV[name]),
            orders: s?.orders ?? 0,
            delivered: s?.delivered ?? 0,
            returned: s?.returned ?? 0,
            inTransit: s?.inTransit ?? 0,
            value: s?.value ?? 0,
          };
        }),
        // Courier names typed on orders that aren't in the standard list
        ...[...courierStats.values()].map((s) => ({
          name: String(s._id),
          enabled: true,
          credentialsSet: null,
          orders: s.orders,
          delivered: s.delivered,
          returned: s.returned,
          inTransit: s.inTransit,
          value: s.value,
          custom: true,
        })),
      ],
      codOutstanding: {
        orders: codOutstanding.reduce((s, r) => s + r.orders, 0),
        amount: codOutstanding.reduce((s, r) => s + r.amount, 0),
        byCourier: codOutstanding.map((r) => ({ courier: r._id ?? "Not set", orders: r.orders, amount: r.amount })),
      },
      pendingOnline: { orders: pendingOnline[0]?.orders ?? 0, amount: pendingOnline[0]?.amount ?? 0 },
    });
  } catch (err) {
    return serverError("Payments overview error", err, "Couldn't load delivery & payments.");
  }
}

/** PUT — { methods?: [{ id, enabled }], couriers?: [{ name, enabled }] } */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "payments.manage");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    await connectDB();
    const settings = (await Settings.findOne()) ?? new Settings({});
    const changes: string[] = [];

    if (Array.isArray(body.methods)) {
      const current = enabledPaymentIds(settings.paymentGateways);
      const next = PAYMENT_OPTIONS.map((o) => {
        const row = body.methods.find((m: any) => m?.id === o.id);
        const on = o.available && (row ? Boolean(row.enabled) : current.includes(o.id));
        if (on !== current.includes(o.id)) changes.push(`${o.title} ${on ? "on" : "off"}`);
        return { id: o.id, title: o.title, enabled: on };
      });
      if (!next.some((m) => m.enabled)) {
        return NextResponse.json({ error: "Keep at least one payment method switched on." }, { status: 400 });
      }
      // Keep any gateway config already stored
      const saved = new Map((settings.paymentGateways ?? []).map((g) => [paymentIdFor(g.name), g.config]));
      settings.paymentGateways = next.map((m) => ({ name: m.title, enabled: m.enabled, config: saved.get(m.id) ?? {} }));
    }

    if (Array.isArray(body.couriers)) {
      const saved = new Map((settings.courierServices ?? []).map((c) => [c.name, c]));
      settings.courierServices = COURIER_OPTIONS.map((name) => {
        const row = body.couriers.find((c: any) => c?.name === name);
        const before = saved.get(name)?.enabled ?? true;
        const on = row ? Boolean(row.enabled) : before;
        if (on !== before) changes.push(`${name} ${on ? "on" : "off"}`);
        return { name, enabled: on, config: saved.get(name)?.config ?? {} };
      });
    }

    await settings.save();
    revalidateCheckoutConfig();
    audit(request, auth.user, {
      action: "payments.update",
      summary: changes.length ? `Delivery & payments: ${changes.join(", ")}` : "Saved delivery & payment settings",
      entity: "Settings",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Payments settings error", err, "Couldn't save delivery & payments.");
  }
}
