import { createServerFn } from "@tanstack/react-start";
import { connectDB } from "@/server/db/connection";
import { Coupon } from "@/server/db/models";

export const validateCoupon = createServerFn({ method: "POST" })
  .validator(
    (data: { code: string; subtotal: number; userId?: string }) => data
  )
  .handler(async ({ data }) => {
    await connectDB();

    const coupon = await Coupon.findOne({
      code: data.code.toUpperCase(),
      isActive: true,
    }).lean();

    if (!coupon) {
      throw new Error("Invalid coupon code");
    }

    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      throw new Error("This coupon is not active yet");
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      throw new Error("This coupon has expired");
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new Error("This coupon has reached its usage limit");
    }
    if (coupon.minOrderAmount && data.subtotal < coupon.minOrderAmount) {
      throw new Error(
        `Minimum order amount is ৳${coupon.minOrderAmount.toLocaleString()}`
      );
    }

    let discount = 0;
    if (coupon.type === "percentage") {
      discount = Math.round((data.subtotal * coupon.value) / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else if (coupon.type === "fixed") {
      discount = coupon.value;
    } else if (coupon.type === "free_shipping") {
      discount = 0;
    }

    return {
      code: coupon.code,
      discount,
      type: coupon.type,
      freeShipping: coupon.type === "free_shipping",
    };
  });
