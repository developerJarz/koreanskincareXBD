"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Flame, Percent, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

import type { NavData } from "@/lib/catalog-shared";
import { getResponsiveImage } from "@/lib/image";
import { BrandBadge } from "@/components/navigation/BrandBadge";
import { groupByLetter } from "@/components/navigation/group-by-letter";

type NavCategory = NavData["categories"][number];

const OPEN_DELAY = 90;
const CLOSE_DELAY = 160;

/**
 * Desktop category bar with a mega-menu dropdown for every top-level category and for brands.
 * Opens on hover (with a short delay so passing the mouse over it doesn't flash panels) and from
 * the keyboard via each item's arrow button; Escape closes it. All data comes from the database
 * and is managed in the admin dashboard.
 */
export function DesktopMegaMenu({ nav, collapsed }: { nav: NavData; collapsed: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const openSoon = (id: string) => {
    clearTimer();
    // Moving between items while a panel is open switches instantly
    if (open) setOpen(id);
    else timer.current = setTimeout(() => setOpen(id), OPEN_DELAY);
  };
  const closeSoon = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(null), CLOSE_DELAY);
  };
  const close = useCallback(() => {
    clearTimer();
    setOpen(null);
  }, []);

  // Close after navigating, and when the bar collapses on scroll
  useEffect(close, [pathname, collapsed, close]);
  useEffect(() => clearTimer, []);

  return (
    <nav
      aria-label="Shop by category and brand"
      className={`hidden lg:block relative border-t border-border/60 bg-card/70 transition-all duration-300 ease-in-out ${
        collapsed
          ? "max-h-0 opacity-0 overflow-hidden border-transparent pointer-events-none"
          : "max-h-14 opacity-100"
      }`}
      onMouseLeave={closeSoon}
    >
      <div className="container-x flex items-center justify-between gap-4">
        <ul className="flex items-center min-w-0 overflow-x-auto scrollbar-none -ml-3">
          {nav.categories.map((c) => (
            <MenuItem
              key={c.slug}
              id={c.slug}
              label={c.name}
              href={`/category/${c.slug}`}
              active={
                pathname === `/category/${c.slug}` ||
                c.children.some((s) => pathname === `/category/${s.slug}`)
              }
              open={open === c.slug}
              onHover={openSoon}
              onToggle={(id) => setOpen((cur) => (cur === id ? null : id))}
              onClose={close}
            >
              <CategoryPanel category={c} onNavigate={close} />
            </MenuItem>
          ))}
          <MenuItem
            id="__brands"
            label="Brands"
            href="/brands"
            active={pathname === "/brands" || pathname.startsWith("/brand/")}
            open={open === "__brands"}
            onHover={openSoon}
            onToggle={(id) => setOpen((cur) => (cur === id ? null : id))}
            onClose={close}
          >
            <BrandsPanel brands={nav.brands} onNavigate={close} />
          </MenuItem>
        </ul>

        <div
          className="flex items-center gap-1 shrink-0 text-[13px] font-semibold"
          onMouseEnter={closeSoon}
        >
          <Link
            href="/products?flag=bestseller"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            Best Sellers
          </Link>
          <Link
            href="/products?flag=new"
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-foreground/80 hover:text-primary hover:bg-secondary/70`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            New Arrivals
          </Link>
          <Link
            href="/products?sale=1"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20`}
          >
            <Percent className="w-3.5 h-3.5" aria-hidden="true" />
            Offers
          </Link>
        </div>
      </div>
    </nav>
  );
}

function MenuItem({
  id,
  label,
  href,
  active,
  open,
  onHover,
  onToggle,
  onClose,
  children,
}: {
  id: string;
  label: string;
  href: string;
  active: boolean;
  open: boolean;
  onHover: (id: string) => void;
  onToggle: (id: string) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const highlighted = open || active;

  return (
    <li
      onMouseEnter={() => onHover(id)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          onClose();
          toggleRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        // Close when keyboard focus leaves this item and its panel
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) onClose();
      }}
    >
      <div
        className={`relative flex items-center rounded-lg transition-colors after:absolute after:left-3 after:right-3 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:origin-center ${
          highlighted ? "text-primary after:scale-x-100" : "text-foreground/80 after:scale-x-0"
        }`}
      >
        <Link
          href={href}
          className="pl-3 pr-1 py-2.5 text-[13px] font-semibold whitespace-nowrap hover:text-primary transition-colors"
        >
          {label}
        </Link>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={`${open ? "Hide" : "Show"} ${label} menu`}
          onClick={() => onToggle(id)}
          className="pr-2.5 pl-0.5 py-2.5 hover:text-primary transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {open && (
        // Positioned against the <nav>, so it spans the full width under the bar
        <div id={panelId} className="absolute left-0 right-0 top-full z-50 pt-px">
          <div className="container-x">
            <div className="rounded-b-2xl border border-t-0 border-border bg-popover text-popover-foreground shadow-[0_24px_48px_-16px_rgb(0_0_0/0.18)] animate-in fade-in-0 slide-in-from-top-1 duration-200">
              {children}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function CategoryPanel({
  category,
  onNavigate,
}: {
  category: NavCategory;
  onNavigate: () => void;
}) {
  const image = category.image ? getResponsiveImage(category.image, [480, 800]) : null;

  return (
    <div className="grid grid-cols-12 gap-8 p-6 xl:p-7">
      <div className="col-span-7">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Shop {category.name}
          </p>
          <Link
            href={`/category/${category.slug}`}
            onClick={onNavigate}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            View all {category.productCount > 0 ? `${category.productCount} products` : ""}
            <ArrowRight
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {category.children.length ? (
          <ul className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-0.5">
            {category.children.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/category/${s.slug}`}
                  onClick={onNavigate}
                  className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 -mx-2.5 text-sm text-foreground/85 hover:bg-secondary hover:text-primary transition-colors"
                >
                  <span className="truncate">{s.name}</span>
                  {s.productCount > 0 && (
                    <span className="text-[11px] tabular-nums text-muted-foreground group-hover:text-primary/70">
                      {s.productCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground max-w-md">{category.description}</p>
        )}
      </div>

      <div className="col-span-2 border-l border-border pl-6">
        {category.topBrands.length > 0 && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
              Top brands
            </p>
            <ul className="space-y-0.5">
              {category.topBrands.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/brand/${b.slug}`}
                    onClick={onNavigate}
                    className="block py-1.5 text-sm text-foreground/85 hover:text-primary transition-colors truncate"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Link
        href={`/category/${category.slug}`}
        onClick={onNavigate}
        className="group col-span-3 relative block min-h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-blush to-accent"
      >
        {image && (
          <img
            {...image}
            sizes="320px"
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 p-4 text-white">
          <span className="block font-serif text-lg font-semibold leading-tight">
            {category.name}
          </span>
          {category.description && (
            <span className="mt-1 block text-xs text-white/85 line-clamp-2">
              {category.description}
            </span>
          )}
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white text-foreground px-3 py-1 text-xs font-semibold">
            Shop now
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </span>
        </span>
      </Link>
    </div>
  );
}

function BrandsPanel({
  brands,
  onNavigate,
}: {
  brands: NavData["brands"];
  onNavigate: () => void;
}) {
  const [query, setQuery] = useState("");
  const featured = useMemo(() => brands.filter((b) => b.featured).slice(0, 9), [brands]);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupByLetter(q ? brands.filter((b) => b.name.toLowerCase().includes(q)) : brands);
  }, [brands, query]);

  return (
    <div className="grid grid-cols-12 gap-8 p-6 xl:p-7">
      <div className="col-span-8 min-w-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            All brands A–Z{" "}
            <span className="font-medium normal-case tracking-normal">({brands.length})</span>
          </p>
          <label className="relative w-56">
            <span className="sr-only">Find a brand</span>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a brand…"
              className="w-full h-8 rounded-full border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </label>
        </div>

        {groups.length ? (
          // Scroll on a wrapper: a height cap on the columns element itself would push the
          // extra brands into hidden columns off to the side instead of scrolling down
          <div className="max-h-[min(60vh,24rem)] overflow-y-auto pr-2">
            <div className="columns-3 xl:columns-4 gap-6">
              {groups.map(([letter, list]) => (
                <div key={letter} className="break-inside-avoid mb-3">
                  <p className="text-xs font-bold text-primary mb-1">{letter}</p>
                  <ul>
                    {list.map((b) => (
                      <li key={b.slug}>
                        <Link
                          href={`/brand/${b.slug}`}
                          onClick={onNavigate}
                          className="group flex items-baseline gap-1.5 py-1 text-sm text-foreground/85 hover:text-primary transition-colors"
                        >
                          <span className="truncate">{b.name}</span>
                          {b.productCount > 0 && (
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              {b.productCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6">No brand matches “{query}”.</p>
        )}
      </div>

      <div className="col-span-4 border-l border-border pl-6 flex flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
          Featured brands
        </p>
        <ul className="grid grid-cols-3 gap-2">
          {featured.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/brand/${b.slug}`}
                onClick={onNavigate}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-transparent p-2 text-center hover:border-border hover:bg-secondary/60 transition-colors"
              >
                <BrandBadge
                  name={b.name}
                  logo={b.logo}
                  className="w-12 h-12 transition-transform group-hover:scale-105"
                />
                <span className="text-[11px] font-semibold leading-tight line-clamp-1">
                  {b.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/brands"
          onClick={onNavigate}
          className="mt-auto pt-4 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          Browse all brands
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
