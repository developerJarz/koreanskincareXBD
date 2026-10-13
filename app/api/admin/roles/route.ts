import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

import { connectDB } from "@/server/db/connection";
import { Role, User } from "@/server/db/models";
import {
  DEFAULT_STAFF_ROLE_SLUG,
  ensureDefaultStaffRole,
  invalidateRoleCache,
  requirePermission,
} from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { cleanString } from "@/server/security/validation";
import { permissionsAfterEdit, sanitizePermissions } from "@/lib/permissions";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// GET — Staff roles with how many team members use each
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "roles.manage");
    if (!auth.ok) return auth.response;

    await ensureDefaultStaffRole();
    const [roles, counts, defaultCount] = await Promise.all([
      Role.find().sort({ isSystem: -1, name: 1 }).lean(),
      User.aggregate([
        { $match: { role: "staff", customRole: { $ne: null } } },
        { $group: { _id: "$customRole", count: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: "staff", customRole: null }),
    ]);
    const countBy = new Map(counts.map((c) => [String(c._id), c.count as number]));

    return NextResponse.json(
      roles.map((r) => ({
        ...JSON.parse(JSON.stringify(r)),
        permissions: sanitizePermissions(r.permissions, true),
        members:
          r.slug === DEFAULT_STAFF_ROLE_SLUG ? defaultCount : (countBy.get(String(r._id)) ?? 0),
      })),
    );
  } catch (err) {
    return serverError("List roles error", err, "Couldn't load roles.");
  }
}

// POST — Create a custom staff role
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "roles.manage");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const name = cleanString(body.name, 60);
    if (!name) return NextResponse.json({ error: "Give the role a name." }, { status: 400 });
    const permissions = permissionsAfterEdit(body.permissions, [], auth.user.role === "super_admin");
    if (permissions.length === 0) {
      return NextResponse.json({ error: "Choose at least one permission." }, { status: 400 });
    }

    await connectDB();
    const base = slugify(name, { lower: true, strict: true }) || "role";
    if (base === DEFAULT_STAFF_ROLE_SLUG) {
      return NextResponse.json({ error: "“Staff” is the built-in role. Pick another name." }, { status: 409 });
    }
    let slug = base;
    for (let i = 2; await Role.exists({ slug }); i++) slug = `${base}-${i}`;

    const role = await Role.create({
      name,
      slug,
      description: cleanString(body.description, 300) || undefined,
      color: COLOR_RE.test(body.color) ? body.color : "#8b5cf6",
      permissions,
      isSystem: false,
      createdBy: auth.user._id,
    });
    invalidateRoleCache();
    audit(request, auth.user, {
      action: "role.create",
      summary: `Created role “${name}” with ${permissions.length} permissions`,
      entity: "Role",
      entityId: role._id.toString(),
    });
    return NextResponse.json({ ...role.toJSON(), members: 0 }, { status: 201 });
  } catch (err) {
    return serverError("Create role error", err, "Couldn't create the role.");
  }
}
