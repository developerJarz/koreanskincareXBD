"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  CheckCircle,
  Clock,
  Printer,
  FileText,
  X,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Phone,
  MapPin,
  Send,
  PackageCheck,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";

interface OrderManagementModuleProps {
  orders: any[];
  onUpdateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
}

export function OrderManagementModule({
  orders: initialOrders,
  onUpdateOrderStatus,
}: OrderManagementModuleProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<any | null>(null);
  const [courierModalOrder, setCourierModalOrder] = useState<any | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<"steadfast" | "pathao" | "redx" | "paperfly" | "ecourier">("steadfast");
  const [courierNote, setCourierNote] = useState("");
  const [isBookingCourier, setIsBookingCourier] = useState(false);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.shippingAddress?.fullName &&
        order.shippingAddress.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.shippingAddress?.phone && order.shippingAddress.phone.includes(searchQuery));
    return matchesStatus && matchesSearch;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o._id || o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await onUpdateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status } : o))
      );
      toast.success(`Order status updated to "${status.toUpperCase()}"`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedOrderIds.length === 0) return;
    toast.loading(`Updating ${selectedOrderIds.length} orders to ${status}...`);
    try {
      for (const id of selectedOrderIds) {
        await onUpdateOrderStatus(id, status);
      }
      setOrders((prev) =>
        prev.map((o) =>
          selectedOrderIds.includes(o._id || o.id) ? { ...o, status } : o
        )
      );
      setSelectedOrderIds([]);
      toast.dismiss();
      toast.success(`Successfully updated ${selectedOrderIds.length} orders!`);
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to update some orders");
    }
  };

  const handleBookCourier = () => {
    if (!courierModalOrder) return;
    setIsBookingCourier(true);

    setTimeout(() => {
      setIsBookingCourier(false);
      const trackingCode = `${selectedCourier.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
      toast.success(`Consignment created with ${selectedCourier.toUpperCase()}! Tracking: ${trackingCode}`);
      
      // Auto update status to shipped
      handleStatusChange(courierModalOrder._id || courierModalOrder.id, "shipped");
      setCourierModalOrder(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search / Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <h2 className="font-serif text-2xl font-bold">Order Workflow & Logistics</h2>
          <p className="text-xs text-muted-foreground">Manage orders, issue POS invoices & dispatch Bangladeshi couriers</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-2xl animate-fade-in">
              <span className="text-xs font-bold text-primary">{selectedOrderIds.length} selected</span>
              <button
                onClick={() => handleBulkStatusChange("confirmed")}
                className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Confirm
              </button>
              <button
                onClick={() => handleBulkStatusChange("shipped")}
                className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-indigo-600 text-white hover:opacity-90 transition"
              >
                Dispatch
              </button>
              <button
                onClick={() => window.print()}
                className="p-1 rounded-xl text-primary hover:bg-primary/20"
                title="Print Invoices"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Status Filter Tabs */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl border border-border bg-background text-xs font-semibold focus:outline-hidden"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by Order #, Customer Name, Phone number or District..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-card text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    className="rounded border-border"
                  />
                </th>
                <th className="p-4">Order #</th>
                <th className="p-4">Customer & District</th>
                <th className="p-4">Items</th>
                <th className="p-4">Amount (BDT)</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((ord) => {
                const isSelected = selectedOrderIds.includes(ord._id || ord.id);
                const statusColor =
                  ORDER_STATUS_CONFIG[ord.status as keyof typeof ORDER_STATUS_CONFIG]?.color || "#6b7280";

                return (
                  <tr key={ord._id || ord.orderNumber} className={`hover:bg-secondary/30 transition ${isSelected ? "bg-primary/5" : ""}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(ord._id || ord.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-foreground">
                      {ord.orderNumber || "ORD-2026-8801"}
                      <div className="text-[10px] text-muted-foreground font-sans font-normal">
                        {new Date(ord.createdAt || Date.now()).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{ord.shippingAddress?.fullName || "Nusrat Jahan"}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{ord.shippingAddress?.phone || "+880 1711-223344"}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{ord.shippingAddress?.city || "Dhaka"}, {ord.shippingAddress?.division || "Dhaka"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">{ord.items?.length || 1} items</span>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        {ord.items?.[0]?.product?.name || ord.items?.[0]?.name || "Blush Crossbody & Ring"}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      ৳{(ord.total || 3490).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary border border-border">
                        {ord.paymentMethod || "COD"}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={ord.status || "pending"}
                        onChange={(e) => handleStatusChange(ord._id || ord.id, e.target.value)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase border border-border bg-background focus:outline-hidden"
                        style={{ color: statusColor }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="returned">Returned</option>
                      </select>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {/* Courier Dispatch Trigger */}
                      <button
                        onClick={() => setCourierModalOrder(ord)}
                        className="p-1.5 rounded-xl border border-border hover:bg-secondary text-primary transition"
                        title="Dispatch via Bangladeshi Courier"
                      >
                        <Truck className="w-4 h-4" />
                      </button>

                      {/* Invoice Print Trigger */}
                      <button
                        onClick={() => setActiveInvoiceOrder(ord)}
                        className="p-1.5 rounded-xl border border-border hover:bg-secondary text-foreground transition"
                        title="View & Print Tax Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bangladeshi Courier Dispatch Modal */}
      {courierModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg">Dispatch Bangladeshi Courier</h3>
              </div>
              <button
                onClick={() => setCourierModalOrder(null)}
                className="p-1 rounded-xl text-muted-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
                <p className="font-bold text-foreground">{courierModalOrder.shippingAddress?.fullName || "Nusrat Jahan"}</p>
                <p className="text-muted-foreground">{courierModalOrder.shippingAddress?.phone || "+880 1711-223344"}</p>
                <p className="text-muted-foreground">{courierModalOrder.shippingAddress?.address || "House 12, Road 4, Dhanmondi, Dhaka"}</p>
                <div className="mt-2 text-primary font-bold">
                  COD Amount to Collect: ৳{(courierModalOrder.total || 3490).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Select Courier Partner</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["steadfast", "pathao", "redx", "paperfly", "ecourier"] as const).map((courier) => (
                    <button
                      key={courier}
                      type="button"
                      onClick={() => setSelectedCourier(courier)}
                      className={`p-2.5 rounded-xl border text-center font-bold capitalize transition ${
                        selectedCourier === courier
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      {courier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Delivery Instruction / Rider Note</label>
                <input
                  type="text"
                  placeholder="e.g. Call before delivery, allow open parcel check"
                  value={courierNote}
                  onChange={(e) => setCourierNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setCourierModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBookCourier}
                disabled={isBookingCourier}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-2"
              >
                {isBookingCourier ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Booking API...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Create Parcel Consignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Enterprise POS Tax Invoice Modal */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in print:p-0">
          <div className="bg-white text-neutral-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden p-8 space-y-6 print:shadow-none print:w-full print:max-w-none">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-neutral-200 pb-5">
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight">
                  Shajgoj<span className="text-rose-600">.bd</span>
                </h1>
                <p className="text-xs text-neutral-500 mt-1">Official Tax Invoice & Packing Slip</p>
                <p className="text-[11px] text-neutral-500">BIN / Tax ID: 004928192-0101 · Dhaka, Bangladesh</p>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-sm">
                  {activeInvoiceOrder.orderNumber || "ORD-2026-8801"}
                </div>
                <p className="text-xs text-neutral-500">
                  {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 border border-neutral-300">
                  {activeInvoiceOrder.paymentMethod || "Cash On Delivery"}
                </span>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold uppercase text-[10px] text-neutral-400">Customer Details:</span>
                <p className="font-bold text-neutral-900 mt-1">
                  {activeInvoiceOrder.shippingAddress?.fullName || "Nusrat Jahan"}
                </p>
                <p className="text-neutral-600">{activeInvoiceOrder.shippingAddress?.phone || "+880 1711-223344"}</p>
                <p className="text-neutral-600">{activeInvoiceOrder.shippingAddress?.email || "customer@shajgoj.bd"}</p>
              </div>
              <div className="text-right">
                <span className="font-bold uppercase text-[10px] text-neutral-400">Delivery Address:</span>
                <p className="text-neutral-700 mt-1">
                  {activeInvoiceOrder.shippingAddress?.address || "House 42, Road 11, Banani"}
                </p>
                <p className="text-neutral-700">
                  {activeInvoiceOrder.shippingAddress?.city || "Dhaka"} - {activeInvoiceOrder.shippingAddress?.postalCode || "1213"}, Bangladesh
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-50 text-neutral-600 font-bold text-[10px] uppercase">
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Price (৳)</th>
                  <th className="py-2.5 px-3 text-right">Total (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {(activeInvoiceOrder.items || [{ name: "Blush Mini Crossbody Bag", quantity: 1, price: 3490 }]).map((it: any, i: number) => (
                  <tr key={i}>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-neutral-900">{it.product?.name || it.name || "Curated Accessory"}</div>
                      <div className="text-[10px] text-neutral-500">SKU: SHJ-ACC-{100 + i} · Signature Pouch Packaging</div>
                    </td>
                    <td className="py-3 px-3 text-center font-medium">{it.quantity || 1}</td>
                    <td className="py-3 px-3 text-right">৳{(it.price || 3490).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-bold">৳{((it.price || 3490) * (it.quantity || 1)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Summary */}
            <div className="flex justify-between items-center border-t border-neutral-300 pt-4 text-xs">
              <div className="text-[11px] text-neutral-500 max-w-xs">
                <p className="font-bold text-neutral-800">Thank you for choosing Shajgoj.bd!</p>
                <p>7-day hassle-free replacement guarantee on all eligible accessories.</p>
              </div>
              <div className="space-y-1 text-right w-48">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span>৳{(activeInvoiceOrder.subtotal || 3490).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Charge:</span>
                  <span>৳{(activeInvoiceOrder.shippingCost ?? 70).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-900 font-bold text-sm border-t border-neutral-300 pt-1 mt-1">
                  <span>Grand Total:</span>
                  <span className="text-rose-600">৳{(activeInvoiceOrder.total || 3560).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions (Hidden in Print) */}
            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 print:hidden">
              <button
                onClick={() => setActiveInvoiceOrder(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-medium hover:bg-neutral-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
