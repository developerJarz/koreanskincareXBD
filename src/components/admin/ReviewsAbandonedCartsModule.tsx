"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Star,
  ShoppingBag,
  Heart,
  Send,
  CheckCircle,
  XCircle,
  MessageCircle,
  Flame,
  Search,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { AbandonedCart } from "./types";

export function ReviewsAbandonedCartsModule() {
  const [activeSubTab, setActiveSubTab] = useState<"reviews" | "abandoned" | "wishlist">("abandoned");

  const [reviews, setReviews] = useState([
    {
      id: "rev_1",
      customerName: "Mehzabin A.",
      productName: "Blush Mini Crossbody Bag",
      rating: 5,
      comment: "Ordered for my sister's birthday and she was thrilled! Packaging felt like an international luxury house.",
      status: "approved",
      date: "3 days ago",
      adminReply: "Thank you Mehzabin! We are delighted she loved the signature packaging. ✨",
    },
    {
      id: "rev_2",
      customerName: "Nusrat K.",
      productName: "Rosé Crystal Band Ring",
      rating: 5,
      comment: "Superb finishing and fast COD delivery in Chattogram. The rider allowed me to verify before payment.",
      status: "approved",
      date: "1 week ago",
      adminReply: "",
    },
    {
      id: "rev_3",
      customerName: "Sharmin S.",
      productName: "Noir Quilted Flap Bag",
      rating: 4,
      comment: "Great quality, but would love a slightly longer strap option for tall wearers.",
      status: "pending",
      date: "Just now",
      adminReply: "",
    },
  ]);

  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([
    {
      id: "ab_1",
      customerName: "Farzana Yasmin",
      customerPhone: "+880 1711-334455",
      customerEmail: "farzana@gmail.com",
      items: [{ name: "Noir Quilted Flap Bag", price: 4890, quantity: 1 }],
      total: 4890,
      abandonedAt: "35 mins ago",
      recoveryStatus: "uncontacted",
    },
    {
      id: "ab_2",
      customerName: "Tanzir Islam",
      customerPhone: "+880 1819-778899",
      customerEmail: "tanzir@yahoo.com",
      items: [
        { name: "Rosé Crystal Band Ring", price: 1290, quantity: 1 },
        { name: "Gold Pavé Ring Stack", price: 1890, quantity: 1 },
      ],
      total: 3180,
      abandonedAt: "2 hours ago",
      recoveryStatus: "whatsapp_sent",
    },
  ]);

  const handleSendRecoveryOffer = (cart: AbandonedCart, channel: "whatsapp" | "sms") => {
    setAbandonedCarts((prev) =>
      prev.map((c) =>
        c.id === cart.id
          ? { ...c, recoveryStatus: channel === "whatsapp" ? "whatsapp_sent" : "sms_sent" }
          : c
      )
    );
    toast.success(`10% OFF Recovery offer sent to ${cart.customerName} via ${channel.toUpperCase()}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold">Reviews & Abandoned Cart Recovery</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Customer reviews moderation, automated cart recovery & wishlist demand analytics
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-secondary p-1 rounded-2xl border border-border text-xs">
          <button
            onClick={() => setActiveSubTab("abandoned")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === "abandoned" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
            }`}
          >
            Abandoned Carts ({abandonedCarts.length})
          </button>
          <button
            onClick={() => setActiveSubTab("reviews")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === "reviews" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
            }`}
          >
            Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveSubTab("wishlist")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === "wishlist" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
            }`}
          >
            Wishlist Leaderboard
          </button>
        </div>
      </div>

      {/* 1. Abandoned Carts Subview */}
      {activeSubTab === "abandoned" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Unfinished Checkouts</h3>
            <span className="text-xs text-rose-600 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              Potential Recoverable Revenue: ৳8,070
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {abandonedCarts.map((cart) => (
              <div
                key={cart.id}
                className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{cart.customerName}</span>
                    <span className="text-[11px] text-muted-foreground">({cart.customerPhone})</span>
                    <span className="text-[10px] text-muted-foreground">· Abandoned {cart.abandonedAt}</span>
                  </div>
                  <p className="text-muted-foreground">
                    Items: {cart.items.map((it) => `${it.name} (x${it.quantity})`).join(", ")}
                  </p>
                  <div className="text-primary font-bold">Cart Value: ৳{cart.total.toLocaleString()}</div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${cart.customerPhone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(cart.customerName)}%2C%20we%20noticed%20you%20left%20items%20in%20your%20Shajgoj.bd%20cart!%20Enjoy%20an%20exclusive%2010%25%20OFF%20with%20code%20RECOVER10%3A%20https%3A%2F%2Fshajgoj.bd%2Fcart`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleSendRecoveryOffer(cart, "whatsapp")}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:opacity-90 transition flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp 10% Recovery</span>
                  </a>

                  <button
                    onClick={() => handleSendRecoveryOffer(cart, "sms")}
                    className="px-3 py-2 rounded-xl border border-border hover:bg-secondary font-semibold transition"
                  >
                    Send SMS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Reviews Moderation Subview */}
      {activeSubTab === "reviews" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-serif font-bold text-lg">Product Reviews & Ratings</h3>
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{rev.customerName}</span>
                    <span className="text-[10px] text-muted-foreground">on <strong>{rev.productName}</strong></span>
                    <div className="flex text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed italic">"{rev.comment}"</p>
                {rev.adminReply && (
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-[11px]">
                    <strong className="text-primary">Official Shajgoj Reply:</strong> {rev.adminReply}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Wishlist Leaderboard */}
      {activeSubTab === "wishlist" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Most Wishlisted Items</h3>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
          <div className="space-y-2.5">
            {[
              { name: "Blush Mini Crossbody Bag", count: 342, price: 3490 },
              { name: "Rosé Crystal Band Ring", count: 289, price: 1290 },
              { name: "Noir Quilted Flap Bag", count: 215, price: 4890 },
              { name: "Ivory Classic Watch", count: 184, price: 4990 },
            ].map((w, idx) => (
              <div
                key={w.name}
                className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-card flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-foreground">{w.name}</div>
                    <div className="text-[11px] text-muted-foreground">৳{w.price.toLocaleString()}</div>
                  </div>
                </div>
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-600" />
                  <span>{w.count} shoppers saved</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
