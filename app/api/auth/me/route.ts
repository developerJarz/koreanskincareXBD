import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, serverError, toAuthUser } from "@/server/auth/session";

// GET — The currently signed-in user according to the server session
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    return NextResponse.json(toAuthUser(user), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError("Session lookup error", err);
  }
}
