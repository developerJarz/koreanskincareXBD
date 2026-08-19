import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IPayment } from "@/types";

export interface PaymentDocument extends Omit<IPayment, "_id">, Document {}

const paymentSchema = new Schema<PaymentDocument>(
  {
    order: { type: Schema.Types.ObjectId as any, ref: "Order", required: true },
    gateway: { type: String, required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT" },
    status: {
      type: String,
      enum: ["initiated", "success", "failed", "refunded"],
      default: "initiated",
    },
    gatewayResponse: { type: Schema.Types.Mixed },
    refundAmount: { type: Number, min: 0 },
    refundedAt: { type: Date },
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

paymentSchema.index({ order: 1 });
paymentSchema.index({ transactionId: 1 });

export const Payment: Model<PaymentDocument> =
  mongoose.models.Payment || mongoose.model<PaymentDocument>("Payment", paymentSchema);
