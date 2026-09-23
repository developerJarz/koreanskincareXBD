import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Product, Category } from "@/server/db/models";
import { PRODUCTS } from "@/lib/site-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "featured";
  const tag = searchParams.get("tag");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const inStockOnly = searchParams.get("inStock") === "true";

  try {
    await connectDB();

    const query: Record<string, any> = { isActive: { $ne: false } };

    if (categorySlug && categorySlug !== "all") {
      const catDoc = await Category.findOne({ slug: categorySlug }).lean();
      if (catDoc) {
        query.category = catDoc._id;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (tag) {
      if (tag === "sale") query.compareAtPrice = { $gt: 0 };
      else if (tag === "bestseller") query.isBestseller = true;
      else if (tag === "new") query.isNewArrival = true;
      else if (tag === "featured") query.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStockOnly) {
      query.stock = { $gt: 0 };
    }

    // Sort order
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") sortOptions = { price: 1 };
    else if (sort === "price_desc") sortOptions = { price: -1 };
    else if (sort === "newest") sortOptions = { createdAt: -1 };
    else if (sort === "bestseller") sortOptions = { isBestseller: -1, createdAt: -1 };

    const products = await Product.find(query)
      .sort(sortOptions)
      .populate("category", "name slug")
      .lean();

    if (products.length > 0) {
      return NextResponse.json(JSON.parse(JSON.stringify(products)), {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    // Return static products if none match in DB
    let fallback = [...PRODUCTS];
    if (categorySlug && categorySlug !== "all") {
      fallback = fallback.filter((p) => p.category === categorySlug);
    }
    if (search) {
      fallback = fallback.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return NextResponse.json(fallback);
  } catch (err) {
    console.warn("DB products fetch error, returning site-data fallback:", err);
    let fallback = [...PRODUCTS];
    if (categorySlug && categorySlug !== "all") {
      fallback = fallback.filter((p) => p.category === categorySlug);
    }
    return NextResponse.json(fallback);
  }
}
