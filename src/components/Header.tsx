"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUIStore } from "@/store/ui.store";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { SiteLogoLink, type LogoBranding } from "@/components/Logo";
import { dashboardFor } from "@/lib/dashboard";
import type { NavData } from "@/lib/catalog-shared";
import { DesktopMegaMenu } from "@/components/navigation/DesktopMegaMenu";
import { MobileNavMenu } from "@/components/navigation/MobileNavMenu";

/** Categories and brands come from the database (see app/(store)/layout.tsx) */
export function Header({ nav, branding }: { nav: NavData; branding?: LogoBranding }) {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openCart, openSearch } = useUIStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getSubtotal());
  const { isAuthenticated: storedSignedIn, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  // The signed-in state lives in browser storage, which the server can't see. Use it only after
  // mounting so the first client render matches the server HTML (avoids a hydration mismatch).
  const isAuthenticated = mounted && storedSignedIn;
  // Admins/staff (and vendors) get a direct button to their dashboard
  const dashboard = isAuthenticated ? dashboardFor(user?.role) : null;
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Two thresholds so the header does not flicker between states when the
    // page sits right at the boundary (collapsing it changes the page height)
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > 8 : y > 80));
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
          className={`container-x flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 ${
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
            <SiteLogoLink variant="header" branding={branding} />
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

            {dashboard && (
              <Link
                href={dashboard.href}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-primary/40 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                <span className="hidden lg:inline">{dashboard.label}</span>
                <span className="lg:hidden">Dashboard</span>
              </Link>
            )}

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

            {/* Wishlist Link (in the menu drawer on phones, to keep the header one line) */}
            <Link
              href="/wishlist"
              className={`hidden sm:flex items-center gap-2 rounded-xl hover:bg-secondary/60 transition-colors text-xs font-semibold ${
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

        {/* Category & brand mega menu (collapses on scroll) */}
        <DesktopMegaMenu nav={nav} collapsed={scrolled} />
      </header>

      {/* Mobile Navigation Drawer */}
      {menu && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden animate-fade-up flex flex-col">
          <div className="flex items-center justify-between h-15 px-5 border-b border-border bg-card">
            <SiteLogoLink variant="header" branding={branding} />
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

          {dashboard && (
            <div className="px-4 pt-4">
              <Link
                href={dashboard.href}
                onClick={() => setMenu(false)}
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                Open {dashboard.label.toLowerCase()}
              </Link>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <MobileNavMenu nav={nav} onNavigate={() => setMenu(false)} />

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
