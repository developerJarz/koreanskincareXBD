"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { ProductDisplay } from "@/lib/product-utils";
import { toCartItem } from "@/lib/product-utils";
import { getImageSrc } from "@/lib/image";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { toast } from "sonner";

export function ProductCard({ p }: { p: ProductDisplay }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(toCartItem(p));
    openCart();
    toast.success(`${p.name} added to cart`);
  };

  return (
    <Link href={`/product/${encodeURIComponent(p.slug)}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-secondary">
        <img
          src={getImageSrc(p.img)}
          alt={p.name}
          width={800}
          height={1000}
          loading="lazy"
          className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {p.tag && (
          <span className="absolute top-3 left-3 bg-background/90 backdrop-blur text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full">
            {p.tag}
          </span>
        )}
        <button
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:text-primary"
          aria-label="Wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toast.info("Sign in to save to wishlist");
          }}
        >
          <Heart className="w-4 h-4" />
        </button>
        <button
          className="absolute inset-x-3 bottom-3 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition"
          onClick={handleQuickAdd}
        >
          Quick add
        </button>
      </div>
      <div className="pt-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.category}</p>
        <p className="text-sm font-medium mt-0.5">{p.name}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-sans font-bold text-base tracking-tight text-foreground">
            ৳{p.price.toLocaleString()}
          </span>
          {p.was && (
            <span className="font-sans text-xs text-muted-foreground line-through">
              ৳{p.was.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
