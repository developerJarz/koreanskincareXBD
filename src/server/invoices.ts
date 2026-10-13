import { connectDB } from "@/server/db/connection";
import { Settings } from "@/server/db/models";
import type { IInvoiceItem, IInvoiceParty } from "@/server/db/models/invoice.model";
import { storefrontFromSettings } from "@/server/storefront";
import { cleanString, isEmail } from "@/server/security/validation";
import { SITE_URL } from "@/lib/site";
import {
  computeInvoiceTotals,
  DEFAULT_INVOICE_TEMPLATE,
  normalizeInvoiceTemplate,
  type InvoiceTemplate,
} from "@/lib/invoice";

/**
 * Invoice design: what was saved in "Invoices → Design", with the shop's own name, logo and
 * contact details (from Website design) filling anything not set yet.
 */
export async function getInvoiceTemplate(): Promise<InvoiceTemplate> {
  await connectDB();
  const settings = await Settings.findOne()
    .select(
      "invoiceTemplate storefront siteName contactEmail contactPhone address logo favicon socialLinks",
    )
    .lean();
  const store = storefrontFromSettings(settings as any);
  const base: InvoiceTemplate = {
    ...DEFAULT_INVOICE_TEMPLATE,
    companyName: store.branding.siteName || DEFAULT_INVOICE_TEMPLATE.companyName,
    companyTagline: store.branding.tagline || DEFAULT_INVOICE_TEMPLATE.companyTagline,
    logoUrl: store.branding.logoUrl || "",
    companyAddress: store.contact.address || DEFAULT_INVOICE_TEMPLATE.companyAddress,
    companyPhone: store.contact.phone || "",
    companyEmail: store.contact.email || "",
    companyWebsite: SITE_URL.replace(/^https?:\/\//, ""),
  };
  return normalizeInvoiceTemplate(settings?.invoiceTemplate, base);
}

export function formatInvoiceNumber(seq: number, template: InvoiceTemplate) {
  return `${template.prefix}${String(seq).padStart(template.numberDigits, "0")}`;
}

type CleanInvoiceInput = {
  customer: IInvoiceParty;
  items: IInvoiceItem[];
  shipping: number;
  discount: number;
  notes?: string;
  terms?: string;
  issueDate: Date;
  dueDate?: Date;
};

function money(value: unknown, max = 100_000_000): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 100) / 100 : null;
}

function date(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const d = new Date(value.length === 10 ? `${value}T12:00:00+06:00` : value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Validates an invoice from the editor. Totals are never taken from the request. */
export function cleanInvoiceInput(
  body: any,
):
  | { ok: true; value: CleanInvoiceInput & ReturnType<typeof computeInvoiceTotals> }
  | { ok: false; error: string; fields?: Record<string, string> } {
  const fields: Record<string, string> = {};
  const name = cleanString(body?.customer?.name, 120);
  if (!name) fields["customer.name"] = "Enter the customer's name.";
  const email = cleanString(body?.customer?.email, 254)?.toLowerCase();
  if (email && !isEmail(email)) fields["customer.email"] = "Enter a valid email or leave it empty.";

  const rawItems: any[] = Array.isArray(body?.items) ? body.items.slice(0, 200) : [];
  const items: IInvoiceItem[] = [];
  rawItems.forEach((raw, i) => {
    const description = cleanString(raw?.description, 300);
    const quantity = money(raw?.quantity, 100_000);
    const unitPrice = money(raw?.unitPrice);
    const discount = money(raw?.discount ?? 0) ?? 0;
    const taxRate = money(raw?.taxRate ?? 0, 100) ?? 0;
    if (!description && !unitPrice) return; // ignore blank rows
    if (!description) fields[`items.${i}.description`] = "Describe the item.";
    if (quantity === null || quantity <= 0)
      fields[`items.${i}.quantity`] = "Quantity must be above 0.";
    if (unitPrice === null) fields[`items.${i}.unitPrice`] = "Enter a price.";
    items.push({
      description: description || "",
      sku: cleanString(raw?.sku, 80) || undefined,
      quantity: quantity ?? 0,
      unitPrice: unitPrice ?? 0,
      discount,
      taxRate,
    });
  });
  if (items.length === 0) fields.items = "Add at least one item.";

  const shipping = money(body?.shipping ?? 0);
  if (shipping === null) fields.shipping = "Delivery charge can't be negative.";
  const discount = money(body?.discount ?? 0);
  if (discount === null) fields.discount = "Discount can't be negative.";
  const issueDate = date(body?.issueDate) ?? new Date();
  const dueDate = date(body?.dueDate);
  if (dueDate && dueDate < new Date(issueDate.getTime() - 86_400_000)) {
    fields.dueDate = "The due date is before the invoice date.";
  }

  if (Object.keys(fields).length) {
    return { ok: false, error: "Please fix the highlighted fields.", fields };
  }

  const totals = computeInvoiceTotals(items, shipping ?? 0, discount ?? 0);
  return {
    ok: true,
    value: {
      customer: {
        name: name!,
        email: email || undefined,
        phone: cleanString(body?.customer?.phone, 40) || undefined,
        address: cleanString(body?.customer?.address, 400) || undefined,
      },
      items,
      shipping: shipping ?? 0,
      discount: discount ?? 0,
      notes: cleanString(body?.notes, 1000) || undefined,
      terms: cleanString(body?.terms, 2000) || undefined,
      issueDate,
      dueDate,
      ...totals,
    },
  };
}

/** Invoice fields from a shop order (customer, items, delivery, discount). */
export function invoiceFromOrder(order: any, template: InvoiceTemplate) {
  const a = order.shippingAddress ?? {};
  const address = [a.streetAddress, a.area, a.district, a.division, a.postalCode]
    .filter(Boolean)
    .join(", ");
  const items: IInvoiceItem[] = (order.items ?? []).map((item: any) => ({
    description:
      item.productName +
      (item.variant?.color || item.variant?.size
        ? ` (${[item.variant?.color, item.variant?.size].filter(Boolean).join(" / ")})`
        : ""),
    sku: item.variant?.sku || undefined,
    quantity: item.quantity,
    unitPrice: item.price,
    discount: 0,
    taxRate: template.defaultTaxRate,
  }));
  const issueDate = new Date();
  return {
    customer: {
      name: a.fullName || order.user?.name || "Customer",
      email: order.guestEmail || order.user?.email || undefined,
      phone: a.phone || order.guestPhone || undefined,
      address: address || undefined,
    },
    items,
    shipping: order.shippingCost ?? 0,
    discount: order.discount ?? 0,
    issueDate,
    dueDate: new Date(issueDate.getTime() + template.defaultDueDays * 86_400_000),
    notes: template.defaultNotes || undefined,
    terms: template.defaultTerms || undefined,
  };
}
