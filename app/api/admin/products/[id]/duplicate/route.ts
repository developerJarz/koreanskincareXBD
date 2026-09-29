import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Product } from "@/server/db/models";
import { requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import { resolveSlug, toEditorProduct } from "@/server/catalog-admin";
import { revalidateCatalog } from "@/server/catalog";
import { isObjectId } from "@/server/security/validation";
import { generateBarcode, generateSku } from "@/server/sku";

// POST — copies a product as a new draft (new SKU/barcode, no sales history) to edit and publish
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    await connectDB();
    const source = await Product.findById(id).lean();
    if (!source) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const name = `${source.name} (copy)`;
    const slug = await resolveSlug(Product, undefined, name);
    if ("error" in slug) return NextResponse.json({ error: slug.error }, { status: 400 });

    const {
      _id,
      createdAt: _c,
      updatedAt: _u,
      __v,
      sku: _sku,
      barcode: _barcode,
      vendor: _vendor,
      approvalStatus: _a,
      reviewNote: _r,
      ...rest
    } = source as any;

    const copy = await Product.create({
      ...rest,
      name,
      slug: slug.slug,
      // The copy gets its own codes
      sku: await generateSku(rest.brand ? String(rest.brand) : null, String(rest.category)),
      barcode: await generateBarcode(),
      status: "draft",
      totalSold: 0,
      totalReviews: 0,
      avgRating: 0,
      viewCount: 0,
    });
    revalidateCatalog();
    return NextResponse.json(toEditorProduct(copy.toObject()), { status: 201 });
  } catch (err) {
    return serverError("Duplicate product error", err, "Couldn't duplicate the product.");
  }
}
