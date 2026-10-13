import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent, Settings } from "@/server/db/models";
import { getAccessProfile, requirePermission } from "@/server/auth/permissions";
import { serverError, setSessionCookie } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { invalidateBlockedIps, isValidIp } from "@/server/security/ip-block";
import { getClientIp } from "@/server/security/rate-limit";

const DAY = 86_400_000;

/**
 * GET — Security overview for the signed-in team member: their recent sign-ins, and (with the
 * right permissions) failed sign-in attempts across the shop and the IP block list.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, [], "all");
    if (!auth.ok) return auth.response;
    const canSeeSiteWide = auth.permissions.includes("audit.view") || auth.permissions.includes("activity.view");
    const canManageIps = auth.permissions.includes("settings.manage");

    await connectDB();
    const since = new Date(Date.now() - 7 * DAY);
    const [myLogins, failedByIp, failedTotal, settings] = await Promise.all([
      ActivityEvent.find({ user: auth.user._id, type: { $in: ["login", "login_failed", "logout"] } })
        .sort({ createdAt: -1 })
        .limit(15)
        .select("type ip device browser os country city createdAt")
        .lean(),
      canSeeSiteWide
        ? ActivityEvent.aggregate([
            { $match: { type: "login_failed", createdAt: { $gte: since } } },
            {
              $group: {
                _id: "$ip",
                attempts: { $sum: 1 },
                emails: { $addToSet: "$label" },
                last: { $max: "$createdAt" },
                country: { $last: "$country" },
              },
            },
            { $sort: { attempts: -1 } },
            { $limit: 15 },
          ])
        : Promise.resolve([]),
      canSeeSiteWide
        ? ActivityEvent.countDocuments({ type: "login_failed", createdAt: { $gte: since } })
        : Promise.resolve(0),
      canManageIps ? Settings.findOne().select("security").lean() : Promise.resolve(null),
    ]);

    const profile = await getAccessProfile(auth.user);
    return NextResponse.json({
      me: {
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
        roleName: profile.roleName,
        permissions: profile.permissions,
        lastLoginAt: auth.user.lastLoginAt ?? null,
        currentIp: getClientIp(request),
      },
      myLogins: JSON.parse(JSON.stringify(myLogins)),
      failedLogins: canSeeSiteWide
        ? {
            total: failedTotal,
            byIp: failedByIp.map((r: any) => ({
              ip: r._id ?? "unknown",
              attempts: r.attempts,
              emails: (r.emails ?? []).filter(Boolean).slice(0, 5),
              last: r.last,
              country: r.country,
            })),
          }
        : null,
      blockedIps: canManageIps ? (settings?.security?.blockedIps ?? []) : null,
    });
  } catch (err) {
    return serverError("Security overview error", err, "Couldn't load security details.");
  }
}

/** PUT — Replace the IP block list. { blockedIps: string[] } */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "settings.manage");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.blockedIps)) {
      return NextResponse.json({ error: "Send a list of IP addresses." }, { status: 400 });
    }
    const ips = [...new Set(body.blockedIps.map((ip: unknown) => String(ip).trim()))].slice(0, 500) as string[];
    const invalid = ips.find((ip) => !isValidIp(ip));
    if (invalid) return NextResponse.json({ error: `“${invalid}” is not a valid IP address.` }, { status: 400 });
    if (ips.includes(getClientIp(request))) {
      return NextResponse.json(
        { error: "That list includes your own IP address — you would lock yourself out." },
        { status: 400 },
      );
    }

    await connectDB();
    const settings = (await Settings.findOne()) ?? new Settings({});
    const before: string[] = settings.security?.blockedIps ?? [];
    settings.security = { blockedIps: ips };
    await settings.save();
    invalidateBlockedIps();

    const added = ips.filter((ip) => !before.includes(ip));
    const removed = before.filter((ip) => !ips.includes(ip));
    audit(request, auth.user, {
      action: "security.ip_block",
      summary: [
        added.length ? `Blocked ${added.join(", ")}` : "",
        removed.length ? `Unblocked ${removed.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("; ") || "Saved the IP block list",
      entity: "Settings",
    });
    return NextResponse.json({ blockedIps: ips });
  } catch (err) {
    return serverError("IP block list error", err, "Couldn't save the IP block list.");
  }
}

/** POST — { action: "sign-out-everywhere" } ends every session of the signed-in member except this one. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, [], "all");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    if (body.action !== "sign-out-everywhere") {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const user = auth.user;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();
    audit(request, user, {
      action: "security.sign_out",
      summary: "Signed out of every other device",
      entity: "User",
      entityId: user._id.toString(),
    });

    const response = NextResponse.json({ success: true });
    // Keep this device signed in with the new session version
    setSessionCookie(response, user);
    return response;
  } catch (err) {
    return serverError("Sign out everywhere error", err, "Couldn't sign out other devices.");
  }
}
