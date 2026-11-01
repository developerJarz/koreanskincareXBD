"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, Sparkles, X } from "lucide-react";
import type { AdminTab } from "./types";
import type { NavGroup } from "./nav";
import { Logo } from "@/components/Logo";

interface AdminSidebarProps {
  /** Navigation already trimmed to what this team member may open */
  groups: NavGroup[];
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  /** Vendor products + vendor stores waiting for review */
  vendorsCount?: number;
}

export function AdminSidebar({
  groups,
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  vendorsCount = 0,
}: AdminSidebarProps) {
  const [filterQuery, setFilterQuery] = useState("");

  // Counts shown next to a nav item only when there is something to act on
  const counts: Partial<Record<AdminTab, number>> = {
    orders: pendingOrdersCount,
    inventory: lowStockCount,
    vendors: vendorsCount,
  };

  // Filter navigation items if admin uses quick filter
  const filteredGroups = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.tab.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, filterQuery]);

  // Close the mobile drawer with Escape and stop the page scrolling behind it
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar"
        aria-label="Dashboard sections"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex min-w-0 flex-1 items-center">
            <Logo variant="footer" size="sm" />
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-sidebar-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Nav Search Filter */}
        <div className="shrink-0 px-3 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-muted" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Quick jump..."
              className="h-8.5 w-full rounded-lg border border-sidebar-border/80 bg-sidebar-accent/50 pl-8 pr-7 text-xs text-sidebar-foreground placeholder:text-sidebar-muted/70 focus:border-rose/60 focus:bg-sidebar-accent focus:outline-hidden"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-muted hover:text-sidebar-foreground"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-3.5">
          {filteredGroups.length === 0 ? (
            <div className="py-6 text-center text-xs text-sidebar-muted">
              No sections matching &ldquo;{filterQuery}&rdquo;
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-sidebar-muted/80">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.tab;
                    const count = counts[item.tab];
                    return (
                      <li key={item.tab}>
                        <button
                          onClick={() => {
                            setActiveTab(item.tab);
                            onClose();
                          }}
                          aria-current={isActive ? "page" : undefined}
                          className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-foreground ${
                            isActive
                              ? "bg-sidebar-accent font-semibold text-sidebar-foreground shadow-xs ring-1 ring-white/10 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-r-full before:bg-rose"
                              : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-rose"
                                : "text-sidebar-muted group-hover:text-sidebar-foreground"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.label}</span>
                          {count ? (
                            <span
                              className="ml-auto inline-flex items-center gap-1 rounded-full bg-rose px-2 py-0.5 text-center text-[10px] font-bold tabular-nums text-sidebar"
                              aria-label={`${count} need attention`}
                            >
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sidebar opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sidebar" />
                              </span>
                              {count}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </nav>

        {/* Footer / Store Link */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center justify-between px-2 text-[11px] text-sidebar-muted">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Online Store</span>
            </div>
            <span className="text-[10px] text-sidebar-muted/70">Dhaka GMT+6</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-lg bg-sidebar-accent/40 px-3 py-2 text-[12px] font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Customer storefront</span>
            </span>
            <span className="text-[10px] text-sidebar-muted/70">↗</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
