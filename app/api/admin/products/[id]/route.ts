import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Order, Product } from "@/server/db/models";
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
import { isObjectId, toNonNegativeNumber } from "@/server/security/validation";

type Ctx = { params: Promise<{ id: string }> };
const notFound = () => NextResponse.json({ error: "Product not found." }, { status: 404 });

// GET — one product in the editor's shape
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    await connectDB();
    const product = await Product.findById(id).lean();
    if (!product) return notFound();
    return NextResponse.json(toEditorProduct(product));
  } catch (err) {
    return serverError("Get product error", err, "Couldn't load the product.");
  }
}

// PUT — save the full editor form
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    await connectDB();
    const product = await Product.findById(id);
    if (!product) return notFound();

    const checked = await validateProduct(await request.json().catch(() => ({})));
    if ("errors" in checked) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields.", fields: checked.errors },
        { status: 400 },
      );
    }
    const { slug: requestedSlug, ...value } = checked.value;

    const slug = await resolveSlug(Product, requestedSlug ?? product.slug, value.name, product._id);
    if ("error" in slug) {
      return NextResponse.json(
        { error: slug.error, fields: { slug: slug.error } },
        { status: 400 },
      );
    }
    if (await skuTaken(value.sku, id)) {
      const msg = `SKU ${value.sku} is already used by another product.`;
      return NextResponse.json({ error: msg, fields: { sku: msg } }, { status: 409 });
    }
    if (await barcodeTaken(value.barcode, id)) {
      const msg = `Barcode ${value.barcode} is already used by another product.`;
      return NextResponse.json({ error: msg, fields: { barcode: msg } }, { status: 409 });
    }
    // Older products saved without codes get them the next time they're saved
    await fillInventoryCodes(value);

    product.set({
      ...value,
      slug: slug.slug,
      // Optional fields cleared in the form must be removed, not left at their old value
      compareAtPrice: value.compareAtPrice ?? undefined,
      costPrice: value.costPrice ?? undefined,
      sku: value.sku ?? undefined,
      brand: value.brand ?? undefined,
      subcategory: value.subcategory ?? undefined,
    });
    await product.save();
    revalidateCatalog();
    return NextResponse.json(toEditorProduct(product.toObject()));
  } catch (err) {
    return serverError("Update product error", err, "Couldn't save the product.");
  }
}

/**
 * PATCH — quick changes from the product table / stock page:
 * { status?, stock?, isFeatured?, isBestseller?, isNewArrival?, isTrending? }
 * Publishing still requires a price, category and image.
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    const body = await request.json().catch(() => ({}));
    await connectDB();
    const product = await Product.findById(id);
    if (!product) return notFound();

    if (body.status !== undefined) {
      if (!["draft", "active", "archived"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      if (body.status === "active") {
        const missing = [
          !(product.price > 0) && "a price",
          !product.category && "a category",
          !(product.images?.length || product.media?.length) && "an image",
        ].filter(Boolean);
        if (missing.length) {
          return NextResponse.json(
            { error: `Add ${missing.join(", ")} before publishing.` },
            { status: 400 },
          );
        }
      }
      product.status = body.status;
    }
    if (body.stock !== undefined) {
      const stock = toNonNegativeNumber(body.stock, 1_000_000);
      if (stock === undefined || !Number.isInteger(stock)) {
        return NextResponse.json({ error: "Stock must be a whole number." }, { status: 400 });
      }
      product.stock = stock;
    }
    for (const flag of ["isFeatured", "isBestseller", "isNewArrival", "isTrending"] as const) {
      if (typeof body[flag] === "boolean") product[flag] = body[flag];
    }
    await product.save();
    revalidateCatalog();
    return NextResponse.json(toEditorProduct(product.toObject()));
  } catch (err) {
    return serverError("Quick update product error", err, "Couldn't update the product.");
  }
}

/**
 * DELETE — removes a product. If it appears in any order it is archived instead, so order
 * history and invoices keep a valid product reference.
 */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    await connectDB();
    const product = await Product.findById(id).select("_id");
    if (!product) return notFound();

    if (await Order.exists({ "items.product": product._id })) {
      await Product.updateOne({ _id: product._id }, { $set: { status: "archived" } });
      revalidateCatalog();
      return NextResponse.json({
        archived: true,
        message:
          "This product is in past orders, so it was archived (hidden everywhere) instead of deleted.",
      });
    }
    await Product.deleteOne({ _id: product._id });
    revalidateCatalog();
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return serverError("Delete product error", err, "Couldn't delete the product.");
  }
}
