import bcryptjs from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";

import { connectDB } from "@/server/db/connection";
import { AuditLog, Role, User, type UserDocument } from "@/server/db/models";
import {
  getAccessProfile,
  invalidateRoleCache,
  requirePermission,
} from "@/server/auth/permissions";
import { roleRank, serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import {
  cleanString,
  generateStrongPassword,
  isEmail,
  isObjectId,
  passwordStrengthError,
} from "@/server/security/validation";
import { permissionsAfterEdit, ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/types";

/**
 * Team members: super admins, admins and moderators (role "staff").
 *
 * A moderator's permissions come from one of:
 *   - the default "Moderator" role (no customRole),
 *   - a shared role (Roles tab),
 *   - a set made just for them ("custom permissions") — a Role with `personalFor` = their id,
 *     removed automatically when they get another role or leave the team.
 */

const TEAM_ROLES: UserRole[] = ["super_admin", "admin", "staff"];

type RoleInfo = { _id: Types.ObjectId; name: string; color: string; personalFor?: Types.ObjectId };

async function serializeMember(user: any, rolesById: Map<string, RoleInfo>, lastAction?: any) {
  const id = String(user._id);
  const roleId = user.customRole ? String(user.customRole) : null;
  const role = roleId ? rolesById.get(roleId) : undefined;
  const profile = await getAccessProfile({ role: user.role, customRole: user.customRole });
  return {
    id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    customRole: role
      ? { id: String(role._id), name: role.name, color: role.color, personal: Boolean(role.personalFor) }
      : null,
    roleName: profile.roleName,
    permissions: profile.permissions,
    isActive: Boolean(user.isActive),
    emailVerified: Boolean(user.emailVerified),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt ?? null,
    lastAction: lastAction ? { summary: lastAction.summary, at: lastAction.createdAt } : null,
  };
}

async function rolesFor(users: { customRole?: unknown }[]) {
  const ids = users.map((u) => u.customRole).filter(Boolean).map(String);
  const roles = ids.length
    ? await Role.find({ _id: { $in: ids } }).select("name color personalFor").lean<RoleInfo[]>()
    : [];
  return new Map(roles.map((r) => [String(r._id), r]));
}

// GET — Everyone with access to the admin panel
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "roles.manage");
    if (!auth.ok) return auth.response;

    await connectDB();
    const members = await User.find({ role: { $in: TEAM_ROLES } }).sort({ name: 1 }).lean();
    const [rolesById, recent] = await Promise.all([
      rolesFor(members),
      AuditLog.aggregate([
        { $match: { actor: { $in: members.map((m) => m._id) } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$actor",
            summary: { $first: "$summary" },
            createdAt: { $first: "$createdAt" },
          },
        },
      ]),
    ]);
    const lastActions = new Map(recent.map((r) => [String(r._id), r]));

    const rows = await Promise.all(
      members.map((m) => serializeMember(m, rolesById, lastActions.get(String(m._id)))),
    );
    // Highest access first
    rows.sort((a, b) => roleRank(b.role) - roleRank(a.role) || a.name.localeCompare(b.name));
    return NextResponse.json({
      members: rows,
      viewerId: auth.user._id.toString(),
      viewerRole: auth.user.role,
    });
  } catch (err) {
    return serverError("List team error", err, "Couldn't load the team.");
  }
}

function canAssign(actorRole: UserRole, role: UserRole) {
  // Only a super admin can hand out admin-level access
  return actorRole === "super_admin" || roleRank(role) < roleRank(actorRole);
}

function canModify(actorRole: UserRole, target: UserDocument) {
  return actorRole === "super_admin" || roleRank(target.role) < roleRank(actorRole);
}

/** A shared role chosen in the form; null = the default Moderator role. */
async function resolveSharedRole(value: unknown) {
  if (value === null || value === "" || value === undefined) return null;
  if (!isObjectId(value)) return undefined;
  const role = await Role.findById(value).select("name isSystem personalFor").lean();
  if (!role || role.personalFor) return undefined;
  return role.isSystem ? null : role;
}

/** Creates or updates the permission set made just for this moderator. */
async function savePersonalRole(user: UserDocument, permissions: unknown, actor: UserDocument) {
  const slug = `personal-${user._id}`;
  const existing = await Role.findOne({ slug });
  const list = permissionsAfterEdit(permissions, existing?.permissions ?? [], actor.role === "super_admin");
  if (list.length === 0) throw Object.assign(new Error("no_permissions"), { status: 400 });
  if (existing) {
    existing.permissions = list;
    existing.name = `${user.name} (custom)`;
    await existing.save();
    return existing;
  }
  return Role.create({
    name: `${user.name} (custom)`,
    slug,
    description: `Permissions chosen for ${user.name}`,
    color: "#0f766e",
    permissions: list,
    isSystem: false,
    personalFor: user._id,
    createdBy: actor._id,
  });
}

async function removePersonalRole(userId: Types.ObjectId | string) {
  await Role.deleteOne({ slug: `personal-${userId}` });
}

type Access =
  | { role: "super_admin" | "admin" }
  | { role: "staff"; mode: "default" }
  | { role: "staff"; mode: "role"; roleId: string }
  | { role: "staff"; mode: "custom"; permissions: unknown };

function readAccess(body: any): Access | { error: string } {
  const role = body.role as UserRole;
  if (role === "super_admin" || role === "admin") return { role };
  if (role !== "staff") return { error: "Choose Admin or Moderator." };
  if (body.permissionMode === "custom") return { role, mode: "custom", permissions: body.permissions };
  if (body.permissionMode === "role" || (body.customRoleId && body.permissionMode !== "default")) {
    return { role, mode: "role", roleId: String(body.customRoleId ?? "") };
  }
  return { role, mode: "default" };
}

/** Applies the access level and moderator permissions to a user; returns a description. */
async function applyAccess(user: UserDocument, access: Access, actor: UserDocument): Promise<string> {
  user.role = access.role;
  if (access.role !== "staff") {
    user.customRole = undefined;
    await removePersonalRole(user._id);
    return ROLE_LABELS[access.role];
  }
  if (access.mode === "custom") {
    const personal = await savePersonalRole(user, access.permissions, actor);
    user.customRole = personal._id;
    return `Moderator with ${personal.permissions.length} custom permissions`;
  }
  await removePersonalRole(user._id);
  if (access.mode === "role") {
    const shared = await resolveSharedRole(access.roleId);
    if (shared === undefined) throw Object.assign(new Error("bad_role"), { status: 400 });
    user.customRole = shared ? shared._id : undefined;
    return `Moderator (${shared ? shared.name : "default permissions"})`;
  }
  user.customRole = undefined;
  return "Moderator (default permissions)";
}

function knownError(err: any) {
  if (err?.message === "no_permissions") {
    return NextResponse.json({ error: "Choose at least one permission." }, { status: 400 });
  }
  if (err?.message === "bad_role") {
    return NextResponse.json({ error: "That role no longer exists." }, { status: 400 });
  }
  return null;
}

async function memberResponse(userId: Types.ObjectId) {
  const fresh = await User.findById(userId).lean();
  return serializeMember(fresh, await rolesFor([fresh!]));
}

/**
 * POST — Add someone to the team.
 * { email, name?, password?, role: "admin"|"super_admin"|"staff",
 *   permissionMode?: "default"|"role"|"custom", customRoleId?, permissions? }
 * An existing customer account is promoted. Otherwise a new account is created — with the
 * password given, or a generated one that is returned once.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "roles.manage");
    if (!auth.ok) return auth.response;
    const actor = auth.user;

    const body = await request.json().catch(() => ({}));
    const email = cleanString(body.email, 254)?.toLowerCase();
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address.", fields: { email: "Enter a valid email address." } }, { status: 400 });
    }
    const access = readAccess(body);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: 400 });
    if (!canAssign(actor.role, access.role)) {
      return NextResponse.json({ error: "Only a super admin can add admins." }, { status: 403 });
    }

    await connectDB();
    let user = await User.findOne({ email });
    let temporaryPassword: string | undefined;
    let created = false;

    if (user) {
      if (user.role === "vendor") {
        return NextResponse.json(
          { error: "This is a vendor account. Use a different email for team access.", fields: { email: "This is a vendor account. Use a different email for team access." } },
          { status: 400 },
        );
      }
      if (TEAM_ROLES.includes(user.role)) {
        return NextResponse.json(
          { error: `${user.name} is already on the team — change their access in the list.`, field: "email" },
          { status: 409 },
        );
      }
    } else {
      const name = cleanString(body.name, 100);
      if (!name) {
        return NextResponse.json(
          { error: "No account uses this email yet — enter their name to create one.", fields: { name: "No account uses this email yet — enter their name to create one." }, code: "not_found" },
          { status: 404 },
        );
      }
      let password: string;
      if (typeof body.password === "string" && body.password) {
        const weak = passwordStrengthError(body.password);
        if (weak) return NextResponse.json({ error: weak, fields: { password: weak } }, { status: 400 });
        password = body.password;
      } else {
        password = temporaryPassword = generateStrongPassword();
      }
      user = new User({
        name,
        email,
        password: await bcryptjs.hash(password, 12),
        role: "customer",
        provider: "credentials",
        emailVerified: true,
      });
      await user.save();
      created = true;
    }

    let description: string;
    try {
      description = await applyAccess(user, access, actor);
    } catch (err) {
      // Don't leave a half-made account behind
      if (created) await User.deleteOne({ _id: user._id });
      const known = knownError(err);
      if (known) return known;
      throw err;
    }
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();
    invalidateRoleCache();

    audit(request, actor, {
      action: "team.add",
      summary: `${created ? "Created account for" : "Gave access to"} ${user.name} <${user.email}> as ${description}`,
      entity: "User",
      entityId: user._id.toString(),
    });

    return NextResponse.json(
      { member: await memberResponse(user._id as Types.ObjectId), temporaryPassword, created },
      { status: 201 },
    );
  } catch (err) {
    return serverError("Add team member error", err, "Couldn't add the team member.");
  }
}

/**
 * PATCH — { userId, role?, permissionMode?, customRoleId?, permissions?, isActive?, signOut? }
 * role "customer" removes someone from the team. Changing the access level signs them out.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "roles.manage");
    if (!auth.ok) return auth.response;
    const actor = auth.user;

    const body = await request.json().catch(() => ({}));
    if (!isObjectId(body.userId)) {
      return NextResponse.json({ error: "Choose a team member." }, { status: 400 });
    }
    if (actor._id.toString() === body.userId) {
      return NextResponse.json({ error: "You can't change your own access." }, { status: 400 });
    }

    await connectDB();
    const target = await User.findById(body.userId);
    if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    if (target.role === "vendor") {
      return NextResponse.json({ error: "Manage vendor accounts from the Vendors page." }, { status: 400 });
    }
    if (!canModify(actor.role, target)) {
      return NextResponse.json(
        { error: "You can't change an account with the same or a higher role." },
        { status: 403 },
      );
    }

    const changes: string[] = [];
    let signOut = false;

    if (body.role === "customer") {
      if (TEAM_ROLES.includes(target.role)) {
        target.role = "customer";
        target.customRole = undefined;
        await removePersonalRole(target._id);
        changes.push("removed from the team");
        signOut = true;
      }
    } else if (body.role !== undefined || body.permissionMode !== undefined || body.customRoleId !== undefined) {
      const access = readAccess({ ...body, role: body.role ?? target.role });
      if ("error" in access) return NextResponse.json({ error: access.error }, { status: 400 });
      if (!canAssign(actor.role, access.role)) {
        return NextResponse.json({ error: "Only a super admin can grant admin access." }, { status: 403 });
      }
      const before = target.role;
      try {
        changes.push(`access → ${await applyAccess(target, access, actor)}`);
      } catch (err) {
        const known = knownError(err);
        if (known) return known;
        throw err;
      }
      if (before !== target.role) signOut = true;
    }

    if (body.isActive !== undefined) {
      const active = Boolean(body.isActive);
      if (active !== target.isActive) {
        target.isActive = active;
        changes.push(active ? "re-activated" : "suspended");
        if (!active) signOut = true;
      }
    }

    if (body.signOut === true) {
      signOut = true;
      changes.push("signed out of every device");
    }

    if (!changes.length) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
    if (signOut) target.sessionVersion = (target.sessionVersion ?? 0) + 1;
    await target.save();
    invalidateRoleCache();

    audit(request, actor, {
      action: "team.update",
      summary: `${target.name} <${target.email}>: ${changes.join(", ")}`,
      entity: "User",
      entityId: target._id.toString(),
    });

    return NextResponse.json({ member: await memberResponse(target._id as Types.ObjectId) });
  } catch (err) {
    return serverError("Update team member error", err, "Couldn't update the team member.");
  }
}
