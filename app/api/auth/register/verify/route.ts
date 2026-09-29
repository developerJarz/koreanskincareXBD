import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import {
  isCrossSiteRequest,
  serverError,
  setSessionCookie,
  toAuthUser,
} from "@/server/auth/session";
import { consumeOtp, verifyOtp } from "@/server/auth/otp";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { cleanString, isEmail } from "@/server/security/validation";

// Step 2 of sign-up: confirm the emailed code, then create the account and sign the user in
export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const limited = rateLimit(`register-verify:${getClientIp(request)}`, 30, 15 * 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const email = cleanString(body.email, 254)?.toLowerCase();
    const code = cleanString(body.code, 10)?.replace(/\s/g, "") ?? "";
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    await connectDB();
    const result = await verifyOtp({ email, purpose: "signup", code });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { record } = result;
    if (!record.pendingPasswordHash || !record.pendingName) {
      return NextResponse.json(
        { error: "This sign-up has expired. Please start again." },
        { status: 400 },
      );
    }

    if (await User.exists({ email })) {
      await consumeOtp(record);
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 },
      );
    }

    // Role is always "customer" — never taken from the request
    const user = await User.create({
      name: record.pendingName,
      email,
      password: record.pendingPasswordHash,
      role: "customer",
      provider: "credentials",
      emailVerified: true,
    });
    await consumeOtp(record);

    const response = NextResponse.json(toAuthUser(user), { status: 201 });
    setSessionCookie(response, user);
    return response;
  } catch (err) {
    return serverError(
      "Register verify error",
      err,
      "Couldn't create your account. Please try again.",
    );
  }
}
