import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Coupon, Order } from "@/server/db/models";
import { serverError } from "@/server/auth/session";
import { requirePermission } from "@/server/auth/permissions";
import { audit } from "@/server/audit";
import { NOT_COUNTED_STATUSES } from "@/server/admin/sales-stats";
import { cleanString, isObjectId, toNonNegativeNumber } from "@/server/security/validation";

// Types the checkout can apply (see evaluateCoupon in src/server/checkout-config.ts)
const COUPON_TYPES = ["percentage", "fixed", "free_shipping", "first_order"];

/** GET — Coupons with how they actually performed (orders, discount given, revenue). */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "marketing.manage");
    if (!auth.ok) return auth.response;

    await connectDB();
    const [coupons, usage] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $match: { couponCode: { $nin: [null, ""] }, status: { $nin: NOT_COUNTED_STATUSES } } },
        {
          $group: {
            _id: { $toUpper: "$couponCode" },
            orders: { $sum: 1 },
            discountGiven: { $sum: "$discount" },
            revenue: { $sum: "$total" },
            lastUsedAt: { $max: "$createdAt" },
          },
        },
      ]),
    ]);
    const byCode = new Map(usage.map((u) => [u._id, u]));
    return NextResponse.json(
      coupons.map((c) => {
        const u = byCode.get(c.code.toUpperCase());
        return {
          ...JSON.parse(JSON.stringify(c)),
          orders: u?.orders ?? 0,
          discountGiven: u?.discountGiven ?? 0,
          revenue: u?.revenue ?? 0,
          lastUsedAt: u?.lastUsedAt ?? null,
        };
      }),
    );
  } catch (err) {
    return serverError("List coupons error", err, "Failed to fetch coupons");
  }
}

/** POST — { code, type, value, minOrderAmount?, maxDiscount?, usageLimit?, startsAt?, expiresAt? } */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "marketing.manage");
    if (!auth.ok) return auth.response;

    const data = await request.json().catch(() => ({}));
    await connectDB();

    const code = cleanString(data.code, 40)?.toUpperCase();
    const type = COUPON_TYPES.includes(data.type) ? data.type : "percentage";
    const value = type === "free_shipping" ? 0 : toNonNegativeNumber(data.value);
    if (!code || !/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return NextResponse.json(
        { error: "Use 3–40 letters, numbers, - or _ for the code.", fields: { code: "Invalid code" } },
        { status: 400 },
      );
    }
    if (type !== "free_shipping" && !value) {
      return NextResponse.json({ error: "Enter the discount.", fields: { value: "Required" } }, { status: 400 });
    }
    if ((type === "percentage" || type === "first_order") && (value ?? 0) > 100) {
      return NextResponse.json({ error: "A percentage can't be over 100.", fields: { value: "Max 100" } }, { status: 400 });
    }
    if (await Coupon.exists({ code })) {
      return NextResponse.json({ error: `${code} already exists.`, fields: { code: "Already used" } }, { status: 409 });
    }
    const date = (v: unknown) => {
      if (typeof v !== "string" || !v) return undefined;
      const d = new Date(v.length === 10 ? `${v}T00:00:00+06:00` : v);
      return Number.isNaN(d.getTime()) ? undefined : d;
    };
    const startsAt = date(data.startsAt) ?? new Date();
    const expiresAt = date(data.expiresAt);
    if (expiresAt && expiresAt <= startsAt) {
      return NextResponse.json({ error: "The end date must be after the start.", fields: { expiresAt: "Too early" } }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code,
      type,
      value: value ?? 0,
      minOrderAmount: toNonNegativeNumber(data.minOrderAmount) || undefined,
      maxDiscount: toNonNegativeNumber(data.maxDiscount) || undefined,
      usageLimit: toNonNegativeNumber(data.usageLimit) || undefined,
      isActive: true,
      startsAt,
      expiresAt: expiresAt ? new Date(expiresAt.getTime() + 86_400_000 - 1) : undefined,
    });

    audit(request, auth.user, {
      action: "coupon.create",
      summary: `Created coupon ${code} (${type === "free_shipping" ? "free delivery" : type === "fixed" ? `৳${value} off` : `${value}% off`})`,
      entity: "Coupon",
      entityId: coupon._id.toString(),
    });
    return NextResponse.json({ ...JSON.parse(JSON.stringify(coupon)), orders: 0, discountGiven: 0, revenue: 0 }, { status: 201 });
  } catch (err) {
    return serverError("Create coupon error", err, "Failed to create coupon");
  }
}

/** PATCH — { id, isActive } */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "marketing.manage");
    if (!auth.ok) return auth.response;

    const { id, isActive } = await request.json().catch(() => ({}));
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(id, { isActive: Boolean(isActive) }, { new: true }).lean();
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    audit(request, auth.user, {
      action: "coupon.update",
      summary: `${coupon.isActive ? "Switched on" : "Switched off"} coupon ${coupon.code}`,
      entity: "Coupon",
      entityId: id,
    });
    return NextResponse.json(JSON.parse(JSON.stringify(coupon)));
  } catch (err) {
    return serverError("Update coupon error", err, "Failed to update coupon");
  }
}

/** DELETE — ?id= */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "marketing.manage");
    if (!auth.ok) return auth.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!isObjectId(id)) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await connectDB();
    const coupon = await Coupon.findByIdAndDelete(id);
    if (coupon) {
      audit(request, auth.user, { action: "coupon.delete", summary: `Deleted coupon ${coupon.code}`, entity: "Coupon", entityId: id });
    }
    return NextResponse.json({ message: "Coupon deleted" });
  } catch (err) {
    return serverError("Delete coupon error", err, "Failed to delete coupon");
  }
}
