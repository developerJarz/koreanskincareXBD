import type { Metadata } from "next";
import { Toaster } from "sonner";

import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchDialog } from "@/components/SearchDialog";
import { CartSheet } from "@/components/CartSheet";

import "../src/styles.css";

export const metadata: Metadata = {
  title: "Shajgoj.bd — Premium Beauty, Accessories & Lifestyle in Bangladesh",
  description:
    "Discover Shajgoj.bd — premium beauty, bags, rings, earrings, necklaces, watches & accessories. Cash on delivery all over Bangladesh.",
};

export const viewport = {
  themeColor: "#f7e8e3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SearchDialog />
        <CartSheet />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
