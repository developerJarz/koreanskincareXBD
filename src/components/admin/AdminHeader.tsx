"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  Menu,
  ExternalLink,
  Plus,
  Zap,
  Check,
  ShieldCheck,
  Package,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import type { BDSeasonalTheme, AdminNotification, AdminTab } from "./types";
import { useAuthStore } from "@/store/auth.store";

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  notifications: AdminNotification[];
  seasonalTheme: BDSeasonalTheme;
  setSeasonalTheme: (theme: BDSeasonalTheme) => void;
  setActiveTab: (tab: AdminTab) => void;
}

export function AdminHeader({
  onOpenSidebar,
  onOpenCommandPalette,
  onOpenNotifications,
  notifications,
  seasonalTheme,
  setSeasonalTheme,
  setActiveTab,
}: AdminHeaderProps) {
  const { user, logout } = useAuthStore();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const seasonalThemeConfig: Record<
    BDSeasonalTheme,
    { label: string; iconText: string; color: string; banner: string }
  > = {
    standard: {
      label: "Classic Luxe",
      iconText: "✨",
      color: "text-foreground",
      banner: "bg-primary text-primary-foreground",
    },
    ramadan: {
      label: "Ramadan Kareem",
      iconText: "🌙",
      color: "text-emerald-600 dark:text-emerald-400",
      banner: "bg-emerald-900 text-emerald-100",
    },
    eid: {
      label: "Eid Mubarak Mega Edit",
      iconText: "🕌",
      color: "text-amber-600 dark:text-amber-400",
      banner: "bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800 text-white",
    },
    boishakh: {
      label: "Pohela Boishakh 1433",
      iconText: "🏮",
      color: "text-rose-600 dark:text-rose-400",
      banner: "bg-gradient-to-r from-red-600 to-rose-700 text-white",
    },
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/90 backdrop-blur-md border-b border-border px-4 lg:px-6 flex items-center justify-between gap-3">
      {/* Left: Mobile Menu & Breadcrumbs / Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl border border-border text-foreground hover:bg-secondary lg:hidden"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-xs text-muted-foreground transition w-64 md:w-80 justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 group-hover:text-foreground transition-colors" />
            <span className="truncate">Search orders, SKU, customers...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded text-muted-foreground">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Seasonal Campaign / Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-medium transition"
            title="Switch Seasonal Bangladeshi Campaign Mode"
          >
            <span>{seasonalThemeConfig[seasonalTheme].iconText}</span>
            <span className="hidden md:inline text-[11px] font-semibold">
              {seasonalThemeConfig[seasonalTheme].label}
            </span>
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border">
                Festive Campaign Mode
              </div>
              {(Object.keys(seasonalThemeConfig) as BDSeasonalTheme[]).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => {
                    setSeasonalTheme(themeKey);
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                    seasonalTheme === themeKey
                      ? "bg-primary/15 text-primary font-bold"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{seasonalThemeConfig[themeKey].iconText}</span>
                    <span>{seasonalThemeConfig[themeKey].label}</span>
                  </span>
                  {seasonalTheme === themeKey && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Menu */}
        <button
          onClick={() => setActiveTab("products")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Product</span>
        </button>

        {/* View Live Store */}
        <Link
          href="/"
          target="_blank"
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition hidden md:inline-flex"
          title="Open Storefront in New Tab"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>

        {/* Notification Center Trigger */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary relative transition"
          aria-label="Notifications"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Badge */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold leading-none">{user?.name || "Admin"}</div>
              <span className="text-[10px] text-muted-foreground capitalize">
                {user?.role?.replace("_", " ") || "Super Admin"}
              </span>
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-2xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-bold text-foreground">{user?.name || "Admin User"}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.email || "admin@shajgoj.bd"}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("security_rbac");
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-xl transition mt-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Security & Permissions</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-xl transition"
              >
                <span>Store Settings</span>
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  logout();
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-500/10 rounded-xl transition font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
