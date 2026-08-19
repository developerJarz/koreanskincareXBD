"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, PRODUCTS } from "@/lib/site-data";

const SORTS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest"] as const;

export default function ShopPageClient({ initialCategory }: { initialCategory: string }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Featured");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const flashSale = useMemo(
    () =>
      PRODUCTS.filter((product) => product.tag === "Sale" || product.tag === "Limited").slice(0, 3),
    [],
  );

  const products = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = PRODUCTS.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesQuery =
        !needle ||
        product.name.toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      if (sort === "Newest") return a.tag === "New" ? -1 : b.tag === "New" ? 1 : 0;
      return 0;
    });
  }, [activeCategory, query, sort]);

  return (
    <section className="container-x py-12 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-xs tracking-[0.2em] uppercase text-primary">Shop</p>
        <h1 className="font-serif text-5xl lg:text-6xl mt-3">The full collection</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Browse by category, search by name, or jump into what is on sale right now.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
        <aside className="lg:sticky lg:top-24 space-y-6 rounded-3xl border border-border bg-card p-5">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </p>
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </label>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Categories
            </p>
            <div className="grid gap-2">
              <button
                onClick={() => {
                  setActiveCategory("all");
                  router.replace(pathname);
                }}
                className={`rounded-2xl border px-4 py-2.5 text-left text-sm transition ${activeCategory === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
              >
                All products
              </button>
              {CATEGORIES.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => {
                    setActiveCategory(category.slug);
                    router.replace(`${pathname}?category=${category.slug}`);
                  }}
                  className={`rounded-2xl border px-4 py-2.5 text-left text-sm transition ${activeCategory === category.slug ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Sort</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
            >
              {SORTS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Flash sale
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Handpicked markdowns that move quickly. Check these first.
            </p>
            <div className="mt-4 space-y-3">
              {flashSale.map((product) => (
                <Link
                  key={product.slug}
                  href={`/product/${encodeURIComponent(product.slug)}`}
                  className="block rounded-xl border border-border bg-background px-3 py-2 text-sm hover:border-primary transition"
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ৳{product.price.toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <p className="text-sm text-muted-foreground">{products.length} products found</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Curated for easy browsing
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card py-20 text-center">
              <p className="font-serif text-2xl">No products match that filter.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                  router.replace(pathname);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">
              {products.map((product) => (
                <ProductCard key={product.slug} p={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
