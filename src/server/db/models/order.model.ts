import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IOrder, OrderStatus, PaymentStatus, IOrderItem } from "@/types";

export interface OrderDocument extends Omit<IOrder, "_id">, Document {}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: "" },
    variant: {
      sku: { type: String },
      color: { type: String },
      size: { type: String },
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },
  },
  { _id: false },
);

const addressSubSchema = {
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  division: { type: String, required: true },
  district: { type: String, required: true },
  area: { type: String, required: true },
  streetAddress: { type: String, required: true },
  postalCode: { type: String },
};

// Billing address is optional — fields are not individually required
const optionalAddressSubSchema = {
  fullName: { type: String },
  phone: { type: String },
  division: { type: String },
  district: { type: String },
  area: { type: String },
  streetAddress: { type: String },
  postalCode: { type: String },
};

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    guestEmail: { type: String },
    guestPhone: { type: String },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ] as OrderStatus[],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"] as PaymentStatus[],
      default: "pending",
    },
    paymentMethod: { type: String, required: true },
    paymentTransactionId: { type: String },
    shippingAddress: addressSubSchema,
    billingAddress: optionalAddressSubSchema,
    deliveryNotes: { type: String },
    shippingMethod: { type: String },
    courierName: { type: String },
    trackingId: { type: String },
    trackingUrl: { type: String },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    invoiceUrl: { type: String },
    notes: { type: String },
    // SHA-256 of the secret given to the buyer at checkout; lets guests view only their own order
    accessTokenHash: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret._id = ret._id.toString();
        delete ret.accessTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ trackingId: 1 });
orderSchema.index({ "items.vendor": 1, createdAt: -1 });

// Auto-generate order number
orderSchema.pre("validate", async function () {
  if (!this.orderNumber) {
    try {
      const model = this.constructor as mongoose.Model<OrderDocument>;
      const count = await model.countDocuments();
      this.orderNumber = `NB-${String(count + 1).padStart(6, "0")}`;
    } catch {
      this.orderNumber = `NB-${Date.now().toString().slice(-6)}`;
    }
  }
});

export const Order: Model<OrderDocument> =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", orderSchema);
