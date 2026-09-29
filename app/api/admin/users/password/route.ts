import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

import { User } from "@/server/db/models";
import {
  requireAuth,
  roleRank,
  serverError,
  setSessionCookie,
  STAFF_ROLES,
} from "@/server/auth/session";
import { rateLimit } from "@/server/security/rate-limit";
import { isEmail, isObjectId, passwordStrengthError } from "@/server/security/validation";

/**
 * POST — Set a password from the admin panel.
 *  - Own account (any staff role): the current password is required.
 *  - Another account: admins only, and only for accounts with a lower role
 *    (a super admin may reset anyone else).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;
    const actor = auth.user;

    const limited = rateLimit(`admin-password:${actor._id}`, 10, 15 * 60_000);
    if (limited) return limited;

    const { userId, email, currentPassword, newPassword } = await request.json().catch(() => ({}));

    const weak = passwordStrengthError(newPassword);
    if (weak) {
      return NextResponse.json({ error: weak }, { status: 400 });
    }

    let target = null;
    if (isObjectId(userId)) {
      target = await User.findById(userId).select("+password");
    } else if (isEmail(email)) {
      target = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    }
    if (!target) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const isSelf = target._id.equals(actor._id);

    if (isSelf) {
      if (
        typeof currentPassword !== "string" ||
        !target.password ||
        !(await bcryptjs.compare(currentPassword, target.password))
      ) {
        return NextResponse.json(
          { error: "The current password you entered is incorrect." },
          { status: 400 },
        );
      }
    } else {
      const canReset =
        actor.role === "super_admin" ||
        (actor.role === "admin" && roleRank(target.role) < roleRank(actor.role));
      if (!canReset) {
        return NextResponse.json(
          { error: "You do not have permission to reset this account's password." },
          { status: 403 },
        );
      }
    }

    target.password = await bcryptjs.hash(newPassword, 12);
    target.sessionVersion = (target.sessionVersion ?? 0) + 1;
    await target.save();

    const response = NextResponse.json({
      success: true,
      message: `Password updated successfully for ${target.name || target.email}!`,
    });
    // Keep the admin signed in on this device after changing their own password
    if (isSelf) setSessionCookie(response, target);
    return response;
  } catch (err) {
    return serverError("Admin password change error", err, "Failed to update password.");
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
