import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { connectDB } from "@/server/db/connection";
import { User, type UserDocument } from "@/server/db/models";
import { isObjectId } from "@/server/security/validation";
import type { AuthUser, UserRole } from "@/types";

/**
 * Server-side sessions.
 *
 * After login the server sets a signed JWT in an HttpOnly cookie. Every protected
 * request re-loads the user from MongoDB, so role changes, deactivation and
 * password changes (which bump `sessionVersion`) take effect immediately.
 * The role stored in the browser (zustand) is only used for UI — never trusted.
 */

export const SESSION_COOKIE = "ksb_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ISSUER = "koreanskincare.bd";

export const STAFF_ROLES: UserRole[] = ["super_admin", "admin", "staff"];
export const ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
export const SUPER_ADMIN_ROLES: UserRole[] = ["super_admin"];
export const VENDOR_ROLES: UserRole[] = ["vendor"];

const ROLE_RANK: Record<UserRole, number> = {
  customer: 0,
  vendor: 0,
  staff: 1,
  admin: 2,
  super_admin: 3,
};

export function roleRank(role: UserRole | undefined): number {
  return role ? (ROLE_RANK[role] ?? 0) : 0;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  return secret;
}

export function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    emailVerified: Boolean(user.emailVerified),
  };
}

export function setSessionCookie(response: NextResponse, user: UserDocument) {
  const token = jwt.sign({ sv: user.sessionVersion ?? 0 }, getSecret(), {
    algorithm: "HS256",
    subject: user._id.toString(),
    issuer: ISSUER,
    expiresIn: SESSION_TTL_SECONDS,
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function loadSessionUser(token: string | undefined): Promise<UserDocument | null> {
  if (!token) return null;

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
    }) as jwt.JwtPayload;
  } catch {
    return null;
  }

  if (!isObjectId(payload.sub)) return null;

  await connectDB();
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) return null;
  if ((user.sessionVersion ?? 0) !== payload.sv) return null;
  return user;
}

/** Session user for Route Handlers. */
export function getSessionUser(request: NextRequest) {
  return loadSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
}

/** Session user for Server Components / Server Actions. */
export async function getSessionUserFromCookies() {
  const store = await cookies();
  return loadSessionUser(store.get(SESSION_COOKIE)?.value);
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF defence in depth (on top of SameSite=Lax cookies): reject state-changing
 * browser requests whose Origin is a different site.
 */
export function isCrossSiteRequest(request: NextRequest): boolean {
  if (!UNSAFE_METHODS.has(request.method)) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    try {
      return new URL(origin).host !== host;
    } catch {
      return true;
    }
  }
  return request.headers.get("sec-fetch-site") === "cross-site";
}

export type AuthResult = { ok: true; user: UserDocument } | { ok: false; response: NextResponse };

/**
 * Guard for API routes. Usage:
 *   const auth = await requireAuth(request, ADMIN_ROLES);
 *   if (!auth.ok) return auth.response;
 */
export async function requireAuth(request: NextRequest, roles?: UserRole[]): Promise<AuthResult> {
  if (isCrossSiteRequest(request)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const user = await getSessionUser(request);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Please sign in to continue." }, { status: 401 }),
    };
  }

  if (roles && !roles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You do not have permission to do this." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}

/** Logs the real error server-side and returns a generic message (no internals leaked to clients). */
export function serverError(label: string, err: unknown, message = "Something went wrong.") {
  console.error(`${label}:`, err);
  return NextResponse.json({ error: message }, { status: 500 });
}
