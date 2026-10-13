import { NextResponse, type NextRequest } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Role, type UserDocument } from "@/server/db/models";
import { requireAuth, STAFF_ROLES } from "@/server/auth/session";
import { isIpBlocked } from "@/server/security/ip-block";
import { getClientIp } from "@/server/security/rate-limit";
import {
  ALL_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  sanitizePermissions,
  type Permission,
} from "@/lib/permissions";

/**
 * Role-based access for the admin panel.
 *
 * super_admin / admin → every permission. staff → their custom role's permissions, or the
 * built-in "Staff" role (slug "staff"). Role documents are cached briefly per server process;
 * every write through the roles API clears the cache, so changes apply on the next request.
 */

export const DEFAULT_STAFF_ROLE_SLUG = "staff";
const CACHE_MS = 30_000;

type CachedRole = { permissions: Permission[]; name: string; at: number };

declare global {
  // eslint-disable-next-line no-var
  var roleCache: Map<string, CachedRole> | undefined;
}

const cache: Map<string, CachedRole> = global.roleCache ?? new Map();
if (!global.roleCache) global.roleCache = cache;

export function invalidateRoleCache() {
  cache.clear();
}

/** Creates the editable default "Staff" role the first time it is needed. */
export async function ensureDefaultStaffRole() {
  await connectDB();
  const existing = await Role.findOne({ slug: DEFAULT_STAFF_ROLE_SLUG }).lean();
  if (existing) {
    // Older installs named the default role "Staff"; the team now calls it "Moderator"
    if (existing.name === "Staff") {
      await Role.updateOne({ _id: existing._id }, { $set: { name: "Moderator" } });
      return { ...existing, name: "Moderator" };
    }
    return existing;
  }
  try {
    const created = await Role.create({
      name: "Moderator",
      slug: DEFAULT_STAFF_ROLE_SLUG,
      description: "Default access for moderators without their own role",
      color: "#d97706",
      permissions: DEFAULT_STAFF_PERMISSIONS,
      isSystem: true,
    });
    return created.toObject();
  } catch {
    // Created by a parallel request (unique slug)
    return Role.findOne({ slug: DEFAULT_STAFF_ROLE_SLUG }).lean();
  }
}

async function loadRole(key: string): Promise<CachedRole | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;

  await connectDB();
  const doc =
    key === DEFAULT_STAFF_ROLE_SLUG
      ? await ensureDefaultStaffRole()
      : await Role.findById(key).select("name permissions").lean();
  if (!doc) return null;

  const entry: CachedRole = {
    name: doc.name,
    // Sensitive permissions are kept here: only a super admin can have saved them
    permissions: sanitizePermissions(doc.permissions, true),
    at: Date.now(),
  };
  cache.set(key, entry);
  return entry;
}

export type AccessProfile = {
  permissions: Permission[];
  /** Shown in the admin header, e.g. "Admin" or "Order desk" */
  roleName: string;
};

/** Effective permissions of a signed-in user. Customers and vendors have none. */
export async function getAccessProfile(
  user: Pick<UserDocument, "role" | "customRole">,
): Promise<AccessProfile> {
  if (user.role === "super_admin") return { permissions: ALL_PERMISSIONS, roleName: "Super admin" };
  if (user.role === "admin") return { permissions: ALL_PERMISSIONS, roleName: "Admin" };
  if (user.role !== "staff") return { permissions: [], roleName: "" };

  const customId = user.customRole ? String(user.customRole) : null;
  const role =
    (customId ? await loadRole(customId) : null) ?? (await loadRole(DEFAULT_STAFF_ROLE_SLUG));
  return {
    permissions: role?.permissions ?? DEFAULT_STAFF_PERMISSIONS,
    roleName: role?.name ?? "Moderator",
  };
}

export type PermissionAuthResult =
  | { ok: true; user: UserDocument; permissions: Permission[] }
  | { ok: false; response: NextResponse };

/**
 * Guard for admin API routes. Pass one permission, or several with `mode`:
 *   const auth = await requirePermission(request, "orders.manage");
 *   const auth = await requirePermission(request, ["catalog.manage", "inventory.manage"], "any");
 */
export async function requirePermission(
  request: NextRequest,
  needed: Permission | Permission[],
  mode: "all" | "any" = "all",
): Promise<PermissionAuthResult> {
  const auth = await requireAuth(request, STAFF_ROLES);
  if (!auth.ok) return auth;

  if (await isIpBlocked(getClientIp(request))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Access from your network has been blocked." },
        { status: 403 },
      ),
    };
  }

  const { permissions } = await getAccessProfile(auth.user);
  const list = Array.isArray(needed) ? needed : [needed];
  const allowed =
    mode === "any"
      ? list.some((p) => permissions.includes(p))
      : list.every((p) => permissions.includes(p));

  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your role does not have permission to do this." },
        { status: 403 },
      ),
    };
  }
  return { ok: true, user: auth.user, permissions };
}
