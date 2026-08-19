import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { INotification, NotificationType } from "@/types";

export interface NotificationDocument extends Omit<INotification, "_id">, Document {}

const notificationSchema = new Schema<NotificationDocument>(
  {
    user: { type: Schema.Types.ObjectId as any, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "order_update",
        "new_offer",
        "low_stock",
        "wishlist_alert",
        "admin",
        "system",
      ] as NotificationType[],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
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

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", notificationSchema);
