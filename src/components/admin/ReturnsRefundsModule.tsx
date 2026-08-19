"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  CreditCard,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { ReturnRequest } from "./types";

export function ReturnsRefundsModule() {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([
    {
      id: "ret_1",
      orderNumber: "ORD-2026-8802",
      customerName: "Ayesha Rahman",
      customerPhone: "+880 1819-445566",
      productName: "Gold Pavé Ring Stack",
      variant: "Size: 6 / Gold",
      reason: "size_issue",
      refundMethod: "bkash",
      refundAmount: 1890,
      status: "pending",
      requestedAt: "18 Aug 2026",
    },
    {
      id: "ret_2",
      orderNumber: "ORD-2026-8798",
      customerName: "Tanzila Haque",
      customerPhone: "+880 1713-990011",
      productName: "Noir Quilted Flap Bag",
      variant: "Color: Noir Black",
      reason: "damaged_transit",
      refundMethod: "wallet",
      refundAmount: 4890,
      status: "approved",
      courierTracking: "STF-992140",
      requestedAt: "17 Aug 2026",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeRefundModal, setActiveRefundModal] = useState<ReturnRequest | null>(null);

  const handleUpdateReturnStatus = (id: string, status: ReturnRequest["status"]) => {
    setReturnRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Return status updated to ${status.toUpperCase()}!`);
  };

  const handleExecuteRefund = () => {
    if (!activeRefundModal) return;
    setReturnRequests((prev) =>
      prev.map((r) => (r.id === activeRefundModal.id ? { ...r, status: "refunded" } : r)),
    );
    toast.success(
      `Refund of ৳${activeRefundModal.refundAmount.toLocaleString()} disbursed via ${activeRefundModal.refundMethod.toUpperCase()}!`,
    );
    setActiveRefundModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-500" />
            <h2 className="font-serif text-2xl font-bold">Returns, Refunds & Exchanges</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            7-day guarantee management with reverse courier pickup and bKash instant refunds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-bold">
            {returnRequests.filter((r) => r.status === "pending").length} Pending Requests
          </span>
        </div>
      </div>

      {/* Return Requests Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Order & Customer</th>
                <th className="p-3.5">Product & Variant</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Refund Channel</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {returnRequests.map((req) => (
                <tr key={req.id} className="hover:bg-secondary/30 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-foreground">{req.orderNumber}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {req.customerName} ({req.customerPhone})
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-foreground">{req.productName}</div>
                    <div className="text-[10px] text-muted-foreground">{req.variant}</div>
                  </td>
                  <td className="p-3.5 capitalize text-muted-foreground">
                    {req.reason.replace("_", " ")}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary border border-border">
                      {req.refundMethod}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-rose-600">
                    ৳{req.refundAmount.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        req.status === "refunded"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : req.status === "approved"
                            ? "bg-blue-500/15 text-blue-600"
                            : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleUpdateReturnStatus(req.id, "approved")}
                        className="px-3 py-1 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold"
                      >
                        Approve Return
                      </button>
                    )}
                    {req.status === "approved" && (
                      <button
                        onClick={() => setActiveRefundModal(req)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 inline-flex"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Disburse ৳</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Refund Modal */}
      {activeRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-base">Disburse Customer Refund</h3>
              <button
                onClick={() => setActiveRefundModal(null)}
                className="p-1 rounded-xl hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-secondary/50 border border-border space-y-1">
              <p className="font-bold text-foreground">
                Order {activeRefundModal.orderNumber} ({activeRefundModal.customerName})
              </p>
              <p className="text-rose-600 font-bold text-sm">
                Refund Amount: ৳{activeRefundModal.refundAmount.toLocaleString()}
              </p>
              <p className="text-muted-foreground">
                Target Channel: <strong>{activeRefundModal.refundMethod.toUpperCase()}</strong> (
                {activeRefundModal.customerPhone})
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Disbursing will automatically transfer ৳
              {activeRefundModal.refundAmount.toLocaleString()} to the customer via{" "}
              {activeRefundModal.refundMethod.toUpperCase()} and notify them with an SMS.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveRefundModal(null)}
                className="px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:opacity-90 transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm bKash/Nagad Payout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
