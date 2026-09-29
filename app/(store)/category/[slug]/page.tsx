import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductListing } from "@/components/catalog/ProductListing";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { findCategoryBySlug, parseListingParams, queryProducts } from "@/server/catalog";
import { pickListingQuery } from "@/lib/catalog-url";
import { SITE_NAME } from "@/lib/site";

type Params = Promise<{ slug: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const found = await findCategoryBySlug(decodeURIComponent(slug));
  if (!found) return { title: `Category not found | ${SITE_NAME}`, robots: { index: false } };
  const { category, parent } = found;
  const title =
    category.seoTitle ||
    `${parent ? `${category.name} – ${parent.name}` : category.name} | ${SITE_NAME}`;
  const description =
    category.seoDescription ||
    category.description ||
    `Shop authentic Korean ${category.name.toLowerCase()} in Bangladesh with cash on delivery.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title,
      description,
      url: `/category/${category.slug}`,
      ...(category.image ? { images: [{ url: category.image }] } : {}),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { slug } = await params;
  const found = await findCategoryBySlug(decodeURIComponent(slug));
  if (!found) notFound();
  const { category, parent } = found;

  const sp = await searchParams;
  const query = pickListingQuery(sp);
  delete query.category; // the category comes from the URL path
  const result = await queryProducts({ ...parseListingParams(sp), category: category.slug });

  // Subcategory chips: children of a top-level category, or siblings of a subcategory
  const top = parent ?? category;
  const chips = top.children;

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          ...(parent ? [{ name: parent.name, path: `/category/${parent.slug}` }] : []),
          { name: category.name, path: `/category/${category.slug}` },
        ]}
      />
      <header className="mt-3 max-w-3xl">
        <h1 className="font-serif text-4xl lg:text-5xl">{category.name}</h1>
        {category.description && (
          <p className="mt-3 text-muted-foreground leading-relaxed">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {category.productCount} product{category.productCount === 1 ? "" : "s"}
        </p>
      </header>

      {chips.length > 0 && (
        <nav aria-label={`${top.name} subcategories`} className="mt-6 -mx-4 px-4 overflow-x-auto scrollbar-none lg:mx-0 lg:px-0 lg:overflow-visible">
          <ul className="flex gap-2 pb-1 w-max lg:w-auto lg:flex-wrap">
            <li>
              <Link
                href={`/category/${top.slug}`}
                aria-current={!parent ? "page" : undefined}
                className={`inline-flex h-9 items-center px-4 rounded-full border text-sm whitespace-nowrap ${!parent ? "bg-foreground text-background border-foreground" : "border-border hover:border-primary hover:text-primary"}`}
              >
                All {top.name}
              </Link>
            </li>
            {chips.map((c) => {
              const active = c.id === category.id;
              return (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex h-9 items-center px-4 rounded-full border text-sm whitespace-nowrap ${active ? "bg-foreground text-background border-foreground" : "border-border hover:border-primary hover:text-primary"}`}
                  >
                    {c.name}
                    <span
                      className={`ml-1.5 text-xs ${active ? "opacity-70" : "text-muted-foreground"}`}
                    >
                      {c.productCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="mt-8">
        <ProductListing
          basePath={`/category/${category.slug}`}
          query={query}
          result={result}
          defaultSort="featured"
          emptyMessage={`No ${category.name.toLowerCase()} products yet.`}
        />
      </div>
    </div>
  );
}
