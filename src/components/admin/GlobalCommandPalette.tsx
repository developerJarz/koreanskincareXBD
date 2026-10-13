"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Package,
  ReceiptText,
  Search,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";

import type { AdminTab } from "./types";
import type { NavGroup } from "./nav";
import { fmtTaka, useAccess, useDebounced } from "./shared";

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  /** Opens a tab; `query` pre-fills that tab's search box */
  onSelectTab: (tab: AdminTab, query?: string) => void;
  groups: NavGroup[];
}

type Hit = {
  key: string;
  tab: AdminTab;
  query: string;
  title: string;
  sub: string;
  badge?: string;
  icon: React.ElementType;
};

async function getJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, { cache: "no-store", signal });
  return res.ok ? res.json() : null;
}

/**
 * Ctrl/⌘ K search across the whole admin: pages, plus live database results for orders,
 * customers, invoices and products (only the kinds this role may open).
 */
export function GlobalCommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  groups,
}: GlobalCommandPaletteProps) {
  const { can } = useAccess();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const q = useDebounced(query.trim(), 250);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setHits([]);
    }
  }, [isOpen]);

  // Live search in MongoDB
  useEffect(() => {
    if (!isOpen || q.length < 2) {
      setHits([]);
      return;
    }
    const ac = new AbortController();
    const enc = encodeURIComponent(q);
    setSearching(true);
    Promise.all([
      can("orders.view") ? getJson(`/api/orders?q=${enc}&pageSize=5`, ac.signal) : null,
      can("customers.view")
        ? getJson(`/api/admin/customers?q=${enc}&pageSize=10`, ac.signal)
        : null,
      can("invoices.view") ? getJson(`/api/admin/invoices?q=${enc}&pageSize=10`, ac.signal) : null,
      can("catalog.view") ? getJson(`/api/admin/products?q=${enc}&pageSize=5`, ac.signal) : null,
    ])
      .then(([orders, customers, invoices, products]) => {
        const list: Hit[] = [];
        for (const o of orders?.items ?? []) {
          list.push({
            key: `o${o._id}`,
            tab: "orders",
            query: o.orderNumber,
            title: o.orderNumber,
            sub: `${o.shippingAddress?.fullName ?? ""} · ${o.shippingAddress?.phone ?? ""} · ${fmtTaka(o.total)}`,
            badge: o.status,
            icon: ShoppingBag,
          });
        }
        for (const c of (customers?.items ?? []).slice(0, 5)) {
          list.push({
            key: `c${c.id}`,
            tab: "customers",
            query: c.email,
            title: c.name,
            sub: `${c.email} · ${c.orders} orders · ${fmtTaka(c.spent)}`,
            icon: Users,
          });
        }
        for (const i of (invoices?.items ?? []).slice(0, 5)) {
          list.push({
            key: `i${i._id}`,
            tab: "invoices",
            query: i.invoiceNumber,
            title: i.invoiceNumber,
            sub: `${i.customer?.name ?? ""} · ${fmtTaka(i.total)}`,
            badge: i.status,
            icon: ReceiptText,
          });
        }
        for (const p of products?.items ?? []) {
          list.push({
            key: `p${p._id}`,
            tab: "products",
            query: p.name,
            title: p.name,
            sub: `${fmtTaka(p.price)} · ${p.stock ?? 0} in stock`,
            badge: p.status,
            icon: Package,
          });
        }
        setHits(list);
        setActive(0);
      })
      .catch(() => {})
      .finally(() => !ac.signal.aborted && setSearching(false));
    return () => ac.abort();
  }, [q, isOpen, can]);

  const pages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .flatMap((g) => g.items)
      .filter((i) => !needle || `${i.label} ${i.description}`.toLowerCase().includes(needle))
      .slice(0, needle ? 6 : 8);
  }, [groups, query]);

  const all = [
    ...pages.map((p) => ({ key: `nav-${p.tab}`, run: () => onSelectTab(p.tab) })),
    ...hits.map((h) => ({ key: h.key, run: () => onSelectTab(h.tab, h.query) })),
  ];

  if (!isOpen) return null;

  const choose = (index: number) => {
    all[index]?.run();
    onClose();
  };

  const row = (index: number, content: React.ReactNode, key: string) => (
    <button
      key={key}
      type="button"
      onMouseEnter={() => setActive(index)}
      onClick={() => choose(index)}
      className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${
        index === active ? "bg-secondary" : "hover:bg-secondary/60"
      }`}
    >
      {content}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-20"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the admin"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          {searching ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <input
            type="text"
            placeholder="Search pages, orders, customers, invoices, products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(all.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(active);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            autoFocus
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-3 text-xs">
          {pages.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-medium text-muted-foreground">Pages</p>
              <div className="mt-1 space-y-0.5">
                {pages.map((p, i) => {
                  const Icon = p.icon;
                  return row(
                    i,
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-foreground">{p.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {p.description}
                        </span>
                      </span>
                    </span>,
                    p.tab,
                  );
                })}
              </div>
            </div>
          )}

          {hits.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-medium text-muted-foreground">
                From the database
              </p>
              <div className="mt-1 space-y-0.5">
                {hits.map((h, i) => {
                  const Icon = h.icon;
                  return row(
                    pages.length + i,
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block font-semibold text-foreground">
                          {h.title}
                          {h.badge && (
                            <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {h.badge}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {h.sub}
                        </span>
                      </span>
                    </span>,
                    h.key,
                  );
                })}
              </div>
            </div>
          )}

          {pages.length === 0 && hits.length === 0 && !searching && (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p>
                {q.length < 2
                  ? "Type at least 2 characters to search the database."
                  : `Nothing found for “${query}”.`}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-4 py-2.5 text-[11px] text-muted-foreground">
          <span>↑↓ to move · Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
