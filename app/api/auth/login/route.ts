import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import bcryptjs from "bcryptjs";
import type { AuthUser, UserRole } from "@/types";

const DEMO_USERS: Record<string, { name: string; role: UserRole; pass: string }> = {
  "superadmin@koreanskincare.bd": {
    name: "koreanskincare.bd Super Admin",
    role: "super_admin",
    pass: "Shajgoj#SuperAdmin!2026$X9",
  },
  "admin@koreanskincare.bd": {
    name: "koreanskincare.bd Admin",
    role: "admin",
    pass: "Shajgoj#Admin!9982*Secure",
  },
  "staff@koreanskincare.bd": { name: "Store Staff", role: "staff", pass: "Staff#Mod@Shajgoj8821$" },
  "customer@koreanskincare.bd": {
    name: "Nusrat Jahan",
    role: "customer",
    pass: "Customer#Lux!Nusrat2026@",
  },
  "superadmin@shajgoj.bd": {
    name: "Super Admin",
    role: "super_admin",
    pass: "Shajgoj#SuperAdmin!2026$X9",
  },
  "admin@shajgoj.bd": { name: "Admin User", role: "admin", pass: "Shajgoj#Admin!9982*Secure" },
  "staff@shajgoj.bd": { name: "Store Staff", role: "staff", pass: "Staff#Mod@Shajgoj8821$" },
  "customer@shajgoj.bd": {
    name: "Nusrat Jahan",
    role: "customer",
    pass: "Customer#Lux!Nusrat2026@",
  },
  "ayesha@example.com": { name: "Ayesha Rahman", role: "customer", pass: "Ayesha#Luxe2026!Bd" },
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

    // Fallback account authentication
    const demo = DEMO_USERS[cleanEmail];
    if (demo && password === demo.pass) {
      const authUser: AuthUser = {
        id: `user_${demo.role}`,
        name: demo.name,
        email: cleanEmail,
        role: demo.role,
        emailVerified: true,
      };
      return NextResponse.json(authUser);
    }

    return NextResponse.json(
      { error: "Invalid email or password. Please check your credentials and try again." },
      { status: 401 },
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
