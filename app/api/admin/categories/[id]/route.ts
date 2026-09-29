import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Category, Product } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError } from "@/server/auth/session";
import { validateCategory } from "@/server/category-admin";
import { revalidateCatalog } from "@/server/catalog";
import { isObjectId } from "@/server/security/validation";

type Ctx = { params: Promise<{ id: string }> };

// PUT — update a category (admins). Send the full category form.
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id))
      return NextResponse.json({ error: "Category not found." }, { status: 404 });

    await connectDB();
    const category = await Category.findById(id);
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

    const checked = await validateCategory(await request.json().catch(() => ({})), category);
    if ("errors" in checked) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields.", fields: checked.errors },
        { status: 400 },
      );
    }
    const movedParent = String(category.parent ?? "") !== String(checked.value.parent ?? "");
    category.set({ ...checked.value, parent: checked.value.parent ?? undefined });
    if (movedParent) {
      const last = await Category.findOne({
        parent: checked.value.parent ?? null,
        _id: { $ne: category._id },
      })
        .sort({ sortOrder: -1 })
        .select("sortOrder")
        .lean();
      category.sortOrder = (last?.sortOrder ?? -1) + 1;
    }
    await category.save();
    revalidateCatalog();
    return NextResponse.json({ ...category.toJSON(), parent: checked.value.parent });
  } catch (err) {
    return serverError("Update category error", err, "Couldn't save the category.");
  }
}

// PATCH — quick toggles from the list: { isActive?, isFeatured? }
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id))
      return NextResponse.json({ error: "Category not found." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const set: Record<string, boolean> = {};
    if (typeof body.isActive === "boolean") set.isActive = body.isActive;
    if (typeof body.isFeatured === "boolean") set.isFeatured = body.isFeatured;

    await connectDB();
    const category = await Category.findByIdAndUpdate(id, { $set: set }, { new: true });
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    revalidateCatalog();
    return NextResponse.json(category.toJSON());
  } catch (err) {
    return serverError("Toggle category error", err, "Couldn't update the category.");
  }
}

// DELETE — only empty categories: no products and no subcategories, so nothing is orphaned
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id))
      return NextResponse.json({ error: "Category not found." }, { status: 404 });

    await connectDB();
    const [children, used] = await Promise.all([
      Category.countDocuments({ parent: id }),
      Product.countDocuments({ $or: [{ category: id }, { subcategory: id }] }),
    ]);
    if (children > 0) {
      return NextResponse.json(
        {
          error: `This category has ${children} subcategor${children === 1 ? "y" : "ies"}. Delete or move them first.`,
        },
        { status: 409 },
      );
    }
    if (used > 0) {
      return NextResponse.json(
        {
          error: `${used} product${used === 1 ? " is" : "s are"} in this category. Move them first, or deactivate the category instead.`,
        },
        { status: 409 },
      );
    }
    const res = await Category.deleteOne({ _id: id });
    if (res.deletedCount === 0)
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    revalidateCatalog();
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Delete category error", err, "Couldn't delete the category.");
  }
}
