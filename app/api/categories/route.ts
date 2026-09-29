import { NextResponse } from "next/server";

import { getCategoryTree } from "@/server/catalog";

// GET /api/categories — active categories as a tree (with subcategories and product counts)
export async function GET() {
  try {
    const tree = await getCategoryTree();
    return NextResponse.json(tree, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("Public categories error:", err);
    return NextResponse.json({ error: "Couldn't load categories." }, { status: 500 });
  }
}
