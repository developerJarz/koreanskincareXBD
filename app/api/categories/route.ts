import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Category, Product } from "@/server/db/models";
import { CATEGORIES } from "@/lib/site-data";

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: { $ne: false } })
      .sort({ sortOrder: 1 })
      .lean();

    if (categories.length > 0) {
      // Calculate dynamic product counts for each category
      const counts = await Product.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]);

      const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

      const enriched = categories.map((cat) => ({
        ...cat,
        productCount: countMap.get(cat._id.toString()) || cat.productCount || 0,
      }));

      return NextResponse.json(JSON.parse(JSON.stringify(enriched)), {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      });
    }

    return NextResponse.json(CATEGORIES);
  } catch (err) {
    console.warn("DB categories error, returning static fallback:", err);
    return NextResponse.json(CATEGORIES);
  }
}
