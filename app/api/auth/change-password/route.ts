import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

import { User } from "@/server/db/models";
import { requireAuth, serverError, setSessionCookie } from "@/server/auth/session";
import { rateLimit } from "@/server/security/rate-limit";
import { passwordStrengthError } from "@/server/security/validation";

// POST — Change the signed-in user's own password
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const limited = rateLimit(`change-password:${auth.user._id}`, 5, 15 * 60_000);
    if (limited) return limited;

    const { currentPassword, newPassword } = await request.json().catch(() => ({}));

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required to change your password." },
        { status: 400 },
      );
    }

    const weak = passwordStrengthError(newPassword);
    if (weak) {
      return NextResponse.json({ error: weak }, { status: 400 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 },
      );
    }

    const userDoc = await User.findById(auth.user._id).select("+password");
    if (!userDoc?.password || !(await bcryptjs.compare(currentPassword, userDoc.password))) {
      return NextResponse.json(
        { error: "The current password you entered is incorrect." },
        { status: 400 },
      );
    }

    userDoc.password = await bcryptjs.hash(newPassword, 12);
    // Signs out every other device; this device gets a fresh cookie below
    userDoc.sessionVersion = (userDoc.sessionVersion ?? 0) + 1;
    await userDoc.save();

    const response = NextResponse.json({
      success: true,
      message: "Password updated successfully!",
    });
    setSessionCookie(response, userDoc);
    return response;
  } catch (err) {
    return serverError("Change password error", err, "Failed to update password.");
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
