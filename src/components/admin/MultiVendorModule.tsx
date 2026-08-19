"use client";

import React, { useState } from "react";
import {
  Store,
  Plus,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  Star,
  ShieldCheck,
  X,
  Phone,
  Mail,
  Send,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Vendor } from "./types";

export function MultiVendorModule() {
  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: "vnd_1",
      name: "Sabrina Hossain",
      shopName: "Glamour BD Crafts",
      email: "sabrina@glamourbd.com",
      phone: "+880 1819-223344",
      division: "Dhaka",
      commissionRate: 12,
      walletBalance: 42500,
      totalSales: 354000,
      productsCount: 38,
      rating: 4.9,
      status: "active",
      joinedDate: "12 Jan 2026",
    },
    {
      id: "vnd_2",
      name: "Mahmud Hasan",
      shopName: "Sylhet Artisan Studio",
      email: "mahmud@sylhetartisan.com",
      phone: "+880 1711-556677",
      division: "Sylhet",
      commissionRate: 10,
      walletBalance: 18200,
      totalSales: 128000,
      productsCount: 19,
      rating: 4.8,
      status: "active",
      joinedDate: "05 Feb 2026",
    },
    {
      id: "vnd_3",
      name: "Rumana Akter",
      shopName: "Dhanmondi Pearl Studio",
      email: "rumana@dhanmondipearls.com",
      phone: "+880 1912-889900",
      division: "Dhaka",
      commissionRate: 15,
      walletBalance: 0,
      totalSales: 0,
      productsCount: 6,
      rating: 5.0,
      status: "pending",
      joinedDate: "18 Aug 2026",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeVendorModal, setActiveVendorModal] = useState<Vendor | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(10000);

  const filteredVendors = vendors.filter(
    (v) =>
      v.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleApproveVendor = (id: string) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status: "active" } : v)));
    toast.success("Vendor approved and store activated!");
  };

  const handleProcessPayout = () => {
    if (!activeVendorModal) return;
    if (payoutAmount > activeVendorModal.walletBalance) {
      toast.error("Payout amount exceeds available wallet balance!");
      return;
    }

    setVendors((prev) =>
      prev.map((v) =>
        v.id === activeVendorModal.id ? { ...v, walletBalance: v.walletBalance - payoutAmount } : v,
      ),
    );

    toast.success(
      `bKash/Bank Payout of ৳${payoutAmount.toLocaleString()} processed for ${activeVendorModal.shopName}!`,
    );
    setActiveVendorModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold">Multi-Vendor Marketplace Hub</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage artisan merchants, commission rates, and bKash vendor payouts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              toast.info("New vendor invitation link generated and copied to clipboard!")
            }
            className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite Merchant</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-3xl bg-card border border-border">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            Total Vendors
          </span>
          <p className="font-serif font-bold text-2xl mt-1 text-foreground">{vendors.length}</p>
        </div>
        <div className="p-4 rounded-3xl bg-card border border-border">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            Marketplace GMV
          </span>
          <p className="font-serif font-bold text-2xl mt-1 text-primary">৳482,000</p>
        </div>
        <div className="p-4 rounded-3xl bg-card border border-border">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            Platform Commission
          </span>
          <p className="font-serif font-bold text-2xl mt-1 text-emerald-600">৳57,840</p>
        </div>
        <div className="p-4 rounded-3xl bg-card border border-border">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            Pending Payouts
          </span>
          <p className="font-serif font-bold text-2xl mt-1 text-amber-600">৳60,700</p>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search merchants by shop name or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border bg-background text-xs focus:outline-hidden"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Shop & Merchant</th>
                <th className="p-3.5">Division</th>
                <th className="p-3.5 text-center">Commission</th>
                <th className="p-3.5 text-center">Products</th>
                <th className="p-3.5 text-center">Rating</th>
                <th className="p-3.5">Payout Balance</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVendors.map((v) => (
                <tr key={v.id} className="hover:bg-secondary/30 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-foreground">{v.shopName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {v.name} · {v.phone}
                    </div>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{v.division}</td>
                  <td className="p-3.5 text-center font-bold text-primary">{v.commissionRate}%</td>
                  <td className="p-3.5 text-center font-medium">{v.productsCount}</td>
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span>{v.rating}</span>
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600">
                    ৳{v.walletBalance.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        v.status === "active"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    {v.status === "pending" ? (
                      <button
                        onClick={() => handleApproveVendor(v.id)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:opacity-90"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveVendorModal(v);
                          setPayoutAmount(Math.min(15000, v.walletBalance));
                        }}
                        className="px-3 py-1 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90"
                      >
                        Payout
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Processing Modal */}
      {activeVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-base">Process Merchant Payout</h3>
              <button
                onClick={() => setActiveVendorModal(null)}
                className="p-1 rounded-xl hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-secondary/50 border border-border space-y-1">
              <p className="font-bold text-foreground">
                {activeVendorModal.shopName} ({activeVendorModal.name})
              </p>
              <p className="text-muted-foreground">
                Available Balance:{" "}
                <strong className="text-emerald-600">
                  ৳{activeVendorModal.walletBalance.toLocaleString()}
                </strong>
              </p>
              <p className="text-muted-foreground">Merchant Phone: {activeVendorModal.phone}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Payout Method</label>
              <select className="w-full p-2.5 rounded-xl border border-border bg-background font-medium focus:outline-hidden">
                <option value="bkash">bKash Merchant B2B Transfer</option>
                <option value="nagad">Nagad Direct Disbursement</option>
                <option value="bank">City Bank / BRAC Bank BEFTN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Disbursement Amount (BDT ৳)
              </label>
              <input
                type="number"
                max={activeVendorModal.walletBalance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveVendorModal(null)}
                className="px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayout}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Disbursement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
