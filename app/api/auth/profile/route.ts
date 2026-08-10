import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import type { AuthUser } from "@/types";

export async function PUT(request: NextRequest) {
  try {
    const { userId, name, phone, avatar } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await connectDB();

    let userDoc: any = null;

    // Try finding by MongoDB _id or email
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      userDoc = await User.findById(userId);
    }

    if (!userDoc && userId?.includes("@")) {
      userDoc = await User.findOne({ email: userId.toLowerCase().trim() });
    }

    if (userDoc) {
      if (name) userDoc.name = name.trim();
      if (phone !== undefined) userDoc.phone = phone.trim();
      if (avatar !== undefined) userDoc.avatar = avatar;
      await userDoc.save();

      const authUser: AuthUser = {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        phone: userDoc.phone,
        avatar: userDoc.avatar,
        emailVerified: userDoc.emailVerified,
      };

      return NextResponse.json(authUser);
    }

    // If it's a demo account or custom ID, return updated client object
    return NextResponse.json({
      id: userId || `user_${Date.now()}`,
      name: name.trim(),
      phone: phone?.trim(),
      avatar,
      message: "Profile updated",
    });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
