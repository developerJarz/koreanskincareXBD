import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { InvoiceDocument, type InvoiceView } from "@/components/invoice/InvoiceDocument";
import { connectDB } from "@/server/db/connection";
import { Invoice } from "@/server/db/models";
import { getSessionUserFromCookies, STAFF_ROLES } from "@/server/auth/session";
import { getAccessProfile } from "@/server/auth/permissions";
import { getInvoiceTemplate } from "@/server/invoices";
import { isObjectId } from "@/server/security/validation";
import { PrintToolbar } from "./PrintToolbar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };

const PAGE_SIZE: Record<string, string> = { A4: "A4", Letter: "letter", "80mm": "80mm auto" };

/** Printable invoice (team only). Print, or "Save as PDF" from the browser's print dialog. */
export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ print?: string }>;
}) {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/auth/login");
  if (!STAFF_ROLES.includes(user.role)) redirect("/");
  const { permissions } = await getAccessProfile(user);
  if (!permissions.includes("invoices.view")) redirect("/admin");

  const { id } = await params;
  if (!isObjectId(id)) notFound();
  await connectDB();
  const [doc, template] = await Promise.all([Invoice.findById(id).lean(), getInvoiceTemplate()]);
  if (!doc) notFound();

  const invoice: InvoiceView = JSON.parse(JSON.stringify(doc));
  const autoPrint = (await searchParams)?.print === "1";

  return (
    <div className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <style>{`
        @page { size: ${PAGE_SIZE[template.paperSize] ?? "A4"}; margin: ${template.paperSize === "80mm" ? "4mm" : "10mm"}; }
        @media print { html, body { background: #fff !important; } .no-print { display: none !important; } .invoice-sheet { box-shadow: none !important; } }
      `}</style>
      <PrintToolbar invoiceNumber={invoice.invoiceNumber} autoPrint={autoPrint} paperSize={template.paperSize} />
      <div
        className="invoice-sheet mx-auto bg-white shadow-xl print:shadow-none"
        style={{ maxWidth: template.paperSize === "80mm" ? 340 : 860 }}
      >
        <InvoiceDocument invoice={invoice} template={template} />
      </div>
    </div>
  );
}
