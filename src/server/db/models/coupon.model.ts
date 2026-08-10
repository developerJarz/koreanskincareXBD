import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ICoupon, CouponType } from "@/types";

export interface CouponDocument extends Omit<ICoupon, "_id">, Document {}

const couponSchema = new Schema<CouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "percentage",
        "fixed",
        "free_shipping",
        "first_order",
        "buy_x_get_y",
      ] as CouponType[],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    buyQuantity: { type: Number, min: 1 },
    getQuantity: { type: Number, min: 1 },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number },
    isAutoApply: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date },
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

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

export const Coupon: Model<CouponDocument> =
  mongoose.models.Coupon ||
  mongoose.model<CouponDocument>("Coupon", couponSchema);
