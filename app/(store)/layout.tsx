import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchDialog } from "@/components/SearchDialog";
import { CartSheet } from "@/components/CartSheet";
import { getNavData } from "@/server/catalog";
import { getStorefront } from "@/server/storefront";

export default async function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Categories and brands for the menu, and the website design (logo, top bar, footer).
  // Both are cached and refreshed as soon as an admin changes them.
  const [nav, storefront] = await Promise.all([
    getNavData().catch(() => ({ categories: [], brands: [] })),
    getStorefront(),
  ]);

  return (
    <>
      {storefront.announcement.enabled && (
        <AnnouncementBar messages={storefront.announcement.messages} />
      )}
      <Header nav={nav} branding={storefront.branding} />
      <main className="flex-1">{children}</main>
      <Footer config={storefront} />
      <SearchDialog />
      <CartSheet />
    </>
  );
}
