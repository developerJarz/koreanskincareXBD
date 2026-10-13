import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { AuditLog, Product } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { revalidateCatalog } from "@/server/catalog";
import { cleanString, escapeRegex, isObjectId } from "@/server/security/validation";

const LOW = { $expr: { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] } };
const SORTS: Record<string, Record<string, 1 | -1>> = {
  stock_asc: { stock: 1, name: 1 },
  stock_desc: { stock: -1, name: 1 },
  name: { name: 1 },
  sold: { totalSold: -1 },
  updated: { updatedAt: -1 },
};

/**
 * GET — Stock overview and list.
 * ?q= &stock=all|low|out|in &status=active|draft|all &sort= &page=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "catalog.view");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const pageSize = Math.min(100, Math.max(10, Math.floor(Number(sp.get("pageSize")) || 25)));

    const base: Record<string, unknown> = { status: { $ne: "archived" } };
    const status = sp.get("status");
    if (status === "active" || status === "draft") base.status = status;

    const filter: Record<string, unknown> = { ...base };
    const stock = sp.get("stock");
    if (stock === "out") filter.stock = { $lte: 0 };
    else if (stock === "low") Object.assign(filter, { stock: { $gt: 0 }, ...LOW });
    else if (stock === "in") filter.stock = { $gt: 0 };
    const q = sp.get("q")?.trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { sku: rx }, { barcode: rx }, { "variants.sku": rx }];
    }

    await connectDB();
    const [items, total, summary, adjustments] = await Promise.all([
      Product.find(filter)
        .sort(SORTS[sp.get("sort") ?? ""] ?? SORTS.stock_asc)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("name slug sku barcode images stock lowStockThreshold trackInventory allowBackorders price costPrice totalSold status variants.sku variants.stock variants.color variants.size updatedAt")
        .populate("brand", "name")
        .lean(),
      Product.countDocuments(filter),
      Product.aggregate([
        { $match: base },
        {
          $group: {
            _id: null,
            products: { $sum: 1 },
            units: { $sum: { $max: ["$stock", 0] } },
            retailValue: { $sum: { $multiply: [{ $max: ["$stock", 0] }, "$price"] } },
            costValue: {
              $sum: { $multiply: [{ $max: ["$stock", 0] }, { $ifNull: ["$costPrice", 0] }] },
            },
            uncosted: {
              $sum: {
                $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $not: [{ $gt: ["$costPrice", 0] }] }] }, 1, 0],
              },
            },
            out: { $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] } },
            low: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$stock", 0] },
                      { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      AuditLog.find({ action: "stock.adjust" })
        .sort({ createdAt: -1 })
        .limit(15)
        .select("summary actorName createdAt meta")
        .lean(),
    ]);

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary: summary[0] ?? { products: 0, units: 0, retailValue: 0, costValue: 0, uncosted: 0, out: 0, low: 0 },
      adjustments: JSON.parse(JSON.stringify(adjustments)),
    });
  } catch (err) {
    return serverError("Inventory error", err, "Couldn't load stock.");
  }
}

const REASONS: Record<string, string> = {
  restock: "New stock received",
  count: "Stock count correction",
  damaged: "Damaged / expired",
  returned: "Customer return",
  lost: "Lost / stolen",
  other: "Other",
};

/**
 * PATCH — Adjust stock. { productId, mode: "add"|"remove"|"set", quantity, reason, note? }
 * Add/remove are applied atomically so two people adjusting at once can't overwrite each other.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "inventory.manage");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    if (!isObjectId(body.productId)) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1_000_000) {
      return NextResponse.json({ error: "Enter a whole number." }, { status: 400 });
    }
    if (!["add", "remove", "set"].includes(body.mode)) {
      return NextResponse.json({ error: "Choose add, remove or set." }, { status: 400 });
    }
    if (body.mode !== "set" && quantity === 0) {
      return NextResponse.json({ error: "Enter how many units." }, { status: 400 });
    }
    const reason = REASONS[body.reason] ? body.reason : "other";
    const note = cleanString(body.note, 200);

    await connectDB();
    const before = await Product.findById(body.productId).select("name stock").lean();
    if (!before) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    let updated;
    if (body.mode === "set") {
      updated = await Product.findByIdAndUpdate(body.productId, { $set: { stock: quantity } }, { new: true });
    } else if (body.mode === "add") {
      updated = await Product.findByIdAndUpdate(body.productId, { $inc: { stock: quantity } }, { new: true });
    } else {
      updated = await Product.findOneAndUpdate(
        { _id: body.productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!updated) {
        return NextResponse.json({ error: `Only ${before.stock} in stock — can't remove ${quantity}.` }, { status: 400 });
      }
    }
    revalidateCatalog();

    const from = before.stock;
    const to = updated!.stock;
    audit(request, auth.user, {
      action: "stock.adjust",
      summary: `${before.name}: ${from} → ${to} (${REASONS[reason]}${note ? ` — ${note}` : ""})`,
      entity: "Product",
      entityId: body.productId,
      meta: { from, to, mode: body.mode, quantity, reason },
    });
    return NextResponse.json({ id: body.productId, stock: to });
  } catch (err) {
    return serverError("Stock adjust error", err, "Couldn't update stock.");
  }
}
