"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { listingHref, type QueryRecord } from "@/lib/catalog-url";

type Facet = { slug: string; name: string; count: number };

type Props = {
  basePath: string;
  query: QueryRecord;
  brandFacets: Facet[];
  categoryFacets: Facet[];
  showBrands?: boolean;
  showCategories?: boolean;
};

const RATINGS = [
  { value: "4", label: "4 stars & up" },
  { value: "3", label: "3 stars & up" },
];

/**
 * Filter panel. Every change updates the URL (so filtered pages can be shared and bookmarked);
 * the server then re-renders the product list with the new filters.
 * Desktop: sidebar. Phones: a "Filters" button that opens a panel.
 */
export function ListingFilters(props: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    "brand",
    "minPrice",
    "maxPrice",
    "rating",
    "inStock",
    "sale",
    "category",
  ].filter((k) => props.query[k] && !(k === "category" && !props.showCategories)).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-card text-sm font-medium"
        aria-expanded={open}
        aria-controls="listing-filters-panel"
      >
        <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
        Filters{activeCount ? ` (${activeCount})` : ""}
      </button>

      <aside className="hidden lg:block" aria-label="Filters">
        <FilterBody {...props} />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="listing-filters-panel"
            className="absolute inset-y-0 right-0 w-[min(22rem,90vw)] bg-background overflow-y-auto p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold font-sans tracking-normal">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterBody {...props} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function FilterBody({
  basePath,
  query,
  brandFacets,
  categoryFacets,
  showBrands = true,
  showCategories = false,
  onNavigate,
}: Props & { onNavigate?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [minPrice, setMinPrice] = useState(query.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice ?? "");
  const [brandSearch, setBrandSearch] = useState("");

  useEffect(() => {
    setMinPrice(query.minPrice ?? "");
    setMaxPrice(query.maxPrice ?? "");
  }, [query.minPrice, query.maxPrice]);

  const go = (changes: Record<string, string | null>) => {
    onNavigate?.();
    startTransition(() => router.push(listingHref(basePath, query, changes), { scroll: false }));
  };

  const selectedBrands = new Set((query.brand ?? "").split(",").filter(Boolean));
  const toggleBrand = (slug: string) => {
    const next = new Set(selectedBrands);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    go({ brand: [...next].join(",") || null });
  };

  const brands = brandFacets.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.trim().toLowerCase()),
  );
  const anyActive =
    ["brand", "minPrice", "maxPrice", "rating", "inStock", "sale"].some((k) => query[k]) ||
    (showCategories && query.category);

  return (
    <div
      className={`space-y-6 text-sm transition-opacity ${pending ? "opacity-60" : ""}`}
      aria-busy={pending}
    >
      {anyActive && (
        <button
          type="button"
          onClick={() =>
            go({
              brand: null,
              minPrice: null,
              maxPrice: null,
              rating: null,
              inStock: null,
              sale: null,
              ...(showCategories ? { category: null } : {}),
            })
          }
          className="text-primary text-sm font-medium hover:underline"
        >
          Clear all filters
        </button>
      )}

      {showCategories && categoryFacets.length > 0 && (
        <fieldset>
          <legend className="font-semibold mb-2">Category</legend>
          <ul className="space-y-1">
            {categoryFacets.map((c) => {
              const active = query.category === c.slug;
              return (
                <li key={c.slug}>
                  <Link
                    href={listingHref(basePath, query, { category: active ? null : c.slug })}
                    onClick={onNavigate}
                    scroll={false}
                    aria-current={active ? "true" : undefined}
                    className={`flex justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary ${active ? "bg-secondary font-semibold text-primary" : ""}`}
                  >
                    <span>{c.name}</span>
                    <span className="text-muted-foreground tabular-nums">{c.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {showBrands && brandFacets.length > 0 && (
        <fieldset>
          <legend className="font-semibold mb-2">Brand</legend>
          {brandFacets.length > 8 && (
            <input
              type="search"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Search brands"
              aria-label="Search brands"
              className="mb-2 w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
            />
          )}
          <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {brands.map((b) => (
              <li key={b.slug}>
                <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.has(b.slug)}
                    onChange={() => toggleBrand(b.slug)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="flex-1">{b.name}</span>
                  <span className="text-muted-foreground tabular-nums">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <fieldset>
        <legend className="font-semibold mb-2">Price (৳)</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            go({ minPrice: minPrice || null, maxPrice: maxPrice || null });
          }}
        >
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="w-full h-9 px-2 rounded-lg border border-border bg-background"
          />
          <span aria-hidden="true">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="w-full h-9 px-2 rounded-lg border border-border bg-background"
          />
          <button
            type="submit"
            className="h-9 px-3 rounded-lg bg-foreground text-background font-medium"
          >
            Go
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="font-semibold mb-2">Rating</legend>
        <div className="space-y-1">
          {RATINGS.map((r) => (
            <label
              key={r.value}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary cursor-pointer"
            >
              <input
                type="radio"
                name="rating"
                checked={query.rating === r.value}
                onChange={() => go({ rating: r.value })}
                className="accent-[var(--primary)]"
              />
              {r.label}
            </label>
          ))}
          {query.rating && (
            <button
              type="button"
              onClick={() => go({ rating: null })}
              className="px-2 text-xs text-primary hover:underline"
            >
              Any rating
            </button>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-1">
        <legend className="font-semibold mb-2">Availability</legend>
        <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={query.inStock === "1"}
            onChange={(e) => go({ inStock: e.target.checked ? "1" : null })}
            className="accent-[var(--primary)]"
          />
          In stock only
        </label>
        <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={query.sale === "1"}
            onChange={(e) => go({ sale: e.target.checked ? "1" : null })}
            className="accent-[var(--primary)]"
          />
          On sale
        </label>
      </fieldset>
    </div>
  );
}
