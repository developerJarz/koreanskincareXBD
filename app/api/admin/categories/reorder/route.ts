import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Category } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError } from "@/server/auth/session";
import { revalidateCatalog } from "@/server/catalog";
import { isObjectId } from "@/server/security/validation";

// PATCH — { orderedIds: [...] } — sets the display order of sibling categories
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    const { orderedIds } = await request.json().catch(() => ({}));
    if (
      !Array.isArray(orderedIds) ||
      orderedIds.length === 0 ||
      orderedIds.length > 500 ||
      !orderedIds.every(isObjectId)
    ) {
      return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    }

    await connectDB();
    // All ids must be siblings (same parent), otherwise the order would mix levels
    const docs = await Category.find({ _id: { $in: orderedIds } })
      .select("parent")
      .lean();
    const parents = new Set(docs.map((d) => String(d.parent ?? "")));
    if (docs.length !== orderedIds.length || parents.size !== 1) {
      return NextResponse.json(
        { error: "Only categories on the same level can be reordered together." },
        { status: 400 },
      );
    }

    await Category.bulkWrite(
      orderedIds.map((id: string, index: number) => ({
        updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } },
      })),
    );
    revalidateCatalog();
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Reorder categories error", err, "Couldn't save the order.");
  }
}
