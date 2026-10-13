"use client";

import { useEffect, useState } from "react";

import { FALLBACK_CHECKOUT_CONFIG, type CheckoutConfig } from "@/lib/checkout";
import { useCartStore } from "@/store/cart.store";

/**
 * Delivery charges and payment methods from admin Settings. Fetched once per page load and
 * shared by every component that asks (cart drawer, cart page, checkout).
 */
let configPromise: Promise<CheckoutConfig> | null = null;

function loadConfig(): Promise<CheckoutConfig> {
  configPromise ??= fetch("/api/checkout-config")
    .then((r) => (r.ok ? r.json() : FALLBACK_CHECKOUT_CONFIG))
    .catch(() => {
      configPromise = null;
      return FALLBACK_CHECKOUT_CONFIG;
    });
  return configPromise;
}

export function useCheckoutConfig(): CheckoutConfig {
  const [config, setConfig] = useState<CheckoutConfig>(FALLBACK_CHECKOUT_CONFIG);
  useEffect(() => {
    let alive = true;
    loadConfig().then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}

export type CouponCheck = { code: string; discount: number; freeShipping: boolean };

export async function checkCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  const res = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "This coupon code isn't valid.");
  return data as CouponCheck;
}

/**
 * Keeps an applied coupon correct as the cart changes: the discount is recalculated by the
 * server for the current subtotal, and the coupon is removed if it no longer applies.
 * Returns whether the coupon gives free delivery and the last error (if it was removed).
 */
export function useAppliedCoupon(subtotal: number) {
  const couponCode = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const [freeShipping, setFreeShipping] = useState(false);
  const [removedReason, setRemovedReason] = useState<string | null>(null);

  useEffect(() => {
    if (!couponCode) {
      setFreeShipping(false);
      return;
    }
    let alive = true;
    const timer = setTimeout(() => {
      checkCoupon(couponCode, subtotal)
        .then((result) => {
          if (!alive) return;
          setCoupon(result.code, result.discount);
          setFreeShipping(result.freeShipping);
        })
        .catch((err: Error) => {
          if (!alive) return;
          removeCoupon();
          setFreeShipping(false);
          setRemovedReason(err.message);
        });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [couponCode, subtotal, setCoupon, removeCoupon]);

  return { freeShipping, removedReason };
}
