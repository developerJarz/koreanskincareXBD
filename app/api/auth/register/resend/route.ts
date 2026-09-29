import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { EmailOtp } from "@/server/db/models";
import { isCrossSiteRequest, serverError } from "@/server/auth/session";
import { issueOtp } from "@/server/auth/otp";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { cleanString, isEmail } from "@/server/security/validation";

// Sends a fresh sign-up code for a sign-up that was started but not yet confirmed
export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const limited = rateLimit(`register-resend:${getClientIp(request)}`, 10, 60 * 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const email = cleanString(body.email, 254)?.toLowerCase();
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    await connectDB();
    const pending = await EmailOtp.findOne({ email, purpose: "signup" });
    if (!pending?.pendingPasswordHash) {
      return NextResponse.json(
        { error: "This sign-up has expired. Please start again." },
        { status: 400 },
      );
    }

    const issued = await issueOtp({ email, purpose: "signup" });
    if (!issued.ok) {
      return NextResponse.json(
        { error: issued.error, retryAfter: issued.retryAfter },
        { status: issued.status },
      );
    }
    return NextResponse.json({ status: "code_sent" });
  } catch (err) {
    return serverError(
      "Register resend error",
      err,
      "We couldn't send the email. Please try again.",
    );
  }
}
