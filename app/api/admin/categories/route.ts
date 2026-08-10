import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Category } from "@/server/db/models";
import slugify from "slugify";

// GET — List categories
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(categories)));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch categories" }, { status: 500 });
  }
}

// POST — Create new category
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await connectDB();

    if (!data.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const slug = data.slug
      ? slugify(data.slug, { lower: true, strict: true })
      : slugify(data.name, { lower: true, strict: true });

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "A category with this slug already exists" }, { status: 400 });
    }

    const category = await Category.create({
      name: data.name,
      slug,
      description: data.description || `${data.name} collection`,
      image: data.image || "",
      productCount: Number(data.productCount || 0),
      sortOrder: Number(data.sortOrder || 0),
      isFeatured: Boolean(data.isFeatured ?? true),
      isActive: Boolean(data.isActive ?? true),
    });

    return NextResponse.json(JSON.parse(JSON.stringify(category)), { status: 201 });
  } catch (err: any) {
    console.error("Create category error:", err);
    return NextResponse.json({ error: err.message || "Failed to create category" }, { status: 500 });
  }
}

// PUT — Edit category
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    await connectDB();

    if (!data.id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (data.name) updates.name = data.name;
    if (data.slug) updates.slug = slugify(data.slug, { lower: true, strict: true });
    if (data.description !== undefined) updates.description = data.description;
    if (data.image !== undefined) updates.image = data.image;
    if (data.sortOrder !== undefined) updates.sortOrder = Number(data.sortOrder);
    if (data.isFeatured !== undefined) updates.isFeatured = Boolean(data.isFeatured);
    if (data.isActive !== undefined) updates.isActive = Boolean(data.isActive);

    const category = await Category.findByIdAndUpdate(data.id, updates, { new: true }).lean();
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(category)));
  } catch (err: any) {
    console.error("Update category error:", err);
    return NextResponse.json({ error: err.message || "Failed to update category" }, { status: 500 });
  }
}

// DELETE — Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Category ID is required" }, { status: 400 });

    await connectDB();
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete category" }, { status: 500 });
  }
}
