import { unstable_cache, revalidateTag } from "next/cache";
import { Types } from "mongoose";

// Aggregation pipelines (used for filter counts) don't convert string ids like find() does,
// so ids used in shared filter conditions are always real ObjectIds
const oid = (id: string) => new Types.ObjectId(id);

import { connectDB } from "@/server/db/connection";
import { Brand, Category, Product } from "@/server/db/models";
import { PUBLIC_PRODUCT_FILTER } from "@/server/marketplace";
import { escapeRegex } from "@/server/security/validation";
import type {
  BrandInfo,
  CardProduct,
  CategoryNode,
  NavData,
  ProductFlag,
  SortKey,
} from "@/lib/catalog-shared";

export type {
  BrandInfo,
  CardProduct,
  CategoryNode,
  NavData,
  ProductFlag,
  SortKey,
} from "@/lib/catalog-shared";
export { SORT_OPTIONS } from "@/lib/catalog-shared";

/**
 * Storefront catalog queries. Everything customers browse goes through here, so filtering,
 * sorting and pagination always happen in MongoDB (never by downloading products to the browser).
 *
 * Category/brand lists are cached and tagged; every admin change calls `revalidateCatalog()`
 * so new or edited categories, brands and products show up immediately.
 */

export const CATALOG_TAG = "catalog";

export function revalidateCatalog() {
  revalidateTag(CATALOG_TAG);
}

// Fields safe to show customers (no cost price, vendor internals or review notes)
const PUBLIC_FIELDS =
  "name slug price compareAtPrice images media brand category subcategory stock allowBackorders trackInventory isFeatured isNewArrival isBestseller isOnSale isTrending avgRating totalReviews totalSold tags createdAt";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800";

// ─── Categories ───

async function loadCategoryTree(): Promise<CategoryNode[]> {
  await connectDB();
  const [cats, pairCounts] = await Promise.all([
    Category.find({ isActive: { $ne: false } })
      .sort({ sortOrder: 1, name: 1 })
      .select("name slug description image seoTitle seoDescription isFeatured parent sortOrder")
      .lean(),
    // Count products per (category, subcategory) pair — a few hundred groups at most
    Product.aggregate<{ _id: { c: Types.ObjectId; s?: Types.ObjectId }; n: number }>([
      { $match: PUBLIC_PRODUCT_FILTER },
      { $group: { _id: { c: "$category", s: "$subcategory" }, n: { $sum: 1 } } },
    ]),
  ]);

  const byId = new Map<string, CategoryNode>();
  for (const c of cats) {
    byId.set(String(c._id), {
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image: c.image ?? "",
      seoTitle: c.seoTitle ?? "",
      seoDescription: c.seoDescription ?? "",
      isFeatured: Boolean(c.isFeatured),
      parentId: c.parent ? String(c.parent) : null,
      productCount: 0,
      children: [],
    });
  }

  // A product counts once for its category, its subcategory, and their parents
  for (const row of pairCounts) {
    const touched = new Set<string>();
    for (const raw of [row._id.c, row._id.s]) {
      if (!raw) continue;
      const node = byId.get(String(raw));
      if (!node) continue;
      touched.add(node.id);
      if (node.parentId && byId.has(node.parentId)) touched.add(node.parentId);
    }
    for (const id of touched) byId.get(id)!.productCount += row.n;
  }

  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      // Top level — or its parent is deactivated, in which case it's shown at the top level
      node.parentId = null;
      roots.push(node);
    }
  }
  return roots;
}

export const getCategoryTree = unstable_cache(loadCategoryTree, ["catalog-category-tree"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

export function flattenCategories(tree: CategoryNode[]) {
  return tree.flatMap((c) => [c, ...c.children]);
}

export async function findCategoryBySlug(slug: string) {
  const tree = await getCategoryTree();
  for (const root of tree) {
    if (root.slug === slug) return { category: root, parent: null as CategoryNode | null };
    const child = root.children.find((c) => c.slug === slug);
    if (child) return { category: child, parent: root };
  }
  return null;
}

// ─── Brands ───

async function loadBrands(): Promise<BrandInfo[]> {
  await connectDB();
  const [brands, counts] = await Promise.all([
    Brand.find({ isActive: { $ne: false } })
      .sort({ sortOrder: 1, name: 1 })
      .select("name slug logo description seoTitle seoDescription showOnHomepage")
      .lean(),
    Product.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { ...PUBLIC_PRODUCT_FILTER, brand: { $ne: null } } },
      { $group: { _id: "$brand", n: { $sum: 1 } } },
    ]),
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.n]));
  return brands.map((b) => ({
    id: String(b._id),
    name: b.name,
    slug: b.slug,
    logo: b.logo ?? "",
    description: b.description ?? "",
    seoTitle: b.seoTitle ?? "",
    seoDescription: b.seoDescription ?? "",
    showOnHomepage: Boolean(b.showOnHomepage),
    productCount: countById.get(String(b._id)) ?? 0,
  }));
}

export const getBrands = unstable_cache(loadBrands, ["catalog-brands"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

// ─── Navigation menu ───

async function loadNavData(): Promise<NavData> {
  const [tree, brands, pairs] = await Promise.all([
    getCategoryTree(),
    getBrands(),
    Product.aggregate<{ _id: { c: Types.ObjectId; b: Types.ObjectId }; n: number }>([
      { $match: { ...PUBLIC_PRODUCT_FILTER, brand: { $ne: null } } },
      { $group: { _id: { c: "$category", b: "$brand" }, n: { $sum: 1 } } },
    ]),
  ]);
  const brandById = new Map(brands.map((b) => [b.id, b]));

  // Products are stored against their top-level category, so this ranks brands per menu column
  const brandCounts = new Map<string, Array<{ id: string; n: number }>>();
  for (const row of pairs) {
    const list = brandCounts.get(String(row._id.c)) ?? [];
    list.push({ id: String(row._id.b), n: row.n });
    brandCounts.set(String(row._id.c), list);
  }

  return {
    categories: tree.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      productCount: c.productCount,
      children: c.children.map((s) => ({
        name: s.name,
        slug: s.slug,
        productCount: s.productCount,
      })),
      topBrands: (brandCounts.get(c.id) ?? [])
        .sort((a, b) => b.n - a.n)
        .map((x) => brandById.get(x.id))
        .filter((b): b is BrandInfo => Boolean(b))
        .slice(0, 6)
        .map((b) => ({ name: b.name, slug: b.slug })),
    })),
    brands: brands.map((b) => ({
      name: b.name,
      slug: b.slug,
      logo: b.logo,
      productCount: b.productCount,
      featured: b.showOnHomepage,
    })),
  };
}

export const getNavData = unstable_cache(loadNavData, ["catalog-nav"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

// ─── Product cards ───

function toCard(
  p: any,
  brandById: Map<string, BrandInfo>,
  catById: Map<string, CategoryNode>,
): CardProduct {
  const brand = p.brand ? brandById.get(String(p.brand)) : undefined;
  const cat =
    (p.subcategory && catById.get(String(p.subcategory))) || catById.get(String(p.category));
  const media: Array<{ url: string; alt?: string }> = p.media?.length
    ? p.media
    : (p.images ?? []).map((url: string) => ({ url, alt: "" }));
  const was = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : null;
  const inStock = p.trackInventory === false || p.stock > 0 || Boolean(p.allowBackorders);

  const badges: CardProduct["badges"] = [];
  if (p.isBestseller) badges.push("Bestseller");
  if (p.isNewArrival) badges.push("New");
  if (was) badges.push("Sale");
  if (p.isTrending) badges.push("Trending");

  return {
    id: String(p._id),
    slug: p.slug,
    name: p.name,
    brand: brand?.name,
    brandSlug: brand?.slug,
    category: cat?.name ?? "",
    categorySlug: cat?.slug,
    price: p.price,
    was,
    img: media[0]?.url ?? FALLBACK_IMAGE,
    imgAlt: media[0]?.alt || p.name,
    images: media.map((m) => m.url),
    rating: p.avgRating ?? 0,
    reviewCount: p.totalReviews ?? 0,
    stock: p.stock ?? 0,
    inStock,
    discountPercent: was ? Math.round(((was - p.price) / was) * 100) : 0,
    badges,
  };
}

async function lookups() {
  const [tree, brands] = await Promise.all([getCategoryTree(), getBrands()]);
  return {
    tree,
    brands,
    brandById: new Map(brands.map((b) => [b.id, b])),
    catById: new Map(flattenCategories(tree).map((c) => [c.id, c])),
  };
}

// ─── Listing query ───

const SORTS: Record<SortKey, Record<string, 1 | -1>> = {
  featured: { isFeatured: -1, totalSold: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  bestselling: { totalSold: -1, createdAt: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  rating: { avgRating: -1, totalReviews: -1 },
};

export type ListingParams = {
  q?: string;
  /** Category or subcategory slug */
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  flag?: ProductFlag;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

const FLAG_FIELD: Record<ProductFlag, string> = {
  featured: "isFeatured",
  bestseller: "isBestseller",
  new: "isNewArrival",
  trending: "isTrending",
};

/** Reads listing filters from URL search params (shared by pages and the public API). */
export function parseListingParams(
  sp: Record<string, string | string[] | undefined>,
): ListingParams {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const num = (k: string) => {
    const n = Number(one(k));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const sort = one("sort") as SortKey | undefined;
  const flag = one("flag") as ProductFlag | undefined;
  const brands = one("brand")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  return {
    // "search" is the older parameter name, still accepted so existing links keep working
    q: (one("q") ?? one("search"))?.slice(0, 100),
    category: one("category")?.slice(0, 100),
    brands: brands?.length ? brands : undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minRating: num("rating"),
    inStock: one("inStock") === "1" || one("inStock") === "true",
    onSale: one("sale") === "1" || one("sale") === "true",
    flag: flag && flag in FLAG_FIELD ? flag : undefined,
    sort: sort && sort in SORTS ? sort : undefined,
    page: Math.max(1, Math.floor(num("page") ?? 1)),
  };
}

export type ListingResult = {
  items: CardProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Brands present in the results (ignoring the brand filter itself), for the filter panel */
  brandFacets: Array<{ slug: string; name: string; count: number }>;
  /** Top-level categories present in the results (ignoring the category filter) */
  categoryFacets: Array<{ slug: string; name: string; count: number }>;
};

export async function queryProducts(params: ListingParams): Promise<ListingResult> {
  const { tree, brands, brandById, catById } = await lookups();
  const pageSize = Math.min(48, Math.max(1, params.pageSize ?? 24));
  const page = Math.max(1, params.page ?? 1);

  const and: Record<string, unknown>[] = [];
  let categoryCond: Record<string, unknown> | null = null;
  let brandCond: Record<string, unknown> | null = null;

  if (params.category) {
    const all = flattenCategories(tree);
    const node = all.find((c) => c.slug === params.category);
    const ids = node ? [node.id, ...node.children.map((c) => c.id)].map(oid) : [];
    // Unknown category → no results (not "everything")
    categoryCond = { $or: [{ category: { $in: ids } }, { subcategory: { $in: ids } }] };
  }

  if (params.brands?.length) {
    const ids = brands.filter((b) => params.brands!.includes(b.slug)).map((b) => oid(b.id));
    brandCond = { brand: { $in: ids } };
  }

  if (params.q) {
    const rx = new RegExp(escapeRegex(params.q), "i");
    const brandIds = brands.filter((b) => rx.test(b.name)).map((b) => oid(b.id));
    const catIds = flattenCategories(tree)
      .filter((c) => rx.test(c.name))
      .map((c) => oid(c.id));
    and.push({
      $or: [
        { name: rx },
        { tags: rx },
        { sku: new RegExp(`^${escapeRegex(params.q)}`, "i") },
        ...(brandIds.length ? [{ brand: { $in: brandIds } }] : []),
        ...(catIds.length ? [{ category: { $in: catIds } }, { subcategory: { $in: catIds } }] : []),
      ],
    });
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (params.minPrice !== undefined) price.$gte = params.minPrice;
    if (params.maxPrice !== undefined) price.$lte = params.maxPrice;
    and.push({ price });
  }
  if (params.minRating) and.push({ avgRating: { $gte: params.minRating } });
  if (params.inStock) {
    and.push({
      $or: [{ stock: { $gt: 0 } }, { allowBackorders: true }, { trackInventory: false }],
    });
  }
  if (params.onSale) and.push({ isOnSale: true });
  if (params.flag) and.push({ [FLAG_FIELD[params.flag]]: true });

  const build = (extra: (Record<string, unknown> | null)[]) => {
    const parts = [...and, ...extra.filter(Boolean)] as Record<string, unknown>[];
    return parts.length ? { ...PUBLIC_PRODUCT_FILTER, $and: parts } : { ...PUBLIC_PRODUCT_FILTER };
  };
  const filter = build([categoryCond, brandCond]);

  const sort = SORTS[params.sort ?? (params.q ? "bestselling" : "featured")];
  const nameSort = params.sort === "name_asc" || params.sort === "name_desc";

  let findQuery = Product.find(filter)
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select(PUBLIC_FIELDS)
    .lean();
  if (nameSort) findQuery = findQuery.collation({ locale: "en", strength: 2 });

  const [docs, total, brandRows, catRows] = await Promise.all([
    findQuery,
    Product.countDocuments(filter),
    Product.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: build([categoryCond]) },
      { $match: { brand: { $ne: null } } },
      { $group: { _id: "$brand", n: { $sum: 1 } } },
    ]),
    Product.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: build([brandCond]) },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]),
  ]);

  const brandFacets = brandRows
    .map((r) => {
      const b = brandById.get(String(r._id));
      return b ? { slug: b.slug, name: b.name, count: r.n } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Roll category counts up to top-level categories
  const topCounts = new Map<string, number>();
  for (const r of catRows) {
    const node = catById.get(String(r._id));
    if (!node) continue;
    const top = node.parentId ? (catById.get(node.parentId) ?? node) : node;
    topCounts.set(top.id, (topCounts.get(top.id) ?? 0) + r.n);
  }
  const categoryFacets = tree
    .filter((c) => topCounts.has(c.id))
    .map((c) => ({ slug: c.slug, name: c.name, count: topCounts.get(c.id)! }));

  return {
    items: docs.map((d) => toCard(d, brandById, catById)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    brandFacets,
    categoryFacets,
  };
}

// ─── Homepage ───

async function loadHomepage() {
  const { brandById, catById, tree, brands } = await lookups();
  const section = (filter: Record<string, unknown>, sort: Record<string, 1 | -1>) =>
    Product.find({ ...PUBLIC_PRODUCT_FILTER, ...filter })
      .sort(sort)
      .limit(8)
      .select(PUBLIC_FIELDS)
      .lean()
      .then((docs) => docs.map((d) => toCard(d, brandById, catById)));

  const [bestsellers, newArrivals, featured, onSale, trending] = await Promise.all([
    section({ isBestseller: true }, { totalSold: -1, createdAt: -1 }),
    section({ isNewArrival: true }, { createdAt: -1 }),
    section({ isFeatured: true }, { createdAt: -1 }),
    section({ isOnSale: true }, { createdAt: -1 }),
    section({ isTrending: true }, { totalSold: -1, createdAt: -1 }),
  ]);

  // Categories: the ones marked "show on homepage", or all top-level ones if none are marked
  const marked = tree.filter((c) => c.isFeatured);
  const categories = (marked.length ? marked : tree).slice(0, 12);
  const homeBrands = brands.filter((b) => b.showOnHomepage).slice(0, 16);

  return { bestsellers, newArrivals, featured, onSale, trending, categories, brands: homeBrands };
}

export const getHomepageData = unstable_cache(loadHomepage, ["catalog-homepage"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

// ─── Product page ───

export async function getProductPageData(slug: string) {
  await connectDB();
  const { brandById, catById } = await lookups();
  const p = await Product.findOne({ slug, ...PUBLIC_PRODUCT_FILTER })
    .select(
      `${PUBLIC_FIELDS} description shortDescription ingredients howToUse seoTitle seoDescription seoKeywords canonicalUrl sku lowStockThreshold`,
    )
    .lean();
  if (!p) return null;

  const tags: string[] = p.tags ?? [];
  const [candidates, sameBrandDocs] = await Promise.all([
    Product.find({
      ...PUBLIC_PRODUCT_FILTER,
      _id: { $ne: p._id },
      $or: [
        ...(p.subcategory ? [{ subcategory: p.subcategory }] : []),
        { category: p.category },
        ...(p.brand ? [{ brand: p.brand }] : []),
        ...(tags.length ? [{ tags: { $in: tags } }] : []),
      ],
    })
      .limit(40)
      .select(PUBLIC_FIELDS)
      .lean(),
    p.brand
      ? Product.find({ ...PUBLIC_PRODUCT_FILTER, _id: { $ne: p._id }, brand: p.brand })
          .sort({ totalSold: -1 })
          .limit(8)
          .select(PUBLIC_FIELDS)
          .lean()
      : Promise.resolve([]),
  ]);

  // Rank: same subcategory > same category > same brand > shared tags
  const score = (c: any) =>
    (p.subcategory && String(c.subcategory) === String(p.subcategory) ? 8 : 0) +
    (String(c.category) === String(p.category) ? 4 : 0) +
    (p.brand && String(c.brand) === String(p.brand) ? 2 : 0) +
    (c.tags ?? []).filter((t: string) => tags.includes(t)).length;
  const related = candidates
    .map((c) => ({ c, s: score(c) }))
    .sort((a, b) => b.s - a.s || (b.c.totalSold ?? 0) - (a.c.totalSold ?? 0))
    .slice(0, 8)
    .map(({ c }) => toCard(c, brandById, catById));

  const card = toCard(p, brandById, catById);
  const media: Array<{ url: string; alt: string }> = p.media?.length
    ? p.media.map((m: any) => ({ url: m.url, alt: m.alt || p.name }))
    : (p.images ?? []).map((url: string) => ({ url, alt: p.name }));
  const category = catById.get(String(p.category));
  const subcategory = p.subcategory ? catById.get(String(p.subcategory)) : undefined;

  return {
    product: {
      ...card,
      media,
      sku: p.sku ?? "",
      description: p.description ?? "",
      shortDescription: p.shortDescription ?? "",
      ingredients: p.ingredients ?? "",
      howToUse: p.howToUse ?? "",
      seoTitle: p.seoTitle ?? "",
      seoDescription: p.seoDescription ?? "",
      canonicalUrl: p.canonicalUrl ?? "",
      lowStockThreshold: p.lowStockThreshold ?? 5,
      allowBackorders: Boolean(p.allowBackorders),
    },
    brand: p.brand ? (brandById.get(String(p.brand)) ?? null) : null,
    category: category ?? null,
    subcategory: subcategory ?? null,
    related,
    sameBrand: sameBrandDocs.map((d) => toCard(d, brandById, catById)),
  };
}
