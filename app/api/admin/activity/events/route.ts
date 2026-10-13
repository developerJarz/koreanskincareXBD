import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent, ACTIVITY_TYPES } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { createdAtMatch, resolveRange } from "@/server/admin/range";
import { escapeRegex, isObjectId } from "@/server/security/validation";

/**
 * GET — Raw activity log, newest first.
 * ?range= &type= &q= (page, product, search term, name, email, IP) &visitor= &session= &user=
 * &device= &country= &page= &pageSize=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "activity.view");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const range = resolveRange(sp, "7d");
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const pageSize = Math.min(100, Math.max(10, Math.floor(Number(sp.get("pageSize")) || 50)));

    const filter: Record<string, unknown> = { ...createdAtMatch(range) };
    const type = sp.get("type");
    if (type && (ACTIVITY_TYPES as readonly string[]).includes(type)) filter.type = type;
    const visitor = sp.get("visitor");
    if (visitor && /^[A-Za-z0-9_-]{4,64}$/.test(visitor)) filter.visitorId = visitor;
    const session = sp.get("session");
    if (session && /^[A-Za-z0-9_-]{4,64}$/.test(session)) filter.sessionId = session;
    const user = sp.get("user");
    if (isObjectId(user)) filter.user = user;
    const device = sp.get("device");
    if (device === "mobile" || device === "tablet" || device === "desktop") filter.device = device;
    const country = sp.get("country");
    if (country && /^[A-Za-z]{2}$/.test(country)) filter.country = country.toUpperCase();

    const q = sp.get("q")?.trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { path: rx },
        { title: rx },
        { productName: rx },
        { searchTerm: rx },
        { userName: rx },
        { userEmail: rx },
        { ip: rx },
        { orderNumber: rx },
        { label: rx },
        { referrerHost: rx },
      ];
    }

    await connectDB();
    const [items, total] = await Promise.all([
      ActivityEvent.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("-expiresAt -__v")
        .lean(),
      ActivityEvent.countDocuments(filter),
    ]);

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return serverError("Activity events error", err, "Couldn't load the activity log.");
  }
}
