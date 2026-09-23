import catBags from "@/assets/cat-bags.jpg";
import catRings from "@/assets/cat-rings.jpg";
import catEarrings from "@/assets/cat-earrings.jpg";
import catNecklaces from "@/assets/cat-necklaces.jpg";
import catSunglasses from "@/assets/cat-sunglasses.jpg";
import catWatches from "@/assets/cat-watches.jpg";
import { CATEGORIES, PRODUCTS, type Category, type Product } from "@/lib/site-data";
import { getImageSrc, type ImageSource } from "@/lib/image";

export type ProductTag = "New" | "Bestseller" | "Limited" | "Sale" | "Hot" | "Best Seller";

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

// Fallback images for K-Beauty & Accessories
const CATEGORY_IMAGES: Record<string, ImageSource> = {
  serums: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
  toners: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
  sunscreens: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800",
  cleansers: "https://images.unsplash.com/photo-1556228852-6d35a585d566?w=800",
  moisturizers: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800",
  masks: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
  "eye-lip-care": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
  sets: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800",
  bags: catBags,
  rings: catRings,
  earrings: catEarrings,
  necklaces: catNecklaces,
  watches: catWatches,
  sunglasses: catSunglasses,
};

const DEFAULT_KBEAUTY_IMAGE = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800";

function resolveStaticImage(slug: string, categorySlug?: string): ImageSource {
  const normCategory = categorySlug?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    STATIC_IMAGES[slug] ||
    (normCategory ? CATEGORY_IMAGES[normCategory] : undefined) ||
    DEFAULT_KBEAUTY_IMAGE
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

  const resolvedImg = product.images?.[0] || resolveStaticImage(product.slug, categorySlug);

  return {
    id: product._id?.toString?.() ?? product._id,
    slug: product.slug,
    name: product.name,
    category: categoryName || staticMatch?.category || categorySlug || "Skincare",
    categorySlug: categorySlug || staticMatch?.categorySlug || staticMatch?.category,
    price: product.price,
    was: product.compareAtPrice ?? staticMatch?.was ?? null,
    img: resolvedImg,
    images:
      product.images?.length > 0
        ? product.images
        : staticMatch?.images?.length
          ? staticMatch.images
          : [resolvedImg],
    tag: resolveProductTag(product) ?? staticMatch?.tag,
    rating: product.rating ?? staticMatch?.rating ?? 4.9,
    reviewCount: product.reviewCount ?? staticMatch?.reviewCount ?? 48,
    stock: product.stock ?? staticMatch?.stock ?? 25,
    description: product.description ?? staticMatch?.description,
    colors: product.colors ?? staticMatch?.colors,
    sizes: product.sizes ?? staticMatch?.sizes,
    benefits: product.benefits ?? staticMatch?.benefits,
    howToUse: product.howToUse ?? staticMatch?.howToUse,
    keyIngredients: product.keyIngredients ?? staticMatch?.keyIngredients,
  };
}

export function mapDbCategory(category: any): CategoryDisplay {
  const staticMatch = CATEGORIES.find((c) => c.slug === category.slug);
  const normSlug = category.slug?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: category._id?.toString?.() ?? category._id,
    slug: category.slug,
    name: category.name,
    img:
      category.image ||
      staticMatch?.img ||
      (normSlug ? CATEGORY_IMAGES[normSlug] : undefined) ||
      DEFAULT_KBEAUTY_IMAGE,
    count: staticMatch?.count ?? `${category.productCount ?? 0} products`,
  };
}

export function toCartItem(product: ProductDisplay, quantity = 1) {
  return {
    productId: product.id ?? product.slug,
    name: product.name,
    image: getImageSrc(product.img) || DEFAULT_KBEAUTY_IMAGE,
    price: product.price,
    compareAtPrice: product.was ?? undefined,
    quantity,
    category: product.categorySlug ?? product.category,
    slug: product.slug,
  };
}
