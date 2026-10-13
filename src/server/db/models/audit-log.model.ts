import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { refreshModelInDev } from "./dev-refresh";

/** What team members changed in the admin panel. Kept for a year, then removed automatically. */
export interface IAuditLog {
  actor?: Types.ObjectId;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  /** Machine key, e.g. "order.status", "role.update", "activity.purge" */
  action: string;
  /** One readable sentence shown in the log */
  summary: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  expiresAt: Date;
  createdAt?: Date;
}

export interface AuditLogDocument extends IAuditLog, Document {}

export const AUDIT_RETENTION_DAYS = 365;

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, required: true },
    actorEmail: { type: String },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    summary: { type: String, required: true, maxlength: 500 },
    entity: { type: String },
    entityId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    meta: { type: Schema.Types.Mixed },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + AUDIT_RETENTION_DAYS * 86_400_000),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshModelInDev("AuditLog");

export const AuditLog: Model<AuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);
