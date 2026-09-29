import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IBrand } from "@/types";

export interface BrandDocument extends Omit<IBrand, "_id">, Document {}

const brandSchema = new Schema<BrandDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    logo: { type: String },
    website: { type: String },
    isActive: { type: Boolean, default: true },
    showOnHomepage: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    seoTitle: { type: String },
    seoDescription: { type: String },
    // Legacy counter, not maintained — live counts come from the products collection
    productCount: { type: Number, default: 0 },
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

brandSchema.index({ isActive: 1, showOnHomepage: 1, sortOrder: 1 });
brandSchema.index({ name: 1 });

export const Brand: Model<BrandDocument> =
  mongoose.models.Brand || mongoose.model<BrandDocument>("Brand", brandSchema);
