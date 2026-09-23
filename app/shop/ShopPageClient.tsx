"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Grid3X3,
  Grid2X2,
  X,
  RotateCcw,
  Check,
  ShieldCheck,
  Zap,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, PRODUCTS, type Product } from "@/lib/site-data";
import { mapDbProduct } from "@/lib/product-utils";

const SORTS = [
  { label: "Featured & Popular", value: "featured" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Highest Rated", value: "rating" },
  { label: "New Arrivals", value: "newest" },
] as const;

const PRICE_PRESETS = [
  { label: "All Prices", min: 0, max: 100000 },
  { label: "Under ৳1,500", min: 0, max: 1500 },
  { label: "৳1,500 - ৳2,200", min: 1500, max: 2200 },
  { label: "Above ৳2,200", min: 2200, max: 100000 },
];

export default function ShopPageClient({ initialCategory }: { initialCategory: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || "all");
  const [sort, setSort] = useState<string>("featured");
  const [pricePreset, setPricePreset] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Dynamic API products & categories (with fallback to site-data)
  const [dbProducts, setDbProducts] = useState<Product[]>(PRODUCTS);
  const [dbCategories, setDbCategories] = useState(CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setActiveCategory(initialCategory || "all");
  }, [initialCategory]);

  // Fetch live categories and products from DB
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/products?limit=100", { credentials: "omit" }),
        ]);

        if (catRes.ok && isMounted) {
          const catData = await catRes.json();
          if (catData?.categories?.length) {
            setDbCategories(catData.categories);
          }
        }

        if (prodRes.ok && isMounted) {
          const prodData = await prodRes.json();
          if (prodData?.products?.length) {
            const mapped = prodData.products.map((p: any) => mapDbProduct(p));
            setDbProducts(mapped);
          }
        }
      } catch (err) {
        console.warn("Using fallback local data for shop catalog:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: dbProducts.length };
    dbProducts.forEach((p) => {
      const catSlug = p.categorySlug || p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      counts[catSlug] = (counts[catSlug] || 0) + 1;
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [dbProducts]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const preset = PRICE_PRESETS[pricePreset];

    return dbProducts
      .filter((product) => {
        // Category match
        const catSlug =
          product.categorySlug || product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const matchesCategory =
          activeCategory === "all" ||
          catSlug === activeCategory ||
          product.category.toLowerCase() === activeCategory.toLowerCase();

        // Search match
        const matchesQuery =
          !needle ||
          product.name.toLowerCase().includes(needle) ||
          product.category.toLowerCase().includes(needle) ||
          (product.description && product.description.toLowerCase().includes(needle));

        // Price match
        const matchesPrice = product.price >= preset.min && product.price <= preset.max;

        // Stock match
        const matchesStock = !inStockOnly || product.stock === undefined || product.stock > 0;

        // Tag match
        const matchesTag =
          selectedTag === "all" ||
          (product.tag && product.tag.toLowerCase() === selectedTag.toLowerCase());

        return matchesCategory && matchesQuery && matchesPrice && matchesStock && matchesTag;
      })
      .sort((a, b) => {
        if (sort === "price_asc") return a.price - b.price;
        if (sort === "price_desc") return b.price - a.price;
        if (sort === "newest") return a.tag === "New" ? -1 : b.tag === "New" ? 1 : 0;
        if (sort === "rating") return (b.rating || 4.9) - (a.rating || 4.9);
        // Featured default: prioritize Sale, Best Seller, New
        const tagPriority: Record<string, number> = {
          "Best Seller": 4,
          Sale: 3,
          Hot: 2,
          New: 1,
        };
        const priorityA = tagPriority[a.tag || ""] || 0;
        const priorityB = tagPriority[b.tag || ""] || 0;
        return priorityB - priorityA;
      });
  }, [dbProducts, activeCategory, query, pricePreset, inStockOnly, selectedTag, sort]);

  // Flash sale items for sidebar
  const flashSaleItems = useMemo(
    () =>
      dbProducts
        .filter((p) => p.tag === "Sale" || p.tag === "Limited" || (p.was && p.was > p.price))
        .slice(0, 3),
    [dbProducts],
  );

  // Clear all filters
  const resetFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setPricePreset(0);
    setInStockOnly(false);
    setSelectedTag("all");
    setSort("featured");
    startTransition(() => {
      router.replace(pathname);
    });
  };

  const hasActiveFilters =
    activeCategory !== "all" ||
    query !== "" ||
    pricePreset !== 0 ||
    inStockOnly ||
    selectedTag !== "all" ||
    sort !== "featured";

  const handleCategorySelect = (slug: string) => {
    setActiveCategory(slug);
    startTransition(() => {
      if (slug === "all") {
        router.replace(pathname);
      } else {
        router.replace(`${pathname}?category=${slug}`);
      }
    });
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Header */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/40 to-background py-10 lg:py-14">
        <div className="container-x">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Authentic Korean Formulations Direct from Seoul</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground font-normal">
                Curated K-Beauty Collection
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Discover clinically-tested Korean skincare essentials for radiant, healthy glass
                skin. Delivered anywhere in Bangladesh with Cash on Delivery.
              </p>
            </div>

            {/* Live Search & Fast Filter Bar */}
            <div className="w-full md:w-80 lg:w-96">
              <label className="relative flex items-center rounded-2xl border border-border bg-card px-4 py-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search brand, ingredient, or product..."
                  className="w-full bg-transparent pl-3 pr-8 text-sm focus:outline-none placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </label>
            </div>
          </div>

          {/* Category Pills Slider */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => handleCategorySelect("all")}
              className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all border ${
                activeCategory === "all"
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              All Products ({categoryCounts["all"] || dbProducts.length})
            </button>
            {dbCategories.map((cat) => {
              const count = categoryCounts[cat.slug] || 0;
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Catalog Layout */}
      <div className="container-x py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Refine Catalog
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Price Range
              </label>
              <div className="grid gap-1.5">
                {PRICE_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    onClick={() => setPricePreset(idx)}
                    className={`text-left px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      pricePreset === idx
                        ? "bg-primary/10 text-primary font-bold border border-primary/20"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {pricePreset === idx && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock Toggle */}
            <div className="pt-3 border-t border-border">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition">
                  In Stock Only
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </label>
            </div>

            {/* Tag / Collection Filter */}
            <div className="pt-3 border-t border-border space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Collections & Badges
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["all", "Best Seller", "Sale", "New", "Hot"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                      selectedTag === t
                        ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                        : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {t === "all" ? "All Tags" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Flash Sale Promo Box */}
            {flashSaleItems.length > 0 && (
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/40 to-background p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>K-Beauty Flash Deals</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Limited inventory import specials at direct Seoul distributor prices.
                </p>
                <div className="space-y-2 pt-1">
                  {flashSaleItems.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/product/${encodeURIComponent(item.slug)}`}
                      className="block p-2.5 rounded-xl border border-border bg-card hover:border-primary transition group"
                    >
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition line-clamp-1">
                        {item.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-primary font-sans">
                          ৳{item.price.toLocaleString()}
                        </span>
                        {item.was && (
                          <span className="text-muted-foreground line-through font-sans">
                            ৳{item.was.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Right Product Area */}
          <div className="space-y-6">
            {/* Control Bar: Total Count, Active Filter Chips, Sort & Grid Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground shadow-sm"
                >
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>Filters</span>
                </button>

                <p className="text-sm text-muted-foreground font-medium">
                  Showing{" "}
                  <span className="font-bold text-foreground">{filteredProducts.length}</span>{" "}
                  {filteredProducts.length === 1 ? "product" : "authentic Korean products"}
                </p>
              </div>

              {/* Sorting and Grid Switcher */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary shadow-sm"
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid columns toggle (Desktop) */}
                <div className="hidden sm:flex items-center border border-border rounded-xl bg-card p-1 shadow-sm">
                  <button
                    onClick={() => setGridCols(3)}
                    className={`p-1.5 rounded-lg transition ${
                      gridCols === 3
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="3 Columns"
                  >
                    <Grid2X2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={`p-1.5 rounded-lg transition ${
                      gridCols === 4
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="4 Columns"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
                {activeCategory !== "all" && (
                  <button
                    onClick={() => handleCategorySelect("all")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  >
                    <span>Category: {activeCategory}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  >
                    <span>Search: "{query}"</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {pricePreset !== 0 && (
                  <button
                    onClick={() => setPricePreset(0)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  >
                    <span>Price: {PRICE_PRESETS[pricePreset].label}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {inStockOnly && (
                  <button
                    onClick={() => setInStockOnly(false)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  >
                    <span>In Stock Only</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedTag !== "all" && (
                  <button
                    onClick={() => setSelectedTag("all")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  >
                    <span>Tag: {selectedTag}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary font-semibold hover:underline ml-2"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Product Grid or Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 lg:p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl lg:text-3xl font-medium text-foreground">
                  No products found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We couldn't find any Korean skincare products matching your current search or
                  filter criteria. Try resetting your filters or exploring our bestsellers.
                </p>
                <div className="pt-2">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-95 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All Filters
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`grid grid-cols-2 gap-4 lg:gap-6 ${
                  gridCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.slug} p={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-card border-l border-border h-full p-6 overflow-y-auto z-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="font-serif text-xl font-bold">Filters</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Price Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Price Range
                </label>
                <div className="grid gap-1">
                  {PRICE_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.label}
                      onClick={() => setPricePreset(idx)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                        pricePreset === idx
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-secondary/40 text-foreground"
                      }`}
                    >
                      <span>{preset.label}</span>
                      {pricePreset === idx && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock */}
              <div className="pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                  <span className="text-xs font-bold text-foreground">In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-primary accent-primary"
                  />
                </label>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Badges
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["all", "Best Seller", "Sale", "New", "Hot"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                        selectedTag === t
                          ? "border-primary bg-primary text-primary-foreground font-bold"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {t === "all" ? "All Tags" : t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-2">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider"
              >
                Apply & View ({filteredProducts.length} Results)
              </button>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="w-full py-2.5 rounded-2xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Reset All
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
