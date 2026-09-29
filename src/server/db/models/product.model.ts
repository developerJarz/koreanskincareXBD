import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IProduct, IProductVariant } from "@/types";

export interface ProductDocument extends Omit<IProduct, "_id">, Document {}

const productVariantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true },
    barcode: { type: String },
    color: { type: String },
    colorHex: { type: String },
    size: { type: String },
    material: { type: String },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    shortDescription: { type: String },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // Child category; its parent must be `category`
    subcategory: { type: Schema.Types.ObjectId, ref: "Category" },
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },
    collections: [{ type: String }],
    tags: [{ type: String }],
    // Derived from `media` in the pre-validate hook below (kept for cart/orders/older code)
    images: [{ type: String }],
    media: [
      {
        _id: false,
        url: { type: String, required: true },
        alt: { type: String, default: "" },
      },
    ],
    variants: [productVariantSchema],

    // Default pricing
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },

    // Inventory
    sku: { type: String },
    barcode: { type: String },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    trackInventory: { type: Boolean, default: true },

    // Attributes
    colors: [{ type: String }],
    sizes: [{ type: String }],
    materials: [{ type: String }],
    weight: { type: Number },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
    },
    // Marketplace
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },
    approvalStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    reviewNote: { type: String },
    vendorActive: { type: Boolean, default: true },

    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    allowBackorders: { type: Boolean, default: false },

    // Extra details shown on the product page
    ingredients: { type: String },
    howToUse: { type: String },
    canonicalUrl: { type: String },

    // SEO
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: [{ type: String }],

    // Stats
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    // Related
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    frequentlyBoughtWith: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for efficient queries
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ status: 1, isBestseller: 1 });
productSchema.index({ status: 1, isNewArrival: 1 });
productSchema.index({ price: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ subcategory: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ status: 1, isOnSale: 1 });
productSchema.index({ status: 1, isTrending: 1 });
// SKU is unique when set; empty/missing SKUs are allowed on many products
productSchema.index(
  { sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $type: "string", $gt: "" } } },
);
productSchema.index(
  { barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: "string", $gt: "" } } },
);
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ approvalStatus: 1, createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

/**
 * Keeps derived fields consistent on every save:
 *  - `media` (url + alt, ordered) is the source of truth; `images` mirrors its URLs so the cart,
 *    orders and older code keep working. Older writers that only set `images` still work: `media`
 *    is rebuilt from them, keeping any alt text already stored for the same URL.
 *  - `isOnSale` is true exactly when a sale price is set (price below compareAtPrice).
 */
productSchema.pre("validate", function () {
  if (this.isModified("media")) {
    this.images = (this.media ?? []).map((m) => m.url);
  } else if (this.isModified("images") || (!this.media?.length && this.images?.length)) {
    const altByUrl = new Map((this.media ?? []).map((m) => [m.url, m.alt ?? ""]));
    this.media = (this.images ?? []).map((url) => ({ url, alt: altByUrl.get(url) ?? "" }));
  }
  this.isOnSale = Boolean(this.compareAtPrice && this.compareAtPrice > this.price);
});

export const Product: Model<ProductDocument> =
  mongoose.models.Product || mongoose.model<ProductDocument>("Product", productSchema);
