import type { Types } from "mongoose";

import { Order, Product, Vendor, type VendorDocument } from "@/server/db/models";
import {
  cleanString,
  isObjectId,
  isSafeUrl,
  toNonNegativeNumber,
} from "@/server/security/validation";

/**
 * Products shown on the storefront. Everything customers can browse or buy must use this,
 * so drafts, archived items, unapproved vendor items and suspended vendors never leak out.
 * ($ne / $nin also match older products that don't have these fields yet.)
 */
export const PUBLIC_PRODUCT_FILTER: Record<string, any> = {
  isActive: { $ne: false },
  status: { $nin: ["draft", "archived"] },
  approvalStatus: { $nin: ["pending", "rejected"] },
  vendorActive: { $ne: false },
};

export function isPubliclyVisible(product: {
  status?: string;
  approvalStatus?: string;
  vendorActive?: boolean;
}) {
  return (
    (!product.status || product.status === "active") &&
    product.approvalStatus !== "pending" &&
    product.approvalStatus !== "rejected" &&
    product.vendorActive !== false
  );
}

export async function getVendorForUser(userId: Types.ObjectId | string) {
  return Vendor.findOne({ user: userId });
}

/** Counts that apply to the product limit: drafts count, archived (deleted) products don't. */
export function countVendorProducts(vendorId: Types.ObjectId) {
  return Product.countDocuments({ vendor: vendorId, status: { $ne: "archived" } });
}

export type VendorProductInput = {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  category: string;
  status: "active" | "draft";
};

/**
 * Validates a vendor's product against the limits the admin set for that vendor.
 * Returns either an error message the vendor can act on, or the cleaned values.
 */
export function checkVendorProduct(
  vendor: VendorDocument,
  raw: any,
): { error: string } | { value: VendorProductInput } {
  const name = cleanString(raw?.name, 200);
  if (!name || name.length < 3) return { error: "Enter a product name (at least 3 characters)." };

  const price = toNonNegativeNumber(raw?.price, 1_000_000);
  if (!price) return { error: "Enter a selling price greater than ৳0." };

  let compareAtPrice: number | undefined;
  if (
    raw?.compareAtPrice !== undefined &&
    raw?.compareAtPrice !== "" &&
    raw?.compareAtPrice !== null
  ) {
    const was = toNonNegativeNumber(raw.compareAtPrice, 1_000_000);
    if (was === undefined) return { error: "The original price is not a valid number." };
    if (was > 0) {
      if (was <= price) {
        return {
          error: "The original price must be higher than the selling price, or left empty.",
        };
      }
      const discount = ((was - price) / was) * 100;
      const max = vendor.limits?.maxDiscountPercent ?? 50;
      if (discount > max + 0.001) {
        return {
          error: `That is a ${Math.round(discount)}% discount. Your account allows up to ${max}%.`,
        };
      }
      compareAtPrice = was;
    }
  }

  const stock = toNonNegativeNumber(raw?.stock ?? 0, 100_000);
  if (stock === undefined || !Number.isInteger(stock)) {
    return { error: "Stock must be a whole number of 0 or more." };
  }

  if (!isObjectId(raw?.category)) return { error: "Choose a category." };
  const allowed = (vendor.limits?.allowedCategories ?? []).map(String);
  if (allowed.length > 0 && !allowed.includes(raw.category)) {
    return { error: "Your account can't list products in that category." };
  }

  const images = Array.isArray(raw?.images) ? raw.images.filter(isSafeUrl).slice(0, 8) : [];
  if (images.length === 0) return { error: "Add at least one image link (https://…)." };

  return {
    value: {
      name,
      description: cleanString(raw?.description, 5000) ?? "",
      price,
      compareAtPrice,
      stock,
      images,
      category: raw.category,
      status: raw?.status === "draft" ? "draft" : "active",
    },
  };
}

/** Whether a change to these fields should send the product back for review. */
export function needsReReview(
  before: {
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    images?: string[];
    category?: any;
  },
  after: VendorProductInput,
) {
  return (
    before.name !== after.name ||
    (before.description ?? "") !== after.description ||
    before.price !== after.price ||
    (before.compareAtPrice ?? undefined) !== after.compareAtPrice ||
    String(before.category) !== after.category ||
    JSON.stringify(before.images ?? []) !== JSON.stringify(after.images)
  );
}

export type VendorSales = { orders: number; gross: number; commission: number; earnings: number };

/** Sales per vendor from order items (cancelled/refunded orders excluded). */
export async function getVendorSales(
  vendors: Array<{ _id: Types.ObjectId; commissionRate: number }>,
): Promise<Map<string, VendorSales>> {
  const ids = vendors.map((v) => v._id);
  const rows = ids.length
    ? await Order.aggregate<{ _id: Types.ObjectId; gross: number; orders: number }>([
        { $match: { "items.vendor": { $in: ids }, status: { $nin: ["cancelled", "refunded"] } } },
        { $unwind: "$items" },
        { $match: { "items.vendor": { $in: ids } } },
        {
          $group: {
            _id: "$items.vendor",
            gross: { $sum: "$items.total" },
            orderIds: { $addToSet: "$_id" },
          },
        },
        { $project: { gross: 1, orders: { $size: "$orderIds" } } },
      ])
    : [];

  const byId = new Map(rows.map((r) => [String(r._id), r]));
  const result = new Map<string, VendorSales>();
  for (const v of vendors) {
    const row = byId.get(String(v._id));
    const gross = row?.gross ?? 0;
    const commission = Math.round((gross * (v.commissionRate ?? 0)) / 100);
    result.set(String(v._id), {
      orders: row?.orders ?? 0,
      gross,
      commission,
      earnings: gross - commission,
    });
  }
  return result;
}

/** Product counts per vendor: total (excl. archived), live, awaiting review. */
export async function getVendorProductCounts(vendorIds: Types.ObjectId[]) {
  const rows = vendorIds.length
    ? await Product.aggregate<{
        _id: Types.ObjectId;
        total: number;
        live: number;
        pending: number;
      }>([
        { $match: { vendor: { $in: vendorIds }, status: { $ne: "archived" } } },
        {
          $group: {
            _id: "$vendor",
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, 1, 0] } },
            live: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "active"] },
                      { $not: [{ $in: ["$approvalStatus", ["pending", "rejected"]] }] },
                      { $ne: ["$vendorActive", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
    : [];
  return new Map(
    rows.map((r) => [String(r._id), { total: r.total, live: r.live, pending: r.pending }]),
  );
}

export type VendorOrderView = {
  _id: string;
  orderNumber?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  customer: string;
  area: string;
  items: Array<{
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  vendorTotal: number;
};

/**
 * Reduces orders to what a vendor may see: only their own items, the buyer's first name and
 * delivery district. Phone numbers and street addresses stay with the shop team, which ships.
 */
export function toVendorOrders(orders: any[], vendorId: Types.ObjectId): VendorOrderView[] {
  const id = String(vendorId);
  return orders.map((o) => {
    const items = (o.items ?? [])
      .filter((item: any) => String(item.vendor) === id)
      .map((item: any) => ({
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));
    return {
      _id: String(o._id),
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      createdAt: new Date(o.createdAt).toISOString(),
      customer: String(o.shippingAddress?.fullName ?? "Customer")
        .trim()
        .split(/\s+/)[0],
      area: [o.shippingAddress?.district, o.shippingAddress?.division].filter(Boolean).join(", "),
      items,
      vendorTotal: items.reduce((sum: number, item: any) => sum + item.total, 0),
    };
  });
}
