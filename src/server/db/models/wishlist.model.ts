import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IWishlist, IWishlistItem } from "@/types";

export interface WishlistDocument extends Omit<IWishlist, "_id">, Document {}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const wishlistSchema = new Schema<WishlistDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [wishlistItemSchema],
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
  }
);

wishlistSchema.index({ user: 1 }, { unique: true });

export const Wishlist: Model<WishlistDocument> =
  mongoose.models.Wishlist ||
  mongoose.model<WishlistDocument>("Wishlist", wishlistSchema);
