import slugify from "slugify";
import type { Model, Types } from "mongoose";

import { Brand, Category, Product } from "@/server/db/models";
import { generateBarcode, generateSku } from "@/server/sku";
import {
  cleanString,
  isObjectId,
  isSafeUrl,
  toNonNegativeNumber,
} from "@/server/security/validation";

/** Admin-side validation for catalog writes. The browser's checks are only a convenience. */

export type FieldErrors = Record<string, string>;

export function toSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true }).slice(0, 120);
}

/**
 * Returns a slug that isn't used by another document. An explicitly chosen slug that's taken is
 * an error (so admins notice); an auto-generated one gets "-2", "-3"… appended.
 */
export async function resolveSlug(
  model: Model<any>,
  requested: string | undefined,
  fallbackText: string,
  excludeId?: Types.ObjectId | string,
): Promise<{ slug: string } | { error: string }> {
  const explicit = Boolean(requested?.trim());
  const base = toSlug(requested?.trim() || fallbackText);
  if (!base) return { error: "Enter a name or slug using letters or numbers." };
  const taken = async (slug: string) =>
    Boolean(await model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }));

  if (!(await taken(base))) return { slug: base };
  if (explicit) return { error: `The link "${base}" is already used. Choose another.` };
  for (let i = 2; i < 200; i++) {
    const candidate = `${base}-${i}`;
    if (!(await taken(candidate))) return { slug: candidate };
  }
  return { slug: `${base}-${Date.now().toString(36)}` };
}

function cleanList(value: unknown, maxItems: number, maxLen: number): string[] {
  const arr = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of arr) {
    const s = cleanString(item, maxLen);
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out.slice(0, maxItems);
}

export type ProductWrite = {
  name: string;
  slug?: string;
  sku?: string;
  barcode?: string;
  shortDescription: string;
  description: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  media: Array<{ url: string; alt: string }>;
  ingredients: string;
  howToUse: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  canonicalUrl: string;
};

/**
 * Validates the product editor payload. Prices arrive as "regular" + optional "sale" and are
 * stored as price (what the customer pays) + compareAtPrice (the crossed-out price), matching how
 * the cart, checkout and orders already work.
 */
export async function validateProduct(
  raw: any,
): Promise<{ errors: FieldErrors } | { value: ProductWrite }> {
  const errors: FieldErrors = {};
  const status = ["draft", "active", "archived"].includes(raw?.status) ? raw.status : "draft";
  const publishing = status === "active";

  const name = cleanString(raw?.name, 200) ?? "";
  if (name.length < 2) errors.name = "Enter the product name.";

  const regular = toNonNegativeNumber(raw?.regularPrice, 10_000_000);
  if (raw?.regularPrice !== undefined && raw?.regularPrice !== "" && regular === undefined) {
    errors.regularPrice = "Enter a valid price.";
  }
  const saleRaw = raw?.salePrice;
  const sale =
    saleRaw === undefined || saleRaw === "" || saleRaw === null
      ? undefined
      : toNonNegativeNumber(saleRaw, 10_000_000);
  if (saleRaw !== undefined && saleRaw !== "" && saleRaw !== null && sale === undefined) {
    errors.salePrice = "Enter a valid sale price.";
  }
  if (publishing && !regular) errors.regularPrice = "A published product needs a price above ৳0.";
  if (sale !== undefined && regular !== undefined && sale >= regular) {
    errors.salePrice = "The sale price must be lower than the regular price.";
  }
  if (sale !== undefined && sale <= 0) errors.salePrice = "The sale price must be above ৳0.";

  const cost =
    raw?.costPrice === undefined || raw?.costPrice === ""
      ? undefined
      : toNonNegativeNumber(raw.costPrice, 10_000_000);

  const stock = toNonNegativeNumber(raw?.stock ?? 0, 1_000_000);
  if (stock === undefined || !Number.isInteger(stock))
    errors.stock = "Stock must be a whole number.";
  const lowStock = toNonNegativeNumber(raw?.lowStockThreshold ?? 5, 100_000);

  // Relationships must point at real records
  let category: string | undefined;
  if (!isObjectId(raw?.category)) {
    errors.category = "Choose a category.";
  } else {
    const cat = await Category.findById(raw.category).select("parent").lean();
    if (!cat) errors.category = "That category no longer exists.";
    else category = raw.category;
  }

  let subcategory: string | null = null;
  if (raw?.subcategory) {
    if (!isObjectId(raw.subcategory)) {
      errors.subcategory = "Choose a valid subcategory.";
    } else {
      const sub = await Category.findById(raw.subcategory).select("parent").lean();
      if (!sub) errors.subcategory = "That subcategory no longer exists.";
      else if (String(sub.parent) !== String(raw.category)) {
        errors.subcategory = "This subcategory belongs to a different category.";
      } else subcategory = raw.subcategory;
    }
  }

  let brand: string | null = null;
  if (raw?.brand) {
    if (!isObjectId(raw.brand) || !(await Brand.exists({ _id: raw.brand }))) {
      errors.brand = "That brand no longer exists.";
    } else brand = raw.brand;
  }

  const media: Array<{ url: string; alt: string }> = [];
  if (Array.isArray(raw?.media)) {
    for (const m of raw.media.slice(0, 12)) {
      if (!isSafeUrl(m?.url)) {
        errors.media = "One of the images has an invalid link.";
        break;
      }
      media.push({ url: m.url, alt: cleanString(m.alt, 200) ?? "" });
    }
  }
  if (publishing && media.length === 0) errors.media = "Add at least one image before publishing.";

  const sku = cleanString(raw?.sku, 64)?.toUpperCase() || undefined;
  if (sku && !/^[A-Z0-9._-]+$/.test(sku)) {
    errors.sku = "SKU can use letters, numbers, dots, dashes and underscores.";
  }
  const barcode = cleanString(raw?.barcode, 20)?.replace(/\s/g, "") || undefined;
  if (barcode && !/^\d{8,14}$/.test(barcode)) {
    errors.barcode = "A barcode is 8 to 14 digits.";
  }

  const canonicalUrl = cleanString(raw?.canonicalUrl, 500) ?? "";
  if (canonicalUrl && !isSafeUrl(canonicalUrl)) errors.canonicalUrl = "Enter a full https:// link.";

  if (Object.keys(errors).length) return { errors };

  return {
    value: {
      name,
      slug: cleanString(raw?.slug, 120) || undefined,
      sku,
      barcode,
      shortDescription: cleanString(raw?.shortDescription, 500) ?? "",
      description: cleanString(raw?.description, 20_000) ?? "",
      brand,
      category: category!,
      subcategory,
      tags: cleanList(raw?.tags, 20, 40),
      price: sale ?? regular ?? 0,
      compareAtPrice: sale !== undefined ? regular : undefined,
      costPrice: cost,
      stock: stock ?? 0,
      lowStockThreshold: lowStock ?? 5,
      trackInventory: raw?.trackInventory !== false,
      allowBackorders: Boolean(raw?.allowBackorders),
      status,
      isFeatured: Boolean(raw?.isFeatured),
      isBestseller: Boolean(raw?.isBestseller),
      isNewArrival: Boolean(raw?.isNewArrival),
      isTrending: Boolean(raw?.isTrending),
      media,
      ingredients: cleanString(raw?.ingredients, 5000) ?? "",
      howToUse: cleanString(raw?.howToUse, 5000) ?? "",
      seoTitle: cleanString(raw?.seoTitle, 120) ?? "",
      seoDescription: cleanString(raw?.seoDescription, 320) ?? "",
      seoKeywords: cleanList(raw?.seoKeywords, 20, 60),
      canonicalUrl,
    },
  };
}

/**
 * New products (and older ones saved without codes) get a SKU and barcode automatically,
 * so every product in stock can be counted, scanned and found by code.
 */
export async function fillInventoryCodes(value: ProductWrite) {
  if (!value.sku) value.sku = await generateSku(value.brand, value.category);
  if (!value.barcode) value.barcode = await generateBarcode();
}

/** Barcode must be unique when set. */
export async function barcodeTaken(barcode: string | undefined, excludeId?: string) {
  if (!barcode) return false;
  return Boolean(
    await Product.exists({ barcode, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }),
  );
}

/** SKU must be unique when set. */
export async function skuTaken(sku: string | undefined, excludeId?: string) {
  if (!sku) return false;
  return Boolean(await Product.exists({ sku, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }));
}

/** Converts a stored product into the editor's shape (regular/sale prices, media with alt). */
export function toEditorProduct(p: any) {
  const onSale = Boolean(p.compareAtPrice && p.compareAtPrice > p.price);
  return {
    _id: String(p._id),
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    brand: p.brand ? String(p.brand?._id ?? p.brand) : "",
    category: p.category ? String(p.category?._id ?? p.category) : "",
    subcategory: p.subcategory ? String(p.subcategory?._id ?? p.subcategory) : "",
    tags: p.tags ?? [],
    regularPrice: onSale ? p.compareAtPrice : p.price,
    salePrice: onSale ? p.price : "",
    costPrice: p.costPrice ?? "",
    stock: p.stock ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? 5,
    trackInventory: p.trackInventory !== false,
    allowBackorders: Boolean(p.allowBackorders),
    status: p.status ?? "draft",
    isFeatured: Boolean(p.isFeatured),
    isBestseller: Boolean(p.isBestseller),
    isNewArrival: Boolean(p.isNewArrival),
    isTrending: Boolean(p.isTrending),
    media: p.media?.length
      ? p.media.map((m: any) => ({ url: m.url, alt: m.alt ?? "" }))
      : (p.images ?? []).map((url: string) => ({ url, alt: "" })),
    ingredients: p.ingredients ?? "",
    howToUse: p.howToUse ?? "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    seoKeywords: p.seoKeywords ?? [],
    canonicalUrl: p.canonicalUrl ?? "",
    vendor: p.vendor ? String(p.vendor) : null,
    approvalStatus: p.approvalStatus ?? "approved",
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
