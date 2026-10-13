"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";

const ITEM =
  "relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary";

/**
 * Phone navigation pinned to the bottom of the screen, like a shopping app:
 * Home, Categories (opens the menu), Search, Cart (with count) and Account.
 * Hidden from the large-screen breakpoint, where the header carries everything.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { openCart, openSearch, openMobileMenu, isMobileMenuOpen, isCartOpen, isSearchOpen } =
    useUIStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  // Cart count and sign-in state live in browser storage: show them only after mounting
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tone = (active: boolean) => (active ? "text-primary" : "text-muted-foreground");
  const overlayOpen = isMobileMenuOpen || isCartOpen || isSearchOpen;
  const onHome = pathname === "/";
  const onAccount = pathname.startsWith("/account") || pathname.startsWith("/auth");
  const onCategories =
    pathname.startsWith("/category") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/brand");

  return (
    <nav
      aria-label="Shop navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_rgb(0_0_0/0.25)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-xl">
        <Link
          href="/"
          className={`${ITEM} ${tone(onHome && !overlayOpen)}`}
          aria-current={onHome ? "page" : undefined}
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          Home
        </Link>
        <button
          type="button"
          onClick={openMobileMenu}
          className={`${ITEM} ${tone(isMobileMenuOpen || (onCategories && !overlayOpen))}`}
        >
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          Categories
        </button>
        <button type="button" onClick={openSearch} className={`${ITEM} ${tone(isSearchOpen)}`}>
          <Search className="h-5 w-5" aria-hidden="true" />
          Search
        </button>
        <button
          type="button"
          onClick={openCart}
          className={`${ITEM} ${tone(isCartOpen)}`}
          aria-label={mounted && itemCount ? `Cart, ${itemCount} items` : "Cart"}
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {mounted && itemCount > 0 && (
              <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-4 text-primary-foreground tabular-nums">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </span>
          Cart
        </button>
        <Link
          href={mounted && signedIn ? "/account" : "/auth/login"}
          className={`${ITEM} ${tone(onAccount && !overlayOpen)}`}
          aria-current={onAccount ? "page" : undefined}
        >
          <User className="h-5 w-5" aria-hidden="true" />
          {mounted && signedIn ? "Account" : "Sign in"}
        </Link>
      </div>
    </nav>
  );
}
