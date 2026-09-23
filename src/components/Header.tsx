"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronRight, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { useUIStore } from "@/store/ui.store";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { SiteLogoLink } from "@/components/Logo";

interface NavCategoryItem {
  to: string;
  label: string;
  icon?: typeof Flame;
  isHighlight?: boolean;
  isSpecial?: boolean;
}

const CATEGORY_NAV: NavCategoryItem[] = [
  { to: "/shop", label: "All Products" },
  { to: "/shop?tag=Bestseller", label: "Best Sellers", icon: Flame, isHighlight: true },
  { to: "/shop?category=toners", label: "Toners & Essences" },
  { to: "/shop?category=serums", label: "Serums & Ampoules" },
  { to: "/shop?category=sunscreens", label: "Sun Care & SPF" },
  { to: "/shop?category=cleansers", label: "Cleansers & Washes" },
  { to: "/shop?category=moisturizers", label: "Moisturizers & Creams" },
  { to: "/shop?category=masks", label: "Sheet Masks" },
  { to: "/shop?category=eye-lip-care", label: "Eye & Lip" },
  { to: "/shop?category=sets", label: "Routine Sets" },
  { to: "/shop?tag=Sale", label: "Deals & Offers", isSpecial: true },
];

export function Header() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openCart, openSearch } = useUIStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getSubtotal());
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Sticky Main E-Commerce Header with Slim Scroll Behavior */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md bg-background/95 border-b border-border transition-all duration-300 ${
          scrolled ? "shadow-md bg-background/90" : "shadow-2xs"
        }`}
      >
        <div
          className={`container-x flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 ${
            scrolled ? "h-13 sm:h-14" : "h-16 lg:h-18"
          }`}
        >
          {/* Mobile Menu Toggle & Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              className="lg:hidden -ml-1 p-1.5 text-foreground hover:text-primary transition rounded-lg hover:bg-secondary/60"
              onClick={() => setMenu(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <SiteLogoLink variant="header" />
          </div>

          {/* E-Commerce Search Bar (Adapts smoothly when scrolled) */}
          <div className="flex-1 max-w-xl hidden md:block mx-2 lg:mx-4">
            <button
              type="button"
              onClick={openSearch}
              className={`w-full flex items-center justify-between px-3.5 py-1.5 sm:py-2 rounded-full border border-border/80 bg-secondary/40 hover:bg-secondary/70 text-muted-foreground transition-all duration-300 shadow-2xs group cursor-pointer ${
                scrolled ? "text-xs py-1.5" : "text-xs sm:text-sm py-2"
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Search className="w-4 h-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">
                  {scrolled
                    ? "Search 100+ authentic Korean skincare..."
                    : "Search COSRX, Beauty of Joseon, Anua, Sunscreens..."}
                </span>
              </span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-background rounded-md border border-border text-muted-foreground shrink-0">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Action Icons & Customer Center (Slims down cleanly on scroll) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Search Icon for Mobile */}
            <button
              onClick={openSearch}
              className="md:hidden p-2 hover:text-primary text-foreground transition-colors rounded-full hover:bg-secondary/60"
              aria-label="Search catalog"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Account Link */}
            <Link
              href={isAuthenticated ? "/account" : "/auth/login"}
              className={`flex items-center gap-2 rounded-xl hover:bg-secondary/60 transition-colors text-xs font-semibold ${
                scrolled
                  ? "p-2 text-foreground hover:text-primary rounded-full"
                  : "px-2.5 py-1.5 text-foreground hover:text-primary"
              }`}
              title={
                isAuthenticated ? `Signed in as ${user?.name || "Account"}` : "Sign In / Register"
              }
            >
              <User className="w-4.5 h-4.5 text-muted-foreground" />
              {!scrolled && (
                <div className="hidden xl:flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {isAuthenticated ? "Welcome Back" : "Hello, Sign In"}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {isAuthenticated ? user?.name?.split(" ")[0] || "Account" : "My Account"}
                  </span>
                </div>
              )}
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className={`flex items-center gap-2 rounded-xl hover:bg-secondary/60 transition-colors text-xs font-semibold ${
                scrolled
                  ? "p-2 text-foreground hover:text-primary rounded-full"
                  : "px-2.5 py-1.5 text-foreground hover:text-primary"
              }`}
              title="Saved Wishlist"
            >
              <Heart className="w-4.5 h-4.5 text-muted-foreground" />
              {!scrolled && (
                <div className="hidden xl:flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-muted-foreground font-normal">Favorite</span>
                  <span className="text-xs font-bold text-foreground">Wishlist</span>
                </div>
              )}
            </Link>

            {/* Shopping Cart Button */}
            <button
              onClick={openCart}
              className={`flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 transition-all rounded-full text-xs font-bold shadow-xs ${
                scrolled ? "px-2.5 py-1.5 ml-0.5" : "px-3 py-1.5 ml-1"
              }`}
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4.5 h-4.5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-background text-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-extrabold shadow-xs">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className={scrolled ? "hidden md:inline" : "hidden sm:inline"}>
                {mounted && itemCount > 0 ? `৳${cartTotal.toLocaleString()}` : "Cart"}
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Category Navigation Bar (Collapses smoothly on scroll) */}
        <nav
          className={`hidden lg:block transition-all duration-300 ease-in-out border-t border-border/60 bg-card/60 overflow-hidden ${
            scrolled
              ? "max-h-0 opacity-0 border-transparent pointer-events-none py-0"
              : "max-h-12 opacity-100 py-1.5"
          }`}
        >
          <div className="container-x flex items-center gap-1 overflow-x-auto scrollbar-none text-xs font-medium">
            {CATEGORY_NAV.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.label}
                  href={c.to}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
                    c.isHighlight
                      ? "text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-500/10"
                      : c.isSpecial
                        ? "text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/10"
                        : "text-foreground/80 hover:text-primary hover:bg-secondary/60"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-amber-500" />}
                  {c.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      {menu && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden animate-fade-up flex flex-col">
          <div className="flex items-center justify-between h-15 px-5 border-b border-border bg-card">
            <SiteLogoLink variant="header" />
            <button
              onClick={() => setMenu(false)}
              className="p-2 text-foreground hover:text-primary transition rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-border bg-secondary/30">
            <button
              onClick={() => {
                setMenu(false);
                openSearch();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-background text-muted-foreground text-xs"
            >
              <Search className="w-4 h-4 text-primary" />
              <span>Search Korean skincare products...</span>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
              K-Beauty Categories
            </p>
            {CATEGORY_NAV.map((c) => (
              <Link
                key={c.label}
                href={c.to}
                onClick={() => setMenu(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  c.isHighlight
                    ? "text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10"
                    : c.isSpecial
                      ? "text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10"
                      : "text-foreground hover:bg-secondary/60"
                }`}
              >
                <span>{c.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}

            <div className="pt-4 border-t border-border mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
                My Account & Orders
              </p>
              <Link
                href={isAuthenticated ? "/account" : "/auth/login"}
                onClick={() => setMenu(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary/60"
              >
                <span>{isAuthenticated ? "My Account Dashboard" : "Sign In / Register"}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMenu(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary/60"
              >
                <span>Saved Wishlist</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              <Link
                href="/track-order"
                onClick={() => setMenu(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary/60"
              >
                <span>Track Your Order</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
