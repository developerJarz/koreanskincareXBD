"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShieldCheck, ArrowRight, Truck, CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { BD_DIVISIONS, BD_DISTRICTS } from "@/lib/constants";
import { optimizedImageUrl } from "@/lib/image";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { useAppliedCoupon, useCheckoutConfig } from "@/hooks/use-checkout";
import { shippingCostFor } from "@/lib/checkout";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, couponCode, couponDiscount, clearCart, removeCoupon } =
    useCartStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = getSubtotal();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [division, setDivision] = useState<string>("Dhaka");
  const [district, setDistrict] = useState<string>("Dhaka");
  const [area, setArea] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Signed-in customers: start from their default saved address (My account → Addresses)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetch("/api/account/addresses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: any[]) => {
        const a = list.find((x) => x.isDefault) ?? list[0];
        if (!a || cancelled) return;
        setFullName(a.fullName);
        setPhone(a.phone);
        setDivision(a.division);
        setDistrict(a.district);
        setArea(a.area);
        setStreetAddress(a.streetAddress);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Delivery charges, payment methods and coupons all come from the admin settings in MongoDB
  const config = useCheckoutConfig();
  const { freeShipping } = useAppliedCoupon(subtotal);
  const isDhaka = division === "Dhaka" && district === "Dhaka";
  const shippingCost = shippingCostFor(
    subtotal - couponDiscount,
    { division, district },
    config,
    freeShipping,
  );
  const total = Math.max(0, subtotal - couponDiscount + shippingCost);
  const activePaymentMethod = config.paymentMethods.some((m) => m.id === paymentMethod)
    ? paymentMethod
    : (config.paymentMethods[0]?.id ?? "COD");

  const handleDivisionChange = (val: string) => {
    setDivision(val);
    const districts = BD_DISTRICTS[val] || [];
    if (districts.length > 0) setDistrict(districts[0]);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!fullName || !phone || !email || !area || !streetAddress) {
      toast.error("Please fill in all required shipping fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantSku: item.variant?.sku,
          })),
          shippingAddress: {
            fullName,
            phone,
            division,
            district,
            area,
            streetAddress,
          },
          paymentMethod: activePaymentMethod,
          couponCode: couponCode || undefined,
          deliveryNotes,
          guestEmail: email,
          guestPhone: phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field === "coupon") removeCoupon();
        throw new Error(data.error || "Failed to place order");
      }

      clearCart();
      toast.success("Order placed successfully!");
      // The access token lets this buyer (even as a guest) view the order; nobody else can
      router.push(
        `/order-confirmation/${encodeURIComponent(data.orderNumber || data._id)}?t=${encodeURIComponent(data.accessToken ?? "")}`,
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="container-x py-24 text-center">
        <p className="text-sm text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x py-24 text-center space-y-4">
        <h1 className="font-serif text-3xl">Your cart is empty</h1>
        <p className="text-sm text-muted-foreground">
          Add items to cart before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <section className="container-x py-8 sm:py-10 lg:py-16 w-full max-w-full overflow-x-hidden">
      <div className="text-center mb-8 sm:mb-10 max-w-xl mx-auto px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Order Checkout
        </p>
        <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl mt-2 tracking-tight break-words">
          Delivery & Payment
        </h1>
      </div>

      <form
        onSubmit={handleSubmitOrder}
        className="w-full max-w-full min-w-0 grid lg:grid-cols-3 gap-6 lg:gap-10 items-start"
      >
        <div className="lg:col-span-2 space-y-6 lg:space-y-8 min-w-0 w-full">
          {/* Step 1: Contact */}
          <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border space-y-4 shadow-sm min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl flex items-center gap-2.5">
              <span className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-sans font-bold flex items-center justify-center">
                1
              </span>
              <span>Contact Information</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Nusrat Jahan"
                  className="w-full max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors box-border"
                />
              </div>

              <div className="min-w-0">
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors box-border"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="text-xs text-muted-foreground block mb-1 font-medium">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors box-border"
              />
            </div>
          </div>

          {/* Step 2: Shipping */}
          <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border space-y-4 shadow-sm min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl flex items-center gap-2.5">
              <span className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-sans font-bold flex items-center justify-center">
                2
              </span>
              <span>Shipping Address</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  Division *
                </label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors box-border"
                >
                  {BD_DIVISIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  District *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors box-border"
                >
                  {(BD_DISTRICTS[division] || []).map((dst) => (
                    <option key={dst} value={dst}>
                      {dst}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  Area / Thana *
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Banani, Gulshan, Uttara"
                  className="w-full max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors box-border"
                />
              </div>

              <div className="min-w-0">
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  House / Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="House 12, Road 5, Block B"
                  className="w-full max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors box-border"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="text-xs text-muted-foreground block mb-1 font-medium">
                Delivery Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Call before arrival, gate code, preferred delivery time..."
                className="w-full max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors box-border"
              />
            </div>
          </div>

          {/* Step 3: Payment */}
          <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border space-y-4 shadow-sm min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl flex items-center gap-2.5">
              <span className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-sans font-bold flex items-center justify-center">
                3
              </span>
              <span>Payment Method</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {config.paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition flex flex-col justify-between gap-2 min-w-0 ${
                    activePaymentMethod === method.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{method.title}</span>
                    <input
                      type="radio"
                      name="payment"
                      checked={activePaymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="accent-primary shrink-0 w-4 h-4"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {method.description}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border space-y-5 lg:space-y-6 lg:sticky lg:top-24 shadow-sm min-w-0 w-full">
          <h2 className="font-serif text-xl sm:text-2xl">Order Summary</h2>

          <div className="max-h-60 overflow-y-auto space-y-3 pr-1 border-b border-border pb-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variant?.sku ?? ""}`}
                className="flex items-center gap-3 text-xs min-w-0"
              >
                <img
                  src={optimizedImageUrl(item.image, 120)}
                  alt={item.name}
                  className="w-12 h-14 object-cover rounded-lg shrink-0 border border-border/50"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-foreground">{item.name}</p>
                  <p className="text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                </div>
                <span className="font-sans font-semibold text-foreground shrink-0 tabular-nums">
                  ৳{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center gap-2 min-w-0 text-muted-foreground">
              <span className="truncate">Subtotal</span>
              <span className="font-sans font-bold text-foreground shrink-0 tabular-nums">
                ৳{subtotal.toLocaleString()}
              </span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between items-center gap-2 min-w-0 text-primary font-medium">
                <span className="truncate">Coupon ({couponCode})</span>
                <span className="font-sans font-bold shrink-0 tabular-nums">
                  -৳{couponDiscount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-2 min-w-0 text-muted-foreground">
              <span className="truncate">
                Shipping ({isDhaka ? "Inside Dhaka" : "Outside Dhaka"})
              </span>
              <span className="font-sans font-medium text-foreground shrink-0 tabular-nums">
                {shippingCost === 0 ? "FREE" : `৳${shippingCost}`}
              </span>
            </div>

            <div className="flex justify-between items-center gap-2 min-w-0 text-base sm:text-lg font-bold border-t border-border pt-3">
              <span>Total Payable</span>
              <span className="font-sans font-bold text-primary shrink-0 tabular-nums">
                ৳{total.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm sm:text-base hover:opacity-90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 min-w-0"
          >
            <span className="truncate">
              {loading ? "Processing Order..." : `Place Order — ৳${total.toLocaleString()}`}
            </span>
            {!loading && <ArrowRight className="w-4 h-4 shrink-0" />}
          </button>

          <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Guaranteed Safe Checkout</span>
          </div>
        </div>
      </form>
    </section>
  );
}
