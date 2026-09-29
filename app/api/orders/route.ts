import crypto from "crypto";
import type { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Order, Product } from "@/server/db/models";
import {
  getSessionUser,
  isCrossSiteRequest,
  requireAuth,
  serverError,
  STAFF_ROLES,
} from "@/server/auth/session";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { cleanString, isEmail, isObjectId } from "@/server/security/validation";
import { isPubliclyVisible } from "@/server/marketplace";

const PAYMENT_METHODS = ["COD", "bKash", "Nagad", "SSLCommerz"];
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

    if (!PAYMENT_METHODS.includes(data.paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
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

    const isDhaka = shippingAddress.division === "Dhaka" && shippingAddress.district === "Dhaka";
    const shippingCost = subtotal >= 2000 ? 0 : isDhaka ? 70 : 120;
    const total = subtotal + shippingCost;

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
      discount: 0,
      couponCode: cleanString(data.couponCode, 40)?.toUpperCase(),
      total,
      paymentMethod: data.paymentMethod,
      shippingAddress,
      billingAddress: shippingAddress,
      deliveryNotes: cleanString(data.deliveryNotes, 1000),
      accessTokenHash: crypto.createHash("sha256").update(accessToken).digest("hex"),
    });

    return NextResponse.json({ ...order.toJSON(), accessToken }, { status: 201 });
  } catch (err: any) {
    // Put back any stock reserved before the failure
    for (const r of reserved) {
      await Product.updateOne(
        { _id: r.id },
        { $inc: { stock: r.quantity, totalSold: -r.quantity } },
      ).catch(() => {});
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

// GET — Staff: all orders (optional status filter). Customers: only their own orders.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const isStaff = STAFF_ROLES.includes(auth.user.role);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, Math.floor(Number(searchParams.get("page") ?? "1")) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Math.floor(Number(searchParams.get("pageSize") ?? "20")) || 20),
    );
    const skip = (page - 1) * pageSize;

    const query: Record<string, unknown> = {};
    // ?mine=1 — a staff member's own orders (their account page), not the whole shop's
    if (!isStaff || searchParams.get("mine") === "1") query.user = auth.user._id;
    if (status && ORDER_STATUSES.includes(status)) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("user", "name email")
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return serverError("List orders error", err, "Failed to fetch orders");
  }
}
