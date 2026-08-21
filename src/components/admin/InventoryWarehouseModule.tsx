"use client";

import React, { useState } from "react";
import {
  Boxes,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  Plus,
  RefreshCw,
  Printer,
  QrCode,
  ArrowRightLeft,
  X,
  Search,
  CheckCircle,
  MapPin,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import type { Warehouse } from "./types";

interface InventoryWarehouseModuleProps {
  products: any[];
  onUpdateProductStock?: (productId: string, newStock: number) => Promise<void>;
}

export function InventoryWarehouseModule({
  products: initialProducts,
  onUpdateProductStock,
}: InventoryWarehouseModuleProps) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [adjustStockProduct, setAdjustStockProduct] = useState<any | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("restock");
  const [activeBarcodeProduct, setActiveBarcodeProduct] = useState<any | null>(null);

  // Pre-configured Bangladeshi enterprise warehouses
  const warehouses: Warehouse[] = [
    {
      id: "wh_dhaka",
      name: "Dhaka Central Fulfillment Hub",
      code: "WH-DHK-01",
      city: "Dhaka",
      address: "Plot 18, Sector 3, Uttara, Dhaka",
      manager: "Tanvir Ahmed",
      phone: "+880 1819-112233",
      totalSkus: 280,
      capacityUtilization: 74,
      status: "active",
    },
    {
      id: "wh_ctg",
      name: "Chattogram Regional Hub",
      code: "WH-CTG-01",
      city: "Chattogram",
      address: "Agrabad Commercial Area, Chattogram",
      manager: "Farhan Kabir",
      phone: "+880 1712-445566",
      totalSkus: 140,
      capacityUtilization: 48,
      status: "active",
    },
    {
      id: "wh_banani",
      name: "Banani Flagship Outlet & POS",
      code: "POS-BAN-01",
      city: "Dhaka",
      address: "House 42, Road 11, Banani, Dhaka",
      manager: "Sadia Islam",
      phone: "+880 1913-778899",
      totalSkus: 95,
      capacityUtilization: 62,
      status: "active",
    },
  ];

  // Filter low stock and searched products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const lowStockItems = products.filter((p) => (p.stock || 0) <= (p.lowStockThreshold || 5));

  const [isSavingStock, setIsSavingStock] = useState(false);

  const handleApplyStockAdjustment = async () => {
    if (!adjustStockProduct) return;
    const currentStock = adjustStockProduct.stock || 0;
    const newStock =
      adjustmentReason === "damage" || adjustmentReason === "transfer_out"
        ? Math.max(0, currentStock - adjustmentAmount)
        : currentStock + adjustmentAmount;

    // Optimistically update UI
    setProducts((prev) =>
      prev.map((p) => (p._id === adjustStockProduct._id ? { ...p, stock: newStock } : p)),
    );

    setIsSavingStock(true);
    try {
      if (onUpdateProductStock) {
        await onUpdateProductStock(adjustStockProduct._id, newStock);
      }

      toast.success(
        `Stock updated for ${adjustStockProduct.name}! New level: ${newStock} units (${adjustmentReason})`,
      );
      setAdjustStockProduct(null);
    } catch (err) {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p._id === adjustStockProduct._id ? { ...p, stock: currentStock } : p)),
      );
      toast.error("Failed to save stock update. Reverted to previous value.");
    } finally {
      setIsSavingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold">Multi-Warehouse & Stock Control</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time inventory levels, barcode label printing & hub replenishment
          </p>
        </div>

        {lowStockItems.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-2xl text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span>{lowStockItems.length} items low on stock!</span>
          </div>
        )}
      </div>

      {/* Warehouse Hubs Cards Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-3 hover:border-primary/40 transition"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600">
                {wh.status.toUpperCase()}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground">{wh.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{wh.address}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 rounded-xl bg-secondary/40 border border-border">
                <span className="text-[10px] text-muted-foreground font-bold">Managed SKUs</span>
                <p className="font-bold text-foreground text-xs mt-0.5">{wh.totalSkus} items</p>
              </div>
              <div className="p-2 rounded-xl bg-secondary/40 border border-border">
                <span className="text-[10px] text-muted-foreground font-bold">Capacity Used</span>
                <p className="font-bold text-primary text-xs mt-0.5">{wh.capacityUtilization}%</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Hub Lead: {wh.manager}</span>
              <span className="font-mono text-primary font-bold">{wh.code}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Stock Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search product inventory by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border bg-background text-xs focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Product & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Dhaka Hub</th>
                <th className="p-3.5 text-center">Chattogram</th>
                <th className="p-3.5 text-center">Banani POS</th>
                <th className="p-3.5 text-center">Total Stock</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((prod, i) => {
                const stock = prod.stock || 25;
                const isLow = stock <= (prod.lowStockThreshold || 5);
                const dhakaShare = Math.round(stock * 0.6);
                const ctgShare = Math.round(stock * 0.25);
                const posShare = Math.max(0, stock - dhakaShare - ctgShare);

                return (
                  <tr key={prod._id || i} className="hover:bg-secondary/30 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground">{prod.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        SKU: SHJ-
                        {prod.slug ? prod.slug.slice(0, 8).toUpperCase() : `ACC-${100 + i}`}
                      </div>
                    </td>
                    <td className="p-3.5 capitalize text-muted-foreground">
                      {typeof prod.category === "object"
                        ? prod.category?.name
                        : prod.category || "Accessories"}
                    </td>
                    <td className="p-3.5 text-center font-medium">{dhakaShare}</td>
                    <td className="p-3.5 text-center font-medium">{ctgShare}</td>
                    <td className="p-3.5 text-center font-medium">{posShare}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow
                            ? "bg-rose-500/15 text-rose-600 border border-rose-300"
                            : "bg-emerald-500/15 text-emerald-600"
                        }`}
                      >
                        {stock} units {isLow && "⚠ Low"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      {/* Barcode Trigger */}
                      <button
                        onClick={() => setActiveBarcodeProduct(prod)}
                        className="p-1.5 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                        title="Print Barcode & QR Sticker"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {/* Stock Adjust Trigger */}
                      <button
                        onClick={() => {
                          setAdjustStockProduct(prod);
                          setAdjustmentAmount(10);
                        }}
                        className="p-1.5 rounded-xl border border-border hover:bg-secondary text-primary transition"
                        title="Adjust Stock / Restock"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-base">Adjust Stock Level</h3>
              <button
                onClick={() => setAdjustStockProduct(null)}
                className="p-1 rounded-xl hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="font-bold text-foreground">{adjustStockProduct.name}</p>
              <p className="text-muted-foreground mt-0.5">
                Current Stock: <strong>{adjustStockProduct.stock || 0} units</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Adjustment Reason</label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background font-medium focus:outline-hidden"
              >
                <option value="restock">Purchase Order Restock (+)</option>
                <option value="customer_return">Customer Return Restock (+)</option>
                <option value="damage">Damaged in Transit / Discard (-)</option>
                <option value="transfer_out">Inter-Warehouse Transfer Out (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setAdjustStockProduct(null)}
                className="px-4 py-2 rounded-xl border border-border font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyStockAdjustment}
                disabled={isSavingStock}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {isSavingStock ? "Saving..." : "Apply Stock Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Barcode & QR Sticker Modal */}
      {activeBarcodeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in print:p-0">
          <div className="bg-white text-neutral-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 print:shadow-none">
            <div className="border-b border-neutral-200 pb-3 flex justify-between items-center print:hidden">
              <span className="font-serif font-bold text-sm">Product Barcode Label</span>
              <button
                onClick={() => setActiveBarcodeProduct(null)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticker Preview */}
            <div className="border-2 border-dashed border-neutral-300 p-4 rounded-2xl space-y-2 bg-neutral-50">
              <div className="font-serif font-bold text-sm">Shajgoj.bd</div>
              <p className="font-bold text-xs text-neutral-800 line-clamp-1">
                {activeBarcodeProduct.name}
              </p>
              <div className="py-2 flex justify-center">
                {/* Simulated Barcode Lines */}
                <div className="flex items-center gap-0.5 h-12">
                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 2, 1, 3, 2, 1, 3, 2].map(
                    (w, i) => (
                      <div key={i} style={{ width: `${w * 1.5}px` }} className="bg-black h-full" />
                    ),
                  )}
                </div>
              </div>
              <p className="font-mono text-[11px] text-neutral-700 tracking-wider">
                SHJ-{activeBarcodeProduct.slug?.slice(0, 10).toUpperCase() || "ACC-8801"}
              </p>
              <p className="font-bold text-xs text-rose-600">
                MRP: ৳{(activeBarcodeProduct.price || 3490).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setActiveBarcodeProduct(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
