import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";

export async function PATCH(request: NextRequest) {
  try {
    const { userId, role, isActive } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectDB();
    const updates: Record<string, any> = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(user)));
  } catch (err: any) {
    console.error("Update user role error:", err);
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}
