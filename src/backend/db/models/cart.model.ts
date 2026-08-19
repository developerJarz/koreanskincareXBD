import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ICart, ICartItem } from "@/types";

export interface CartDocument extends Omit<ICart, "_id">, Document {}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId as any, ref: "Product", required: true },
    variant: {
      sku: { type: String },
      color: { type: String },
      size: { type: String },
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const cartSchema = new Schema<CartDocument>(
  {
    user: { type: Schema.Types.ObjectId as any, ref: "User" },
    sessionId: { type: String },
    items: [cartItemSchema],
    couponCode: { type: String },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
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

cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });

export const Cart: Model<CartDocument> =
  mongoose.models.Cart || mongoose.model<CartDocument>("Cart", cartSchema);
