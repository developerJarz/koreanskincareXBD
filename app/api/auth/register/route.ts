import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import bcryptjs from "bcryptjs";
import type { AuthUser } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "customer",
      provider: "credentials",
    });

    const authUser: AuthUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: false,
    };

    return NextResponse.json(authUser, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
