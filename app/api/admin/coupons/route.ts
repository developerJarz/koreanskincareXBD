import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Coupon } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError } from "@/server/auth/session";
import { cleanString, isObjectId, toNonNegativeNumber } from "@/server/security/validation";

const COUPON_TYPES = ["percentage", "fixed", "free_shipping", "first_order", "buy_x_get_y"];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(coupons)));
  } catch (err) {
    return serverError("List coupons error", err, "Failed to fetch coupons");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    const data = await request.json().catch(() => ({}));
    await connectDB();

    const code = cleanString(data.code, 40)?.toUpperCase();
    const value = toNonNegativeNumber(data.value);
    if (!code || !/^[A-Z0-9_-]+$/.test(code) || !value) {
      return NextResponse.json(
        { error: "A coupon code (letters, numbers, - or _) and a positive value are required" },
        { status: 400 },
      );
    }

    const type = COUPON_TYPES.includes(data.type) ? data.type : "percentage";
    if (type === "percentage" && value > 100) {
      return NextResponse.json({ error: "Percentage cannot exceed 100" }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code,
      type,
      value,
      minOrderAmount: toNonNegativeNumber(data.minOrderAmount) || undefined,
      maxDiscount: toNonNegativeNumber(data.maxDiscount) || undefined,
      usageLimit: toNonNegativeNumber(data.usageLimit) || undefined,
      isActive: true,
      startsAt: new Date(),
    });

    return NextResponse.json(JSON.parse(JSON.stringify(coupon)), { status: 201 });
  } catch (err) {
    return serverError("Create coupon error", err, "Failed to create coupon");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    const { id, isActive } = await request.json().catch(() => ({}));
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { isActive: Boolean(isActive) },
      { new: true },
    ).lean();
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json(JSON.parse(JSON.stringify(coupon)));
  } catch (err) {
    return serverError("Update coupon error", err, "Failed to update coupon");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!isObjectId(id)) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await connectDB();
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ message: "Coupon deleted" });
  } catch (err) {
    return serverError("Delete coupon error", err, "Failed to delete coupon");
  }
}
