import Link from "next/link";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { SiteLogoLink } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="container-x py-16 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8 md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <SiteLogoLink variant="footer" />
          <p className="mt-4 text-sm opacity-70 max-w-xs leading-relaxed">
            100% Authentic Korean skincare, clinically-proven beauty formulas & glass skin
            essentials delivered nationwide in Bangladesh with Cash on Delivery.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { icon: Instagram, url: "https://instagram.com" },
              { icon: Facebook, url: "https://facebook.com" },
              { icon: Youtube, url: "https://youtube.com" },
            ].map(({ icon: Icon, url }, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label="social"
                className="w-9 h-9 rounded-full border border-background/20 flex items-center justify-center hover:bg-background/10 transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-4 text-primary">Shop K-Beauty</p>
          <ul className="space-y-2.5 text-sm opacity-75">
            <li>
              <Link href="/shop" className="hover:opacity-100 hover:text-primary transition">
                All Products
              </Link>
            </li>
            <li>
              <Link
                href="/shop?category=serums"
                className="hover:opacity-100 hover:text-primary transition"
              >
                Serums & Ampoules
              </Link>
            </li>
            <li>
              <Link
                href="/shop?category=toners"
                className="hover:opacity-100 hover:text-primary transition"
              >
                Toners & Essences
              </Link>
            </li>
            <li>
              <Link
                href="/shop?category=sunscreens"
                className="hover:opacity-100 hover:text-primary transition"
              >
                Sunscreen & UV Shield
              </Link>
            </li>
            <li>
              <Link
                href="/shop?category=cleansers"
                className="hover:opacity-100 hover:text-primary transition"
              >
                Cleansers & Washes
              </Link>
            </li>
            <li>
              <Link
                href="/shop?category=moisturizers"
                className="hover:opacity-100 hover:text-primary transition"
              >
                Barrier Moisturizers
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold mb-4 text-primary">Help & Support</p>
          <ul className="space-y-2.5 text-sm opacity-75">
            <li>
              <Link href="/track-order" className="hover:opacity-100 hover:text-primary transition">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:opacity-100 hover:text-primary transition">
                Shopping Bag
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:opacity-100 hover:text-primary transition">
                Contact & Support
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:opacity-100 hover:text-primary transition">
                Customer Account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold mb-4 text-primary">About KoreanSkincare.bd</p>
          <ul className="space-y-2.5 text-sm opacity-75">
            <li>
              <Link href="/about" className="hover:opacity-100 hover:text-primary transition">
                Our Story & Authenticity
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:opacity-100 hover:text-primary transition">
                K-Beauty Skincare Journal
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:opacity-100 hover:text-primary transition">
                Saved Wishlist
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-75">
          <p>© {new Date().getFullYear()} KoreanSkincare.bd — All rights reserved.</p>
          <p>
            Powered by{" "}
            <a
              href="https://jarzdigital.com"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-100 hover:text-primary transition font-medium"
            >
              JarzDigital
            </a>{" "}
            · bKash · Nagad · Cash on Delivery
          </p>
        </div>
      </div>
    </footer>
  );
}
