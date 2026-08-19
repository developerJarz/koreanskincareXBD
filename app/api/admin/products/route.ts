import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Product, Category } from "@/server/db/models";
import slugify from "slugify";

// GET — List products with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("category", "name slug")
      .lean();
    return NextResponse.json(JSON.parse(JSON.stringify(products)));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
}

// POST — Create a new product
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await connectDB();

    if (!data.name || !data.price) {
      return NextResponse.json({ error: "Product name and price are required" }, { status: 400 });
    }

    const slug = data.slug
      ? slugify(data.slug, { lower: true, strict: true })
      : slugify(data.name, { lower: true, strict: true });

    // Find or assign default category
    let categoryId = data.category;
    if (!categoryId || !/^[0-9a-fA-F]{24}$/.test(categoryId)) {
      const defaultCategory = await Category.findOne();
      if (defaultCategory) {
        categoryId = defaultCategory._id;
      } else {
        const createdCat = await Category.create({ name: "Bags", slug: "bags" });
        categoryId = createdCat._id;
      }
    }

    const product = await Product.create({
      name: data.name,
      slug,
      description: data.description || "",
      category: categoryId,
      price: Number(data.price),
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
      stock: Number(data.stock ?? 10),
      images: data.images?.length
        ? data.images
        : ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"],
      status: data.status || "active",
      isFeatured: Boolean(data.isFeatured),
      isNewArrival: Boolean(data.isNewArrival),
      isBestseller: Boolean(data.isBestseller),
    });

    return NextResponse.json(JSON.parse(JSON.stringify(product)), { status: 201 });
  } catch (err: any) {
    console.error("Create product error:", err);
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 });
  }
}

// PUT — Edit product
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    await connectDB();

    if (!data.id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (data.name) updates.name = data.name;
    if (data.price !== undefined) updates.price = Number(data.price);
    if (data.compareAtPrice !== undefined) updates.compareAtPrice = Number(data.compareAtPrice);
    if (data.stock !== undefined) updates.stock = Number(data.stock);
    if (data.description !== undefined) updates.description = data.description;
    if (data.status) updates.status = data.status;
    if (data.isFeatured !== undefined) updates.isFeatured = Boolean(data.isFeatured);
    if (data.isNewArrival !== undefined) updates.isNewArrival = Boolean(data.isNewArrival);
    if (data.isBestseller !== undefined) updates.isBestseller = Boolean(data.isBestseller);
    if (data.images) updates.images = data.images;

    const product = await Product.findByIdAndUpdate(data.id, updates, { new: true }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(product)));
  } catch (err: any) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status: 500 });
  }
}

// DELETE — Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await connectDB();
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status: 500 });
  }
}
