import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
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
    verification: {
      google: "zckOEbhGrzJuooeHnt9PFadiWMj73gER5O7NABQm0zQ",
    },
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
      <head>
        <meta name="google-site-verification" content="zckOEbhGrzJuooeHnt9PFadiWMj73gER5O7NABQm0zQ" />

        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-REC91RL7N4"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-REC91RL7N4');
            `,
          }}
        />

        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WRR4TQNK');
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WRR4TQNK"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
