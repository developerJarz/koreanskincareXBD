"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  X,
  CreditCard,
  Award,
  Calendar,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminUserRow } from "./types";

interface CustomerCrmModuleProps {
  users: AdminUserRow[];
  onToggleUserStatus: (userId: string, currentStatus: boolean) => Promise<void>;
}

export function CustomerCrmModule({
  users,
  onToggleUserStatus,
}: CustomerCrmModuleProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [activeCustomer, setActiveCustomer] = useState<AdminUserRow | null>(null);
  const [smsModalCustomer, setSmsModalCustomer] = useState<AdminUserRow | null>(null);
  const [smsText, setSmsText] = useState("");

  // Customer RFM segmentation logic
  const getCustomerSegment = (user: AdminUserRow) => {
    const points = user.rewardPoints || 0;
    const balance = user.walletBalance || 0;
    if (points > 1000 || balance > 5000) return { label: "VIP Champion", color: "bg-purple-500/15 text-purple-600 border-purple-300" };
    if (points > 300) return { label: "Loyal Buyer", color: "bg-emerald-500/15 text-emerald-600 border-emerald-300" };
    if (points > 100) return { label: "Growing Shopper", color: "bg-blue-500/15 text-blue-600 border-blue-300" };
    if (!user.isActive) return { label: "At Risk / Inactive", color: "bg-rose-500/15 text-rose-600 border-rose-300" };
    return { label: "New Customer", color: "bg-secondary text-muted-foreground border-border" };
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (segmentFilter === "vip") return matchesSearch && (u.rewardPoints > 1000 || u.walletBalance > 5000);
    if (segmentFilter === "loyal") return matchesSearch && u.rewardPoints > 300;
    if (segmentFilter === "inactive") return matchesSearch && !u.isActive;
    return matchesSearch;
  });

  const handleSendQuickSms = () => {
    if (!smsText.trim()) return;
    toast.success(`SMS sent to ${smsModalCustomer?.name || "Customer"} successfully!`);
    setSmsModalCustomer(null);
    setSmsText("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Segmentation Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <h2 className="font-serif text-2xl font-bold">Customer CRM & RFM Segmentation</h2>
          <p className="text-xs text-muted-foreground">
            Customer lifetime value, loyalty tiers, WhatsApp direct chat & engagement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-secondary p-1 rounded-2xl border border-border text-xs">
            <button
              onClick={() => setSegmentFilter("all")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                segmentFilter === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setSegmentFilter("vip")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                segmentFilter === "vip" ? "bg-card text-purple-600 shadow-xs" : "text-muted-foreground"
              }`}
            >
              VIP
            </button>
            <button
              onClick={() => setSegmentFilter("loyal")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                segmentFilter === "loyal" ? "bg-card text-emerald-600 shadow-xs" : "text-muted-foreground"
              }`}
            >
              Loyal
            </button>
            <button
              onClick={() => setSegmentFilter("inactive")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                segmentFilter === "inactive" ? "bg-card text-rose-600 shadow-xs" : "text-muted-foreground"
              }`}
            >
              At Risk
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by customer name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-card text-xs focus:outline-hidden"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const segment = getCustomerSegment(user);
          return (
            <div
              key={user.id}
              className="bg-card border border-border rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-serif font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${segment.color}`}>
                    {segment.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Reward Points</span>
                    <p className="font-bold text-primary text-sm mt-0.5">{user.rewardPoints} pts</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Wallet Balance</span>
                    <p className="font-bold text-emerald-600 text-sm mt-0.5">৳{user.walletBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {/* WhatsApp Chat Button */}
                <a
                  href={`https://wa.me/8801711223344?text=Hello%20${encodeURIComponent(user.name)}%2C%20greetings%20from%20Shajgoj.bd!`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 px-2.5 rounded-xl border border-border bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                  title="Direct WhatsApp Chat"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                {/* Quick SMS Button */}
                <button
                  onClick={() => {
                    setSmsModalCustomer(user);
                    setSmsText(`Hello ${user.name}, enjoy exclusive 15% OFF on our newest Eid collection at Shajgoj.bd! Use code: SHAJGOJVIP`);
                  }}
                  className="py-1.5 px-2.5 rounded-xl border border-border hover:bg-secondary text-[11px] font-semibold text-foreground transition"
                  title="Send Quick SMS"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>

                {/* View Details Drawer */}
                <button
                  onClick={() => setActiveCustomer(user)}
                  className="py-1.5 px-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90 transition"
                >
                  Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Profile Drawer */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border-l border-border w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-lg">
                    {activeCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">{activeCustomer.name}</h3>
                    <p className="text-xs text-muted-foreground">{activeCustomer.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCustomer(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Segment */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Overview</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Role</span>
                    <p className="font-bold capitalize mt-0.5">{activeCustomer.role.replace("_", " ")}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Status</span>
                    <p className={`font-bold mt-0.5 ${activeCustomer.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                      {activeCustomer.isActive ? "Active Account" : "Suspended"}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Reward Points</span>
                    <p className="font-bold text-primary mt-0.5">{activeCustomer.rewardPoints} pts</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Wallet Balance</span>
                    <p className="font-bold text-emerald-600 mt-0.5">৳{activeCustomer.walletBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Primary Delivery Hub</h4>
                <div className="p-3 rounded-2xl bg-secondary/40 border border-border space-y-1">
                  <p className="font-semibold text-foreground">House 42, Road 11, Banani, Dhaka 1213</p>
                  <p className="text-muted-foreground">District: Dhaka Metropolitan · Zone: Banani/Gulshan</p>
                  <p className="text-muted-foreground">Phone: +880 1711-223344</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex gap-2">
              <button
                onClick={() => {
                  onToggleUserStatus(activeCustomer.id, activeCustomer.isActive);
                  setActiveCustomer(null);
                }}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition ${
                  activeCustomer.isActive
                    ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                }`}
              >
                {activeCustomer.isActive ? "Suspend Customer" : "Activate Account"}
              </button>
              <button
                onClick={() => setActiveCustomer(null)}
                className="px-5 py-2.5 rounded-2xl border border-border text-xs font-medium hover:bg-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Quick SMS Modal */}
      {smsModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-base">Send SMS Broadcast</h3>
              <button onClick={() => setSmsModalCustomer(null)} className="p-1 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-muted-foreground">Recipient: <strong className="text-foreground">{smsModalCustomer.name}</strong> (+880 1711-223344)</p>
            <textarea
              rows={4}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              className="w-full p-3 rounded-2xl border border-border bg-background focus:outline-hidden"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSmsModalCustomer(null)} className="px-4 py-2 rounded-xl border border-border font-medium">
                Cancel
              </button>
              <button onClick={handleSendQuickSms} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Send SMS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
