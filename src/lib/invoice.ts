/**
 * Invoice design and maths, shared by the admin editor (live preview), the API (which always
 * recomputes totals) and the printable invoice page.
 */

export const INVOICE_LAYOUTS = ["classic", "modern", "minimal", "compact"] as const;
export type InvoiceLayout = (typeof INVOICE_LAYOUTS)[number];
export const PAPER_SIZES = ["A4", "Letter", "80mm"] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

export type InvoiceTemplate = {
  layout: InvoiceLayout;
  accentColor: string;
  fontStyle: "sans" | "serif";
  paperSize: PaperSize;
  title: string;
  showLogo: boolean;
  logoUrl: string;
  companyName: string;
  companyTagline: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  /** BIN / VAT registration number, shown when filled in */
  taxId: string;
  prefix: string;
  numberDigits: number;
  currencySymbol: string;
  defaultTaxRate: number;
  defaultDueDays: number;
  showSku: boolean;
  showDiscountColumn: boolean;
  showTaxColumn: boolean;
  showPaymentHistory: boolean;
  showPaidStamp: boolean;
  showSignature: boolean;
  signatureLabel: string;
  paymentInstructions: string;
  defaultNotes: string;
  defaultTerms: string;
  footerText: string;
};

export const DEFAULT_INVOICE_TEMPLATE: InvoiceTemplate = {
  layout: "modern",
  accentColor: "#be185d",
  fontStyle: "sans",
  paperSize: "A4",
  title: "Invoice",
  showLogo: true,
  logoUrl: "",
  companyName: "koreanskincare.bd",
  companyTagline: "Authentic Korean skincare in Bangladesh",
  companyAddress: "House 42, Road 11, Banani, Dhaka 1213",
  companyPhone: "",
  companyEmail: "",
  companyWebsite: "koreanskincare.bd",
  taxId: "",
  prefix: "INV-",
  numberDigits: 5,
  currencySymbol: "৳",
  defaultTaxRate: 0,
  defaultDueDays: 7,
  showSku: true,
  showDiscountColumn: true,
  showTaxColumn: false,
  showPaymentHistory: true,
  showPaidStamp: true,
  showSignature: true,
  signatureLabel: "Authorised signature",
  paymentInstructions:
    "Pay by bKash / Nagad or cash on delivery. Use the invoice number as reference.",
  defaultNotes: "Thank you for shopping with us!",
  defaultTerms: "Goods once sold can be exchanged within 7 days with the original invoice.",
  footerText: "This is a computer-generated invoice.",
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function str(value: unknown, fallback: string, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}
function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
function numIn(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

/** Fills gaps with defaults and drops anything invalid. */
export function normalizeInvoiceTemplate(
  raw: unknown,
  base = DEFAULT_INVOICE_TEMPLATE,
): InvoiceTemplate {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = base;
  const logoUrl = str(r.logoUrl, d.logoUrl, 1000);
  return {
    layout: INVOICE_LAYOUTS.includes(r.layout as InvoiceLayout)
      ? (r.layout as InvoiceLayout)
      : d.layout,
    accentColor:
      typeof r.accentColor === "string" && HEX.test(r.accentColor) ? r.accentColor : d.accentColor,
    fontStyle: r.fontStyle === "serif" || r.fontStyle === "sans" ? r.fontStyle : d.fontStyle,
    paperSize: PAPER_SIZES.includes(r.paperSize as PaperSize)
      ? (r.paperSize as PaperSize)
      : d.paperSize,
    title: str(r.title, d.title, 40) || d.title,
    showLogo: bool(r.showLogo, d.showLogo),
    // Only http(s) or site-relative images
    logoUrl: /^(https?:\/\/|\/(?!\/))/.test(logoUrl) || logoUrl === "" ? logoUrl : d.logoUrl,
    companyName: str(r.companyName, d.companyName, 120),
    companyTagline: str(r.companyTagline, d.companyTagline, 160),
    companyAddress: str(r.companyAddress, d.companyAddress, 300),
    companyPhone: str(r.companyPhone, d.companyPhone, 60),
    companyEmail: str(r.companyEmail, d.companyEmail, 120),
    companyWebsite: str(r.companyWebsite, d.companyWebsite, 120),
    taxId: str(r.taxId, d.taxId, 60),
    prefix: str(r.prefix, d.prefix, 12).replace(/[^A-Za-z0-9/_-]/g, ""),
    numberDigits: Math.round(numIn(r.numberDigits, d.numberDigits, 3, 8)),
    currencySymbol: str(r.currencySymbol, d.currencySymbol, 6) || d.currencySymbol,
    defaultTaxRate: numIn(r.defaultTaxRate, d.defaultTaxRate, 0, 100),
    defaultDueDays: Math.round(numIn(r.defaultDueDays, d.defaultDueDays, 0, 365)),
    showSku: bool(r.showSku, d.showSku),
    showDiscountColumn: bool(r.showDiscountColumn, d.showDiscountColumn),
    showTaxColumn: bool(r.showTaxColumn, d.showTaxColumn),
    showPaymentHistory: bool(r.showPaymentHistory, d.showPaymentHistory),
    showPaidStamp: bool(r.showPaidStamp, d.showPaidStamp),
    showSignature: bool(r.showSignature, d.showSignature),
    signatureLabel: str(r.signatureLabel, d.signatureLabel, 60),
    paymentInstructions: str(r.paymentInstructions, d.paymentInstructions, 600),
    defaultNotes: str(r.defaultNotes, d.defaultNotes, 600),
    defaultTerms: str(r.defaultTerms, d.defaultTerms, 1200),
    footerText: str(r.footerText, d.footerText, 200),
  };
}

export type InvoiceLine = {
  description: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
};

export type InvoiceTotals = {
  lines: Array<InvoiceLine & { net: number; tax: number; amount: number }>;
  subtotal: number;
  taxTotal: number;
  total: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Line net = qty × price − line discount; tax on the net; total = subtotal + tax + shipping − discount. */
export function computeInvoiceTotals(
  items: InvoiceLine[],
  shipping: number,
  discount: number,
): InvoiceTotals {
  const lines = items.map((item) => {
    const net = Math.max(0, round2(item.quantity * item.unitPrice - (item.discount || 0)));
    const tax = round2((net * (item.taxRate || 0)) / 100);
    return { ...item, net, tax, amount: round2(net + tax) };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.net, 0));
  const taxTotal = round2(lines.reduce((s, l) => s + l.tax, 0));
  const total = Math.max(0, round2(subtotal + taxTotal + (shipping || 0) - (discount || 0)));
  return { lines, subtotal, taxTotal, total };
}

export type InvoiceStatusKey = "draft" | "issued" | "partially_paid" | "paid" | "void";

export function paymentStatusFor(
  total: number,
  amountPaid: number,
  current: InvoiceStatusKey,
): InvoiceStatusKey {
  if (current === "void" || current === "draft") return current;
  if (total > 0 && amountPaid >= total - 0.005) return "paid";
  if (amountPaid > 0) return "partially_paid";
  return "issued";
}

export function isOverdue(status: InvoiceStatusKey, dueDate?: string | Date | null): boolean {
  if (!dueDate || (status !== "issued" && status !== "partially_paid")) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatusKey | "overdue", string> = {
  draft: "Draft",
  issued: "Unpaid",
  partially_paid: "Part paid",
  paid: "Paid",
  void: "Void",
  overdue: "Overdue",
};

export function formatMoney(amount: number, symbol = "৳"): string {
  const hasPaisa = Math.round(amount * 100) % 100 !== 0;
  return `${symbol}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasPaisa ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}
