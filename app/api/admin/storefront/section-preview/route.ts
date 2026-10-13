import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { resolveHomeSections } from "@/server/catalog";
import { CONTENT_SECTIONS, normalizeStorefront, type HomeSectionId } from "@/lib/storefront";

/**
 * POST — { section } → exactly what that homepage section would show with these settings
 * (unsaved settings included), using the same code as the homepage itself.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "catalog.view");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const id = body?.section?.id as HomeSectionId;
    if (!CONTENT_SECTIONS.includes(id)) {
      return NextResponse.json({ error: "This section has no products to preview." }, { status: 400 });
    }
    // Run the settings through the same validation as saving
    const section = normalizeStorefront({ sections: [body.section] }).value.sections.find(
      (s) => s.id === id,
    )!;
    const content = await resolveHomeSections([{ ...section, enabled: true }]);

    if (id === "categories") {
      return NextResponse.json({
        kind: "category",
        items: content.categories.map((c) => ({
          id: c.id,
          name: c.name,
          image: c.image,
          meta: `${c.productCount} products`,
          href: `/category/${c.slug}`,
        })),
      });
    }
    if (id === "brands") {
      return NextResponse.json({
        kind: "brand",
        items: content.brands.map((b) => ({
          id: b.id,
          name: b.name,
          image: b.logo ?? "",
          meta: `${b.productCount} products`,
          href: `/brand/${b.slug}`,
        })),
      });
    }
    return NextResponse.json({
      kind: "product",
      items: (content.rows[id] ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        image: p.img,
        meta: `৳${p.price.toLocaleString("en-US")}${p.was ? ` (was ৳${p.was.toLocaleString("en-US")})` : ""} · ${
          p.inStock ? `${p.stock} in stock` : "out of stock"
        }`,
        href: `/product/${p.slug}`,
      })),
    });
  } catch (err) {
    return serverError("Section preview error", err, "Couldn't preview this section.");
  }
}
