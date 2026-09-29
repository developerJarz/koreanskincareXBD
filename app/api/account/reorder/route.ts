import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Order, Product } from "@/server/db/models";
import { requireAuth, serverError } from "@/server/auth/session";
import { isObjectId } from "@/server/security/validation";
import { PUBLIC_PRODUCT_FILTER } from "@/server/marketplace";

/**
 * GET ?order=<id> — "Buy again": the items of one of your orders as cart items at today's prices.
 * Products that are no longer sold or are out of stock are listed separately.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const id = new URL(request.url).searchParams.get("order");
    if (!isObjectId(id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    await connectDB();
    const order = await Order.findOne({ _id: id, user: auth.user._id }).select("items").lean();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const ids = order.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: ids }, ...PUBLIC_PRODUCT_FILTER })
      .select("name slug price compareAtPrice images stock allowBackorders trackInventory category")
      .populate("category", "slug")
      .lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const items: unknown[] = [];
    const unavailable: string[] = [];
    for (const item of order.items) {
      const p = byId.get(String(item.product));
      const inStock = p && (!p.trackInventory || p.allowBackorders || (p.stock ?? 0) > 0);
      if (!p || !inStock) {
        unavailable.push(item.productName);
        continue;
      }
      const maxQty = p.trackInventory && !p.allowBackorders ? p.stock : 99;
      items.push({
        productId: String(p._id),
        name: p.name,
        image: p.images?.[0] ?? item.productImage ?? "",
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        quantity: Math.max(1, Math.min(item.quantity, maxQty ?? 1)),
        category: (p.category as { slug?: string } | null)?.slug ?? "",
        slug: p.slug,
      });
    }
    return NextResponse.json({ items, unavailable });
  } catch (err) {
    return serverError("Reorder error", err, "Couldn't load that order.");
  }
}
