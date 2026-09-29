import { after, NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import { isCrossSiteRequest, serverError } from "@/server/auth/session";
import { issueOtp } from "@/server/auth/otp";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { cleanString, isEmail } from "@/server/security/validation";

const GENERIC =
  "If an account exists for this email, we've sent a 6-digit code to it. Check your inbox and spam folder.";

/**
 * Step 1 of password reset: email a code.
 * The reply is identical whether or not the account exists, and the email is sent after
 * responding, so neither the message nor the response time reveals who has an account.
 */
export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const limited = rateLimit(`forgot:${getClientIp(request)}`, 10, 60 * 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const email = cleanString(body.email, 254)?.toLowerCase();
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    after(async () => {
      try {
        await connectDB();
        const user = await User.findOne({ email }).select("+password");
        // Only accounts that sign in with a password can reset one
        if (!user || !user.isActive || !user.password) return;
        const issued = await issueOtp({ email, purpose: "reset", name: user.name });
        if (!issued.ok) console.warn(`Password reset code not sent to ${email}: ${issued.error}`);
      } catch (err) {
        console.error("Password reset email failed:", err);
      }
    });

    return NextResponse.json({ status: "code_sent", message: GENERIC });
  } catch (err) {
    return serverError("Forgot password error", err, "Something went wrong. Please try again.");
  }
}
