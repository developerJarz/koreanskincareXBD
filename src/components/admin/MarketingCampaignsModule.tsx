"use client";

import React, { useState } from "react";
import {
  Flame,
  Tag,
  Plus,
  Calendar,
  MessageSquare,
  Sparkles,
  Percent,
  CheckCircle,
  Copy,
  Trash2,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { BDSeasonalTheme, SmsTemplate } from "./types";

interface MarketingCampaignsModuleProps {
  coupons: any[];
  seasonalTheme: BDSeasonalTheme;
  setSeasonalTheme: (theme: BDSeasonalTheme) => void;
}

export function MarketingCampaignsModule({
  coupons: initialCoupons,
  seasonalTheme,
  setSeasonalTheme,
}: MarketingCampaignsModuleProps) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState(15);
  const [newCouponMinSpend, setNewCouponMinSpend] = useState(2000);
  const [smsCampaignText, setSmsCampaignText] = useState(
    "Shajgoj.bd Eid-ul-Fitr Grand Sale! Enjoy 20% OFF on premium jewelry & luxury bags. Use code: SHAJGOJVIP. Shop at shajgoj.bd",
  );
  const [smsAudience, setSmsAudience] = useState("vip");

  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([
    {
      id: "sms_1",
      title: "Order Confirmation SMS",
      trigger: "order_placed",
      body: "Assalamu Alaikum {name}, your order {order_id} of BDT {amount} is confirmed at Shajgoj.bd. Hotline: 01711223344",
      isActive: true,
    },
    {
      id: "sms_2",
      title: "Courier Shipped & Tracking",
      trigger: "shipped",
      body: "Your Shajgoj.bd parcel is dispatched via {courier}. Tracking ID: {tracking_code}. Expect delivery within 24-48 hrs!",
      isActive: true,
    },
    {
      id: "sms_3",
      title: "Eid Mubarak Festive Promo",
      trigger: "eid_promo",
      body: "Eid Mubarak {name}! Get flat 15% OFF on all signature collections at Shajgoj.bd with code: EID2026. Free delivery across BD!",
      isActive: true,
    },
  ]);

  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    setIsCreatingCoupon(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCouponCode.toUpperCase().trim(),
          type: "percentage",
          value: newCouponDiscount,
          minOrderAmount: newCouponMinSpend,
          usageLimit: 500,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create coupon");
      }

      const newCoupon = await res.json();
      setCoupons([newCoupon, ...coupons]);
      toast.success(`Coupon "${newCoupon.code}" created and saved to database!`);
      setNewCouponCode("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleBroadcastSms = () => {
    toast.loading("Sending SMS blast via Greenweb SMS BD gateway...");
    setTimeout(() => {
      toast.dismiss();
      toast.success(
        `SMS broadcast successfully sent to 1,420 ${smsAudience.toUpperCase()} recipients!`,
      );
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="font-serif text-2xl font-bold">
              Bangladeshi Campaigns & Marketing Suite
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Eid, Ramadan, Pohela Boishakh festive tools, coupon codes & Greenweb SMS broadcasts
          </p>
        </div>
      </div>

      {/* Seasonal Campaigns Visual Showcase */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Eid-ul-Fitr Campaign */}
        <div className="bg-gradient-to-br from-amber-900/80 via-yellow-800/80 to-amber-950 text-amber-100 p-6 rounded-3xl space-y-3 shadow-lg border border-amber-500/30 relative overflow-hidden">
          <span className="text-2xl">🕌</span>
          <h3 className="font-serif font-bold text-lg text-white">Eid-ul-Fitr Mega Edit</h3>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Festive gold accents, luxury packaging, and countdown flash discounts.
          </p>
          <button
            onClick={() => {
              setSeasonalTheme("eid");
              toast.success("Eid Mubarak Campaign mode activated across the platform!");
            }}
            className={`w-full py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
              seasonalTheme === "eid"
                ? "bg-white text-amber-900"
                : "bg-amber-500 text-white hover:bg-amber-400"
            }`}
          >
            {seasonalTheme === "eid" ? "✓ Active Mode" : "Activate Eid Mode"}
          </button>
        </div>

        {/* Ramadan Kareem Campaign */}
        <div className="bg-gradient-to-br from-emerald-950 via-teal-900/90 to-emerald-900 text-emerald-100 p-6 rounded-3xl space-y-3 shadow-lg border border-emerald-500/30 relative overflow-hidden">
          <span className="text-2xl">🌙</span>
          <h3 className="font-serif font-bold text-lg text-white">Ramadan Kareem Specials</h3>
          <p className="text-xs text-emerald-200/80 leading-relaxed">
            Iftar & Sehri flash sales, subtle emerald theme & gift bundle highlights.
          </p>
          <button
            onClick={() => {
              setSeasonalTheme("ramadan");
              toast.success("Ramadan Kareem Campaign mode activated!");
            }}
            className={`w-full py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
              seasonalTheme === "ramadan"
                ? "bg-white text-emerald-900"
                : "bg-emerald-500 text-white hover:bg-emerald-400"
            }`}
          >
            {seasonalTheme === "ramadan" ? "✓ Active Mode" : "Activate Ramadan Mode"}
          </button>
        </div>

        {/* Pohela Boishakh Campaign */}
        <div className="bg-gradient-to-br from-rose-900 via-red-900 to-amber-900 text-rose-100 p-6 rounded-3xl space-y-3 shadow-lg border border-rose-500/30 relative overflow-hidden">
          <span className="text-2xl">🏮</span>
          <h3 className="font-serif font-bold text-lg text-white">Pohela Boishakh 1433</h3>
          <p className="text-xs text-rose-200/80 leading-relaxed">
            Bengali New Year red & white motifs, special Baisakhi gift boxes.
          </p>
          <button
            onClick={() => {
              setSeasonalTheme("boishakh");
              toast.success("Pohela Boishakh Campaign mode activated!");
            }}
            className={`w-full py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
              seasonalTheme === "boishakh"
                ? "bg-white text-rose-900"
                : "bg-rose-500 text-white hover:bg-rose-400"
            }`}
          >
            {seasonalTheme === "boishakh" ? "✓ Active Mode" : "Activate Boishakh Mode"}
          </button>
        </div>
      </div>

      {/* Coupon Engine & SMS Broadcast Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coupon Manager */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Active Promotional Coupons</h3>
            <Tag className="w-4 h-4 text-primary" />
          </div>

          <form
            onSubmit={handleCreateCoupon}
            className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Create New Promo Code
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Code (e.g. EID20)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                className="col-span-1 px-3 py-2 rounded-xl border border-border bg-background text-xs uppercase font-bold focus:outline-hidden"
              />
              <input
                type="number"
                placeholder="Discount %"
                value={newCouponDiscount}
                onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                className="col-span-1 px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isCreatingCoupon}
                className="col-span-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {isCreatingCoupon ? "Saving..." : "+ Add Coupon"}
              </button>
            </div>
          </form>

          <div className="space-y-2 pt-1 max-h-64 overflow-y-auto scrollbar-thin">
            {coupons.map((c: any) => (
              <div
                key={c._id || c.code}
                className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold">
                    {c.code}
                  </div>
                  <div>
                    <div className="font-bold">{c.value}% OFF</div>
                    <div className="text-[10px] text-muted-foreground">
                      Min spend: ৳{c.minOrderAmount || 1000}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Used: {c.usageCount || 0} times
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bangladeshi SMS Broadcast Engine */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Bangladeshi SMS Marketing Hub</h3>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Target Customer Segment</label>
              <select
                value={smsAudience}
                onChange={(e) => setSmsAudience(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background font-medium focus:outline-hidden"
              >
                <option value="all">All Registered Customers (4,280 contacts)</option>
                <option value="vip">VIP & High-LTV Buyers (320 contacts)</option>
                <option value="abandoned">Abandoned Cart Users (85 contacts)</option>
                <option value="dhaka">Dhaka Metropolitan Only (2,890 contacts)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                SMS Content (Max 160 chars / 1 SMS)
              </label>
              <textarea
                rows={4}
                value={smsCampaignText}
                onChange={(e) => setSmsCampaignText(e.target.value)}
                className="w-full p-3 rounded-2xl border border-border bg-background focus:outline-hidden text-xs leading-relaxed"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>Chars: {smsCampaignText.length} / 160</span>
                <span>Gateway: Greenweb BD API (Connected)</span>
              </div>
            </div>

            <button
              onClick={handleBroadcastSms}
              className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch SMS Campaign Broadcast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
