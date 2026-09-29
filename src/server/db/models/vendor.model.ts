import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IVendor } from "@/types";

export interface VendorDocument extends Omit<IVendor, "_id">, Document {}

const vendorSchema = new Schema<VendorDocument>(
  {
    // The login account for this vendor (role "vendor")
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    district: { type: String, trim: true },
    pickupAddress: { type: String, trim: true },
    description: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "approved", "suspended"],
      default: "approved",
    },
    commissionRate: { type: Number, default: 10, min: 0, max: 60 },

    // Rules the admin sets; every vendor API checks these on the server
    limits: {
      maxProducts: { type: Number, default: 50, min: 0, max: 10000 },
      maxDiscountPercent: { type: Number, default: 50, min: 0, max: 90 },
      requireProductApproval: { type: Boolean, default: true },
      allowedCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    },

    // Visible to the shop team only
    adminNotes: { type: String, default: "" },
    suspendedReason: { type: String },
    approvedAt: { type: Date },
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

vendorSchema.index({ status: 1, createdAt: -1 });

export const Vendor: Model<VendorDocument> =
  mongoose.models.Vendor || mongoose.model<VendorDocument>("Vendor", vendorSchema);
