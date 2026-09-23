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
  Key,
} from "lucide-react";
import type { BDSeasonalTheme, AdminNotification, AdminTab } from "./types";
import { useAuthStore } from "@/store/auth.store";
import { SiteLogoLink } from "@/components/Logo";

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

        <SiteLogoLink variant="admin" className="lg:hidden" />

        {/* Global Search Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-secondary/70 hover:bg-secondary border border-border/80 text-xs text-muted-foreground transition-all duration-200 w-64 md:w-80 justify-between group shadow-xs hover:border-primary/30"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
            <span className="truncate">Search SKU, orders, users...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-card border border-border rounded-md text-foreground shadow-2xs font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Seasonal Campaign / Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-border/80 bg-card hover:bg-secondary text-xs font-semibold transition-all duration-200 shadow-2xs"
            title="Switch Seasonal Bangladeshi Campaign Mode"
          >
            <span>{seasonalThemeConfig[seasonalTheme].iconText}</span>
            <span className="hidden md:inline text-[11px]">
              {seasonalThemeConfig[seasonalTheme].label}
            </span>
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-card border border-border/80 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 border-b border-border/60">
                Festive Campaign Mode
              </div>
              {(Object.keys(seasonalThemeConfig) as BDSeasonalTheme[]).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => {
                    setSeasonalTheme(themeKey);
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition duration-150 ${
                    seasonalTheme === themeKey
                      ? "bg-primary/15 text-primary font-bold"
                      : "hover:bg-secondary/80 text-foreground"
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
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all duration-200 shadow-sm shadow-primary/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Product</span>
        </button>

        {/* View Live Store */}
        <Link
          href="/"
          target="_blank"
          className="p-2 rounded-2xl border border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 hidden md:inline-flex shadow-2xs"
          title="Open Storefront in New Tab"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>

        {/* Notification Center Trigger */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-2xl border border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary relative transition-all duration-200 shadow-2xs"
          aria-label="Notifications"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Badge */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-border/80 bg-card hover:bg-secondary transition-all duration-200 shadow-2xs"
          >
            <div className="w-7 h-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold leading-none text-foreground">
                {user?.name || "Admin"}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium capitalize">
                {user?.role?.replace("_", " ") || "Super Admin"}
              </span>
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-card border border-border/80 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-bold text-foreground">{user?.name || "Admin User"}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.email || "admin@koreanskincare.bd"}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("security_rbac");
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-xl transition mt-1"
              >
                <Key className="w-3.5 h-3.5 text-primary" />
                <span>Change Password</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("security_rbac");
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-xl transition"
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
