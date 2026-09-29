"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import type { AdminTab } from "./types";
import { ADMIN_NAV } from "./nav";
import { Logo } from "@/components/Logo";

interface AdminSidebarProps {
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
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  vendorsCount = 0,
}: AdminSidebarProps) {
  // Counts shown next to a nav item only when there is something to act on
  const counts: Partial<Record<AdminTab, number>> = {
    orders: pendingOrdersCount,
    inventory: lowStockCount,
    vendors: vendorsCount,
  };

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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar"
        aria-label="Dashboard sections"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 shrink-0 px-5 flex items-center justify-between border-b border-sidebar-border">
          <Logo variant="footer" size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent lg:hidden focus-visible:outline-2 focus-visible:outline-sidebar-foreground"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5">
          {ADMIN_NAV.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-1.5 text-[11px] font-medium text-sidebar-muted">
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
                        className={`relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-foreground ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-foreground font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-rose"
                            : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                        {count ? (
                          <span
                            className="ml-auto min-w-5 px-1.5 rounded-full bg-rose text-sidebar text-[11px] font-bold leading-5 text-center tabular-nums"
                            aria-label={`${count} need attention`}
                          >
                            {count}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-3 border-t border-sidebar-border">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            <span>View shop</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
