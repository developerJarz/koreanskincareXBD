import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Invoice } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { cleanInvoiceInput } from "@/server/invoices";
import { cleanString, isObjectId } from "@/server/security/validation";
import { formatMoney, paymentStatusFor } from "@/lib/invoice";

type Ctx = { params: Promise<{ id: string }> };
const notFound = () => NextResponse.json({ error: "Invoice not found." }, { status: 404 });

// GET — One invoice with its items and payments
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requirePermission(request, "invoices.view");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    await connectDB();
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return notFound();
    return NextResponse.json(JSON.parse(JSON.stringify(invoice)));
  } catch (err) {
    return serverError("Get invoice error", err, "Couldn't load the invoice.");
  }
}

// PUT — Edit customer, items, charges, dates and notes (not for void invoices)
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requirePermission(request, "invoices.manage");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    const body = await request.json().catch(() => ({}));
    const result = cleanInvoiceInput(body);
    if (!result.ok) return NextResponse.json({ error: result.error, fields: result.fields }, { status: 400 });

    await connectDB();
    const invoice = await Invoice.findById(id);
    if (!invoice) return notFound();
    if (invoice.status === "void") {
      return NextResponse.json({ error: "A void invoice can't be edited. Duplicate it instead." }, { status: 400 });
    }

    const { lines: _lines, ...value } = result.value;
    Object.assign(invoice, value);
    const requested = invoice.status === "draft" && body.status !== "issued" ? "draft" : "issued";
    invoice.status = paymentStatusFor(invoice.total, invoice.amountPaid, requested);
    await invoice.save();

    audit(request, auth.user, {
      action: "invoice.update",
      summary: `Edited invoice ${invoice.invoiceNumber} (${formatMoney(invoice.total)})`,
      entity: "Invoice",
      entityId: id,
    });
    return NextResponse.json(invoice.toJSON());
  } catch (err) {
    return serverError("Update invoice error", err, "Couldn't save the invoice.");
  }
}

/**
 * PATCH — Quick actions:
 *   { action: "issue" }                                   finalise a draft
 *   { action: "payment", amount, method, reference?, date?, note? }   record money received
 *   { action: "remove_payment", index }                   undo a recorded payment
 *   { action: "void", reason? }                           cancel (kept for records)
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requirePermission(request, "invoices.manage");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    const body = await request.json().catch(() => ({}));
    await connectDB();
    const invoice = await Invoice.findById(id);
    if (!invoice) return notFound();
    if (invoice.status === "void") {
      return NextResponse.json({ error: "This invoice is void." }, { status: 400 });
    }

    let summary: string;
    switch (body.action) {
      case "issue": {
        if (invoice.status !== "draft") return NextResponse.json({ error: "Already issued." }, { status: 400 });
        invoice.status = paymentStatusFor(invoice.total, invoice.amountPaid, "issued");
        summary = `Issued invoice ${invoice.invoiceNumber}`;
        break;
      }
      case "payment": {
        const amount = Math.round(Number(body.amount) * 100) / 100;
        const balance = Math.round((invoice.total - invoice.amountPaid) * 100) / 100;
        if (!Number.isFinite(amount) || amount <= 0) {
          return NextResponse.json({ error: "Enter the amount received." }, { status: 400 });
        }
        if (amount > balance + 0.005) {
          return NextResponse.json(
            { error: `That's more than the balance due (${formatMoney(balance)}).` },
            { status: 400 },
          );
        }
        const method = cleanString(body.method, 40) || "Cash";
        const when = body.date ? new Date(`${String(body.date).slice(0, 10)}T12:00:00+06:00`) : new Date();
        invoice.payments.push({
          amount,
          method,
          reference: cleanString(body.reference, 100) || undefined,
          note: cleanString(body.note, 300) || undefined,
          date: Number.isNaN(when.getTime()) ? new Date() : when,
        });
        invoice.amountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100;
        invoice.status = paymentStatusFor(
          invoice.total,
          invoice.amountPaid,
          invoice.status === "draft" ? "issued" : invoice.status,
        );
        summary = `Recorded ${formatMoney(amount)} ${method} payment on ${invoice.invoiceNumber}`;
        break;
      }
      case "remove_payment": {
        const index = Number(body.index);
        const payment = invoice.payments[index];
        if (!Number.isInteger(index) || !payment) {
          return NextResponse.json({ error: "Payment not found." }, { status: 404 });
        }
        invoice.payments.splice(index, 1);
        invoice.amountPaid = Math.max(0, Math.round((invoice.amountPaid - payment.amount) * 100) / 100);
        invoice.status = paymentStatusFor(invoice.total, invoice.amountPaid, "issued");
        summary = `Removed a ${formatMoney(payment.amount)} payment from ${invoice.invoiceNumber}`;
        break;
      }
      case "void": {
        invoice.status = "void";
        invoice.voidedAt = new Date();
        const reason = cleanString(body.reason, 300);
        if (reason) invoice.notes = [invoice.notes, `Voided: ${reason}`].filter(Boolean).join("\n");
        summary = `Voided invoice ${invoice.invoiceNumber}${reason ? ` — ${reason}` : ""}`;
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    await invoice.save();
    audit(request, auth.user, { action: `invoice.${body.action}`, summary, entity: "Invoice", entityId: id });
    return NextResponse.json(invoice.toJSON());
  } catch (err) {
    return serverError("Invoice action error", err, "Couldn't update the invoice.");
  }
}

// DELETE — Only drafts can be deleted; issued invoices are voided so the number sequence stays intact
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requirePermission(request, "invoices.manage");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return notFound();

    await connectDB();
    const invoice = await Invoice.findById(id);
    if (!invoice) return notFound();
    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only drafts can be deleted. Void an issued invoice instead." },
        { status: 400 },
      );
    }
    await invoice.deleteOne();
    audit(request, auth.user, {
      action: "invoice.delete",
      summary: `Deleted draft invoice ${invoice.invoiceNumber}`,
      entity: "Invoice",
      entityId: id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Delete invoice error", err, "Couldn't delete the invoice.");
  }
}
