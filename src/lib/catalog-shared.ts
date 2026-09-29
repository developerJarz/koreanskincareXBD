/** Catalog types and constants shared by server code and client components (no server imports). */

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  parentId: string | null;
  productCount: number;
  children: CategoryNode[];
};

export type BrandInfo = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  showOnHomepage: boolean;
  productCount: number;
};

/** Everything the storefront navigation menu needs — a small payload sent to the browser. */
export type NavData = {
  categories: Array<{
    name: string;
    slug: string;
    description: string;
    image: string;
    productCount: number;
    children: Array<{ name: string; slug: string; productCount: number }>;
    /** Brands with the most products in this category, most first */
    topBrands: Array<{ name: string; slug: string }>;
  }>;
  brands: Array<{
    name: string;
    slug: string;
    logo: string;
    productCount: number;
    /** "Featured" in the admin dashboard (also shown on the homepage) */
    featured: boolean;
  }>;
};

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  brandSlug?: string;
  category: string;
  categorySlug?: string;
  price: number;
  was: number | null;
  img: string;
  imgAlt: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  inStock: boolean;
  discountPercent: number;
  badges: Array<"Bestseller" | "New" | "Sale" | "Trending">;
};

export type SortKey =
  | "featured"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc"
  | "bestselling"
  | "rating";

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "rating", label: "Top rated" },
];

export type ProductFlag = "featured" | "bestseller" | "new" | "trending";
