import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import bcryptjs from "bcryptjs";
import type { AuthUser, UserRole } from "@/types";

const DEMO_USERS: Record<string, { name: string; role: UserRole; pass: string }> = {
  "superadmin@noors.bd": { name: "Super Admin", role: "super_admin", pass: "admin123" },
  "admin@noors.bd": { name: "Noors Admin", role: "admin", pass: "admin123" },
  "staff@noors.bd": { name: "Store Staff", role: "staff", pass: "staff123" },
  "customer@noors.bd": { name: "Nusrat Jahan", role: "customer", pass: "customer123" },
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = email?.toLowerCase().trim();

    if (!cleanEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Try database login first
    try {
      await connectDB();
      const user = await User.findOne({ email: cleanEmail }).select("+password");

      if (user && user.password) {
        const isValid = await bcryptjs.compare(password, user.password);
        if (isValid) {
          user.lastLoginAt = new Date();
          await user.save();
          const authUser: AuthUser = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
          };
          return NextResponse.json(authUser);
        }
      }
    } catch (err) {
      console.warn("DB login fallback:", err);
    }

    // Demo account fallback
    const demo = DEMO_USERS[cleanEmail];
    if (demo && password === demo.pass) {
      const authUser: AuthUser = {
        id: `demo_${demo.role}`,
        name: demo.name,
        email: cleanEmail,
        role: demo.role,
        emailVerified: true,
      };
      return NextResponse.json(authUser);
    }

    return NextResponse.json(
      { error: "Invalid email or password. Try admin@noors.bd / admin123" },
      { status: 401 },
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
