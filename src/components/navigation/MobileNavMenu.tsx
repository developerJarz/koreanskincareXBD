"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Flame, Percent, Search, Sparkles, Tag } from "lucide-react";
import { useMemo, useState } from "react";

import type { NavData } from "@/lib/catalog-shared";
import { getResponsiveImage } from "@/lib/image";
import { BrandBadge } from "@/components/navigation/BrandBadge";
import { groupByLetter } from "@/components/navigation/group-by-letter";

/** Category and brand navigation for the phone/tablet menu drawer (accordion style). */
export function MobileNavMenu({ nav, onNavigate }: { nav: NavData; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <QuickLink
          href="/products?flag=bestseller"
          onClick={onNavigate}
          tone="amber"
          icon={<Flame className="w-4 h-4" />}
        >
          Best Sellers
        </QuickLink>
        <QuickLink
          href="/products?flag=new"
          onClick={onNavigate}
          tone="primary"
          icon={<Sparkles className="w-4 h-4" />}
        >
          New In
        </QuickLink>
        <QuickLink
          href="/products?sale=1"
          onClick={onNavigate}
          tone="rose"
          icon={<Percent className="w-4 h-4" />}
        >
          Offers
        </QuickLink>
      </div>

      <section>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 pb-2">
          Shop by category
        </p>
        <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {nav.categories.map((c) => {
            const isOpen = expanded === c.slug;
            const image = c.image ? getResponsiveImage(c.image, [160]) : null;
            return (
              <li key={c.slug}>
                <div className="flex items-center">
                  <Link
                    href={`/category/${c.slug}`}
                    onClick={onNavigate}
                    className="flex-1 flex items-center gap-3 pl-3 py-2.5 min-w-0"
                  >
                    <span className="w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-blush to-accent">
                      {image && (
                        <img
                          {...image}
                          sizes="40px"
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold truncate">{c.name}</span>
                      {c.productCount > 0 && (
                        <span className="block text-[11px] text-muted-foreground">
                          {c.productCount} products
                        </span>
                      )}
                    </span>
                  </Link>
                  {c.children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggle(c.slug)}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? "Hide" : "Show"} ${c.name} subcategories`}
                      className="self-stretch px-4 text-muted-foreground hover:text-primary"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
                      />
                    </button>
                  )}
                </div>
                {isOpen && (
                  <ul className="bg-secondary/40 px-3 py-2 grid grid-cols-2 gap-x-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                    <li className="col-span-2">
                      <Link
                        href={`/category/${c.slug}`}
                        onClick={onNavigate}
                        className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-primary"
                      >
                        All {c.name}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </li>
                    {c.children.map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/category/${s.slug}`}
                          onClick={onNavigate}
                          className="block px-2 py-2 text-[13px] text-foreground/85 rounded-lg hover:bg-background"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <BrandsSection brands={nav.brands} onNavigate={onNavigate} />
    </div>
  );
}

function BrandsSection({
  brands,
  onNavigate,
}: {
  brands: NavData["brands"];
  onNavigate: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const featured = brands.filter((b) => b.featured).slice(0, 9);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupByLetter(q ? brands.filter((b) => b.name.toLowerCase().includes(q)) : brands);
  }, [brands, query]);

  if (!brands.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Top brands
        </p>
        <Link href="/brands" onClick={onNavigate} className="text-xs font-semibold text-primary">
          View all
        </Link>
      </div>

      {featured.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {featured.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/brand/${b.slug}`}
                onClick={onNavigate}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-2.5 text-center"
              >
                <BrandBadge name={b.name} logo={b.logo} className="w-11 h-11" />
                <span className="text-[11px] font-semibold leading-tight line-clamp-1">
                  {b.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        aria-expanded={showAll}
        className="mt-2 w-full flex items-center justify-between rounded-2xl border border-border bg-card px-3.5 py-3 text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          All brands A–Z ({brands.length})
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${showAll ? "rotate-180" : ""}`}
        />
      </button>

      {showAll && (
        <div className="mt-2 rounded-2xl border border-border bg-card p-3 animate-in fade-in-0 duration-200">
          <label className="relative block mb-3">
            <span className="sr-only">Find a brand</span>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a brand…"
              className="w-full h-10 rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </label>
          {groups.length ? (
            groups.map(([letter, list]) => (
              <div key={letter} className="mb-2">
                <p className="text-xs font-bold text-primary px-1">{letter}</p>
                <ul className="grid grid-cols-2">
                  {list.map((b) => (
                    <li key={b.slug}>
                      <Link
                        href={`/brand/${b.slug}`}
                        onClick={onNavigate}
                        className="block px-1 py-1.5 text-[13px] text-foreground/85 truncate"
                      >
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground px-1 py-2">No brand matches “{query}”.</p>
          )}
        </div>
      )}
    </section>
  );
}

const TONES = {
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  primary: "bg-primary/10 text-primary",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function QuickLink({
  href,
  onClick,
  tone,
  icon,
  children,
}: {
  href: string;
  onClick: () => void;
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-bold ${TONES[tone]}`}
    >
      {icon}
      {children}
    </Link>
  );
}
