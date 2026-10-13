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
  order: { icon: ShoppingBag, color: "bg-primary/12 text-primary" },
  inventory: { icon: AlertTriangle, color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  refund: { icon: RotateCcw, color: "bg-rose-500/12 text-rose-700 dark:text-rose-400" },
  security: { icon: ShieldAlert, color: "bg-purple-500/12 text-purple-700 dark:text-purple-400" },
  system: { icon: Bell, color: "bg-sky-500/12 text-sky-700 dark:text-sky-400" },
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg">Notifications</h3>
            {unread > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onMarkAllAsRead}
              disabled={!unread}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {notifications.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {loading ? "Loading…" : "You're all caught up."}
            </p>
          )}
          {notifications.map((n) => {
            const { icon: Icon, color } = ICONS[n.type] ?? ICONS.system;
            return (
              <div
                key={n.id}
                className={`rounded-xl border p-3 ${n.isRead ? "border-border" : "border-primary/25 bg-secondary/40"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 rounded-lg p-2 ${color}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {fmtRelative(n.at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {n.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab(n.tab);
                        onClose();
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="border-t border-border bg-secondary/30 p-3 text-center text-[11px] text-muted-foreground">
          Built from your orders, stock, reviews and invoices — refreshed every minute.
        </p>
      </div>
    </div>
  );
}
