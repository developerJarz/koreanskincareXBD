import Link from "next/link";
import { Fragment } from "react";
import {
  ChevronRight,
  Gift,
  Heart,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { BrandMark } from "@/components/catalog/BrandMark";
import { NewsletterForm } from "@/components/catalog/NewsletterForm";
import { getResponsiveImage } from "@/lib/image";
import {
  HOME_SECTIONS,
  type HomeSectionId,
  type StorefrontConfig,
  type TrustIcon,
} from "@/lib/storefront";
import { getHomepageData, type CardProduct, type CategoryNode } from "@/server/catalog";
import { getStorefront } from "@/server/storefront";

// Rebuilt at most every 5 minutes, and immediately when an admin changes the catalog or design
export const revalidate = 300;

const LARGE_IMAGE_WIDTHS = [480, 800, 1200, 1600];

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 lg:mb-8">
      <h2 className="font-serif text-3xl lg:text-4xl text-foreground font-normal">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline shrink-0"
      >
        {linkLabel} <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

/** A product row from a database flag. Hidden entirely when nothing is marked for it. */
function ProductSection({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: CardProduct[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="container-x py-10 lg:py-14" aria-label={title}>
      <SectionHeading title={title} href={href} linkLabel="View all" />
      <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {products.slice(0, 8).map((p) => (
          <li key={p.id}>
            <ProductCard p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryCard({ category }: { category: CategoryNode }) {
  const count = `${category.productCount} product${category.productCount === 1 ? "" : "s"}`;
  // With a photo: white text on a dark fade. Without one (until an image is uploaded): a clean tinted card.
  if (!category.image) {
    return (
      <Link
        href={`/category/${category.slug}`}
        className="group flex flex-col justify-end aspect-[4/5] rounded-2xl border border-border bg-accent/60 p-4 hover:border-primary/40 hover:bg-accent transition-colors"
      >
        <span className="block font-serif text-xl leading-tight text-foreground group-hover:text-primary">
          {category.name}
        </span>
        <span className="block text-xs text-muted-foreground mt-0.5">{count}</span>
      </Link>
    );
  }
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative flex flex-col justify-end aspect-[4/5] rounded-2xl overflow-hidden border border-border/60 bg-secondary"
    >
      <img
        {...getResponsiveImage(category.image, [320, 480, 640])}
        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
        alt=""
        width={480}
        height={600}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
        aria-hidden="true"
      />
      <span className="relative p-4 text-white">
        <span className="block font-serif text-xl leading-tight">{category.name}</span>
        <span className="block text-xs opacity-85 mt-0.5">{count}</span>
      </span>
    </Link>
  );
}

const TRUST_ICON_COMPONENTS: Record<TrustIcon, typeof Truck> = {
  truck: Truck,
  refresh: RotateCcw,
  shield: ShieldCheck,
  sparkles: Sparkles,
  heart: Heart,
  gift: Gift,
};

/**
 * Sections, their order, text and images are edited in the admin "Website design" → Homepage.
 * Product rows and category/brand grids are filled from the catalog.
 */
export default async function HomePage() {
  const [data, config] = await Promise.all([getHomepageData(), getStorefront()]);
  const { hero, promise, testimonials, newsletter } = config;

  const productRows: Partial<Record<HomeSectionId, { href: string; products: CardProduct[] }>> = {
    bestsellers: { href: "/products?flag=bestseller", products: data.bestsellers },
    newArrivals: { href: "/products?flag=new", products: data.newArrivals },
    onSale: { href: "/products?sale=1", products: data.onSale },
    featured: { href: "/products?flag=featured", products: data.featured },
    trending: { href: "/products?flag=trending", products: data.trending },
  };

  const render = (id: HomeSectionId, title: string): React.ReactNode => {
    const row = productRows[id];
    if (row) return <ProductSection title={title} href={row.href} products={row.products} />;

    switch (id) {
      case "hero":
        return <HeroSection hero={hero} />;
      case "trust":
        return config.trust.items.length > 0 ? (
          <section className="border-y border-border/80 bg-secondary/30">
            <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
              {config.trust.items.map((feature, i) => {
                const Icon = TRUST_ICON_COMPONENTS[feature.icon] ?? Sparkles;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-card border border-border/70 shadow-2xs"
                  >
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{feature.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.summary}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null;
      case "categories":
        return data.categories.length > 0 ? (
          <section id="categories" className="container-x py-12 lg:py-16" aria-label={title}>
            <SectionHeading title={title} href="/products" linkLabel="All products" />
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {data.categories.map((c) => (
                <li key={c.id}>
                  <CategoryCard category={c} />
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      case "brands":
        return data.brands.length > 0 ? (
          <section className="container-x py-10 lg:py-14" aria-label={title}>
            <SectionHeading title={title} href="/brands" linkLabel="All brands" />
            <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {data.brands.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/brand/${b.slug}`}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow] text-center h-full"
                  >
                    <BrandMark name={b.name} logo={b.logo} size="sm" />
                    <span className="text-xs font-semibold leading-tight">{b.name}</span>
                    <span className="text-[11px] text-muted-foreground -mt-1">
                      {b.productCount} product{b.productCount === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      case "promise":
        return (
          <section className="container-x py-16 lg:py-24">
            <div className="relative overflow-hidden rounded-3xl bg-secondary/40 border border-border p-8 md:p-16 grid md:grid-cols-2 gap-8 items-center">
              <div>
                {promise.eyebrow && (
                  <p className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                    {promise.eyebrow}
                  </p>
                )}
                <h2 className="font-serif text-3xl md:text-5xl mt-3 leading-tight text-foreground font-normal">
                  {promise.titleLine1} <br /> {promise.titleLine2}
                </h2>
                <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
                  {promise.description}
                </p>
                {promise.ctaLabel && promise.ctaHref && (
                  <Link
                    href={promise.ctaHref}
                    className="mt-7 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 shadow-sm transition"
                  >
                    {promise.ctaLabel} <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <div className="relative">
                <img
                  {...getResponsiveImage(promise.image, LARGE_IMAGE_WIDTHS)}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  alt=""
                  width={1600}
                  height={1200}
                  loading="lazy"
                  className="rounded-2xl object-cover w-full aspect-[4/3] shadow-md border border-border"
                />
              </div>
            </div>
          </section>
        );
      case "testimonials":
        return testimonials.items.length > 0 ? (
          <section className="border-t border-border/80 bg-secondary/30 mt-8">
            <div className="container-x py-16 lg:py-24">
              <div className="text-center mb-12">
                <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                  {testimonials.eyebrow}
                </span>
                <h2 className="font-serif text-4xl lg:text-5xl mt-2 tracking-tight text-foreground font-normal">
                  {testimonials.title}
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.items.map((review, i) => (
                  <figure
                    key={i}
                    className="card-interactive bg-card p-7 rounded-3xl border border-border/80 shadow-xs hover:shadow-xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-1 text-amber-500" aria-label="5 out of 5 stars">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star
                              key={s}
                              className="w-4 h-4 fill-amber-500 text-amber-500"
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Verified Buyer
                        </span>
                      </div>
                      <blockquote className="text-sm leading-relaxed text-foreground/90 font-normal">
                        “{review.quote}”
                      </blockquote>
                    </div>
                    <figcaption className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{review.name}</span>
                      {review.city && (
                        <span className="text-xs text-muted-foreground">
                          {review.city}, Bangladesh
                        </span>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null;
      case "newsletter":
        return (
          <section className="container-x py-16 lg:py-24">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                {newsletter.eyebrow}
              </p>
              <h2 className="font-serif text-4xl lg:text-5xl mt-2 text-foreground font-normal">
                {newsletter.title}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">{newsletter.description}</p>
              <NewsletterForm />
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {config.sections
        .filter((s) => s.enabled)
        .map((s) => (
          <Fragment key={s.id}>{render(s.id, s.title || HOME_SECTIONS[s.id])}</Fragment>
        ))}
    </>
  );
}
function HeroSection({ hero }: { hero: StorefrontConfig["hero"] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/30 via-background to-background">
      <div className="container-x grid lg:grid-cols-2 gap-10 lg:gap-16 py-12 lg:py-20 items-center">
        <div className="animate-fade-up order-2 lg:order-1">
          {hero.badge && (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card/90 border border-primary/20 shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 relative" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {hero.badge}
              </span>
              {hero.badgeNote && (
                <span className="hidden sm:inline text-[11px] font-medium text-muted-foreground border-l border-border/80 pl-2.5">
                  {hero.badgeNote}
                </span>
              )}
            </div>
          )}
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mt-5 text-foreground font-normal">
            {hero.titleLine1}
            {hero.titleLine2 && (
              <>
                <br />
                <span className="italic text-primary font-serif">{hero.titleLine2}</span>
              </>
            )}
          </h1>
          {hero.description && (
            <p className="mt-6 text-muted-foreground max-w-md text-base sm:text-lg leading-relaxed">
              {hero.description}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {hero.primaryLabel && hero.primaryHref && (
              <Link
                href={hero.primaryHref}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 shadow-lg shadow-primary/25 transition"
              >
                {hero.primaryLabel} <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
            {hero.secondaryLabel && hero.secondaryHref && (
              <Link
                href={hero.secondaryHref}
                className="inline-flex items-center gap-2 border border-border bg-card/60 px-7 py-3.5 rounded-full text-sm font-semibold hover:bg-secondary transition"
              >
                {hero.secondaryLabel}
              </Link>
            )}
          </div>
          {(hero.ratingText || hero.customersText) && (
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {hero.ratingText && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-primary text-primary" aria-hidden="true" />{" "}
                  {hero.ratingText}
                </div>
              )}
              {hero.customersText && <div className="font-medium">{hero.customersText}</div>}
            </div>
          )}
        </div>
        <div className="relative order-1 lg:order-2 animate-fade-up">
          <div className="absolute -top-6 -left-6 w-40 h-40 rounded-full bg-primary/20 blur-3xl opacity-60" />
          <div className="absolute -bottom-6 -right-6 w-56 h-56 rounded-full bg-rose-500/20 blur-3xl opacity-40" />
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/80">
            <img
              {...getResponsiveImage(hero.image, LARGE_IMAGE_WIDTHS)}
              sizes="(min-width: 1024px) 50vw, 100vw"
              // Largest element on the page: fetch it before anything else
              fetchPriority="high"
              alt={hero.imageAlt}
              width={1600}
              height={1200}
              className="w-full h-full object-cover aspect-[4/5] hover:scale-105 transition-transform duration-700"
            />
            {hero.featuredTitle && (
              <div className="absolute bottom-5 left-5 right-5 bg-background/90 backdrop-blur-md px-5 py-4 rounded-2xl flex items-center justify-between gap-3 border border-border/60 shadow-lg">
                <div>
                  {hero.featuredLabel && (
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                      {hero.featuredLabel}
                    </p>
                  )}
                  <p className="font-semibold text-foreground text-sm">{hero.featuredTitle}</p>
                </div>
                {hero.featuredHref && (
                  <Link
                    href={hero.featuredHref}
                    className="font-serif text-sm font-semibold text-primary hover:underline shrink-0"
                  >
                    Shop Now →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
