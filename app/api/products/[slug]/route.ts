import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Product } from "@/server/db/models";
import { PRODUCTS } from "@/lib/site-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    await connectDB();
    const product = await Product.findOne({ slug }).populate("category", "name slug").lean();

    if (product) {
      // Find related products in the same category
      const related = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        isActive: { $ne: false },
      })
        .limit(4)
        .populate("category", "name slug")
        .lean();

      return NextResponse.json({
        product: JSON.parse(JSON.stringify(product)),
        related: JSON.parse(JSON.stringify(related)),
      });
    }

    // Static fallback
    const fallbackProd = PRODUCTS.find((p) => p.slug === slug);
    if (fallbackProd) {
      const relatedFallback = PRODUCTS.filter(
        (p) => p.category === fallbackProd.category && p.slug !== slug,
      ).slice(0, 4);
      return NextResponse.json({ product: fallbackProd, related: relatedFallback });
    }

    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (err: any) {
    console.warn("Single product fetch error:", err);
    const fallbackProd = PRODUCTS.find((p) => p.slug === slug);
    if (fallbackProd) {
      return NextResponse.json({ product: fallbackProd, related: [] });
    }
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}
