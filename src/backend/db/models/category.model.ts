import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ICategory } from "@/types";

export interface CategoryDocument extends Omit<ICategory, "_id">, Document {}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    image: { type: String },
    icon: { type: String },
    parent: { type: Schema.Types.ObjectId as any, ref: "Category" },
    children: [{ type: Schema.Types.ObjectId as any, ref: "Category" }],
    productCount: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    seoTitle: { type: String },
    seoDescription: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        if (ret._id) ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ isActive: 1, isFeatured: 1 });

export const Category: Model<CategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<CategoryDocument>("Category", categorySchema);
