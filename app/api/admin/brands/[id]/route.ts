import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Brand, Product } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError } from "@/server/auth/session";
import { validateBrand } from "@/server/brand-admin";
import { revalidateCatalog } from "@/server/catalog";
import { isObjectId } from "@/server/security/validation";

type Ctx = { params: Promise<{ id: string }> };

// PUT — update a brand (admins). Send the full brand form.
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Brand not found." }, { status: 404 });

    await connectDB();
    const brand = await Brand.findById(id);
    if (!brand) return NextResponse.json({ error: "Brand not found." }, { status: 404 });

    const checked = await validateBrand(await request.json().catch(() => ({})), brand._id);
    if ("errors" in checked) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields.", fields: checked.errors },
        { status: 400 },
      );
    }
    brand.set(checked.value);
    await brand.save();
    revalidateCatalog();
    return NextResponse.json(brand.toJSON());
  } catch (err) {
    return serverError("Update brand error", err, "Couldn't save the brand.");
  }
}

// PATCH — quick toggles from the list: { isActive?, showOnHomepage? }
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Brand not found." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const set: Record<string, boolean> = {};
    if (typeof body.isActive === "boolean") set.isActive = body.isActive;
    if (typeof body.showOnHomepage === "boolean") set.showOnHomepage = body.showOnHomepage;

    await connectDB();
    const brand = await Brand.findByIdAndUpdate(id, { $set: set }, { new: true });
    if (!brand) return NextResponse.json({ error: "Brand not found." }, { status: 404 });
    revalidateCatalog();
    return NextResponse.json(brand.toJSON());
  } catch (err) {
    return serverError("Toggle brand error", err, "Couldn't update the brand.");
  }
}

// DELETE — only brands no product uses, so no product is left pointing at a missing brand
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Brand not found." }, { status: 404 });

    await connectDB();
    const used = await Product.countDocuments({ brand: id });
    if (used > 0) {
      return NextResponse.json(
        {
          error: `${used} product${used === 1 ? " uses" : "s use"} this brand. Move them to another brand first, or deactivate the brand instead.`,
        },
        { status: 409 },
      );
    }
    const res = await Brand.deleteOne({ _id: id });
    if (res.deletedCount === 0)
      return NextResponse.json({ error: "Brand not found." }, { status: 404 });
    revalidateCatalog();
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Delete brand error", err, "Couldn't delete the brand.");
  }
}
