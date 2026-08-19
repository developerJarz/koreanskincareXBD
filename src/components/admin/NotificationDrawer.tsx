"use client";

import React from "react";
import {
  X,
  Bell,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import type { AdminNotification, AdminTab } from "./types";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  onMarkAllAsRead: () => void;
  onSelectTab: (tab: AdminTab) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectTab,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  const iconMap: Record<AdminNotification["type"], { icon: React.ElementType; color: string }> = {
    order: { icon: ShoppingBag, color: "bg-primary/15 text-primary" },
    inventory: { icon: AlertTriangle, color: "bg-amber-500/15 text-amber-600" },
    refund: { icon: RotateCcw, color: "bg-rose-500/15 text-rose-600" },
    security: { icon: ShieldAlert, color: "bg-purple-500/15 text-purple-600" },
    system: { icon: Bell, color: "bg-blue-500/15 text-blue-600" },
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-bold text-lg">Notifications</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
              {notifications.filter((n) => !n.isRead).length} new
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {notifications.map((notif) => {
            const { icon: Icon, color } = iconMap[notif.type] || iconMap.system;
            return (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  notif.isRead
                    ? "bg-card border-border opacity-70"
                    : "bg-secondary/40 border-primary/20 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-semibold text-xs text-foreground truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.type === "order" && (
                      <button
                        onClick={() => {
                          onSelectTab("orders");
                          onClose();
                        }}
                        className="mt-2 text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>View in Orders Pipeline</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    {notif.type === "inventory" && (
                      <button
                        onClick={() => {
                          onSelectTab("inventory");
                          onClose();
                        }}
                        className="mt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <span>Check Stock & Reorder</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-secondary/30 text-center">
          <p className="text-[11px] text-muted-foreground">
            Auto-synced with Bangladeshi couriers, bKash & MongoDB webhooks
          </p>
        </div>
      </div>
    </div>
  );
}
