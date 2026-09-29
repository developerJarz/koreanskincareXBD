import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ISiteSettings } from "@/types";

export interface SettingsDocument extends Omit<ISiteSettings, "_id">, Document {}

const settingsSchema = new Schema<SettingsDocument>(
  {
    siteName: { type: String, default: "koreanskincare.bd" },
    siteDescription: {
      type: String,
      default: "Authentic Korean skincare, beauty & lifestyle essentials for Bangladesh",
    },
    logo: { type: String },
    favicon: { type: String },
    // Website design edited in the admin "Website design" tab; shape and validation live in
    // src/lib/storefront.ts (normalizeStorefront), so the schema stays flexible
    storefront: { type: Schema.Types.Mixed },
    contactEmail: { type: String, default: "hello@koreanskincare.bd" },
    contactPhone: { type: String, default: "+880 1711-223344" },
    address: {
      type: String,
      default: "House 42, Road 11, Banani, Dhaka 1213",
    },
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
      youtube: { type: String },
      tiktok: { type: String },
      whatsapp: { type: String },
    },
    seo: {
      defaultTitle: {
        type: String,
        default: "koreanskincare.bd — Authentic Korean Skincare & Beauty in Bangladesh",
      },
      defaultDescription: {
        type: String,
        default:
          "Discover koreanskincare.bd — a curated collection of 100% authentic Korean skincare, beauty, and modern lifestyle products for Bangladesh.",
      },
      ogImage: { type: String },
      googleAnalyticsId: { type: String },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 2000 },
      defaultShippingCost: { type: Number, default: 120 },
      insideDhakaCost: { type: Number, default: 70 },
      outsideDhakaCost: { type: Number, default: 120 },
    },
    paymentGateways: [
      {
        name: { type: String, required: true },
        enabled: { type: Boolean, default: false },
        config: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    courierServices: [
      {
        name: { type: String, required: true },
        enabled: { type: Boolean, default: false },
        config: { type: Schema.Types.Mixed, default: {} },
      },
    ],
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

export const Settings: Model<SettingsDocument> =
  mongoose.models.Settings || mongoose.model<SettingsDocument>("Settings", settingsSchema);
