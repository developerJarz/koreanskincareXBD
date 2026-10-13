import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { resolveRange } from "@/server/admin/range";
import { getSalesStats } from "@/server/admin/sales-stats";

/** GET — Sales figures for a date range (?range=today|7d|30d|90d|year|all|custom&from&to). */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["analytics.view", "dashboard.view"], "any");
    if (!auth.ok) return auth.response;

    await connectDB();
    const range = resolveRange(new URL(request.url).searchParams, "30d");
    return NextResponse.json(await getSalesStats(range));
  } catch (err) {
    return serverError("Sales stats error", err, "Couldn't load sales figures.");
  }
}
