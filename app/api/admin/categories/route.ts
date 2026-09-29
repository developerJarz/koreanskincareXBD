import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";

import { connectDB } from "@/server/db/connection";
import { Category, Product } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import { validateCategory } from "@/server/category-admin";
import { revalidateCatalog } from "@/server/catalog";

// GET — all categories (flat, with parent ids) and product counts. The UI builds the tree.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;

    await connectDB();
    const [cats, direct, sub] = await Promise.all([
      Category.find().sort({ sortOrder: 1, name: 1 }).limit(2000).lean(),
      Product.aggregate<{ _id: Types.ObjectId; n: number }>([
        { $match: { status: { $ne: "archived" } } },
        { $group: { _id: "$category", n: { $sum: 1 } } },
      ]),
      Product.aggregate<{ _id: Types.ObjectId; n: number }>([
        { $match: { status: { $ne: "archived" }, subcategory: { $ne: null } } },
        { $group: { _id: "$subcategory", n: { $sum: 1 } } },
      ]),
    ]);
    const count = new Map<string, number>();
    for (const r of [...direct, ...sub])
      count.set(String(r._id), (count.get(String(r._id)) ?? 0) + r.n);

    return NextResponse.json(
      cats.map((c) => ({
        ...JSON.parse(JSON.stringify(c)),
        parent: c.parent ? String(c.parent) : null,
        productCount: count.get(String(c._id)) ?? 0,
      })),
    );
  } catch (err) {
    return serverError("List categories error", err, "Couldn't load categories.");
  }
}

// POST — create a category or subcategory (admins)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    await connectDB();
    const checked = await validateCategory(await request.json().catch(() => ({})));
    if ("errors" in checked) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields.", fields: checked.errors },
        { status: 400 },
      );
    }

    // New categories go to the end of their list
    const last = await Category.findOne({ parent: checked.value.parent ?? null })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();
    const category = await Category.create({
      ...checked.value,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    });
    revalidateCatalog();
    return NextResponse.json(
      { ...category.toJSON(), parent: checked.value.parent, productCount: 0 },
      { status: 201 },
    );
  } catch (err) {
    return serverError("Create category error", err, "Couldn't create the category.");
  }
}
