import mongoose, { Schema, type Document, type Model } from "mongoose";

export type OtpPurpose = "signup" | "reset";

export interface EmailOtpDocument extends Document {
  email: string;
  purpose: OtpPurpose;
  /** HMAC of the code — the code itself is never stored */
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
  /** Codes sent in the current hour, to stop someone flooding an inbox */
  sendCount: number;
  sendWindowStart: Date;
  /** Sign-up only: the account details, held until the email is confirmed */
  pendingName?: string;
  pendingPasswordHash?: string;
}

const emailOtpSchema = new Schema<EmailOtpDocument>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ["signup", "reset"], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    sendCount: { type: Number, default: 1 },
    sendWindowStart: { type: Date, required: true },
    pendingName: { type: String },
    pendingPasswordHash: { type: String },
  },
  { timestamps: true },
);

emailOtpSchema.index({ email: 1, purpose: 1 }, { unique: true });
// MongoDB deletes each record an hour after its code expires (keeps the hourly send limit working)
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 });

export const EmailOtp: Model<EmailOtpDocument> =
  mongoose.models.EmailOtp || mongoose.model<EmailOtpDocument>("EmailOtp", emailOtpSchema);
