import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import { isCrossSiteRequest, serverError } from "@/server/auth/session";
import { consumeOtp, verifyOtp } from "@/server/auth/otp";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { cleanString, isEmail, passwordStrengthError } from "@/server/security/validation";

// Step 2 of password reset: confirm the emailed code and set the new password
export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const limited = rateLimit(`reset:${getClientIp(request)}`, 30, 15 * 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const email = cleanString(body.email, 254)?.toLowerCase();
    const code = cleanString(body.code, 10)?.replace(/\s/g, "") ?? "";
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    const weak = passwordStrengthError(body.newPassword);
    if (weak) return NextResponse.json({ error: weak }, { status: 400 });

    await connectDB();
    const result = await verifyOtp({ email, purpose: "reset", code });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      await consumeOtp(result.record);
      return NextResponse.json(
        { error: "This code has expired. Request a new one." },
        { status: 400 },
      );
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: await bcryptjs.hash(body.newPassword, 12), failedLoginAttempts: 0 },
        $unset: { lockUntil: 1 },
        // Signs the account out on every device, in case someone else had access
        $inc: { sessionVersion: 1 },
      },
    );
    await consumeOtp(result.record);

    return NextResponse.json({
      success: true,
      message: "Your password has been changed. Sign in with your new password.",
    });
  } catch (err) {
    return serverError(
      "Reset password error",
      err,
      "Couldn't reset your password. Please try again.",
    );
  }
}
