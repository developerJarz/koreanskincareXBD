import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { PurchasePanel } from "@/components/catalog/PurchasePanel";
import { getProductPageData } from "@/server/catalog";
import { connectDB } from "@/server/db/connection";
import { Review } from "@/server/db/models";
import { absoluteUrl, jsonLd, SITE_NAME } from "@/lib/site";

type Params = Promise<{ slug: string }>;

// Shared by generateMetadata and the page within one request
const loadProduct = cache((slug: string) =>
  getProductPageData(decodeURIComponent(slug).slice(0, 200)),
);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await loadProduct((await params).slug);
  if (!data) return { title: `Product not found | ${SITE_NAME}`, robots: { index: false } };
  const { product, brand } = data;
  const title = product.seoTitle || `${product.name} | ${SITE_NAME}`;
  const description = (
    product.seoDescription ||
    product.shortDescription ||
    product.description ||
    `Buy ${brand ? `${brand.name} ` : ""}${product.name} in Bangladesh at ৳${product.price}.`
  ).slice(0, 160);
  const canonical = product.canonicalUrl || `/product/${product.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/product/${product.slug}`,
      images: product.media.slice(0, 4).map((m) => ({ url: m.url, alt: m.alt })),
    },
  };
}

/** Plain-text descriptions: blank lines become paragraphs (no HTML is ever rendered from the DB). */
function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
    </>
  );
}

export default async function ProductPage({ params }: { params: Params }) {
  const data = await loadProduct((await params).slug);
  if (!data) notFound();
  const { product, brand, category, subcategory, related, sameBrand } = data;

  await connectDB();
  const reviews = product.reviewCount
    ? await Review.find({ product: product.id, status: "approved" })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("userName rating title comment isVerifiedPurchase createdAt")
        .lean()
    : [];

  const crumbs = [
    { name: "Home", path: "/" },
    ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
    ...(subcategory ? [{ name: subcategory.name, path: `/category/${subcategory.slug}` }] : []),
    { name: product.name, path: `/product/${product.slug}` },
  ];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.media.map((m) => absoluteUrl(m.url)),
    description: (product.shortDescription || product.description).slice(0, 5000) || undefined,
    sku: product.sku || undefined,
    ...(brand ? { brand: { "@type": "Brand", name: brand.name } } : {}),
    ...(category ? { category: category.name } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "BDT",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const details = [
    product.description && { id: "description", title: "Description", body: product.description },
    product.ingredients && { id: "ingredients", title: "Ingredients", body: product.ingredients },
    product.howToUse && { id: "how-to-use", title: "How to use", body: product.howToUse },
  ].filter(Boolean) as Array<{ id: string; title: string; body: string }>;

  return (
    <div className="container-x py-6 lg:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(productLd)} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-5 grid gap-8 lg:gap-12 lg:grid-cols-2">
        <ProductGallery media={product.media} name={product.name} />

        <div>
          {brand && (
            <Link
              href={`/brand/${brand.slug}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {brand.name}
            </Link>
          )}
          <h1 className="font-serif text-3xl lg:text-4xl mt-1 leading-tight">{product.name}</h1>

          {product.reviewCount > 0 ? (
            <a
              href="#reviews"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
              <span>
                ({product.reviewCount} review{product.reviewCount === 1 ? "" : "s"})
              </span>
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No reviews yet</p>
          )}

          {product.shortDescription && (
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.shortDescription}</p>
          )}

          <PurchasePanel
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              img: product.img,
              price: product.price,
              was: product.was,
              discountPercent: product.discountPercent,
              stock: product.stock,
              inStock: product.inStock,
              allowBackorders: product.allowBackorders,
              lowStockThreshold: product.lowStockThreshold,
              category: product.categorySlug ?? product.category,
            }}
          />

          <ul className="mt-6 grid gap-3 text-sm">
            <li className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span>
                Delivery ৳70 inside Dhaka, ৳120 elsewhere. Free on orders over ৳2,000. Cash on
                delivery available everywhere in Bangladesh.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span>Easy 7-day exchange on unopened products.</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span>100% authentic, imported from Korea.</span>
            </li>
          </ul>

          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm border-t border-border pt-5">
            {brand && (
              <>
                <dt className="text-muted-foreground">Brand</dt>
                <dd>
                  <Link href={`/brand/${brand.slug}`} className="hover:text-primary">
                    {brand.name}
                  </Link>
                </dd>
              </>
            )}
            {category && (
              <>
                <dt className="text-muted-foreground">Category</dt>
                <dd>
                  <Link
                    href={`/category/${(subcategory ?? category).slug}`}
                    className="hover:text-primary"
                  >
                    {subcategory ? `${category.name} › ${subcategory.name}` : category.name}
                  </Link>
                </dd>
              </>
            )}
            {product.sku && (
              <>
                <dt className="text-muted-foreground">SKU</dt>
                <dd className="tabular-nums">{product.sku}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {details.length > 0 && (
        <section className="mt-12 lg:mt-16 max-w-3xl space-y-3" aria-label="Product information">
          {details.map((d, i) => (
            <details
              key={d.id}
              open={i === 0}
              className="group rounded-2xl border border-border bg-card"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between p-5 font-semibold">
                <h2 className="text-base font-sans tracking-normal">{d.title}</h2>
                <span
                  className="text-muted-foreground group-open:rotate-45 transition-transform text-xl leading-none"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-foreground/90 space-y-3">
                <Paragraphs text={d.body} />
              </div>
            </details>
          ))}
        </section>
      )}

      <section id="reviews" className="mt-12 lg:mt-16 max-w-3xl" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="font-serif text-2xl lg:text-3xl">
          Reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No reviews yet. Bought this product? Reviews from verified customers will appear here.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {reviews.map((r) => (
              <li key={String(r._id)} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="font-medium">{r.userName}</span>
                  {r.isVerifiedPurchase && (
                    <span className="text-xs text-emerald-700">Verified purchase</span>
                  )}
                </div>
                {r.title && <p className="mt-2 font-semibold text-sm">{r.title}</p>}
                <p className="mt-1 text-sm text-foreground/90 whitespace-pre-line">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-12 lg:mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-serif text-2xl lg:text-3xl mb-5">
            You may also like
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {related.slice(0, 4).map((p) => (
              <li key={p.id}>
                <ProductCard p={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {brand && sameBrand.length > 0 && (
        <section className="mt-12 lg:mt-16" aria-labelledby="brand-heading">
          <div className="flex items-end justify-between mb-5 gap-3">
            <h2 id="brand-heading" className="font-serif text-2xl lg:text-3xl">
              More from {brand.name}
            </h2>
            <Link
              href={`/brand/${brand.slug}`}
              className="text-sm font-semibold text-primary hover:underline shrink-0"
            >
              View all
            </Link>
          </div>
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {sameBrand.slice(0, 4).map((p) => (
              <li key={p.id}>
                <ProductCard p={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
