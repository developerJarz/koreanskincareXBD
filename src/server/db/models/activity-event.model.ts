import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { refreshModelInDev } from "./dev-refresh";

/**
 * One visitor action on the website: a page view, add to cart, search, purchase, sign-in…
 *
 * Every document carries its own `expiresAt` (createdAt + the retention set in the admin
 * "Site activity" settings, 30 days by default). MongoDB's TTL monitor deletes documents once
 * that time has passed, so old activity is removed automatically without a cron job.
 */
export const ACTIVITY_TYPES = [
  "page_view",
  "add_to_cart",
  "remove_from_cart",
  "search",
  "purchase",
  "login",
  "login_failed",
  "signup",
  "logout",
  "click",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface IActivityEvent {
  type: ActivityType;
  /** Client-generated id, used to attach time-on-page to the page view it belongs to */
  eid?: string;
  sessionId: string;
  visitorId: string;
  path?: string;
  url?: string;
  title?: string;
  query?: string;
  referrer?: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  user?: Types.ObjectId;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  product?: Types.ObjectId;
  productSlug?: string;
  productName?: string;
  variant?: string;
  quantity?: number;
  value?: number;
  searchTerm?: string;
  orderId?: Types.ObjectId;
  orderNumber?: string;
  label?: string;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
  device?: "mobile" | "tablet" | "desktop";
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  language?: string;
  screen?: string;
  /** Missing when the store keeps activity forever */
  expiresAt?: Date;
  createdAt?: Date;
}

export interface ActivityEventDocument extends IActivityEvent, Document {}

const activityEventSchema = new Schema<ActivityEventDocument>(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    eid: { type: String },
    sessionId: { type: String, required: true },
    visitorId: { type: String, required: true },
    path: { type: String },
    url: { type: String },
    title: { type: String },
    query: { type: String },
    referrer: { type: String },
    referrerHost: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    userEmail: { type: String },
    userRole: { type: String },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    productSlug: { type: String },
    productName: { type: String },
    variant: { type: String },
    quantity: { type: Number },
    value: { type: Number },
    searchTerm: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String },
    label: { type: String },
    durationMs: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
    device: { type: String, enum: ["mobile", "tablet", "desktop"] },
    browser: { type: String },
    os: { type: String },
    country: { type: String },
    city: { type: String },
    language: { type: String },
    screen: { type: String },
    expiresAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "activity_events",
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  },
);

activityEventSchema.index({ createdAt: -1 });
activityEventSchema.index({ type: 1, createdAt: -1 });
activityEventSchema.index({ sessionId: 1, createdAt: 1 });
activityEventSchema.index({ visitorId: 1, createdAt: -1 });
activityEventSchema.index({ path: 1, createdAt: -1 });
activityEventSchema.index({ user: 1, createdAt: -1 });
activityEventSchema.index({ eid: 1 }, { sparse: true });
activityEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshModelInDev("ActivityEvent");

export const ActivityEvent: Model<ActivityEventDocument> =
  mongoose.models.ActivityEvent ||
  mongoose.model<ActivityEventDocument>("ActivityEvent", activityEventSchema);
