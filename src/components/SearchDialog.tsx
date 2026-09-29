"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";

import { useUIStore } from "@/store/ui.store";
import type { CardProduct } from "@/lib/catalog-shared";
import { getResponsiveImage } from "@/lib/image";

const POPULAR_SEARCHES = [
  "COSRX",
  "Snail mucin",
  "Sunscreen",
  "Toner",
  "Beauty of Joseon",
  "Serum",
];
const taka = (n: number) => `৳${new Intl.NumberFormat("en-US").format(n)}`;

/**
 * Site search (Ctrl/⌘ K). Queries the database as you type (debounced) — product names, brands,
 * categories and SKUs — and Enter opens the full results page with filters.
 */
export function SearchDialog() {
  const router = useRouter();
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUIStore.getState().toggleSearch();
      }
      if (e.key === "Escape" && useUIStore.getState().isSearchOpen) closeSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSearch]);

  // Debounced search; stale responses are ignored if the user kept typing
  useEffect(() => {
    const q = query.trim();
    if (!isSearchOpen || q.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&pageSize=6`);
        const data = await res.json();
        if (id !== requestId.current) return;
        setResults(res.ok ? data.items : []);
        setTotal(res.ok ? data.total : 0);
      } catch {
        if (id === requestId.current) setResults([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, isSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim();
  const openAll = () => {
    if (!q) return;
    closeSearch();
    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closeSearch}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10">
        <form
          className="flex items-center px-5 py-4 border-b border-border gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            openAll();
          }}
        >
          <Search className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands or categories"
            aria-label="Search products, brands or categories"
            className="w-full bg-transparent text-base focus:outline-none placeholder:text-muted-foreground"
          />
          {loading && (
            <Loader2
              className="w-4 h-4 animate-spin text-muted-foreground shrink-0"
              aria-label="Searching"
            />
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 hover:text-primary text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-accent"
          >
            Esc
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-5" aria-live="polite">
          {q.length < 2 ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 rounded-full border border-border bg-secondary/50 text-sm hover:border-primary hover:text-primary transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : !loading && results.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">No products found for “{q}”.</p>
          ) : (
            <>
              <ul className="grid gap-2">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${encodeURIComponent(p.slug)}`}
                      onClick={closeSearch}
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-secondary/60"
                    >
                      <img
                        {...getResponsiveImage(p.img, [120, 240])}
                        sizes="56px"
                        alt=""
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-xl object-cover bg-secondary shrink-0"
                      />
                      <span className="flex-1 min-w-0">
                        {p.brand && (
                          <span className="block text-xs text-muted-foreground">{p.brand}</span>
                        )}
                        <span className="block text-sm font-medium truncate">{p.name}</span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{taka(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {total > results.length && (
                <button
                  type="button"
                  onClick={openAll}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                >
                  See all {total} results <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
