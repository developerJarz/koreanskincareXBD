import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { serverError } from "@/server/auth/session";
import { requireVendor } from "@/server/auth/vendor";
import { cleanString } from "@/server/security/validation";

// PUT — Vendors can update their contact details and store description.
// Store name, status, commission and limits are only changed by the shop team.
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    // Allowed even while pending/suspended, so vendors can keep contact details current
    const auth = await requireVendor(request);
    if (!auth.ok) return auth.response;
    const { vendor } = auth;

    const body = await request.json().catch(() => ({}));
    const contactName = cleanString(body.contactName, 100);
    if (body.contactName !== undefined && !contactName) {
      return NextResponse.json({ error: "Enter a contact name." }, { status: 400 });
    }
    if (contactName) vendor.contactName = contactName;
    if (body.phone !== undefined) vendor.phone = cleanString(body.phone, 30) ?? "";
    if (body.district !== undefined) vendor.district = cleanString(body.district, 60) ?? "";
    if (body.pickupAddress !== undefined) {
      vendor.pickupAddress = cleanString(body.pickupAddress, 300) ?? "";
    }
    if (body.description !== undefined)
      vendor.description = cleanString(body.description, 2000) ?? "";
    await vendor.save();

    const { adminNotes: _internal, ...visible } = vendor.toJSON();
    return NextResponse.json(visible);
  } catch (err) {
    return serverError("Vendor profile update error", err, "Failed to save your store details");
  }
}
