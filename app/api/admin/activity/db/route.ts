import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { checkDatabase, collectionStats } from "@/server/admin/db-status";
import { getActivitySettings } from "@/server/activity";

const DAY = 86_400_000;

async function storageReport() {
  const now = Date.now();
  const [stats, oldest, newest, byType, olderThan7, olderThan30, olderThan90, indexes, settings] =
    await Promise.all([
      collectionStats(["activity_events"]),
      ActivityEvent.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
      ActivityEvent.findOne().sort({ createdAt: -1 }).select("createdAt").lean(),
      ActivityEvent.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      ActivityEvent.countDocuments({ createdAt: { $lt: new Date(now - 7 * DAY) } }),
      ActivityEvent.countDocuments({ createdAt: { $lt: new Date(now - 30 * DAY) } }),
      ActivityEvent.countDocuments({ createdAt: { $lt: new Date(now - 90 * DAY) } }),
      ActivityEvent.collection.indexes().catch(() => []),
      getActivitySettings(),
    ]);

  const ttl = (indexes as any[]).find((i) => i.key?.expiresAt === 1 && "expireAfterSeconds" in i);
  const collection = stats[0];
  return {
    settings,
    collection: collection ?? {
      name: "activity_events",
      documents: 0,
      sizeBytes: 0,
      storageBytes: 0,
      indexBytes: 0,
    },
    oldest: oldest?.createdAt ?? null,
    newest: newest?.createdAt ?? null,
    byType: byType.map((t) => ({ type: t._id, count: t.count })),
    age: { olderThan7, olderThan30, olderThan90 },
    autoDelete: {
      indexReady: Boolean(ttl),
      description: !ttl
        ? "The automatic-delete index is missing. Use “Repair indexes” to create it."
        : settings.retentionDays === 0
          ? "Kept forever: new activity is never deleted automatically. Use “Delete activity data now” to clear old records."
          : `MongoDB deletes each record automatically ${settings.retentionDays} days after it was recorded (checked about every minute).`
    },
  };
}

// GET — Database connection and activity storage report
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "activity.view");
    if (!auth.ok) return auth.response;

    const status = await checkDatabase();
    if (!status.connected) return NextResponse.json({ status, storage: null });
    return NextResponse.json({ status, storage: await storageReport() });
  } catch (err) {
    return serverError("Activity DB status error", err, "Couldn't check the database.");
  }
}

/**
 * POST — { action: "connect" }  open / test the database connection
 *        { action: "repair" }   create missing indexes (incl. the automatic-delete one)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const auth = await requirePermission(
      request,
      body.action === "repair" ? "activity.manage" : "activity.view",
    );
    if (!auth.ok) return auth.response;

    if (body.action === "repair") {
      await connectDB();
      await ActivityEvent.createIndexes();
      audit(request, auth.user, {
        action: "activity.indexes",
        summary: "Repaired the site activity database indexes",
        entity: "ActivityEvent",
      });
    } else if (body.action !== "connect") {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const status = await checkDatabase();
    return NextResponse.json({
      status,
      storage: status.connected ? await storageReport() : null,
    });
  } catch (err) {
    return serverError("Activity DB action error", err, "Couldn't complete the database action.");
  }
}
