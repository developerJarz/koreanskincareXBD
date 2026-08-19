import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IBanner } from "@/types";

export interface BannerDocument extends Omit<IBanner, "_id">, Document {}

const bannerSchema = new Schema<BannerDocument>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image: { type: String, required: true },
    mobileImage: { type: String },
    link: { type: String },
    buttonText: { type: String },
    position: {
      type: String,
      enum: ["hero", "sidebar", "inline", "popup"],
      default: "inline",
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    expiresAt: { type: Date },
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

bannerSchema.index({ position: 1, isActive: 1 });

export const Banner: Model<BannerDocument> =
  mongoose.models.Banner || mongoose.model<BannerDocument>("Banner", bannerSchema);
