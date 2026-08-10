import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IBlog } from "@/types";

export interface BlogDocument extends Omit<IBlog, "_id">, Document {}

const blogSchema = new Schema<BlogDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    featuredImage: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }],
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: { type: Date },
    seoTitle: { type: String },
    seoDescription: { type: String },
    viewCount: { type: Number, default: 0 },
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
  }
);

blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ title: "text", content: "text" });

export const Blog: Model<BlogDocument> =
  mongoose.models.Blog || mongoose.model<BlogDocument>("Blog", blogSchema);
