import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductListing } from "@/components/catalog/ProductListing";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BrandMark } from "@/components/catalog/BrandMark";
import { getBrands, parseListingParams, queryProducts } from "@/server/catalog";
import { pickListingQuery } from "@/lib/catalog-url";
import { SITE_NAME } from "@/lib/site";

type Params = Promise<{ slug: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

async function findBrand(slug: string) {
  const brands = await getBrands();
  return brands.find((b) => b.slug === decodeURIComponent(slug)) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const brand = await findBrand((await params).slug);
  if (!brand) return { title: `Brand not found | ${SITE_NAME}`, robots: { index: false } };
  const title = brand.seoTitle || `${brand.name} in Bangladesh | ${SITE_NAME}`;
  const description =
    brand.seoDescription ||
    brand.description ||
    `Shop 100% authentic ${brand.name} products in Bangladesh with cash on delivery.`;
  return {
    title,
    description,
    alternates: { canonical: `/brand/${brand.slug}` },
    openGraph: {
      title,
      description,
      url: `/brand/${brand.slug}`,
      ...(brand.logo ? { images: [{ url: brand.logo }] } : {}),
    },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const brand = await findBrand((await params).slug);
  if (!brand) notFound();

  const sp = await searchParams;
  const query = pickListingQuery(sp);
  delete query.brand; // the brand comes from the URL path
  const result = await queryProducts({ ...parseListingParams(sp), brands: [brand.slug] });

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
          { name: brand.name, path: `/brand/${brand.slug}` },
        ]}
      />
      <header className="mt-4 flex flex-col sm:flex-row sm:items-center gap-5">
        <BrandMark name={brand.name} logo={brand.logo} size="lg" />
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl lg:text-5xl">{brand.name}</h1>
          {brand.description && (
            <p className="mt-2 text-muted-foreground leading-relaxed">{brand.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <div className="mt-8">
        <ProductListing
          basePath={`/brand/${brand.slug}`}
          query={query}
          result={result}
          defaultSort="featured"
          showBrandFilter={false}
          showCategoryFilter
          emptyMessage={`No ${brand.name} products yet.`}
        />
      </div>
    </div>
  );
}
