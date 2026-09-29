import Link from "next/link";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchDialog } from "@/components/SearchDialog";
import { CartSheet } from "@/components/CartSheet";
import { getNavData } from "@/server/catalog";
import { getStorefront } from "@/server/storefront";

export default async function NotFound() {
  const [nav, storefront] = await Promise.all([
    getNavData().catch(() => ({ categories: [], brands: [] })),
    getStorefront(),
  ]);

  return (
    <>
      <Header nav={nav} branding={storefront.branding} />
      <main className="flex min-h-[60vh] items-center justify-center bg-background px-4 py-20">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-6xl text-foreground">Page not found</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            This link may be old or mistyped. Try the shop, or search from the header.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse the shop
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Go to home page
            </Link>
          </div>
        </div>
      </main>
      <Footer config={storefront} />
      <SearchDialog />
      <CartSheet />
    </>
  );
}
