import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IAnalyticsEvent } from "@/types";

export interface AnalyticsDocument extends Omit<IAnalyticsEvent, "_id">, Document {}

const analyticsSchema = new Schema<AnalyticsDocument>(
  {
    type: {
      type: String,
      enum: ["page_view", "product_view", "add_to_cart", "purchase", "search"],
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
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

analyticsSchema.index({ type: 1, createdAt: -1 });
analyticsSchema.index({ sessionId: 1 });
analyticsSchema.index({ createdAt: -1 });

export const Analytics: Model<AnalyticsDocument> =
  mongoose.models.Analytics || mongoose.model<AnalyticsDocument>("Analytics", analyticsSchema);
