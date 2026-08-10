import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Coupon } from "@/server/db/models";

export async function GET() {
  try {
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(coupons)));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await connectDB();

    if (!data.code || !data.value) {
      return NextResponse.json({ error: "Coupon code and value are required" }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code: data.code.toUpperCase().trim(),
      type: data.type || "percentage",
      value: Number(data.value),
      minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : undefined,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      isActive: true,
      startsAt: new Date(),
    });

    return NextResponse.json(JSON.parse(JSON.stringify(coupon)), { status: 201 });
  } catch (err: any) {
    console.error("Create coupon error:", err);
    return NextResponse.json({ error: err.message || "Failed to create coupon" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, isActive } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(id, { isActive: Boolean(isActive) }, { new: true }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(coupon)));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await connectDB();
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ message: "Coupon deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete coupon" }, { status: 500 });
  }
}
