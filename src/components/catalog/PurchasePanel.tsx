"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    img: string;
    price: number;
    was: number | null;
    discountPercent: number;
    stock: number;
    inStock: boolean;
    allowBackorders: boolean;
    lowStockThreshold: number;
    category: string;
  };
};

const taka = (n: number) => `৳${new Intl.NumberFormat("en-US").format(n)}`;
const MAX_PER_ORDER = 99;

export function PurchasePanel({ product }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);
  const maxQty = product.allowBackorders
    ? MAX_PER_ORDER
    : Math.max(1, Math.min(product.stock, MAX_PER_ORDER));
  const [qty, setQty] = useState(1);

  const add = () =>
    addItem({
      productId: product.id,
      name: product.name,
      image: product.img,
      price: product.price,
      compareAtPrice: product.was ?? undefined,
      quantity: qty,
      category: product.category,
      slug: product.slug,
    });

  const stockText = !product.inStock
    ? "Out of stock"
    : product.stock <= 0 && product.allowBackorders
      ? "Available to order — ships when restocked"
      : product.stock <= product.lowStockThreshold
        ? `Only ${product.stock} left`
        : "In stock";

  return (
    <div className="mt-5 space-y-5">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl font-bold tabular-nums">{taka(product.price)}</span>
        {product.was && (
          <>
            <span className="text-lg text-muted-foreground line-through tabular-nums">
              <span className="sr-only">Regular price </span>
              {taka(product.was)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
              Save {product.discountPercent}%
            </span>
          </>
        )}
      </div>

      <p
        className={`text-sm font-medium ${
          !product.inStock
            ? "text-destructive"
            : product.stock <= product.lowStockThreshold
              ? "text-amber-700 dark:text-amber-400"
              : "text-emerald-700 dark:text-emerald-400"
        }`}
      >
        {stockText}
      </p>

      {product.inStock && (
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex items-center h-12 rounded-full border border-border"
            role="group"
            aria-label="Quantity"
          >
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-12 h-12 inline-flex items-center justify-center disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center tabular-nums font-semibold" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              className="w-12 h-12 inline-flex items-center justify-center disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              add();
              openCart();
              toast.success(`${product.name} added to your bag`);
            }}
            className="flex-1 min-w-40 h-12 inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/5"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            Add to bag
          </button>
          <button
            type="button"
            onClick={() => {
              add();
              router.push("/checkout");
            }}
            className="w-full sm:w-auto sm:flex-1 min-w-40 h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
          >
            Buy now
          </button>
        </div>
      )}
    </div>
  );
}
