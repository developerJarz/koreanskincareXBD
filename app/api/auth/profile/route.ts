import { NextRequest, NextResponse } from "next/server";
import { requireAuth, serverError, toAuthUser } from "@/server/auth/session";
import { cleanString, isSafeUrl } from "@/server/security/validation";

// PUT — Update the signed-in user's own profile (the user is taken from the session, never the body)
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const userDoc = auth.user;

    const body = await request.json().catch(() => ({}));
    const name = cleanString(body.name, 100);
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    userDoc.name = name;
    if (body.phone !== undefined) userDoc.phone = cleanString(body.phone, 30) ?? "";
    if (body.avatar !== undefined) {
      if (body.avatar && !isSafeUrl(body.avatar)) {
        return NextResponse.json({ error: "Avatar must be a valid image URL" }, { status: 400 });
      }
      userDoc.avatar = body.avatar || undefined;
    }
    await userDoc.save();

    return NextResponse.json(toAuthUser(userDoc));
  } catch (err) {
    return serverError("Update profile error", err, "Failed to update profile");
  }
}
