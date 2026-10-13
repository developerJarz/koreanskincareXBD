/** Checkout settings shared by the order API and the cart / checkout pages. */

export const COURIER_OPTIONS = [
  "Steadfast",
  "Pathao",
  "RedX",
  "Paperfly",
  "eCourier",
  "Sundarban",
  "Own delivery",
] as const;

export type CheckoutConfig = {
  shipping: { freeShippingThreshold: number; insideDhakaCost: number; outsideDhakaCost: number };
  paymentMethods: { id: string; title: string; description: string }[];
};

export const FALLBACK_CHECKOUT_CONFIG: CheckoutConfig = {
  shipping: { freeShippingThreshold: 2000, insideDhakaCost: 70, outsideDhakaCost: 120 },
  paymentMethods: [
    { id: "COD", title: "Cash on Delivery", description: "Pay cash when receiving the parcel" },
    { id: "bKash", title: "bKash", description: "Online payment via bKash" },
    { id: "Nagad", title: "Nagad", description: "Online payment via Nagad" },
  ],
};

/** Delivery charge for an order. A free-delivery threshold of 0 turns free delivery off. */
export function shippingCostFor(
  subtotalAfterDiscount: number,
  address: { division?: string; district?: string },
  config: CheckoutConfig,
  freeShipping = false,
): number {
  const { freeShippingThreshold, insideDhakaCost, outsideDhakaCost } = config.shipping;
  if (freeShipping) return 0;
  if (freeShippingThreshold > 0 && subtotalAfterDiscount >= freeShippingThreshold) return 0;
  const isDhaka = address.division === "Dhaka" && address.district === "Dhaka";
  return isDhaka ? insideDhakaCost : outsideDhakaCost;
}
