"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import type { ProductDisplay } from "@/lib/product-utils";
import { toCartItem } from "@/lib/product-utils";
import { getImageSrc } from "@/lib/image";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { toast } from "sonner";

const FALLBACK_KBEAUTY_IMAGE = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800";

export function ProductCard({ p }: { p: ProductDisplay }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  const initialSrc = getImageSrc(p.img) || FALLBACK_KBEAUTY_IMAGE;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(getImageSrc(p.img) || FALLBACK_KBEAUTY_IMAGE);
  }, [p.img]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(toCartItem(p));
    openCart();
    toast.success(`${p.name} added to cart`, {
      description: "Item successfully added to your shopping bag.",
    });
  };

  const discountPercent = p.was ? Math.round(((p.was - p.price) / p.was) * 100) : 0;

  return (
    <Link
      href={`/product/${encodeURIComponent(p.slug)}`}
      className="group block card-interactive p-3 rounded-3xl bg-card border border-border/70 hover:border-primary/40 shadow-xs hover:shadow-xl transition-all duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl bg-secondary/70 aspect-[4/5]">
        <img
          src={imgSrc}
          alt={p.name}
          width={800}
          height={1000}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            if (imgSrc !== FALLBACK_KBEAUTY_IMAGE) {
              setImgSrc(FALLBACK_KBEAUTY_IMAGE);
            }
          }}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-108 ${
            imgLoaded ? "opacity-100" : "opacity-90"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Tags */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {p.tag && (
            <span className="glass-card text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-foreground border border-white/30 shadow-xs">
              {p.tag}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-rose-500/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className="absolute top-2.5 right-2.5 w-8.5 h-8.5 rounded-full glass-card flex items-center justify-center text-foreground/80 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-xs"
          aria-label="Add to Wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toast.info(`${p.name} saved to your wishlist!`);
          }}
        >
          <Heart className="w-4 h-4 transition-transform group-hover:fill-rose-500/20" />
        </button>

        {/* Quick Add Button */}
        <button
          className="absolute inset-x-2.5 bottom-2.5 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-primary/95 shadow-lg shadow-primary/25 transition-all duration-300"
          onClick={handleQuickAdd}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Quick Add</span>
        </button>
      </div>

      <div className="pt-3 px-1 pb-0.5">
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          {p.category}
        </p>
        <p className="text-sm font-semibold text-foreground mt-0.5 line-clamp-1 group-hover:text-primary transition-colors">
          {p.name}
        </p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-sans font-bold text-base tracking-tight text-foreground">
            ৳{p.price.toLocaleString()}
          </span>
          {p.was && (
            <span className="font-sans text-xs text-muted-foreground line-through opacity-75">
              ৳{p.was.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
