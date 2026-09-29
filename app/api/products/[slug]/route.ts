import { NextRequest, NextResponse } from "next/server";

import { getProductPageData } from "@/server/catalog";

// GET /api/products/:slug — one published product with related and same-brand products
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const data = await getProductPageData(decodeURIComponent(slug).slice(0, 200));
    if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("Single product fetch error:", err);
    return NextResponse.json({ error: "Couldn't load the product." }, { status: 500 });
  }
}
