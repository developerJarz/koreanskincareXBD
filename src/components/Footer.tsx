import Link from "next/link";
import { Instagram, Facebook, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="container-x py-16 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8 md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <p className="font-serif text-2xl">
            Shajgoj<span className="text-primary">.bd</span>
          </p>
          <p className="mt-4 text-sm opacity-70 max-w-xs">
            Premium beauty, fashion & lifestyle accessories for the modern woman of Bangladesh.
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
          <p className="text-sm font-medium mb-4">Shop</p>
          <ul className="space-y-2.5 text-sm opacity-70">
            <li>
              <Link href="/shop" className="hover:opacity-100 hover:text-primary transition">
                All products
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:opacity-100 hover:text-primary transition">
                Bags
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:opacity-100 hover:text-primary transition">
                Jewelry
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:opacity-100 hover:text-primary transition">
                Watches
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:opacity-100 hover:text-primary transition">
                Sunglasses
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium mb-4">Help & Support</p>
          <ul className="space-y-2.5 text-sm opacity-70">
            <li>
              <Link href="/track-order" className="hover:opacity-100 hover:text-primary transition">
                Track Order
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:opacity-100 hover:text-primary transition">
                Shopping Cart
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:opacity-100 hover:text-primary transition">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:opacity-100 hover:text-primary transition">
                My Account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium mb-4">About Shajgoj</p>
          <ul className="space-y-2.5 text-sm opacity-70">
            <li>
              <Link href="/about" className="hover:opacity-100 hover:text-primary transition">
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:opacity-100 hover:text-primary transition">
                Journal & Stories
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
        <div className="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-70">
          <p>© {new Date().getFullYear()} Shajgoj.bd — All rights reserved.</p>
          <p>
            Powered by{" "}
            <a
              href="https://jarzdigital.com"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-100 hover:text-primary transition"
            >
              JarzDigital
            </a>{" "}
            · bKash · Nagad · COD
          </p>
        </div>
      </div>
    </footer>
  );
}
