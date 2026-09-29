import { NextResponse, type NextRequest } from "next/server";

import { Vendor, type UserDocument, type VendorDocument } from "@/server/db/models";
import { requireAuth, VENDOR_ROLES } from "@/server/auth/session";

export type VendorAuthResult =
  { ok: true; user: UserDocument; vendor: VendorDocument } | { ok: false; response: NextResponse };

const BLOCKED_MESSAGES: Record<string, string> = {
  pending:
    "Your store is waiting for approval by the shop team. You can make changes once it's approved.",
  suspended:
    "Your store is suspended, so changes are turned off. Contact the shop team for details.",
};

/**
 * Guard for vendor APIs: a signed-in vendor with a linked store.
 * With `write: true` the store must also be approved — pending and suspended stores are read-only.
 */
export async function requireVendor(
  request: NextRequest,
  { write = false }: { write?: boolean } = {},
): Promise<VendorAuthResult> {
  const auth = await requireAuth(request, VENDOR_ROLES);
  if (!auth.ok) return auth;

  const vendor = await Vendor.findOne({ user: auth.user._id });
  if (!vendor) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No store is linked to this account. Contact the shop team." },
        { status: 403 },
      ),
    };
  }

  if (write && vendor.status !== "approved") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: BLOCKED_MESSAGES[vendor.status] ?? "Your store can't make changes right now." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user: auth.user, vendor };
}
