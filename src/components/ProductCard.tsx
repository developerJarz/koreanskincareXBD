"use client";

import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";

import type { CardProduct } from "@/lib/catalog-shared";
import { getResponsiveImage } from "@/lib/image";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";

const BADGE_STYLE: Record<CardProduct["badges"][number], string> = {
  Bestseller: "bg-foreground text-background",
  New: "bg-emerald-700 text-white",
  Sale: "bg-primary text-primary-foreground",
  Trending: "bg-amber-600 text-white",
};

const taka = (n: number) => `৳${new Intl.NumberFormat("en-US").format(n)}`;

export function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);
  const image = getResponsiveImage(p.img);
  // The discount badge already says "sale", so show at most one other badge
  const badge = p.badges.find((b) => b !== "Sale");
  const href = `/product/${encodeURIComponent(p.slug)}`;

  const addToCart = () => {
    addItem({
      productId: p.id,
      name: p.name,
      image: p.img,
      price: p.price,
      compareAtPrice: p.was ?? undefined,
      quantity: 1,
      category: p.categorySlug ?? p.category,
      slug: p.slug,
    });
    openCart();
    toast.success(`${p.name} added to your bag`);
  };

  return (
    <article className="group flex flex-col rounded-2xl bg-card border border-border/70 hover:border-primary/40 hover:shadow-lg transition-[border-color,box-shadow] duration-200 overflow-hidden">
      <Link
        href={href}
        className="block relative bg-secondary/60 aspect-square overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          {...image}
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
          alt=""
          width={600}
          height={600}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {p.discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground">
              -{p.discountPercent}%
            </span>
          )}
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${BADGE_STYLE[badge]}`}
            >
              {badge}
            </span>
          )}
        </span>
        {!p.inStock && (
          <span className="absolute inset-x-0 bottom-0 py-1.5 text-center text-xs font-semibold bg-background/85 text-foreground">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-3">
        {p.brand && (
          <Link
            href={`/brand/${p.brandSlug}`}
            className="text-[11px] font-semibold text-muted-foreground hover:text-primary truncate"
          >
            {p.brand}
          </Link>
        )}
        <Link
          href={href}
          className="mt-0.5 text-sm font-medium text-foreground leading-snug line-clamp-2 hover:text-primary min-h-[2.5rem]"
        >
          {p.name}
        </Link>

        {p.reviewCount > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="sr-only">Rated</span>
            <span className="font-medium text-foreground">{p.rating.toFixed(1)}</span>
            <span>
              ({p.reviewCount}
              <span className="sr-only"> reviews</span>)
            </span>
          </p>
        )}

        <p className="mt-auto pt-2 flex items-baseline gap-2 flex-wrap">
          <span className="font-bold text-base text-foreground tabular-nums">{taka(p.price)}</span>
          {p.was && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              <span className="sr-only">was </span>
              {taka(p.was)}
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={addToCart}
          disabled={!p.inStock}
          aria-label={p.inStock ? `Add ${p.name} to bag` : `${p.name} is out of stock`}
          className="mt-2.5 w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
          {p.inStock ? "Add to bag" : "Out of stock"}
        </button>
      </div>
    </article>
  );
}
