import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IReview } from "@/types";

export interface ReviewDocument extends Omit<IReview, "_id">, Document {}

const reviewSchema = new Schema<ReviewDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    comment: { type: String, required: true },
    images: [{ type: String }],
    videos: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    helpfulBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reply: {
      message: { type: String },
      repliedBy: { type: Schema.Types.ObjectId, ref: "User" },
      repliedAt: { type: Date },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
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

reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });
// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review: Model<ReviewDocument> =
  mongoose.models.Review || mongoose.model<ReviewDocument>("Review", reviewSchema);
