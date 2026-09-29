import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Product } from "@/server/db/models";
import { requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import { cleanString, isObjectId } from "@/server/security/validation";

// GET — Vendor products, by default the ones waiting for review (?status=pending|approved|rejected|all, ?vendor=<id>)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";
    const vendorId = searchParams.get("vendor");

    const query: Record<string, unknown> = { vendor: { $ne: null }, status: { $ne: "archived" } };
    if (["pending", "approved", "rejected"].includes(status)) query.approvalStatus = status;
    if (isObjectId(vendorId)) query.vendor = vendorId;

    await connectDB();
    const products = await Product.find(query)
      .sort({ updatedAt: -1 })
      .limit(200)
      .select(
        "name slug price compareAtPrice stock images status approvalStatus reviewNote vendor category updatedAt createdAt",
      )
      .populate("vendor", "storeName slug status")
      .populate("category", "name")
      .lean();

    return NextResponse.json(JSON.parse(JSON.stringify(products)));
  } catch (err) {
    return serverError("Vendor products review list error", err, "Failed to load products");
  }
}

// PATCH — Approve or reject a vendor product: { productId, decision: "approve" | "reject", note? }
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;

    const { productId, decision, note } = await request.json().catch(() => ({}));
    if (!isObjectId(productId) || !["approve", "reject"].includes(decision)) {
      return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
    }
    const reviewNote = cleanString(note, 500) ?? "";
    if (decision === "reject" && reviewNote.length < 5) {
      return NextResponse.json(
        { error: "Tell the vendor why it was rejected so they can fix it." },
        { status: 400 },
      );
    }

    await connectDB();
    const product = await Product.findOneAndUpdate(
      { _id: productId, vendor: { $ne: null } },
      {
        $set: {
          approvalStatus: decision === "approve" ? "approved" : "rejected",
          reviewNote: decision === "approve" ? "" : reviewNote,
        },
      },
      { new: true },
    ).lean();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    return NextResponse.json(JSON.parse(JSON.stringify(product)));
  } catch (err) {
    return serverError("Vendor product review error", err, "Failed to save the review");
  }
}
