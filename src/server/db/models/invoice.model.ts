import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { refreshModelInDev } from "./dev-refresh";

export const INVOICE_STATUSES = ["draft", "issued", "partially_paid", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface IInvoiceItem {
  description: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  /** Flat discount for the whole line, in taka */
  discount: number;
  /** Percent, e.g. 5 for 5% VAT */
  taxRate: number;
}

export interface IInvoicePayment {
  amount: number;
  method: string;
  reference?: string;
  date: Date;
  note?: string;
}

export interface IInvoiceParty {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface IInvoice {
  invoiceNumber: string;
  order?: Types.ObjectId;
  orderNumber?: string;
  customer: IInvoiceParty;
  items: IInvoiceItem[];
  shipping: number;
  /** Discount on the whole invoice (after line discounts), in taka */
  discount: number;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  payments: IInvoicePayment[];
  status: InvoiceStatus;
  issueDate: Date;
  dueDate?: Date;
  notes?: string;
  terms?: string;
  currency: string;
  createdBy?: Types.ObjectId;
  createdByName?: string;
  voidedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceDocument extends IInvoice, Document {}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false },
);

const invoicePaymentSchema = new Schema<IInvoicePayment>(
  {
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    reference: { type: String },
    date: { type: Date, required: true },
    note: { type: String },
  },
  { _id: false },
);

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String },
    customer: {
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    items: [invoiceItemSchema],
    shipping: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    payments: [invoicePaymentSchema],
    status: { type: String, enum: INVOICE_STATUSES, default: "issued" },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date },
    notes: { type: String },
    terms: { type: String },
    currency: { type: String, default: "BDT" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String },
    voidedAt: { type: Date },
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

invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ status: 1, issueDate: -1 });
invoiceSchema.index({ order: 1 });

refreshModelInDev("Invoice");

export const Invoice: Model<InvoiceDocument> =
  mongoose.models.Invoice || mongoose.model<InvoiceDocument>("Invoice", invoiceSchema);
