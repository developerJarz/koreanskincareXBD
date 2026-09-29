import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

import { connectDB } from "@/server/db/connection";
import { Product } from "@/server/db/models";
import { serverError } from "@/server/auth/session";
import { requireVendor } from "@/server/auth/vendor";
import { checkVendorProduct, countVendorProducts, needsReReview } from "@/server/marketplace";
import { isObjectId } from "@/server/security/validation";
import { generateBarcode, generateSku } from "@/server/sku";

const VENDOR_PRODUCT_FIELDS =
  "name slug description price compareAtPrice stock images category status approvalStatus reviewNote vendorActive totalSold createdAt updatedAt";

// GET — This vendor's products (deleted ones excluded)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = await requireVendor(request);
    if (!auth.ok) return auth.response;

    const products = await Product.find({ vendor: auth.vendor._id, status: { $ne: "archived" } })
      .sort({ updatedAt: -1 })
      .select(VENDOR_PRODUCT_FIELDS)
      .lean();
    return NextResponse.json(JSON.parse(JSON.stringify(products)));
  } catch (err) {
    return serverError("Vendor products list error", err, "Failed to load your products");
  }
}

// POST — Add a product, within the vendor's product limit
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = await requireVendor(request, { write: true });
    if (!auth.ok) return auth.response;
    const { vendor } = auth;

    const used = await countVendorProducts(vendor._id);
    if (used >= vendor.limits.maxProducts) {
      return NextResponse.json(
        {
          error: `You've reached your limit of ${vendor.limits.maxProducts} products. Delete one or ask the shop team to raise the limit.`,
        },
        { status: 403 },
      );
    }

    const checked = checkVendorProduct(vendor, await request.json().catch(() => ({})));
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
    const input = checked.value;

    // Short suffix keeps vendor slugs from ever colliding with the shop's own products
    const slug = `${slugify(input.name, { lower: true, strict: true }).slice(0, 60)}-${Date.now().toString(36)}`;

    const product = await Product.create({
      ...input,
      slug,
      // Stock codes are assigned automatically, like the shop's own products
      sku: await generateSku(null, input.category),
      barcode: await generateBarcode(),
      vendor: vendor._id,
      approvalStatus: vendor.limits.requireProductApproval ? "pending" : "approved",
      vendorActive: true,
      // Merchandising flags are the shop team's decision, never the vendor's
      isFeatured: false,
      isNewArrival: false,
      isBestseller: false,
      trackInventory: true,
    });

    return NextResponse.json(product.toJSON(), { status: 201 });
  } catch (err) {
    return serverError("Vendor product create error", err, "Failed to add the product");
  }
}

// PUT — Edit one of this vendor's products. Changing anything customers see sends it back for review.
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const auth = await requireVendor(request, { write: true });
    if (!auth.ok) return auth.response;
    const { vendor } = auth;

    const body = await request.json().catch(() => ({}));
    if (!isObjectId(body.id)) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    // Ownership check: vendors can only ever load and edit their own products
    const product = await Product.findOne({
      _id: body.id,
      vendor: vendor._id,
      status: { $ne: "archived" },
    });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const checked = checkVendorProduct(vendor, body);
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
    const input = checked.value;

    const reReview = vendor.limits.requireProductApproval && needsReReview(product, input);

    product.set({
      name: input.name,
      description: input.description,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      stock: input.stock,
      images: input.images,
      category: input.category,
      status: input.status,
    });
    if (reReview) {
      product.approvalStatus = "pending";
      product.reviewNote = "";
    }
    await product.save();

    return NextResponse.json(product.toJSON());
  } catch (err) {
    return serverError("Vendor product update error", err, "Failed to save the product");
  }
}

// DELETE — Remove a product from the vendor's store (kept as archived so past orders still resolve)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const auth = await requireVendor(request, { write: true });
    if (!auth.ok) return auth.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!isObjectId(id))
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });

    const res = await Product.updateOne(
      { _id: id, vendor: auth.vendor._id },
      { $set: { status: "archived" } },
    );
    if (res.matchedCount === 0)
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Vendor product delete error", err, "Failed to delete the product");
  }
}
