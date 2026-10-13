import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Settings } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { getInvoiceTemplate } from "@/server/invoices";
import { DEFAULT_INVOICE_TEMPLATE, normalizeInvoiceTemplate } from "@/lib/invoice";

// GET — The invoice design (with shop details filling unset fields)
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "invoices.view");
    if (!auth.ok) return auth.response;
    return NextResponse.json(await getInvoiceTemplate());
  } catch (err) {
    return serverError("Invoice template error", err, "Couldn't load the invoice design.");
  }
}

// PUT — Save the invoice design. { reset: true } goes back to the defaults.
export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "invoices.design");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    await connectDB();
    const settings = (await Settings.findOne()) ?? new Settings({});
    if (body.reset) {
      settings.invoiceTemplate = undefined;
    } else {
      settings.invoiceTemplate = normalizeInvoiceTemplate(body, DEFAULT_INVOICE_TEMPLATE);
    }
    settings.markModified("invoiceTemplate");
    await settings.save();

    audit(request, auth.user, {
      action: "invoice.design",
      summary: body.reset ? "Reset the invoice design to the default" : "Changed the invoice design",
      entity: "Settings",
    });
    return NextResponse.json(await getInvoiceTemplate());
  } catch (err) {
    return serverError("Save invoice template error", err, "Couldn't save the invoice design.");
  }
}
