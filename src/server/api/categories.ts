import { createServerFn } from "@tanstack/react-start";
import { connectDB } from "@/server/db/connection";
import { Category } from "@/server/db/models";

// ─── Get all active categories ───
export const getCategories = createServerFn({ method: "GET" })
  .validator((data?: { featured?: boolean }) => data ?? {})
  .handler(async ({ data }) => {
    await connectDB();

    const query: Record<string, unknown> = { isActive: true };
    if (data?.featured) query.isFeatured = true;

    const categories = await Category.find(query).sort({ sortOrder: 1 }).lean();

    return JSON.parse(JSON.stringify(categories));
  });

// ─── Get category by slug ───
export const getCategoryBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    await connectDB();
    const category = await Category.findOne({ slug, isActive: true })
      .populate("children", "name slug image productCount")
      .lean();
    return category ? JSON.parse(JSON.stringify(category)) : null;
  });

// ─── Admin: Create category ───
export const createCategory = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const category = await Category.create(data);
    return JSON.parse(JSON.stringify(category.toJSON()));
  });

// ─── Admin: Update category ───
export const updateCategory = createServerFn({ method: "POST" })
  .validator((data: { id: string; updates: Record<string, unknown> }) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const category = await Category.findByIdAndUpdate(data.id, data.updates, { new: true }).lean();
    return JSON.parse(JSON.stringify(category));
  });

// ─── Admin: Delete category ───
export const deleteCategory = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await connectDB();
    await Category.findByIdAndDelete(id);
    return { success: true };
  });
