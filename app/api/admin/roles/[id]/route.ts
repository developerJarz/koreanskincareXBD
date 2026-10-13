import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Role, User } from "@/server/db/models";
import { invalidateRoleCache, requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { cleanString, isObjectId } from "@/server/security/validation";
import {
  PERMISSIONS,
  permissionsAfterEdit,
  sanitizePermissions,
  type Permission,
} from "@/lib/permissions";

type Ctx = { params: Promise<{ id: string }> };
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// PUT — Edit a role's name, description, colour and permissions
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requirePermission(request, "roles.manage");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Role not found." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    await connectDB();
    const role = await Role.findById(id);
    if (!role) return NextResponse.json({ error: "Role not found." }, { status: 404 });

    const name = cleanString(body.name, 60);
    if (body.name !== undefined && !name) {
      return NextResponse.json({ error: "Give the role a name." }, { status: 400 });
    }
    const before = sanitizePermissions(role.permissions, true);
    if (name) role.name = name;
    if (body.description !== undefined) role.description = cleanString(body.description, 300) || undefined;
    if (COLOR_RE.test(body.color)) role.color = body.color;
    if (body.permissions !== undefined) {
      const permissions = permissionsAfterEdit(
        body.permissions,
        role.permissions,
        auth.user.role === "super_admin",
      );
      if (permissions.length === 0) {
        return NextResponse.json({ error: "Choose at least one permission." }, { status: 400 });
      }
      role.permissions = permissions;
    }
    await role.save();
    invalidateRoleCache();

    const after = sanitizePermissions(role.permissions, true);
    const added = after.filter((p) => !before.includes(p));
    const removed = before.filter((p) => !after.includes(p));
    const label = (list: Permission[]) => list.map((p) => PERMISSIONS[p].label).join(", ");
    const parts = [
      added.length ? `added ${label(added)}` : "",
      removed.length ? `removed ${label(removed)}` : "",
    ].filter(Boolean);
    audit(request, auth.user, {
      action: "role.update",
      summary: `Updated role “${role.name}”${parts.length ? `: ${parts.join("; ")}` : ""}`,
      entity: "Role",
      entityId: id,
    });

    return NextResponse.json(role.toJSON());
  } catch (err) {
    return serverError("Update role error", err, "Couldn't save the role.");
  }
}

// DELETE — Remove a custom role; its members fall back to the default Staff role
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requirePermission(request, "roles.manage");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Role not found." }, { status: 404 });

    await connectDB();
    const role = await Role.findById(id);
    if (!role) return NextResponse.json({ error: "Role not found." }, { status: 404 });
    if (role.isSystem) {
      return NextResponse.json({ error: "The built-in Staff role can't be deleted." }, { status: 400 });
    }

    const { modifiedCount } = await User.updateMany({ customRole: role._id }, { $unset: { customRole: 1 } });
    await role.deleteOne();
    invalidateRoleCache();
    audit(request, auth.user, {
      action: "role.delete",
      summary: `Deleted role “${role.name}”${modifiedCount ? ` (${modifiedCount} members moved to Staff)` : ""}`,
      entity: "Role",
      entityId: id,
    });
    return NextResponse.json({ success: true, movedMembers: modifiedCount });
  } catch (err) {
    return serverError("Delete role error", err, "Couldn't delete the role.");
  }
}
