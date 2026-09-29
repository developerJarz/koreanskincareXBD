import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Category, Product } from "@/server/db/models";
import { requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import {
  barcodeTaken,
  fillInventoryCodes,
  resolveSlug,
  skuTaken,
  toEditorProduct,
  validateProduct,
} from "@/server/catalog-admin";
import { revalidateCatalog } from "@/server/catalog";
import { escapeRegex, isObjectId } from "@/server/security/validation";

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  stock_asc: { stock: 1 },
  updated: { updatedAt: -1 },
};

/**
 * GET — paginated product list for the admin table.
 * ?q= &brand=<id> &category=<id> &status=draft|active|archived|out_of_stock &stock=low|out|in
 * &minPrice= &maxPrice= &flag=featured|bestseller|new|sale|trending &sort= &page= &pageSize=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const pageSize = Math.min(100, Math.max(5, Math.floor(Number(sp.get("pageSize")) || 20)));

    await connectDB();
    const and: Record<string, unknown>[] = [];

    const q = sp.get("q")?.trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      and.push({ $or: [{ name: rx }, { sku: rx }, { slug: rx }, { tags: rx }] });
    }
    const brand = sp.get("brand");
    if (brand === "none") and.push({ brand: null });
    else if (isObjectId(brand)) and.push({ brand });

    const category = sp.get("category");
    if (isObjectId(category)) {
      const children = await Category.find({ parent: category }).select("_id").lean();
      const ids = [category, ...children.map((c) => String(c._id))];
      and.push({ $or: [{ category: { $in: ids } }, { subcategory: { $in: ids } }] });
    }

    const status = sp.get("status");
    if (status === "draft" || status === "active" || status === "archived") and.push({ status });
    else if (status === "out_of_stock")
      and.push({ status: "active", stock: { $lte: 0 }, allowBackorders: { $ne: true } });
    else and.push({ status: { $ne: "archived" } });

    const stock = sp.get("stock");
    if (stock === "out") and.push({ stock: { $lte: 0 } });
    else if (stock === "low")
      and.push({
        stock: { $gt: 0 },
        $expr: { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] },
      });
    else if (stock === "in") and.push({ stock: { $gt: 0 } });

    const minPrice = Number(sp.get("minPrice"));
    const maxPrice = Number(sp.get("maxPrice"));
    if (sp.get("minPrice") && Number.isFinite(minPrice)) and.push({ price: { $gte: minPrice } });
    if (sp.get("maxPrice") && Number.isFinite(maxPrice)) and.push({ price: { $lte: maxPrice } });

    const flagField: Record<string, string> = {
      featured: "isFeatured",
      bestseller: "isBestseller",
      new: "isNewArrival",
      sale: "isOnSale",
      trending: "isTrending",
    };
    const flag = sp.get("flag");
    if (flag && flagField[flag]) and.push({ [flagField[flag]]: true });

    const filter = and.length ? { $and: and } : {};
    const sortKey = sp.get("sort") ?? "newest";
    let query = Product.find(filter)
      .sort(SORTS[sortKey] ?? SORTS.newest)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select(
        "name slug sku price compareAtPrice stock lowStockThreshold allowBackorders images media status isFeatured isBestseller isNewArrival isOnSale isTrending brand category subcategory vendor approvalStatus createdAt updatedAt",
      )
      .populate("brand", "name slug")
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("vendor", "storeName")
      .lean();
    if (sortKey.startsWith("name")) query = query.collation({ locale: "en", strength: 2 });

    const [items, total, statusCounts] = await Promise.all([
      query,
      Product.countDocuments(filter),
      Product.aggregate<{ _id: string; n: number }>([
        { $group: { _id: "$status", n: { $sum: 1 } } },
      ]),
    ]);

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s._id, s.n])),
    });
  } catch (err) {
    return serverError("Admin product list error", err, "Couldn't load products.");
  }
}

// POST — create a product from the editor
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;

    await connectDB();
    const checked = await validateProduct(await request.json().catch(() => ({})));
    if ("errors" in checked) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields.", fields: checked.errors },
        { status: 400 },
      );
    }
    const { slug: requestedSlug, ...value } = checked.value;

    const slug = await resolveSlug(Product, requestedSlug, value.name);
    if ("error" in slug) {
      return NextResponse.json(
        { error: slug.error, fields: { slug: slug.error } },
        { status: 400 },
      );
    }
    if (await skuTaken(value.sku)) {
      const msg = `SKU ${value.sku} is already used by another product.`;
      return NextResponse.json({ error: msg, fields: { sku: msg } }, { status: 409 });
    }
    if (await barcodeTaken(value.barcode)) {
      const msg = `Barcode ${value.barcode} is already used by another product.`;
      return NextResponse.json({ error: msg, fields: { barcode: msg } }, { status: 409 });
    }
    // Left empty in the form → generated automatically
    await fillInventoryCodes(value);

    const product = await Product.create({ ...value, slug: slug.slug });
    revalidateCatalog();
    return NextResponse.json(toEditorProduct(product.toObject()), { status: 201 });
  } catch (err) {
    return serverError("Create product error", err, "Couldn't create the product.");
  }
}
