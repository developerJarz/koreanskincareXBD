import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BrandMark } from "@/components/catalog/BrandMark";
import { getBrands } from "@/server/catalog";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `All brands | ${SITE_NAME}`,
  description: "Every authentic Korean beauty brand we stock, from COSRX to Beauty of Joseon.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const brands = await getBrands();
  const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
        ]}
      />
      <h1 className="font-serif text-4xl lg:text-5xl mt-3">All brands</h1>
      <p className="mt-2 text-muted-foreground">{sorted.length} authentic Korean beauty brands.</p>

      {sorted.length === 0 ? (
        <p className="mt-10 text-muted-foreground">Brands will appear here once they're added.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {sorted.map((b) => (
            <li key={b.id}>
              <Link
                href={`/brand/${b.slug}`}
                className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow] h-full"
              >
                <BrandMark name={b.name} logo={b.logo} size="md" />
                <span className="font-medium text-sm">{b.name}</span>
                <span className="text-xs text-muted-foreground -mt-2">
                  {b.productCount} product{b.productCount === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
