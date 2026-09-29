"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CheckCircle2, Package, MapPin, Truck, ArrowRight, Printer, Loader2 } from "lucide-react";
import { SiteLogoLink } from "@/components/Logo";
import { optimizedImageUrl } from "@/lib/image";

export default function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { orderId } = use(params);
  const { t: accessToken } = use(searchParams);
  const resolvedOrderId = decodeURIComponent(orderId);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrder() {
      try {
        const query = accessToken ? `?t=${encodeURIComponent(accessToken)}` : "";
        const res = await fetch(`/api/orders/${encodeURIComponent(resolvedOrderId)}${query}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [resolvedOrderId, accessToken]);

  const orderNumber = order?.orderNumber ?? `NB-${resolvedOrderId.slice(-6).toUpperCase()}`;
  const paymentMethod = order?.paymentMethod ?? "COD";
  const paymentLabel =
    paymentMethod === "COD"
      ? "Cash on Delivery"
      : paymentMethod === "bKash"
        ? "bKash"
        : paymentMethod === "Nagad"
          ? "Nagad"
          : paymentMethod;

  if (loading) {
    return (
      <section className="container-x py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Loading order details...</p>
      </section>
    );
  }

  return (
    <section className="container-x py-12 lg:py-20 max-w-3xl mx-auto">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto animate-fade-up">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Order Success
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl">Thank You for Your Order!</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Your order <span className="font-mono text-foreground font-bold">{orderNumber}</span> has
          been confirmed and is currently being packed at our Banani, Dhaka studio.
        </p>
      </div>

      <div className="mt-12 bg-card p-8 rounded-3xl border border-border shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <SiteLogoLink variant="header" />
            <div className="border-l border-border pl-4">
              <p className="text-xs text-muted-foreground">Order Reference</p>
              <p className="font-mono text-lg font-bold">{orderNumber}</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-full border border-border text-xs flex items-center gap-1.5 hover:bg-accent"
          >
            <Printer className="w-3.5 h-3.5" /> Print Invoice
          </button>
        </div>

        {/* Order Items */}
        {order?.items && order.items.length > 0 && (
          <div className="space-y-3 pb-4 border-b border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Items Ordered
            </p>
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {item.productImage && (
                  <img
                    src={optimizedImageUrl(item.productImage, 120)}
                    alt={item.productName}
                    className="w-12 h-14 object-cover rounded-lg shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="font-sans font-bold text-foreground">
                  ৳{item.total?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs py-4">
          <div className="space-y-1 text-primary">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold">
              1
            </div>
            <p className="font-medium">Confirmed</p>
          </div>
          <div className="space-y-1 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              2
            </div>
            <p>Processing</p>
          </div>
          <div className="space-y-1 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              3
            </div>
            <p>Shipped</p>
          </div>
          <div className="space-y-1 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              4
            </div>
            <p>Delivered</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border text-sm">
          <div>
            <p className="font-medium mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Delivery Info
            </p>
            {order?.shippingAddress ? (
              <p className="text-muted-foreground leading-relaxed">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.streetAddress}, {order.shippingAddress.area}
                <br />
                {order.shippingAddress.district}, {order.shippingAddress.division}
                <br />
                Phone: {order.shippingAddress.phone}
              </p>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                Express Delivery via SteadFast Courier
                <br />
                Estimated delivery: <strong className="text-foreground">1-3 Business Days</strong>
              </p>
            )}
          </div>

          <div>
            <p className="font-medium mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
              <Truck className="w-3.5 h-3.5 text-primary" /> Payment Status
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Payment Method: <strong className="text-foreground">{paymentLabel}</strong>
              <br />
              {order?.total && (
                <>
                  Total:{" "}
                  <strong className="text-foreground">৳{order.total.toLocaleString()}</strong>
                  <br />
                </>
              )}
              Status:{" "}
              <span className="text-amber-600 font-medium">
                {paymentMethod === "COD" ? "Pending Delivery" : "Pending Payment"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/shop"
          className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 text-center flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
