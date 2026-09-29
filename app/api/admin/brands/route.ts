import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";

import { connectDB } from "@/server/db/connection";
import { Brand, Product } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import { validateBrand } from "@/server/brand-admin";
import { revalidateCatalog } from "@/server/catalog";

// GET — every brand (active or not) with how many products use it
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;

    await connectDB();
    const [brands, counts] = await Promise.all([
      Brand.find().sort({ sortOrder: 1, name: 1 }).limit(1000).lean(),
      Product.aggregate<{ _id: Types.ObjectId; total: number; live: number }>([
        { $match: { brand: { $ne: null }, status: { $ne: "archived" } } },
        {
          $group: {
            _id: "$brand",
            total: { $sum: 1 },
            live: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          },
        },
      ]),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c]));
    return NextResponse.json(
      brands.map((b) => ({
        ...JSON.parse(JSON.stringify(b)),
        productCount: byId.get(String(b._id))?.total ?? 0,
        liveProductCount: byId.get(String(b._id))?.live ?? 0,
      })),
    );
  } catch (err) {
    return serverError("List brands error", err, "Couldn't load brands.");
  }
}

// POST — create a brand (admins)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    await connectDB();
    const checked = await validateBrand(await request.json().catch(() => ({})));
    if ("errors" in checked) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields.", fields: checked.errors },
        { status: 400 },
      );
    }
    const brand = await Brand.create(checked.value);
    revalidateCatalog();
    return NextResponse.json(
      { ...brand.toJSON(), productCount: 0, liveProductCount: 0 },
      { status: 201 },
    );
  } catch (err) {
    return serverError("Create brand error", err, "Couldn't create the brand.");
  }
}
