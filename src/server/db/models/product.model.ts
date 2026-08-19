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
    subcategory: { type: String },
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },
    collections: [{ type: String }],
    tags: [{ type: String }],
    images: [{ type: String }],
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
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },

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
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ status: 1, isBestseller: 1 });
productSchema.index({ status: 1, isNewArrival: 1 });
productSchema.index({ price: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

export const Product: Model<ProductDocument> =
  mongoose.models.Product || mongoose.model<ProductDocument>("Product", productSchema);
