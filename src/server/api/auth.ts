import { createServerFn } from "@tanstack/react-start";
import { connectDB } from "@/server/db/connection";
import { User } from "@/server/db/models";
import bcryptjs from "bcryptjs";
import type { UserRole } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
}

// ─── Register ───
export const registerUser = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; password: string }) => data)
  .handler(async ({ data }) => {
    await connectDB();

    // Check if user exists
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error("An account with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(data.password, 12);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: "customer",
      provider: "credentials",
    });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    } satisfies AuthUser;
  });

// ─── Login ───
export const loginUser = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    await connectDB();

    const user = await User.findOne({
      email: data.email.toLowerCase(),
    }).select("+password");

    if (!user || !user.password) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcryptjs.compare(data.password, user.password);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Your account has been deactivated");
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
    } satisfies AuthUser;
  });

// ─── Get user by ID ───
export const getUserById = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
    } satisfies AuthUser;
  });

// ─── Update profile ───
export const updateProfile = createServerFn({ method: "POST" })
  .validator((data: { userId: string; name?: string; phone?: string; avatar?: string }) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const updates: Record<string, unknown> = {};
    if (data.name) updates.name = data.name;
    if (data.phone) updates.phone = data.phone;
    if (data.avatar) updates.avatar = data.avatar;

    const user = await User.findByIdAndUpdate(data.userId, updates, {
      new: true,
    }).lean();

    if (!user) throw new Error("User not found");

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
    } satisfies AuthUser;
  });

// ─── Change password ───
export const changePassword = createServerFn({ method: "POST" })
  .validator((data: { userId: string; currentPassword: string; newPassword: string }) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const user = await User.findById(data.userId).select("+password");
    if (!user || !user.password) {
      throw new Error("User not found");
    }

    const isValid = await bcryptjs.compare(data.currentPassword, user.password);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    user.password = await bcryptjs.hash(data.newPassword, 12);
    await user.save();

    return { success: true };
  });

// ─── Admin: Get all users ───
export const getAllUsers = createServerFn({ method: "GET" })
  .validator((data: { role?: UserRole; page?: number; pageSize?: number; search?: string }) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const { role, page = 1, pageSize = 20, search } = data;
    const skip = (page - 1) * pageSize;

    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      User.countDocuments(query),
    ]);

    return {
      items: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        emailVerified: u.emailVerified,
        isActive: u.isActive,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });
