"use client";

import { useState, useEffect } from "react";
import { Search, X, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/store/ui.store";
import { PRODUCTS } from "@/lib/site-data";
import { useCartStore } from "@/store/cart.store";
import { toCartItem } from "@/lib/product-utils";
import { getImageSrc } from "@/lib/image";
import { toast } from "sonner";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800";

const POPULAR_SEARCHES = [
  "COSRX Snail Mucin",
  "Beauty of Joseon Sunscreen",
  "Anua Heartleaf 77%",
  "Centella Ampoule",
  "Laneige Lip Mask",
  "Torriden Serum",
];

export function SearchDialog() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useUIStore.getState().toggleSearch();
      }
      if (e.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  if (!isSearchOpen) return null;

  const needle = query.trim().toLowerCase();
  const results = needle
    ? PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.category.toLowerCase().includes(needle) ||
          (p.brand && p.brand.toLowerCase().includes(needle)) ||
          (p.description && p.description.toLowerCase().includes(needle)),
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-fade-up"
        onClick={closeSearch}
      />
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-up">
        {/* Search input bar */}
        <div className="flex items-center px-6 py-4 border-b border-border gap-3">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search COSRX, Snail Mucin, Sunscreen, Toners, Serums..."
            className="w-full bg-transparent text-base focus:outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:text-primary text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={closeSearch}
            className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-accent"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          {!query.trim() ? (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
                Popular K-Beauty Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 rounded-full border border-border bg-secondary/50 text-xs font-medium hover:border-primary hover:text-primary transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No Korean skincare products found matching "{query}"
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Found {results.length} authentic Korean products
              </p>
              <div className="grid gap-3">
                {results.map((p) => {
                  const imageSrc = getImageSrc(p.img) || FALLBACK_IMAGE;
                  return (
                    <div
                      key={p.slug}
                      className="flex items-center justify-between p-3 rounded-2xl border border-border hover:bg-accent/40 transition group"
                    >
                      <Link
                        href={`/product/${encodeURIComponent(p.slug)}`}
                        onClick={closeSearch}
                        className="flex items-center gap-4 flex-1 min-w-0"
                      >
                        <img
                          src={imageSrc}
                          alt={p.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                          }}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border/60"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                            {p.category}
                          </p>
                          <p className="font-semibold text-sm truncate group-hover:text-primary transition text-foreground">
                            {p.name}
                          </p>
                          <p className="font-sans font-bold text-sm text-foreground mt-0.5">
                            ৳{p.price.toLocaleString()}
                          </p>
                        </div>
                      </Link>

                      <button
                        onClick={() => {
                          addItem(toCartItem(p));
                          toast.success(`${p.name} added to cart`);
                          closeSearch();
                          useUIStore.getState().openCart();
                        }}
                        className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition shrink-0 ml-2 shadow-xs"
                        title="Quick Add"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press ESC to close</span>
          <Link
            href="/shop"
            onClick={closeSearch}
            className="text-primary font-semibold hover:underline flex items-center gap-1"
          >
            View full K-Beauty collection <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
