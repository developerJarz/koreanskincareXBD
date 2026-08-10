import catBags from "@/assets/cat-bags.jpg";
import catRings from "@/assets/cat-rings.jpg";
import catEarrings from "@/assets/cat-earrings.jpg";
import catNecklaces from "@/assets/cat-necklaces.jpg";
import catSunglasses from "@/assets/cat-sunglasses.jpg";
import catWatches from "@/assets/cat-watches.jpg";
import { CATEGORIES, PRODUCTS, type Category, type Product } from "@/lib/site-data";
import { getImageSrc, type ImageSource } from "@/lib/image";

export type ProductTag = "New" | "Bestseller" | "Limited" | "Sale";

export interface ProductDisplay extends Product {
  id?: string;
  categorySlug?: string;
  stock?: number;
  description?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
}

export interface CategoryDisplay extends Category {
  id?: string;
}

const STATIC_IMAGES: Record<string, ImageSource> = Object.fromEntries(
  PRODUCTS.map((p) => [p.slug, p.img]),
);

// Seed uses ASCII slugs; site-data may use accented variants
const SLUG_ALIASES: Record<string, string> = {
  "rose-crystal-band": "rosé-crystal-band",
  "gold-pave-stack": "gold-pavé-stack",
};

const CATEGORY_IMAGES: Record<string, ImageSource> = {
  bags: catBags,
  rings: catRings,
  earrings: catEarrings,
  necklaces: catNecklaces,
  watches: catWatches,
  sunglasses: catSunglasses,
};

function resolveStaticImage(slug: string, categorySlug?: string): ImageSource {
  return (
    STATIC_IMAGES[slug] ||
    STATIC_IMAGES[SLUG_ALIASES[slug] ?? ""] ||
    (categorySlug ? CATEGORY_IMAGES[categorySlug] : undefined) ||
    catBags
  );
}

function resolveProductTag(product: {
  isNewArrival?: boolean;
  isBestseller?: boolean;
  compareAtPrice?: number | null;
  price: number;
  tags?: string[];
}): ProductTag | undefined {
  if (product.isNewArrival) return "New";
  if (product.isBestseller) return "Bestseller";
  if (product.compareAtPrice && product.compareAtPrice > product.price) return "Sale";
  if (product.tags?.some((t) => t.toLowerCase().includes("limited"))) return "Limited";
  return undefined;
}

export function mapDbProduct(product: any): ProductDisplay {
  const categoryObj = product.category;
  const categorySlug =
    typeof categoryObj === "object" && categoryObj !== null
      ? categoryObj.slug
      : typeof categoryObj === "string"
        ? categoryObj
        : undefined;
  const categoryName =
    typeof categoryObj === "object" && categoryObj !== null
      ? categoryObj.name
      : (categorySlug ?? "");

  const staticMatch = PRODUCTS.find((p) => p.slug === product.slug);

  return {
    id: product._id?.toString?.() ?? product._id,
    slug: product.slug,
    name: product.name,
    category: categoryName || staticMatch?.category || categorySlug || "",
    categorySlug: categorySlug || staticMatch?.category,
    price: product.price,
    was: product.compareAtPrice ?? null,
    img: product.images?.[0] || resolveStaticImage(product.slug, categorySlug),
    images:
      product.images?.length > 0
        ? product.images
        : [resolveStaticImage(product.slug, categorySlug)],
    tag: resolveProductTag(product) ?? staticMatch?.tag,
    stock: product.stock,
    description: product.description,
    colors: product.colors,
    sizes: product.sizes,
  };
}

export function mapDbCategory(category: any): CategoryDisplay {
  const staticMatch = CATEGORIES.find((c) => c.slug === category.slug);
  return {
    id: category._id?.toString?.() ?? category._id,
    slug: category.slug,
    name: category.name,
    img: category.image || staticMatch?.img || CATEGORY_IMAGES[category.slug] || catBags,
    count: staticMatch?.count ?? `${category.productCount ?? 0} pieces`,
  };
}

export function toCartItem(product: ProductDisplay, quantity = 1) {
  return {
    productId: product.id ?? product.slug,
    name: product.name,
    image: getImageSrc(product.img),
    price: product.price,
    compareAtPrice: product.was ?? undefined,
    quantity,
    category: product.categorySlug ?? product.category,
    slug: product.slug,
  };
}
