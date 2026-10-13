import { revalidateTag, unstable_cache } from "next/cache";

import { connectDB } from "@/server/db/connection";
import { Coupon, Settings } from "@/server/db/models";
import type { CheckoutConfig } from "@/lib/checkout";

export { shippingCostFor, type CheckoutConfig } from "@/lib/checkout";

/**
 * What checkout needs from the admin settings: delivery charges and which payment methods are
 * switched on. Used by the order API (source of truth) and shown by the cart and checkout pages.
 */

export const CHECKOUT_CONFIG_TAG = "checkout-config";

export const PAYMENT_OPTIONS = [
  {
    id: "COD",
    title: "Cash on Delivery",
    description: "Pay cash when receiving the parcel",
    aliases: ["cod", "cash on delivery"],
    available: true,
  },
  {
    id: "bKash",
    title: "bKash",
    description: "Online payment via bKash",
    aliases: ["bkash"],
    available: true,
  },
  {
    id: "Nagad",
    title: "Nagad",
    description: "Online payment via Nagad",
    aliases: ["nagad"],
    available: true,
  },
  {
    id: "SSLCommerz",
    title: "Card / SSLCommerz",
    description: "Visa, Mastercard, Amex and more",
    aliases: ["sslcommerz", "card"],
    // There is no card-payment integration in the site yet, so it is never offered at checkout
    available: false,
  },
] as const;

export type PaymentMethodId = (typeof PAYMENT_OPTIONS)[number]["id"];

/** Switched on when the store has never saved payment settings (matches the original checkout). */
const DEFAULT_ENABLED: PaymentMethodId[] = ["COD", "bKash", "Nagad"];

export { COURIER_OPTIONS } from "@/lib/checkout";

export function paymentIdFor(name: string): PaymentMethodId | null {
  const key = name.trim().toLowerCase();
  return (
    PAYMENT_OPTIONS.find(
      (o) => o.id.toLowerCase() === key || (o.aliases as readonly string[]).includes(key),
    )?.id ?? null
  );
}

export function enabledPaymentIds(
  gateways: { name: string; enabled: boolean }[] | undefined,
): PaymentMethodId[] {
  if (!gateways?.length) return DEFAULT_ENABLED;
  const enabled = new Set<PaymentMethodId>();
  for (const g of gateways) {
    const id = paymentIdFor(g.name);
    if (id && g.enabled) enabled.add(id);
  }
  return PAYMENT_OPTIONS.filter((o) => o.available && enabled.has(o.id)).map((o) => o.id);
}

async function loadCheckoutConfig(): Promise<CheckoutConfig> {
  try {
    await connectDB();
    const s = await Settings.findOne().select("shipping paymentGateways").lean();
    const ids = enabledPaymentIds(s?.paymentGateways);
    return {
      shipping: {
        freeShippingThreshold: s?.shipping?.freeShippingThreshold ?? 2000,
        insideDhakaCost: s?.shipping?.insideDhakaCost ?? 70,
        outsideDhakaCost: s?.shipping?.outsideDhakaCost ?? 120,
      },
      // Never leave checkout without a way to pay
      paymentMethods: PAYMENT_OPTIONS.filter((o) =>
        (ids.length ? ids : ["COD"]).includes(o.id),
      ).map(({ id, title, description }) => ({ id, title, description })),
    };
  } catch (err) {
    console.error("Checkout config load error:", err);
    return {
      shipping: { freeShippingThreshold: 2000, insideDhakaCost: 70, outsideDhakaCost: 120 },
      paymentMethods: PAYMENT_OPTIONS.filter((o) => DEFAULT_ENABLED.includes(o.id)).map(
        ({ id, title, description }) => ({ id, title, description }),
      ),
    };
  }
}

/** Cached; refreshed as soon as an admin saves delivery charges or payment methods. */
export const getCheckoutConfig = unstable_cache(loadCheckoutConfig, ["checkout-config-v2"], {
  tags: [CHECKOUT_CONFIG_TAG],
  revalidate: 600,
});

export function revalidateCheckoutConfig() {
  revalidateTag(CHECKOUT_CONFIG_TAG);
}

export type CouponResult =
  | {
      ok: true;
      code: string;
      discount: number;
      freeShipping: boolean;
      couponId: string;
      type: string;
    }
  | { ok: false; error: string };

/** Checks a coupon against the Promotions list and works out the discount for this subtotal. */
export async function evaluateCoupon(rawCode: string, subtotal: number): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase().slice(0, 40);
  if (!code) return { ok: false, error: "Enter a coupon code." };
  await connectDB();
  const coupon = await Coupon.findOne({ code, isActive: true }).lean();
  if (!coupon) return { ok: false, error: "This coupon code isn't valid." };

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now)
    return { ok: false, error: "This coupon isn't active yet." };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now)
    return { ok: false, error: "This coupon has expired." };
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, error: "This coupon has been fully used." };
  }
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return {
      ok: false,
      error: `Spend at least ৳${coupon.minOrderAmount.toLocaleString("en-US")} to use this coupon.`,
    };
  }

  let discount = 0;
  let freeShipping = false;
  switch (coupon.type) {
    case "percentage":
    case "first_order":
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      break;
    case "fixed":
      discount = coupon.value;
      break;
    case "free_shipping":
      freeShipping = true;
      break;
    default:
      return { ok: false, error: "This coupon can't be used online." };
  }
  return {
    ok: true,
    code: coupon.code,
    discount: Math.min(Math.max(0, discount), subtotal),
    freeShipping,
    couponId: String(coupon._id),
    type: coupon.type,
  };
}
