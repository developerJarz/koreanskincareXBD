import { createServerFn } from "@tanstack/react-start";
import { connectDB } from "@/server/db/connection";
import { Product } from "@/server/db/models";

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  minRating?: number;
  hasDiscount?: boolean;
  search?: string;
  tags?: string[];
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
}

export interface ProductSort {
  field: "createdAt" | "price" | "totalSold" | "avgRating" | "name";
  order: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Get products with filtering, sorting, pagination ───
export const getProducts = createServerFn({ method: "GET" })
  .validator(
    (data: { filters?: ProductFilters; sort?: ProductSort; page?: number; pageSize?: number }) =>
      data,
  )
  .handler(async ({ data }) => {
    await connectDB();

    const {
      filters = {},
      sort = { field: "createdAt", order: "desc" },
      page = 1,
      pageSize = 12,
    } = data;

    // Build query
    const query: Record<string, unknown> = { status: "active" };

    if (filters.category) query.category = filters.category;
    if (filters.brand) query.brand = filters.brand;
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) (query.price as Record<string, number>).$gte = filters.minPrice;
      if (filters.maxPrice) (query.price as Record<string, number>).$lte = filters.maxPrice;
    }
    if (filters.colors?.length) query.colors = { $in: filters.colors };
    if (filters.sizes?.length) query.sizes = { $in: filters.sizes };
    if (filters.inStock) query.stock = { $gt: 0 };
    if (filters.minRating) query.avgRating = { $gte: filters.minRating };
    if (filters.hasDiscount) query.compareAtPrice = { $exists: true, $ne: null };
    if (filters.tags?.length) query.tags = { $in: filters.tags };
    if (filters.isFeatured) query.isFeatured = true;
    if (filters.isBestseller) query.isBestseller = true;
    if (filters.isNewArrival) query.isNewArrival = true;

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Build sort
    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sort.field] = sort.order === "asc" ? 1 : -1;

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(pageSize)
        .populate("category", "name slug")
        .populate("brand", "name slug logo")
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    } satisfies PaginatedResult<unknown>;
  });

// ─── Get single product by slug ───
export const getProductBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    await connectDB();

    const product = await Product.findOne({ slug, status: "active" })
      .populate("category", "name slug")
      .populate("brand", "name slug logo")
      .populate("relatedProducts", "name slug price compareAtPrice images")
      .populate("frequentlyBoughtWith", "name slug price compareAtPrice images")
      .lean();

    if (!product) return null;

    // Increment view count
    await Product.updateOne({ slug }, { $inc: { viewCount: 1 } });

    return JSON.parse(JSON.stringify(product));
  });

// ─── Get featured products ───
export const getFeaturedProducts = createServerFn({ method: "GET" })
  .validator((limit?: number) => limit)
  .handler(async ({ data: limit = 8 }) => {
    await connectDB();
    const products = await Product.find({
      status: "active",
      isFeatured: true,
    })
      .sort({ totalSold: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(products));
  });

// ─── Get bestsellers ───
export const getBestsellers = createServerFn({ method: "GET" })
  .validator((limit?: number) => limit)
  .handler(async ({ data: limit = 4 }) => {
    await connectDB();
    const products = await Product.find({
      status: "active",
      isBestseller: true,
    })
      .sort({ totalSold: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(products));
  });

// ─── Get new arrivals ───
export const getNewArrivals = createServerFn({ method: "GET" })
  .validator((limit?: number) => limit)
  .handler(async ({ data: limit = 8 }) => {
    await connectDB();
    const products = await Product.find({
      status: "active",
      isNewArrival: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(products));
  });

// ─── Search products ───
export const searchProducts = createServerFn({ method: "GET" })
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    await connectDB();

    if (!query || query.length < 2) return [];

    const products = await Product.find({
      status: "active",
      $or: [
        { name: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
      .select("name slug price compareAtPrice images category")
      .populate("category", "name slug")
      .limit(10)
      .lean();

    return JSON.parse(JSON.stringify(products));
  });

// ─── Admin: Create product ───
export const createProduct = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const product = await Product.create(data);
    return JSON.parse(JSON.stringify(product.toJSON()));
  });

// ─── Admin: Update product ───
export const updateProduct = createServerFn({ method: "POST" })
  .validator((data: { id: string; updates: Record<string, unknown> }) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const product = await Product.findByIdAndUpdate(data.id, data.updates, {
      new: true,
    }).lean();
    return JSON.parse(JSON.stringify(product));
  });

// ─── Admin: Delete product ───
export const deleteProduct = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await connectDB();
    await Product.findByIdAndDelete(id);
    return { success: true };
  });
