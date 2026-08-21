"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useUIStore } from "@/store/ui.store";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [menu, setMenu] = useState(false);
  const { openCart, openSearch } = useUIStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="container-x flex items-center justify-between h-14 lg:h-16">
          <button
            className="lg:hidden -ml-2 p-2"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 tracking-tight group">
            <img
              src="/shajgoj.png"
              alt="Shajgoj.bd"
              className="h-8 lg:h-9 w-auto max-w-[140px] lg:max-w-[180px] object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.to}
                className={`transition-colors hover:text-primary ${pathname === n.to ? "text-primary font-medium" : ""}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={openSearch}
              className="p-2 hover:text-primary transition-colors"
              aria-label="Search"
              title="Search (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link
              href={isAuthenticated ? "/account" : "/auth/login"}
              className="p-2 hover:text-primary transition-colors hidden sm:inline-flex"
              aria-label="Account"
              title={isAuthenticated ? "My Account" : "Sign In"}
            >
              <User className="w-4 h-4" />
            </Link>
            <Link
              href="/wishlist"
              className="p-2 hover:text-primary transition-colors hidden sm:inline-flex"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
            </Link>
            <button
              onClick={openCart}
              className="p-2 hover:text-primary transition-colors relative"
              aria-label="Cart"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden animate-fade-up">
          <div className="flex items-center justify-between h-14 px-5 border-b border-border">
            <Link href="/" onClick={() => setMenu(false)} className="flex items-center gap-2">
              <img src="/shajgoj.png" alt="Shajgoj.bd" className="h-7 w-auto object-contain" />
            </Link>
            <button onClick={() => setMenu(false)} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex flex-col p-6 gap-1 text-lg">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.to}
                onClick={() => setMenu(false)}
                className="flex items-center justify-between py-3 border-b border-border"
              >
                {n.label} <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
            <Link
              href={isAuthenticated ? "/account" : "/auth/login"}
              onClick={() => setMenu(false)}
              className="flex items-center justify-between py-3 border-b border-border text-primary font-medium"
            >
              {isAuthenticated ? "My Account" : "Sign In / Register"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
