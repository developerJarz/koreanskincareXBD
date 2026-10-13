import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";

const ID_RE = /^[A-Za-z0-9_-]{4,64}$/;

/**
 * GET — Full trace of one visit: every event in order, with the visitor's other recent visits.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission(request, "activity.view");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!ID_RE.test(id)) {
      return NextResponse.json({ error: "Visit not found." }, { status: 404 });
    }

    await connectDB();
    const events = await ActivityEvent.find({ sessionId: id })
      .sort({ createdAt: 1 })
      .limit(1000)
      .select("-expiresAt -__v")
      .lean();
    if (!events.length) {
      return NextResponse.json({ error: "Visit not found." }, { status: 404 });
    }

    const visitorId = events[0].visitorId;
    const otherVisits = await ActivityEvent.aggregate([
      { $match: { visitorId, sessionId: { $ne: id } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$sessionId",
          start: { $first: "$createdAt" },
          end: { $last: "$createdAt" },
          pageViews: { $sum: { $cond: [{ $eq: ["$type", "page_view"] }, 1, 0] } },
          purchases: { $sum: { $cond: [{ $eq: ["$type", "purchase"] }, 1, 0] } },
          landing: { $first: "$path" },
        },
      },
      { $sort: { start: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      sessionId: id,
      visitorId,
      events: JSON.parse(JSON.stringify(events)),
      otherVisits: otherVisits.map((v) => ({ ...v, sessionId: v._id, _id: undefined })),
    });
  } catch (err) {
    return serverError("Activity trace error", err, "Couldn't load this visit.");
  }
}
