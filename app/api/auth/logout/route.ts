import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, getSessionUser } from "@/server/auth/session";
import { recordServerEvent } from "@/server/activity";

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request).catch(() => null);
  if (user) recordServerEvent(request, { type: "logout" }, user);

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
