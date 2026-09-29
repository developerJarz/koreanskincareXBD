import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";

import { SITE_URL } from "@/lib/site";
import { optimizedImageUrl } from "@/lib/image";
import { getStorefront } from "@/server/storefront";

import "../src/styles.css";

// Font files live in the repo (variable fonts, latin subset), so dev and builds never
// need to reach Google — a flaky connection can't slow down or break the site
const serif = localFont({
  src: [
    { path: "../src/assets/fonts/playfair-display-latin.woff2", style: "normal" },
    { path: "../src/assets/fonts/playfair-display-italic-latin.woff2", style: "italic" },
  ],
  weight: "400 900",
  display: "swap",
  variable: "--font-playfair",
  fallback: ["Georgia", "serif"],
});

const sans = localFont({
  src: "../src/assets/fonts/plus-jakarta-sans-latin.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-jakarta",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  // A favicon uploaded in "Website design" replaces the built-in one
  const { branding } = await getStorefront();
  const favicon = branding.faviconUrl;
  return {
    // Resolves relative canonical and Open Graph URLs on every page
    metadataBase: new URL(SITE_URL),
    title: "KoreanSkincare.bd — Premium Korean Skincare & Beauty in Bangladesh",
    description:
      "Discover KoreanSkincare.bd — 100% authentic Korean skincare, clinically-proven formulas, and glass skin essentials with Cash on Delivery all over Bangladesh.",
    icons: favicon
      ? {
          icon: [{ url: optimizedImageUrl(favicon, 64) }],
          shortcut: optimizedImageUrl(favicon, 64),
          apple: optimizedImageUrl(favicon, 180),
        }
      : // The default icon (moved from app/icon.png, which would override an uploaded favicon)
        { icon: [{ url: "/icon.png", type: "image/png" }], shortcut: "/icon.png" },
  };
}

export const viewport = {
  themeColor: "#f7e8e3",
};

// Storefront chrome (header, footer, cart) lives in app/(store)/layout.tsx;
// the admin dashboard has its own shell and does not load it.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, ColorZilla, password managers…)
    // add attributes to <html>/<body> before React loads. This only ignores attribute
    // differences on these two tags — mismatches anywhere inside the page are still reported.
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
