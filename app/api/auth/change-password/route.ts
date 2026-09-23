import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import bcryptjs from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, currentPassword, newPassword } = await request.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    if (!userId && !email) {
      return NextResponse.json({ error: "User ID or email is required." }, { status: 400 });
    }

    await connectDB();

    let userDoc: any = null;
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      userDoc = await User.findById(userId).select("+password");
    }

    if (!userDoc && (email || (userId && userId.includes("@")))) {
      const searchEmail = (email || userId).toLowerCase().trim();
      userDoc = await User.findOne({ email: searchEmail }).select("+password");
    }

    if (!userDoc) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // Verify current password if provided
    if (currentPassword && userDoc.password) {
      const isMatch = await bcryptjs.compare(currentPassword, userDoc.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "The current password you entered is incorrect." },
          { status: 400 },
        );
      }
    }

    // Hash new password and update
    const hashed = await bcryptjs.hash(newPassword.trim(), 12);
    userDoc.password = hashed;
    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: `Password updated successfully for ${userDoc.name || userDoc.email}!`,
    });
  } catch (err: any) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update password." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
