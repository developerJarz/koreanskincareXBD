import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent, Settings } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import {
  getActivitySettings,
  invalidateActivitySettings,
  KEEP_FOREVER,
  MAX_RETENTION_DAYS,
  MIN_RETENTION_DAYS,
  normalizeActivitySettings,
} from "@/server/activity";

// GET — Tracking and retention settings
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "activity.view");
    if (!auth.ok) return auth.response;
    invalidateActivitySettings();
    return NextResponse.json(await getActivitySettings());
  } catch (err) {
    return serverError("Activity settings error", err, "Couldn't load activity settings.");
  }
}

const describeRetention = (days: number) => (days === KEEP_FOREVER ? "forever" : `${days} days`);

/**
 * PUT — Save tracking settings. `retentionDays: 0` keeps activity forever.
 * With `applyToExisting: true` the choice also applies to activity already stored:
 *   - N days: anything older is deleted now and every remaining record gets a new delete date
 *   - forever: stored records lose their delete date, so MongoDB never removes them
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "activity.manage");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const days = Math.round(Number(body.retentionDays));
    if (
      body.retentionDays === null ||
      !Number.isFinite(days) ||
      days < MIN_RETENTION_DAYS ||
      days > MAX_RETENTION_DAYS
    ) {
      return NextResponse.json(
        { error: `Keep activity for 1 to ${MAX_RETENTION_DAYS} days, or choose “Keep forever”.` },
        { status: 400 },
      );
    }
    const next = normalizeActivitySettings({ ...body, retentionDays: days });

    await connectDB();
    const settings = (await Settings.findOne()) ?? new Settings({});
    const before = normalizeActivitySettings(settings.activityTracking);
    settings.activityTracking = next;
    await settings.save();
    invalidateActivitySettings();

    let deleted = 0;
    let rescheduled = 0;
    if (body.applyToExisting) {
      try {
        if (days === KEEP_FOREVER) {
          rescheduled = (
            await ActivityEvent.updateMany(
              { expiresAt: { $exists: true } },
              { $unset: { expiresAt: 1 } },
            )
          ).modifiedCount;
        } else {
          const cutoff = new Date(Date.now() - days * 86_400_000);
          deleted = (await ActivityEvent.deleteMany({ createdAt: { $lt: cutoff } })).deletedCount;
          // Update pipeline (computes each record's date from its own createdAt); Mongoose 9
          // only allows pipelines when asked explicitly
          rescheduled = (
            await ActivityEvent.updateMany(
              {},
              [{ $set: { expiresAt: { $add: ["$createdAt", days * 86_400_000] } } }],
              { updatePipeline: true },
            )
          ).modifiedCount;
        }
      } catch (err) {
        console.error("Apply retention to stored activity error:", err);
        return NextResponse.json(
          {
            error:
              "Settings were saved, but updating the records already stored failed. Try again, or use “Delete activity data now”.",
            settings: next,
          },
          { status: 500 },
        );
      }
    }

    const changes: string[] = [];
    if (before.enabled !== next.enabled) changes.push(next.enabled ? "turned tracking on" : "turned tracking off");
    if (before.retentionDays !== next.retentionDays)
      changes.push(
        `keep ${describeRetention(before.retentionDays)} → ${describeRetention(next.retentionDays)}`,
      );
    if (before.anonymizeIp !== next.anonymizeIp)
      changes.push(next.anonymizeIp ? "hide full IP addresses" : "store full IP addresses");
    if (before.trackStaff !== next.trackStaff)
      changes.push(next.trackStaff ? "record team visits" : "skip team visits");
    audit(request, auth.user, {
      action: "activity.settings",
      summary: `Changed activity settings${changes.length ? `: ${changes.join(", ")}` : ""}${
        body.applyToExisting ? ` (applied to stored data, ${deleted} deleted)` : ""
      }`,
      entity: "Settings",
    });

    return NextResponse.json({ settings: next, deleted, rescheduled });
  } catch (err) {
    return serverError("Activity settings error", err, "Couldn't save activity settings.");
  }
}
