"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, Plus, LogOut, Key, ShieldCheck } from "lucide-react";
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
}: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const current = getNavItem(activeTab);
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
    "relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-ring";

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 border-b border-border px-3 sm:px-4 lg:px-8 flex items-center gap-2 sm:gap-3">
      <button
        onClick={onOpenSidebar}
        className={`${iconButton} lg:hidden -ml-1`}
        aria-label="Open menu"
        aria-controls="admin-sidebar"
        aria-expanded={sidebarOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Where you are */}
      <div className="min-w-0 flex-1">
        <h1 className="text-[15px] font-semibold text-foreground leading-tight truncate font-sans tracking-normal">
          {current.label}
        </h1>
        <p className="hidden sm:block text-xs text-muted-foreground truncate">
          {current.description}
        </p>
      </div>

      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2 w-56 lg:w-72 h-9 px-3 rounded-lg bg-secondary/70 hover:bg-secondary border border-border text-xs text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">Search orders, products, people</span>
        <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-card border border-border rounded text-foreground font-semibold">
          Ctrl K
        </kbd>
      </button>
      <button
        onClick={onOpenCommandPalette}
        className={`${iconButton} md:hidden`}
        aria-label="Search"
      >
        <Search className="w-4.5 h-4.5" />
      </button>

      <button
        onClick={() => setActiveTab("products")}
        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add product</span>
      </button>

      <button
        onClick={onOpenNotifications}
        className={iconButton}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-4 text-center tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2.5 h-9 pl-1 pr-1 lg:pr-3 rounded-lg hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Account menu"
        >
          <span className="w-7 h-7 rounded-md bg-sidebar text-sidebar-foreground flex items-center justify-center text-xs font-bold">
            {initial}
          </span>
          <span className="hidden lg:block text-left leading-tight">
            <span className="block text-xs font-semibold text-foreground max-w-32 truncate">
              {user?.name || "Admin"}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {ROLE_LABELS[user?.role ?? ""] ?? "Team member"}
            </span>
          </span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-popover p-1.5 shadow-lg z-50"
          >
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onChangePassword();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg"
            >
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              Change password
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setActiveTab("security_rbac");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              Team & security
            </button>
            <div className="border-t border-border my-1" />
            <button
              role="menuitem"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
