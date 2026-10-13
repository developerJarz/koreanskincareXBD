import crypto from "crypto";
import type { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Coupon, Order, Product } from "@/server/db/models";
import {
  getSessionUser,
  isCrossSiteRequest,
  requireAuth,
  serverError,
  STAFF_ROLES,
} from "@/server/auth/session";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { cleanString, escapeRegex, isEmail, isObjectId } from "@/server/security/validation";
import { getAccessProfile } from "@/server/auth/permissions";
import { createdAtMatch, resolveRange } from "@/server/admin/range";
import { isPubliclyVisible } from "@/server/marketplace";
import { recordServerEvent } from "@/server/activity";
import { evaluateCoupon, getCheckoutConfig, shippingCostFor } from "@/server/checkout-config";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
];
const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;

function cleanAddress(raw: any) {
  const address = {
    fullName: cleanString(raw?.fullName, 100),
    phone: cleanString(raw?.phone, 30),
    division: cleanString(raw?.division, 60),
    district: cleanString(raw?.district, 60),
    area: cleanString(raw?.area, 100),
    streetAddress: cleanString(raw?.streetAddress, 300),
    postalCode: cleanString(raw?.postalCode, 20),
  };
  const complete =
    address.fullName &&
    address.phone &&
    address.division &&
    address.district &&
    address.area &&
    address.streetAddress;
  return complete ? address : null;
}

// POST — Create a new order (guests allowed; prices and totals are always computed server-side)
export async function POST(request: NextRequest) {
  const reserved: { id: Types.ObjectId; quantity: number }[] = [];
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limited = rateLimit(`order:${getClientIp(request)}`, 10, 10 * 60_000);
    if (limited) return limited;

    const data = await request.json().catch(() => ({}));

    const items = data.items;
    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
      return NextResponse.json({ error: "Your cart is empty or invalid" }, { status: 400 });
    }
    for (const item of items) {
      if (
        typeof item?.productId !== "string" ||
        item.productId.length > 200 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_QUANTITY
      ) {
        return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
      }
    }

    const shippingAddress = cleanAddress(data.shippingAddress);
    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Please fill in all required shipping fields" },
        { status: 400 },
      );
    }

    const config = await getCheckoutConfig();
    if (!config.paymentMethods.some((m) => m.id === data.paymentMethod)) {
      return NextResponse.json(
        { error: "This payment method isn’t available. Please choose another." },
        { status: 400 },
      );
    }

    const guestEmail = cleanString(data.guestEmail, 254)?.toLowerCase();
    if (guestEmail && !isEmail(guestEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    await connectDB();
    const sessionUser = await getSessionUser(request);

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = isObjectId(item.productId)
        ? await Product.findById(item.productId).lean()
        : await Product.findOne({ slug: item.productId }).lean();

      if (!product || !isPubliclyVisible(product)) {
        return NextResponse.json(
          { error: "A product in your cart is no longer available" },
          { status: 404 },
        );
      }

      let price = product.price;
      let variantInfo = undefined;

      if (typeof item.variantSku === "string" && product.variants?.length) {
        const variant = product.variants.find((v: any) => v.sku === item.variantSku);
        if (variant) {
          price = variant.price;
          variantInfo = { sku: variant.sku, color: variant.color, size: variant.size };
        }
      }

      const total = price * item.quantity;
      subtotal += total;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.images?.[0] || "/placeholder.svg",
        variant: variantInfo,
        price,
        quantity: item.quantity,
        total,
        vendor: product.vendor,
      });

      if (product.trackInventory) {
        // Atomic: only decrements when enough stock is left, so stock can never go negative
        const res = await Product.updateOne(
          { _id: product._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, totalSold: item.quantity } },
        );
        if (res.modifiedCount === 0) {
          throw Object.assign(new Error("out_of_stock"), { productName: product.name });
        }
        reserved.push({ id: product._id, quantity: item.quantity });
      }
    }

    // Coupons from Promotions, checked again here so the order always matches what the shop allows
    const couponInput = cleanString(data.couponCode, 40);
    let discount = 0;
    let freeShipping = false;
    let couponCode: string | undefined;
    let couponId: string | undefined;
    if (couponInput) {
      const coupon = await evaluateCoupon(couponInput, subtotal);
      if (!coupon.ok) throw Object.assign(new Error("bad_coupon"), { reason: coupon.error });
      discount = coupon.discount;
      freeShipping = coupon.freeShipping;
      couponCode = coupon.code;
      couponId = coupon.couponId;
    }

    // Delivery charges come from admin Settings (free delivery is judged after the discount)
    const shippingCost = shippingCostFor(subtotal - discount, shippingAddress, config, freeShipping);
    const total = Math.max(0, subtotal - discount + shippingCost);

    // Secret that lets the buyer (incl. guests) open their confirmation page; only its hash is stored
    const accessToken = crypto.randomBytes(24).toString("base64url");

    const order = await Order.create({
      user: sessionUser?._id,
      guestEmail: guestEmail || sessionUser?.email,
      guestPhone: cleanString(data.guestPhone, 30),
      items: orderItems,
      subtotal,
      shippingCost,
      tax: 0,
      discount,
      couponCode,
      total,
      paymentMethod: data.paymentMethod,
      shippingAddress,
      billingAddress: shippingAddress,
      deliveryNotes: cleanString(data.deliveryNotes, 1000),
      accessTokenHash: crypto.createHash("sha256").update(accessToken).digest("hex"),
    });

    if (couponId) {
      await Coupon.updateOne({ _id: couponId }, { $inc: { usageCount: 1 } }).catch((err) =>
        console.error("Coupon usage count error:", err),
      );
    }

    recordServerEvent(
      request,
      {
        type: "purchase",
        orderId: order._id,
        orderNumber: order.orderNumber,
        value: total,
        quantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        label: data.paymentMethod,
      },
      sessionUser,
    );

    return NextResponse.json({ ...order.toJSON(), accessToken }, { status: 201 });
  } catch (err: any) {
    // Put back any stock reserved before the failure
    for (const r of reserved) {
      await Product.updateOne(
        { _id: r.id },
        { $inc: { stock: r.quantity, totalSold: -r.quantity } },
      ).catch(() => {});
    }
    if (err?.message === "bad_coupon") {
      return NextResponse.json({ error: err.reason, field: "coupon" }, { status: 400 });
    }
    if (err?.message === "out_of_stock") {
      return NextResponse.json(
        { error: `Sorry, "${err.productName}" does not have enough stock.` },
        { status: 409 },
      );
    }
    return serverError("Create order error", err, "Failed to create order");
  }
}

// GET — Staff with "View orders": every order, searchable and filterable. Everyone else (and
// staff with ?mine=1): only their own orders.
//   ?q= (order number, name, phone, email, tracking, transaction id) &status=a,b &payment=COD
//   &paymentStatus= &range= &from= &to= &sort=newest|oldest|total_desc|total_asc &page= &pageSize=
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const access = STAFF_ROLES.includes(auth.user.role) ? await getAccessProfile(auth.user) : null;
    const canSeeAll = Boolean(access?.permissions.includes("orders.view"));

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Math.floor(Number(searchParams.get("page") ?? "1")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Math.floor(Number(searchParams.get("pageSize") ?? "20")) || 20),
    );
    const skip = (page - 1) * pageSize;

    const query: Record<string, unknown> = {};
    // ?mine=1 — a staff member's own orders (their account page), not the whole shop's
    if (!canSeeAll || searchParams.get("mine") === "1") query.user = auth.user._id;

    const statuses = (searchParams.get("status") ?? "")
      .split(",")
      .filter((st) => ORDER_STATUSES.includes(st));
    if (statuses.length === 1) query.status = statuses[0];
    else if (statuses.length > 1) query.status = { $in: statuses };

    if (canSeeAll) {
      const payment = cleanString(searchParams.get("payment"), 30);
      if (payment) query.paymentMethod = payment;
      const paymentStatus = searchParams.get("paymentStatus");
      if (paymentStatus && ["pending", "paid", "failed", "refunded", "partially_refunded"].includes(paymentStatus)) {
        query.paymentStatus = paymentStatus;
      }
      if (searchParams.get("range")) Object.assign(query, createdAtMatch(resolveRange(searchParams, "all")));
      const q = searchParams.get("q")?.trim().slice(0, 100);
      if (q) {
        const rx = new RegExp(escapeRegex(q), "i");
        query.$or = [
          { orderNumber: rx },
          { "shippingAddress.fullName": rx },
          { "shippingAddress.phone": rx },
          { "shippingAddress.district": rx },
          { guestEmail: rx },
          { guestPhone: rx },
          { trackingId: rx },
          { paymentTransactionId: rx },
          { "items.productName": rx },
        ];
      }
    }

    const sort: Record<string, 1 | -1> =
      ({
        oldest: { createdAt: 1 },
        total_desc: { total: -1 },
        total_asc: { total: 1 },
      } as Record<string, Record<string, 1 | -1>>)[searchParams.get("sort") ?? ""] ?? { createdAt: -1 };

    const [orders, total, statusCounts] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(pageSize).populate("user", "name email").lean(),
      Order.countDocuments(query),
      canSeeAll && searchParams.get("counts") === "1"
        ? Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      statusCounts: statusCounts ? Object.fromEntries(statusCounts.map((r: any) => [r._id, r.count])) : undefined,
    });
  } catch (err) {
    return serverError("List orders error", err, "Failed to fetch orders");
  }
}
