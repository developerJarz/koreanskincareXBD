import React from "react";

import {
  computeInvoiceTotals,
  formatMoney,
  INVOICE_STATUS_LABELS,
  isOverdue,
  type InvoiceLine,
  type InvoiceStatusKey,
  type InvoiceTemplate,
} from "@/lib/invoice";

/**
 * The invoice itself, rendered from the saved design (template). Used for the live preview in
 * the admin editor and for the printable page, so what you design is exactly what prints.
 * Colours are fixed (not the site theme) so a dark-mode admin still prints a white invoice.
 */

export type InvoiceView = {
  invoiceNumber: string;
  status: InvoiceStatusKey;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  orderNumber?: string | null;
  customer: { name: string; email?: string; phone?: string; address?: string };
  items: InvoiceLine[];
  shipping: number;
  discount: number;
  amountPaid: number;
  payments?: {
    amount: number;
    method: string;
    reference?: string;
    date: string | Date;
    note?: string;
  }[];
  notes?: string;
  terms?: string;
};

const INK = "#1c1917";
const MUTED = "#57534e";
const LINE = "#e7e5e4";

const d = (v?: string | Date | null) =>
  v
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Dhaka",
      }).format(new Date(v))
    : "—";

function Stamp({ text, color }: { text: string; color: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "38%",
        right: "8%",
        transform: "rotate(-14deg)",
        border: `3px solid ${color}`,
        color,
        borderRadius: 8,
        padding: "6px 18px",
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: 4,
        opacity: 0.22,
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

export function InvoiceDocument({
  invoice,
  template: t,
}: {
  invoice: InvoiceView;
  template: InvoiceTemplate;
}) {
  const totals = computeInvoiceTotals(invoice.items, invoice.shipping, invoice.discount);
  const balance = Math.max(0, Math.round((totals.total - invoice.amountPaid) * 100) / 100);
  const money = (n: number) => formatMoney(n, t.currencySymbol);
  const accent = t.accentColor;
  const thermal = t.paperSize === "80mm" || t.layout === "compact";
  const overdue = isOverdue(invoice.status, invoice.dueDate ?? null);
  const fontFamily =
    t.fontStyle === "serif"
      ? "Georgia, 'Playfair Display', 'Times New Roman', serif"
      : "'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, sans-serif";

  const showDiscount = t.showDiscountColumn && invoice.items.some((i) => i.discount > 0);
  const showTax = t.showTaxColumn && invoice.items.some((i) => i.taxRate > 0);
  const status = overdue ? "overdue" : invoice.status;

  const company = (
    <div style={{ minWidth: 0 }}>
      {t.showLogo && t.logoUrl ? (
        <img
          src={t.logoUrl}
          alt={t.companyName}
          style={{
            maxHeight: thermal ? 40 : 54,
            maxWidth: 200,
            objectFit: "contain",
            marginBottom: 6,
          }}
        />
      ) : (
        <div
          style={{
            fontSize: thermal ? 16 : 22,
            fontWeight: 800,
            color: t.layout === "modern" ? "#fff" : accent,
          }}
        >
          {t.companyName}
        </div>
      )}
      {t.showLogo && t.logoUrl && (
        <div style={{ fontWeight: 700, fontSize: 13 }}>{t.companyName}</div>
      )}
      {t.companyTagline && <div style={{ fontSize: 11, opacity: 0.85 }}>{t.companyTagline}</div>}
      <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.5, opacity: 0.85 }}>
        {t.companyAddress && <div>{t.companyAddress}</div>}
        {[t.companyPhone, t.companyEmail, t.companyWebsite].filter(Boolean).join(" · ")}
        {t.taxId && <div>BIN / VAT reg.: {t.taxId}</div>}
      </div>
    </div>
  );

  const meta = (
    <div style={{ textAlign: thermal ? "left" : "right", fontSize: 12, lineHeight: 1.6 }}>
      <div
        style={{
          fontSize: thermal ? 18 : 26,
          fontWeight: 800,
          letterSpacing: 0.5,
          color: t.layout === "modern" ? "#fff" : INK,
        }}
      >
        {t.title}
      </div>
      <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 700 }}>
        {invoice.invoiceNumber}
      </div>
      <div>Date: {d(invoice.issueDate)}</div>
      {invoice.dueDate && <div>Due: {d(invoice.dueDate)}</div>}
      {invoice.orderNumber && <div>Order: {invoice.orderNumber}</div>}
      <div
        style={{
          display: "inline-block",
          marginTop: 4,
          padding: "1px 8px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          background:
            t.layout === "modern"
              ? "rgba(255,255,255,.2)"
              : status === "paid"
                ? "#dcfce7"
                : status === "overdue"
                  ? "#fee2e2"
                  : "#f5f5f4",
          color:
            t.layout === "modern"
              ? "#fff"
              : status === "paid"
                ? "#166534"
                : status === "overdue"
                  ? "#991b1b"
                  : MUTED,
        }}
      >
        {INVOICE_STATUS_LABELS[status]}
      </div>
    </div>
  );

  const header =
    t.layout === "modern" && !thermal ? (
      <div
        style={{
          background: accent,
          color: "#fff",
          padding: "28px 36px",
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {company}
        {meta}
      </div>
    ) : (
      <div
        style={{
          padding: thermal ? "16px 14px 8px" : "32px 36px 16px",
          display: "flex",
          flexDirection: thermal ? "column" : "row",
          justifyContent: "space-between",
          gap: thermal ? 10 : 24,
          borderBottom: t.layout === "classic" ? `3px solid ${accent}` : `1px solid ${LINE}`,
          textAlign: thermal ? "center" : "left",
        }}
      >
        {company}
        {meta}
      </div>
    );

  const pad = thermal ? "10px 14px" : "20px 36px";
  const cell: React.CSSProperties = {
    padding: thermal ? "4px 2px" : "9px 8px",
    borderBottom: `1px solid ${LINE}`,
    verticalAlign: "top",
  };
  const head: React.CSSProperties = {
    ...cell,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: t.layout === "minimal" ? MUTED : accent,
    borderBottom: `${t.layout === "minimal" ? 1 : 2}px solid ${t.layout === "minimal" ? LINE : accent}`,
    fontWeight: 700,
  };

  return (
    <div
      className="invoice-document"
      style={{
        position: "relative",
        background: "#fff",
        color: INK,
        fontFamily,
        width: "100%",
        maxWidth: thermal ? 320 : 820,
        margin: "0 auto",
        fontSize: thermal ? 11 : 12.5,
        boxSizing: "border-box",
      }}
    >
      {t.showPaidStamp && invoice.status === "paid" && <Stamp text="PAID" color="#15803d" />}
      {invoice.status === "void" && <Stamp text="VOID" color="#57534e" />}
      {header}

      <div
        style={{
          padding: pad,
          display: "flex",
          flexDirection: thermal ? "column" : "row",
          gap: thermal ? 6 : 24,
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: MUTED,
            }}
          >
            Bill to
          </div>
          <div style={{ fontWeight: 700, fontSize: thermal ? 12 : 14, marginTop: 2 }}>
            {invoice.customer.name}
          </div>
          <div style={{ color: MUTED, lineHeight: 1.5 }}>
            {invoice.customer.phone && <div>{invoice.customer.phone}</div>}
            {invoice.customer.email && <div>{invoice.customer.email}</div>}
            {invoice.customer.address && (
              <div style={{ maxWidth: 320 }}>{invoice.customer.address}</div>
            )}
          </div>
        </div>
        {!thermal && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: MUTED,
              }}
            >
              {balance > 0 && invoice.status !== "void" ? "Amount due" : "Total"}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: accent }}>
              {money(balance > 0 && invoice.status !== "void" ? balance : totals.total)}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: thermal ? "0 14px" : "0 36px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: "left" }}>Item</th>
              <th style={{ ...head, textAlign: "right" }}>Qty</th>
              {!thermal && <th style={{ ...head, textAlign: "right" }}>Price</th>}
              {showDiscount && !thermal && (
                <th style={{ ...head, textAlign: "right" }}>Discount</th>
              )}
              {showTax && !thermal && <th style={{ ...head, textAlign: "right" }}>Tax</th>}
              <th style={{ ...head, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {totals.lines.map((line, i) => (
              <tr key={i}>
                <td style={cell}>
                  <div style={{ fontWeight: 600 }}>{line.description}</div>
                  {t.showSku && line.sku && (
                    <div style={{ fontSize: 10, color: MUTED }}>SKU {line.sku}</div>
                  )}
                  {thermal && (
                    <div style={{ fontSize: 10, color: MUTED }}>
                      @ {money(line.unitPrice)}
                      {line.discount ? ` − ${money(line.discount)}` : ""}
                    </div>
                  )}
                </td>
                <td style={{ ...cell, textAlign: "right" }}>{line.quantity}</td>
                {!thermal && (
                  <td style={{ ...cell, textAlign: "right" }}>{money(line.unitPrice)}</td>
                )}
                {showDiscount && !thermal && (
                  <td style={{ ...cell, textAlign: "right" }}>
                    {line.discount ? `−${money(line.discount)}` : "—"}
                  </td>
                )}
                {showTax && !thermal && (
                  <td style={{ ...cell, textAlign: "right" }}>
                    {line.taxRate ? `${line.taxRate}%` : "—"}
                  </td>
                )}
                <td style={{ ...cell, textAlign: "right", fontWeight: 600 }}>
                  {money(line.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <table style={{ width: thermal ? "100%" : 280, borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Subtotal", money(totals.subtotal)],
                totals.taxTotal ? ["Tax / VAT", money(totals.taxTotal)] : null,
                invoice.shipping ? ["Delivery", money(invoice.shipping)] : null,
                invoice.discount ? ["Discount", `−${money(invoice.discount)}`] : null,
              ]
                .filter(Boolean)
                .map((row) => (
                  <tr key={row![0]}>
                    <td style={{ padding: "3px 0", color: MUTED }}>{row![0]}</td>
                    <td style={{ padding: "3px 0", textAlign: "right" }}>{row![1]}</td>
                  </tr>
                ))}
              <tr>
                <td
                  style={{ padding: "8px 0 3px", fontWeight: 800, borderTop: `2px solid ${INK}` }}
                >
                  Total
                </td>
                <td
                  style={{
                    padding: "8px 0 3px",
                    fontWeight: 800,
                    textAlign: "right",
                    borderTop: `2px solid ${INK}`,
                    color: accent,
                  }}
                >
                  {money(totals.total)}
                </td>
              </tr>
              {invoice.amountPaid > 0 && (
                <tr>
                  <td style={{ padding: "3px 0", color: MUTED }}>Paid</td>
                  <td style={{ padding: "3px 0", textAlign: "right" }}>
                    −{money(invoice.amountPaid)}
                  </td>
                </tr>
              )}
              {invoice.amountPaid > 0 && invoice.status !== "void" && (
                <tr>
                  <td style={{ padding: "3px 0", fontWeight: 700 }}>Balance due</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 700 }}>
                    {money(balance)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {t.showPaymentHistory && invoice.payments && invoice.payments.length > 0 && (
        <div style={{ padding: thermal ? "8px 14px 0" : "16px 36px 0" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: MUTED,
              marginBottom: 4,
            }}
          >
            Payments received
          </div>
          {invoice.payments.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 11,
                padding: "2px 0",
              }}
            >
              <span>
                {d(p.date)} · {p.method}
                {p.reference ? ` · ${p.reference}` : ""}
              </span>
              <span>{money(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          padding: thermal ? "12px 14px" : "20px 36px",
          display: "grid",
          gridTemplateColumns: thermal ? "1fr" : "1fr 1fr",
          gap: 18,
          fontSize: 11,
          color: MUTED,
          lineHeight: 1.55,
        }}
      >
        <div>
          {t.paymentInstructions && balance > 0 && invoice.status !== "void" && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: INK }}>How to pay</div>
              <div style={{ whiteSpace: "pre-line" }}>{t.paymentInstructions}</div>
            </div>
          )}
          {invoice.notes && (
            <div>
              <div style={{ fontWeight: 700, color: INK }}>Notes</div>
              <div style={{ whiteSpace: "pre-line" }}>{invoice.notes}</div>
            </div>
          )}
        </div>
        <div>
          {invoice.terms && (
            <div>
              <div style={{ fontWeight: 700, color: INK }}>Terms</div>
              <div style={{ whiteSpace: "pre-line" }}>{invoice.terms}</div>
            </div>
          )}
          {t.showSignature && !thermal && (
            <div style={{ marginTop: 36, textAlign: "right" }}>
              <div
                style={{
                  display: "inline-block",
                  minWidth: 180,
                  borderTop: `1px solid ${MUTED}`,
                  paddingTop: 4,
                  textAlign: "center",
                }}
              >
                {t.signatureLabel}
              </div>
            </div>
          )}
        </div>
      </div>

      {t.footerText && (
        <div
          style={{
            padding: thermal ? "8px 14px 14px" : "12px 36px 24px",
            textAlign: "center",
            fontSize: 10,
            color: MUTED,
            borderTop: `1px solid ${LINE}`,
          }}
        >
          {t.footerText}
        </div>
      )}
    </div>
  );
}
