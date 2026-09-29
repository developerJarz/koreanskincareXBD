import { NextRequest, NextResponse } from "next/server";
import { User } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, roleRank, serverError } from "@/server/auth/session";
import { isObjectId } from "@/server/security/validation";
import type { UserRole } from "@/types";

// "vendor" is deliberately missing: vendor accounts are created and managed from the Vendors page,
// which keeps the user and its vendor store record in sync
const VALID_ROLES: UserRole[] = ["super_admin", "admin", "staff", "customer"];

// PATCH — Change a user's role or active status (admins only, respecting the role hierarchy)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;
    const actor = auth.user;

    const { userId, role, isActive } = await request.json().catch(() => ({}));
    if (!isObjectId(userId)) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (actor._id.toString() === userId) {
      return NextResponse.json(
        { error: "You cannot change your own role or status." },
        { status: 400 },
      );
    }

    const target = await User.findById(userId);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSuperAdmin = actor.role === "super_admin";
    if (!isSuperAdmin && roleRank(target.role) >= roleRank(actor.role)) {
      return NextResponse.json(
        { error: "You cannot modify an account with an equal or higher role." },
        { status: 403 },
      );
    }

    let invalidateSessions = false;

    if (role !== undefined) {
      if (target.role === "vendor") {
        return NextResponse.json(
          { error: "This is a vendor account. Manage it from the Vendors page." },
          { status: 400 },
        );
      }
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      if (!isSuperAdmin && roleRank(role) >= roleRank(actor.role)) {
        return NextResponse.json(
          { error: "Only a super admin can grant admin-level roles." },
          { status: 403 },
        );
      }
      if (role !== target.role) {
        target.role = role;
        invalidateSessions = true;
      }
    }

    if (isActive !== undefined) {
      const active = Boolean(isActive);
      if (active !== target.isActive) {
        target.isActive = active;
        if (!active) invalidateSessions = true;
      }
    }

    if (invalidateSessions) {
      target.sessionVersion = (target.sessionVersion ?? 0) + 1;
    }
    await target.save();

    return NextResponse.json(target.toJSON());
  } catch (err) {
    return serverError("Update user role error", err, "Failed to update user");
  }
}
