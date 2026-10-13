import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { AuditLog } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { createdAtMatch, resolveRange } from "@/server/admin/range";
import { escapeRegex, isObjectId } from "@/server/security/validation";

/** GET — Team audit log. ?range= &q= &actor=<userId> &area=order|role|team|… &page= */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "audit.view");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const range = resolveRange(sp, "30d");
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const pageSize = 30;

    const filter: Record<string, unknown> = { ...createdAtMatch(range) };
    const actor = sp.get("actor");
    if (isObjectId(actor)) filter.actor = actor;
    const area = sp.get("area");
    if (area && /^[a-z_]{2,30}$/.test(area)) filter.action = new RegExp(`^${area}\\.`);
    const q = sp.get("q")?.trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ summary: rx }, { actorName: rx }, { actorEmail: rx }, { ip: rx }, { entityId: rx }];
    }

    await connectDB();
    const [items, total, actors] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("-expiresAt -__v")
        .lean(),
      AuditLog.countDocuments(filter),
      AuditLog.aggregate([
        { $match: createdAtMatch(range) },
        { $group: { _id: "$actor", name: { $last: "$actorName" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]),
    ]);

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      actors: actors.map((a) => ({ id: String(a._id), name: a.name, count: a.count })),
    });
  } catch (err) {
    return serverError("Audit log error", err, "Couldn't load the audit log.");
  }
}
