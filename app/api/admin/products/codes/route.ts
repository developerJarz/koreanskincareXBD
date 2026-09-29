import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Product } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import { revalidateCatalog } from "@/server/catalog";
import { isObjectId } from "@/server/security/validation";
import { generateBarcode, generateSku } from "@/server/sku";

const MISSING = (field: string) => ({
  $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: "" }],
});

/**
 * GET ?brand=<id>&category=<id>&want=sku|barcode|both — a fresh SKU/barcode suggestion for the
 * product editor (nothing is saved). Also reports how many products still have no codes.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;
    await connectDB();

    const params = new URL(request.url).searchParams;
    const brand = params.get("brand");
    const category = params.get("category");
    const want = params.get("want") ?? "both";

    const [sku, barcode, missingSku, missingBarcode] = await Promise.all([
      want !== "barcode"
        ? generateSku(isObjectId(brand) ? brand : null, isObjectId(category) ? category : null)
        : undefined,
      want !== "sku" ? generateBarcode() : undefined,
      Product.countDocuments(MISSING("sku")),
      Product.countDocuments(MISSING("barcode")),
    ]);
    return NextResponse.json({
      sku,
      barcode,
      missing: { sku: missingSku, barcode: missingBarcode },
    });
  } catch (err) {
    return serverError("Generate product codes error", err, "Couldn't generate codes.");
  }
}

/** POST — gives every product that has no SKU or barcode one (admins only). Existing codes are kept. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;
    await connectDB();

    const products = await Product.find({ $or: [MISSING("sku"), MISSING("barcode")] })
      .select("sku barcode brand category createdAt")
      .sort({ createdAt: 1 })
      .lean();

    // Codes handed out in this run, so two products never get the same one
    const reservedSkus = new Set<string>();
    const reservedBarcodes = new Set<string>();
    let skus = 0;
    let barcodes = 0;

    for (const p of products) {
      const set: Record<string, string> = {};
      if (!p.sku) {
        set.sku = await generateSku(
          p.brand ? String(p.brand) : null,
          p.category ? String(p.category) : null,
          reservedSkus,
        );
        reservedSkus.add(set.sku);
        skus++;
      }
      if (!p.barcode) {
        set.barcode = await generateBarcode(reservedBarcodes);
        reservedBarcodes.add(set.barcode);
        barcodes++;
      }
      await Product.updateOne({ _id: p._id }, { $set: set });
    }

    if (products.length) revalidateCatalog();
    return NextResponse.json({ updated: products.length, skus, barcodes });
  } catch (err) {
    return serverError("Fill product codes error", err, "Couldn't generate the missing codes.");
  }
}
