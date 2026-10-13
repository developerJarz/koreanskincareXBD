import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { refreshModelInDev } from "./dev-refresh";

/**
 * Staff roles with granular permissions (see src/lib/permissions.ts).
 * The role with slug "staff" is the built-in default for staff members without a custom role;
 * it can be edited but not deleted.
 */
export interface IRole {
  name: string;
  slug: string;
  description?: string;
  color: string;
  permissions: string[];
  isSystem: boolean;
  personalFor?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoleDocument extends IRole, Document {}

const roleSchema = new Schema<RoleDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 300 },
    color: { type: String, default: "#8b5cf6" },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false },
    // Set for a permission set made for one moderator ("custom permissions for this person");
    // it is deleted when that person gets another role or leaves the team
    personalFor: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
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

refreshModelInDev("Role");

export const Role: Model<RoleDocument> =
  mongoose.models.Role || mongoose.model<RoleDocument>("Role", roleSchema);
