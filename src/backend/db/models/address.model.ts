import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IAddress } from "@/types";

export interface AddressDocument extends Omit<IAddress, "_id">, Document {}

const addressSchema = new Schema<AddressDocument>(
  {
    user: { type: Schema.Types.ObjectId as any, ref: "User", required: true },
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    division: { type: String, required: true },
    district: { type: String, required: true },
    area: { type: String, required: true },
    streetAddress: { type: String, required: true },
    postalCode: { type: String },
    isDefault: { type: Boolean, default: false },
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
  }
);

addressSchema.index({ user: 1 });

export const Address: Model<AddressDocument> =
  mongoose.models.Address ||
  mongoose.model<AddressDocument>("Address", addressSchema);
