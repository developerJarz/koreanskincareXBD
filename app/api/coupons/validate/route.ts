import { NextRequest, NextResponse } from "next/server";

import { evaluateCoupon } from "@/server/checkout-config";
import { isCrossSiteRequest, serverError } from "@/server/auth/session";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";

/** POST — { code, subtotal } → the discount the coupon gives. The order API checks it again. */
export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const limited = rateLimit(`coupon:${getClientIp(request)}`, 20, 10 * 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const subtotal = Number(body.subtotal);
    if (typeof body.code !== "string" || !Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });
    }
    const result = await evaluateCoupon(body.code, subtotal);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({
      code: result.code,
      discount: result.discount,
      freeShipping: result.freeShipping,
    });
  } catch (err) {
    return serverError("Validate coupon error", err, "Couldn't check the coupon.");
  }
}
