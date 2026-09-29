import { after, NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import {
  isCrossSiteRequest,
  serverError,
  setSessionCookie,
  toAuthUser,
} from "@/server/auth/session";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { isEmail } from "@/server/security/validation";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// Compared against when the email does not exist, so response time does not reveal valid accounts
const DUMMY_HASH = "$2b$12$wGTb5kBSsD7k1cBclcQFd.gA0S9QutOk0JuK.nSuD0BHjfB2IHqE.";

const INVALID = "Invalid email or password. Please check your credentials and try again.";

export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const limited = rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isEmail(email) || !password || password.length > 128) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const emailLimited = rateLimit(`login:email:${email}`, 10, 15 * 60_000);
    if (emailLimited) return emailLimited;

    await connectDB();
    const user = await User.findOne({ email }).select("+password +failedLoginAttempts +lockUntil");

    if (!user || !user.password) {
      await bcryptjs.compare(password, DUMMY_HASH);
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.` },
        { status: 429 },
      );
    }

    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) {
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      await User.updateOne(
        { _id: user._id },
        attempts >= MAX_FAILED_ATTEMPTS
          ? {
              $set: {
                failedLoginAttempts: 0,
                lockUntil: new Date(Date.now() + LOCK_MINUTES * 60_000),
              },
            }
          : { $set: { failedLoginAttempts: attempts } },
      );
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    // Checked only after the password matches, so account status is not revealed to guessers
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 },
      );
    }

    // Bookkeeping runs after the response is sent, so signing in doesn't wait on an extra DB write
    const userId = user._id;
    after(() =>
      User.updateOne(
        { _id: userId },
        { $set: { lastLoginAt: new Date(), failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } },
      ).catch((err) => console.error("Failed to record login:", err)),
    );

    const response = NextResponse.json(toAuthUser(user));
    setSessionCookie(response, user);
    return response;
  } catch (err) {
    return serverError("Login error", err, "Login failed. Please try again later.");
  }
}
