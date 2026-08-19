"use client";

import React, { useState } from "react";
import {
  Truck,
  CreditCard,
  CheckCircle,
  Key,
  ShieldCheck,
  Search,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export function CouriersPaymentsModule() {
  const [couriers, setCouriers] = useState([
    {
      id: "steadfast",
      name: "Steadfast Courier API",
      status: "connected",
      apiKey: "stf_live_k99281a829",
      secret: "••••••••••••••••",
      autoBooking: true,
      codRate: "1.0%",
    },
    {
      id: "pathao",
      name: "Pathao Courier Merchant API",
      status: "connected",
      apiKey: "pth_live_83910aa1",
      secret: "••••••••••••••••",
      autoBooking: false,
      codRate: "1.0%",
    },
    {
      id: "redx",
      name: "RedX Logistics API",
      status: "ready",
      apiKey: "rdx_sandbox_3910a",
      secret: "••••••••••••••••",
      autoBooking: false,
      codRate: "1.0%",
    },
    {
      id: "paperfly",
      name: "Paperfly Wings API",
      status: "ready",
      apiKey: "pfl_api_99120",
      secret: "••••••••••••••••",
      autoBooking: false,
      codRate: "1.2%",
    },
    {
      id: "ecourier",
      name: "eCourier BD",
      status: "ready",
      apiKey: "ec_live_77182",
      secret: "••••••••••••••••",
      autoBooking: false,
      codRate: "1.0%",
    },
  ]);

  const [paymentGateways, setPaymentGateways] = useState([
    {
      id: "bkash",
      name: "bKash Direct Checkout (Tokenized)",
      status: "active",
      appKey: "bks_live_app_09912",
      merchantNumber: "+880 1711-000000",
      fee: "1.5%",
    },
    {
      id: "nagad",
      name: "Nagad Merchant Payment API",
      status: "active",
      appKey: "ngd_live_app_44819",
      merchantNumber: "+880 1819-000000",
      fee: "1.2%",
    },
    {
      id: "sslcommerz",
      name: "SSLCommerz Enterprise Gateway (Visa/Mastercard/Amex)",
      status: "active",
      appKey: "ssl_store_shajgoj_live",
      merchantNumber: "Store ID: shajgojlive",
      fee: "2.5%",
    },
    {
      id: "rocket",
      name: "DBBL Rocket Payment",
      status: "sandbox",
      appKey: "rkt_sandbox_8819",
      merchantNumber: "+880 1912-000000",
      fee: "1.5%",
    },
    {
      id: "cod",
      name: "Cash on Delivery (COD with Advance Booking Fee)",
      status: "active",
      appKey: "Manual Settlement",
      merchantNumber: "All 64 Districts",
      fee: "0%",
    },
  ]);

  const [trxIdSearch, setTrxIdSearch] = useState("");
  const [trxResult, setTrxResult] = useState<any | null>(null);

  const handleVerifyTrx = () => {
    if (!trxIdSearch.trim()) return;
    toast.loading("Querying bKash / Nagad payment server...");
    setTimeout(() => {
      toast.dismiss();
      setTrxResult({
        trxId: trxIdSearch.toUpperCase(),
        gateway: "bKash Direct",
        amount: 3490,
        currency: "BDT",
        senderPhone: "+880 1711-223344",
        status: "COMPLETED",
        paidAt: new Date().toLocaleTimeString(),
        verified: true,
      });
      toast.success("Transaction verified successfully on Bangladesh payment switch!");
    }, 800);
  };

  const handleToggleCourier = (id: string) => {
    setCouriers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, autoBooking: !c.autoBooking } : c)),
    );
    toast.success("Courier automatic dispatch settings updated!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold">Bangladesh Couriers & Gateways</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            API keys, webhook callbacks and live bKash/Nagad TrxID verification
          </p>
        </div>
      </div>

      {/* TrxID Verification Sandbox Bar */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Live bKash / Nagad / SSLCommerz Transaction (TrxID) Lookup</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter 10-character TrxID (e.g. 9J28A1LK92)..."
            value={trxIdSearch}
            onChange={(e) => setTrxIdSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-2xl border border-border bg-background text-xs font-mono focus:outline-hidden"
          />
          <button
            onClick={handleVerifyTrx}
            className="px-5 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify Trx</span>
          </button>
        </div>

        {trxResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 animate-fade-in">
            <div className="flex justify-between items-center font-bold">
              <span className="text-emerald-700 dark:text-emerald-300">
                ✓ TrxID: {trxResult.trxId} ({trxResult.gateway})
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px]">
                {trxResult.status}
              </span>
            </div>
            <p className="text-muted-foreground">
              Amount:{" "}
              <strong className="text-foreground">
                ৳{trxResult.amount.toLocaleString()} {trxResult.currency}
              </strong>{" "}
              · Sender: {trxResult.senderPhone} · Timestamp: {trxResult.paidAt}
            </p>
          </div>
        )}
      </div>

      {/* Couriers Grid */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-lg">Bangladeshi Logistics & Courier APIs</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {couriers.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3 hover:border-primary/40 transition"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Truck className="w-4 h-4" />
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    c.status === "connected"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-xs text-foreground">{c.name}</h4>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  Key: {c.apiKey}
                </p>
              </div>

              <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between text-xs">
                <span>Auto-Parcel Booking</span>
                <button
                  type="button"
                  onClick={() => handleToggleCourier(c.id)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    c.autoBooking ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      c.autoBooking ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Gateways Grid */}
      <div className="space-y-4 pt-4">
        <h3 className="font-serif font-bold text-lg">Payment Gateways & COD Rules</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentGateways.map((g) => (
            <div
              key={g.id}
              className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3 hover:border-primary/40 transition"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600">
                  {g.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-xs text-foreground">{g.name}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">{g.merchantNumber}</p>
              </div>

              <div className="pt-2 border-t border-border flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Gateway Surcharge Fee</span>
                <span className="font-bold text-primary">{g.fee}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
