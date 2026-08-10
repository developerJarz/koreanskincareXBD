"use client";

import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/store/ui.store";
import { useCartStore } from "@/store/cart.store";

export function CartSheet() {
  const { isCartOpen, closeCart } = useUIStore();
  const { items, updateQuantity, removeItem, getSubtotal, getItemCount } = useCartStore();

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const freeShippingThreshold = 2000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-2xl">Shopping Cart</h2>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                {getItemCount()} items
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="bg-secondary/40 p-4 border-b border-border text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-muted-foreground">
                Add{" "}
                <span className="font-medium text-foreground">
                  ৳{remainingForFreeShipping.toLocaleString()}
                </span>{" "}
                more for{" "}
                <span className="text-primary font-medium">Free Delivery inside Dhaka</span>
              </p>
            ) : (
              <p className="text-primary font-medium flex items-center gap-1">
                ✦ You unlocked Free Delivery inside Dhaka!
              </p>
            )}
            <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-serif text-xl">Your cart is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Discover our collection of premium accessories
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-xs font-medium hover:opacity-90 transition"
                >
                  Start Shopping <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variant?.sku ?? ""}`}
                  className="flex gap-4 p-4 rounded-2xl border border-border bg-background"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-24 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${encodeURIComponent(item.slug)}`}
                          onClick={closeCart}
                          className="font-medium text-sm truncate hover:text-primary transition"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId, item.variant?.sku)}
                          className="text-muted-foreground hover:text-destructive transition p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
                        {item.category}
                      </p>
                      {item.variant?.color && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Color: {item.variant.color}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded-full bg-secondary/50">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.variant?.sku)
                          }
                          className="p-1.5 hover:text-primary transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.variant?.sku)
                          }
                          className="p-1.5 hover:text-primary transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="font-serif text-sm font-semibold">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-border bg-card space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-serif text-foreground font-medium">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="w-full py-3.5 rounded-full border border-border text-center text-xs font-medium hover:bg-accent transition"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-3.5 rounded-full bg-primary text-primary-foreground text-center text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1.5"
                >
                  Checkout <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
