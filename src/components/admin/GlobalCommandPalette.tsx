"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Sparkles,
  Truck,
  Shield,
  Layers,
  RotateCcw,
  ArrowRight,
  Boxes,
  Flame,
  DollarSign,
} from "lucide-react";
import type { AdminTab } from "./types";

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AdminTab) => void;
  products?: any[];
  orders?: any[];
  users?: any[];
}

export function GlobalCommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  products = [],
  orders = [],
  users = [],
}: GlobalCommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNavItems: Array<{
    tab: AdminTab;
    label: string;
    group: string;
    icon: React.ElementType;
  }> = [
    { tab: "overview", label: "Executive Dashboard", group: "Pages", icon: BarChart3 },
    { tab: "analytics", label: "Sales Analytics & Conversion BI", group: "Pages", icon: BarChart3 },
    { tab: "orders", label: "Orders Pipeline & POS Invoicing", group: "Pages", icon: ShoppingBag },
    { tab: "products", label: "Products Catalog & Variants", group: "Pages", icon: Package },
    { tab: "inventory", label: "Multi-Warehouse & Stock Levels", group: "Pages", icon: Boxes },
    { tab: "customers", label: "Customer CRM & RFM Segments", group: "Pages", icon: Users },
    { tab: "returns", label: "Returns & Refund Requests", group: "Pages", icon: RotateCcw },
    {
      tab: "couriers_payments",
      label: "Bangladeshi Couriers & Gateways",
      group: "Pages",
      icon: Truck,
    },
    { tab: "marketing", label: "Campaigns (Eid, Ramadan) & SMS", group: "Pages", icon: Flame },
    { tab: "ai_studio", label: "AI Copywriter & Image Enhancer", group: "Pages", icon: Sparkles },
    {
      tab: "finance",
      label: "Profit & Loss (P&L) & Report Center",
      group: "Pages",
      icon: DollarSign,
    },
    {
      tab: "security_rbac",
      label: "Role Permissions & Security Center",
      group: "Pages",
      icon: Shield,
    },
  ];

  const filteredNav = quickNavItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  const matchedOrders = orders
    .filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(query.toLowerCase())) ||
        (o.shippingAddress?.fullName &&
          o.shippingAddress.fullName.toLowerCase().includes(query.toLowerCase())) ||
        (o.shippingAddress?.phone && o.shippingAddress.phone.includes(query)),
    )
    .slice(0, 4);

  const matchedProducts = products
    .filter((p) => p.name && p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search anything (e.g. 'Eid Sale', 'Pathao', 'ORD-2026', 'Gold Ring')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm focus:outline-hidden text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 space-y-4 text-xs scrollbar-thin">
          {/* Matched Navigation Pages */}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Navigation & Modules
              </p>
              <div className="space-y-1 mt-1">
                {filteredNav.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => {
                        onSelectTab(item.tab);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-secondary transition text-foreground group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Orders */}
          {matchedOrders.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Matching Orders
              </p>
              <div className="space-y-1 mt-1">
                {matchedOrders.map((ord) => (
                  <button
                    key={ord._id || ord.orderNumber}
                    onClick={() => {
                      onSelectTab("orders");
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-secondary transition text-foreground"
                  >
                    <div>
                      <div className="font-semibold text-primary">{ord.orderNumber}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {ord.shippingAddress?.fullName} · {ord.shippingAddress?.phone} · ৳
                        {ord.total?.toLocaleString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary border border-border">
                      {ord.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Products */}
          {matchedProducts.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Matching Products
              </p>
              <div className="space-y-1 mt-1">
                {matchedProducts.map((prod) => (
                  <button
                    key={prod._id || prod.slug}
                    onClick={() => {
                      onSelectTab("products");
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-secondary transition text-foreground"
                  >
                    <div>
                      <div className="font-semibold">{prod.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        ৳{prod.price?.toLocaleString()} · Stock: {prod.stock || 0}
                      </div>
                    </div>
                    <span className="text-[10px] text-primary font-semibold">View in Catalog</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 &&
            matchedOrders.length === 0 &&
            matchedProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No results found for "{query}"</p>
              </div>
            )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-secondary/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex gap-3">
            <span>
              <kbd className="font-mono bg-card px-1.5 py-0.5 border border-border rounded">↑↓</kbd>{" "}
              to navigate
            </span>
            <span>
              <kbd className="font-mono bg-card px-1.5 py-0.5 border border-border rounded">
                Enter
              </kbd>{" "}
              to select
            </span>
          </div>
          <span>
            <kbd className="font-mono bg-card px-1.5 py-0.5 border border-border rounded">Esc</kbd>{" "}
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
