import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Product } from "@/server/db/models";
import { serverError } from "@/server/auth/session";
import { requirePermission } from "@/server/auth/permissions";
import { cleanString, isObjectId } from "@/server/security/validation";

/**
 * GET ?q=<focus keyword>&exclude=<product id> — other products that already target the same focus
 * keyword (case-insensitive), so the editor can warn before two products compete in search.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "catalog.view");
    if (!auth.ok) return auth.response;

    const params = new URL(request.url).searchParams;
    const q = cleanString(params.get("q"), 100)?.replace(/\s+/g, " ");
    if (!q || q.length < 2) return NextResponse.json({ items: [] });
    const exclude = params.get("exclude");

    await connectDB();
    const items = await Product.find({
      focusKeyword: q,
      status: { $ne: "archived" },
      ...(isObjectId(exclude) ? { _id: { $ne: exclude } } : {}),
    })
      .collation({ locale: "en", strength: 2 })
      .select("name slug")
      .limit(10)
      .lean();

    return NextResponse.json({
      items: items.map((p) => ({ _id: String(p._id), name: p.name, slug: p.slug })),
    });
  } catch (err) {
    return serverError("Focus keyword lookup error", err, "Couldn't check the keyword.");
  }
}
