import type { Metadata } from "next";

import { ProductListing } from "@/components/catalog/ProductListing";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { parseListingParams, queryProducts, type ProductFlag } from "@/server/catalog";
import { pickListingQuery } from "@/lib/catalog-url";
import { SITE_NAME } from "@/lib/site";

type SP = Promise<Record<string, string | string[] | undefined>>;

const FLAG_TITLES: Record<ProductFlag, string> = {
  bestseller: "Best sellers",
  new: "New arrivals",
  featured: "Featured products",
  trending: "Trending now",
};

function pageTitle(sp: Record<string, string | string[] | undefined>) {
  const params = parseListingParams(sp);
  if (params.q) return `Results for “${params.q}”`;
  if (params.flag) return FLAG_TITLES[params.flag];
  if (params.onSale) return "On sale";
  return "All products";
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const params = parseListingParams(sp);
  const title = pageTitle(sp);
  return {
    title: `${title} | ${SITE_NAME}`,
    description:
      "Shop 100% authentic Korean skincare, makeup, hair and body care in Bangladesh with cash on delivery.",
    alternates: { canonical: "/products" },
    // Search results and filtered combinations shouldn't compete with category pages in search engines
    robots:
      params.q || Object.keys(pickListingQuery(sp)).length > 1
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const query = pickListingQuery(sp);
  const params = parseListingParams(sp);
  const result = await queryProducts(params);
  const title = pageTitle(sp);

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: title, path: "/products" },
        ]}
      />
      <h1 className="font-serif text-4xl lg:text-5xl mt-3">{title}</h1>
      {params.q && (
        <p className="mt-2 text-sm text-muted-foreground">
          Searching product names, brands, categories and SKUs.
        </p>
      )}
      <div className="mt-8">
        <ProductListing
          basePath="/products"
          query={query}
          result={result}
          defaultSort={params.q ? "bestselling" : "featured"}
          showCategoryFilter
          emptyMessage={
            params.q ? `Nothing found for “${params.q}”.` : "No products match these filters."
          }
        />
      </div>
    </div>
  );
}
