import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IHomepageSection, HomepageSectionType } from "@/types";

export interface HomepageSectionDocument extends Omit<IHomepageSection, "_id">, Document {}

const homepageSectionSchema = new Schema<HomepageSectionDocument>(
  {
    type: {
      type: String,
      enum: [
        "hero",
        "features",
        "categories",
        "products",
        "banner",
        "testimonials",
        "newsletter",
        "blog",
        "custom",
      ] as HomepageSectionType[],
      required: true,
    },
    title: { type: String, required: true },
    subtitle: { type: String },
    eyebrow: { type: String },
    content: { type: Schema.Types.Mixed, default: {} },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
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
  },
);

homepageSectionSchema.index({ sortOrder: 1 });

export const HomepageSection: Model<HomepageSectionDocument> =
  mongoose.models.HomepageSection ||
  mongoose.model<HomepageSectionDocument>("HomepageSection", homepageSectionSchema);
