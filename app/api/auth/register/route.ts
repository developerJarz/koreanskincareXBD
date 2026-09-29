import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import { isCrossSiteRequest, serverError } from "@/server/auth/session";
import { issueOtp } from "@/server/auth/otp";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { cleanString, isEmail, passwordStrengthError } from "@/server/security/validation";

/**
 * Step 1 of sign-up: check the details and email a 6-digit code.
 * No account exists until the code is confirmed at /api/auth/register/verify.
 */
export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limited = rateLimit(`register:${getClientIp(request)}`, 10, 60 * 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const name = cleanString(body.name, 100);
    const email = cleanString(body.email, 254)?.toLowerCase();
    const password = body.password;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const weak = passwordStrengthError(password);
    if (weak) {
      return NextResponse.json({ error: weak }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in or reset your password." },
        { status: 409 },
      );
    }

    // The password is hashed now and held with the code, so it never needs to be sent again
    const issued = await issueOtp({
      email,
      purpose: "signup",
      name,
      pendingPasswordHash: await bcryptjs.hash(password, 12),
    });
    if (!issued.ok) {
      return NextResponse.json(
        { error: issued.error, retryAfter: issued.retryAfter },
        { status: issued.status },
      );
    }

    return NextResponse.json({ status: "code_sent", email });
  } catch (err) {
    return serverError(
      "Register error",
      err,
      "We couldn't send the verification email. Please try again in a moment.",
    );
  }
}
