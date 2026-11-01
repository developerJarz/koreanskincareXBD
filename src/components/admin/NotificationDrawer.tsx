"use client";

import React, { useEffect } from "react";
import {
  X,
  Bell,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  CheckCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { AdminNotification, AdminTab } from "./types";
import { fmtRelative } from "./shared";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  loading: boolean;
  onRefresh: () => void;
  onMarkAllAsRead: () => void;
  onSelectTab: (tab: AdminTab) => void;
}

const ICONS: Record<AdminNotification["type"], { icon: React.ElementType; color: string }> = {
  order: { icon: ShoppingBag, color: "bg-primary/12 text-primary border-primary/20" },
  inventory: {
    icon: AlertTriangle,
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  refund: {
    icon: RotateCcw,
    color: "bg-rose-500/12 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  security: {
    icon: ShieldAlert,
    color: "bg-purple-500/12 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  system: { icon: Bell, color: "bg-sky-500/12 text-sky-700 dark:text-sky-400 border-sky-500/20" },
};

/** The bell menu. Items come from /api/admin/notifications (built from the database). */
export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  loading,
  onRefresh,
  onMarkAllAsRead,
  onSelectTab,
}: NotificationDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Notifications</h3>
              <p className="text-[11px] text-muted-foreground">Store events and alerts</p>
            </div>
            {unread > 0 && (
              <span className="ml-1 rounded-full bg-rose/10 px-2 py-0.5 text-[11px] font-bold text-rose">
                {unread} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onMarkAllAsRead}
              disabled={!unread}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark read</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-25" />
              <p className="text-sm font-medium text-foreground">
                {loading ? "Checking notifications…" : "You're all caught up!"}
              </p>
              <p className="mt-1 text-xs">New store orders and system notices will appear here.</p>
            </div>
          )}

          {notifications.map((n) => {
            const meta = ICONS[n.type] ?? ICONS.system;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                onClick={() => {
                  onSelectTab(n.tab);
                  onClose();
                }}
                className={`group relative flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all duration-150 hover:border-primary/40 hover:bg-secondary/40 ${
                  n.isRead
                    ? "border-border/70 bg-card/60 opacity-80"
                    : "border-primary/25 bg-primary/5 shadow-xs"
                }`}
              >
                {!n.isRead && (
                  <span
                    className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-rose"
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {n.title}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{fmtRelative(n.at)}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
