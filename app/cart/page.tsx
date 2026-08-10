"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useCartStore } from "@/store/cart.store";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    setCoupon,
    removeCoupon,
    couponCode,
    couponDiscount,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = getSubtotal();
  const estimatedShipping = subtotal >= 2000 ? 0 : 70;
  const total = Math.max(0, subtotal - couponDiscount + estimatedShipping);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    if (couponInput.trim().toUpperCase() === "NOORS10") {
      const discount = Math.round(subtotal * 0.1);
      setCoupon("NOORS10", discount);
      toast.success("Coupon NOORS10 applied! (10% OFF)");
      setCouponInput("");
    } else {
      toast.error("Invalid coupon code. Try NOORS10");
    }
  };

  if (!mounted) {
    return (
      <div className="container-x py-24 text-center">
        <p className="text-sm text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  return (
    <>
      <section className="border-b border-border bg-secondary/30">
        <div className="container-x py-12 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Your Selection</p>
          <h1 className="font-serif text-4xl lg:text-5xl mt-2">Shopping Bag</h1>
        </div>
      </section>

      <section className="container-x py-12 lg:py-16">
        {items.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-3xl">Your cart is empty</h2>
            <p className="text-sm text-muted-foreground">
              Looks like you haven't added anything to your cart yet. Explore our curated pieces!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition mt-4"
            >
              Explore Shop <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  Showing <strong className="text-foreground">{items.length}</strong> items
                </p>
                <button
                  onClick={clearCart}
                  className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const itemKey = `${item.productId}-${item.variant?.sku ?? ""}`;
                  return (
                    <div
                      key={itemKey}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 lg:p-6 rounded-3xl border border-border bg-card shadow-sm"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-24 object-cover rounded-2xl shrink-0 bg-secondary"
                        />
                        <div>
                          <p className="text-xs uppercase tracking-widest text-primary font-medium">
                            {item.category}
                          </p>
                          <h3 className="font-serif text-lg font-medium mt-0.5 truncate">{item.name}</h3>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.variant.color && `Color: ${item.variant.color}`}
                              {item.variant.size && ` | Size: ${item.variant.size}`}
                            </p>
                          )}
                          <p className="font-sans font-semibold text-sm mt-1 sm:hidden">
                            ৳{item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 border border-border rounded-full p-1 bg-background">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1, item.variant?.sku)
                            }
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1, item.variant?.sku)
                            }
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right min-w-[80px]">
                          <p className="font-sans font-bold text-base text-foreground">
                            ৳{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeItem(item.productId, item.variant?.sku)}
                          className="text-muted-foreground hover:text-destructive p-1 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border space-y-6 sticky top-24 shadow-sm">
              <h2 className="font-serif text-2xl">Order Summary</h2>

              {/* Coupon Form */}
              <div className="space-y-2">
                {couponCode ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-primary">
                      <Tag className="w-3.5 h-3.5" /> {couponCode} applied (-৳{couponDiscount})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-destructive font-medium hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code (NOORS10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium border border-border"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              <div className="space-y-3 text-sm border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-sans font-bold text-foreground">৳{subtotal.toLocaleString()}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Discount</span>
                    <span className="font-sans font-bold">-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Delivery</span>
                  <span className="font-sans font-medium text-foreground">
                    {estimatedShipping === 0 ? "FREE (Orders > ৳2,000)" : `৳${estimatedShipping}`}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
                  <span>Total</span>
                  <span className="font-sans font-bold text-primary">৳{total.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-4 rounded-full bg-primary text-primary-foreground font-medium text-sm text-center block hover:opacity-90 transition shadow-lg shadow-primary/20"
              >
                Proceed to Checkout →
              </Link>

              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Secure Checkout with bKash, Nagad or COD</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
