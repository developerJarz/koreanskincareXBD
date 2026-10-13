import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { refreshModelInDev } from "./dev-refresh";

export const EXPENSE_CATEGORIES = [
  "marketing",
  "packaging",
  "salaries",
  "delivery",
  "rent_utilities",
  "software",
  "stock_purchase",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_METHODS = ["Cash", "bKash", "Nagad", "Bank transfer", "Card"] as const;

export interface IExpense {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  paidVia: string;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExpenseDocument extends IExpense, Document {}

const expenseSchema = new Schema<ExpenseDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    paidVia: { type: String, default: "Cash" },
    notes: { type: String, maxlength: 1000 },
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

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });

refreshModelInDev("Expense");

export const Expense: Model<ExpenseDocument> =
  mongoose.models.Expense || mongoose.model<ExpenseDocument>("Expense", expenseSchema);
