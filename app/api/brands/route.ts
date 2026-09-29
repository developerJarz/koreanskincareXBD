import { NextResponse } from "next/server";

import { getBrands } from "@/server/catalog";

// GET /api/brands — active brands with product counts
export async function GET() {
  try {
    const brands = await getBrands();
    return NextResponse.json(brands, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("Public brands error:", err);
    return NextResponse.json({ error: "Couldn't load brands." }, { status: 500 });
  }
}
