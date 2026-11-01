"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, Plus, LogOut, Key, ShieldCheck, ChevronRight } from "lucide-react";
import type { AdminNotification, AdminTab } from "./types";
import { getNavItem } from "./nav";
import { useAuthStore } from "@/store/auth.store";

interface AdminHeaderProps {
  activeTab: AdminTab;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onChangePassword: () => void;
  notifications: AdminNotification[];
  setActiveTab: (tab: AdminTab) => void;
  /** e.g. "Admin" or a custom role name like "Order desk" */
  roleName: string;
  canAddProduct: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  staff: "Staff",
};

export function AdminHeader({
  activeTab,
  sidebarOpen,
  onOpenSidebar,
  onOpenCommandPalette,
  onOpenNotifications,
  onChangePassword,
  notifications,
  setActiveTab,
  roleName,
  canAddProduct,
}: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const current = getNavItem(activeTab);
  const Icon = current.icon;
  const initial = user?.name?.trim().charAt(0).toUpperCase() || "A";

  // Close the account menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleSignOut = () => {
    setMenuOpen(false);
    logout();
    router.replace("/auth/login");
  };

  const iconButton =
    "relative inline-flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors focus-visible:outline-2 focus-visible:outline-ring shrink-0";

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-15 shrink-0 items-center gap-1.5 sm:gap-3 border-b border-border/80 bg-card/90 px-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 sm:px-6 lg:px-8">
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenSidebar}
        className={`${iconButton} lg:hidden`}
        aria-label="Open menu"
        aria-controls="admin-sidebar"
        aria-expanded={sidebarOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Active Location / Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="hidden text-xs text-muted-foreground md:inline">Admin</span>
            <ChevronRight className="hidden h-3 w-3 text-muted-foreground/60 md:inline" />
            <h1 className="truncate font-sans text-sm font-bold tracking-tight text-foreground sm:text-[15px]">
              {current.label}
            </h1>
          </div>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {current.description}
          </p>
        </div>
      </div>

      {/* Store Live Pill */}
      <div className="hidden xl:inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span>Store Live</span>
      </div>

      {/* Search Bar / Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden h-9 w-56 items-center gap-2 rounded-xl border border-border/80 bg-secondary/60 px-3 text-xs text-muted-foreground transition-all duration-150 hover:border-border hover:bg-secondary md:flex lg:w-72 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">Search orders, products, users…</span>
        <kbd className="ml-auto rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-foreground">
          Ctrl K
        </kbd>
      </button>

      <button
        onClick={onOpenCommandPalette}
        className={`${iconButton} md:hidden`}
        aria-label="Search"
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      {/* Add Product Shortcut Button */}
      {canAddProduct && (
        <button
          onClick={() => setActiveTab("products")}
          className="hidden h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all duration-150 hover:bg-primary/90 hover:shadow-sm sm:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add product</span>
        </button>
      )}

      {/* Notification Bell */}
      <button
        onClick={onOpenNotifications}
        className={iconButton}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-rose px-1 text-center text-[10px] font-bold tabular-nums text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* User Account Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 items-center gap-2.5 rounded-xl pl-1 pr-1 transition-colors hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-ring lg:pr-3"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Account menu"
        >
          <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-sidebar text-xs font-bold text-sidebar-foreground shadow-xs ring-1 ring-border">
            {initial}
          </span>
          <span className="hidden text-left leading-tight lg:block">
            <span className="block max-w-32 truncate text-xs font-semibold text-foreground">
              {user?.name || "Admin"}
            </span>
            <span className="block text-[10px] font-medium text-muted-foreground">
              {roleName || ROLE_LABELS[user?.role ?? ""] || "Staff"}
            </span>
          </span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-popover p-2 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100"
          >
            <div className="mb-1 border-b border-border px-3 py-2">
              <p className="truncate text-xs font-semibold text-foreground">{user?.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
              <div className="mt-1.5">
                <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  {roleName || ROLE_LABELS[user?.role ?? ""] || "Staff"}
                </span>
              </div>
            </div>

            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onChangePassword();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Key className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Change password</span>
            </button>

            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setActiveTab("security_rbac");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Security & sign-ins</span>
            </button>

            <div className="my-1 border-t border-border" />

            <button
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
