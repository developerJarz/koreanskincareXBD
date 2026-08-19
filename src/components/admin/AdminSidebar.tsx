"use client";

import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Package,
  Layers,
  Boxes,
  Users,
  Store,
  RotateCcw,
  Truck,
  Sparkles,
  DollarSign,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Shield,
  Activity,
  Settings,
  ChevronRight,
  X,
  BadgeAlert,
  Flame,
} from "lucide-react";
import type { AdminTab } from "./types";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  returnsCount?: number;
}

type NavGroup = {
  title: string;
  items: Array<{
    tab: AdminTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    isHot?: boolean;
  }>;
};

export function AdminSidebar({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  returnsCount = 2,
}: AdminSidebarProps) {
  const navGroups: NavGroup[] = [
    {
      title: "Core & Intelligence",
      items: [
        { tab: "overview", label: "Executive Overview", icon: LayoutDashboard },
        { tab: "analytics", label: "Sales & BI Analytics", icon: BarChart3 },
        { tab: "finance", label: "Finance & Profit (P&L)", icon: DollarSign },
      ],
    },
    {
      title: "Catalog & Warehouses",
      items: [
        { tab: "products", label: "Products & Variants", icon: Package },
        { tab: "categories", label: "Categories & Badges", icon: Layers },
        {
          tab: "inventory",
          label: "Multi-Warehouse & Stock",
          icon: Boxes,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: "bg-amber-500",
        },
        { tab: "media", label: "Media Library (CDN)", icon: ImageIcon },
      ],
    },
    {
      title: "Orders & Logistics BD",
      items: [
        {
          tab: "orders",
          label: "Order Pipeline & POS",
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: "bg-primary",
        },
        {
          tab: "returns",
          label: "Returns & Exchanges",
          icon: RotateCcw,
          badge: returnsCount > 0 ? returnsCount : undefined,
          badgeColor: "bg-rose-500",
        },
        { tab: "couriers_payments", label: "Couriers & Payments BD", icon: Truck },
      ],
    },
    {
      title: "Customers & Marketplace",
      items: [
        { tab: "customers", label: "Customers CRM & RFM", icon: Users },
        { tab: "vendors", label: "Multi-Vendor Hub", icon: Store },
        { tab: "reviews_abandoned", label: "Reviews & Abandoned Carts", icon: MessageSquare },
      ],
    },
    {
      title: "Growth & Automation",
      items: [
        { tab: "marketing", label: "Campaigns, Eid & SMS", icon: Flame, isHot: true },
        { tab: "ai_studio", label: "AI Studio (Copy & Image)", icon: Sparkles, isHot: true },
        { tab: "cms_blog", label: "CMS Pages & SEO", icon: FileText },
      ],
    },
    {
      title: "System & Governance",
      items: [
        { tab: "security_rbac", label: "RBAC, 2FA & Audit Logs", icon: Shield },
        { tab: "api_health", label: "API, Webhooks & Health", icon: Activity },
        { tab: "settings", label: "Store Settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-border px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <div className="font-serif font-bold text-lg tracking-tight leading-none">
                Shajgoj<span className="text-primary">.bd</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                Enterprise Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 py-1 text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.isHot && !isActive && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          AI / Eid
                        </span>
                      )}
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                            isActive ? "bg-white/30 text-white" : item.badgeColor || "bg-primary"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 opacity-40 transition-transform ${
                          isActive ? "translate-x-0.5 opacity-90" : ""
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Quick Status */}
        <div className="p-3 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Store Live & Synced
              </span>
            </div>
            <span className="text-[10px] font-bold text-primary">v2.4 Pro</span>
          </div>
        </div>
      </aside>
    </>
  );
}
