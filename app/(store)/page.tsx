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
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { getResponsiveImage } from "@/lib/image";
import {
  HOME_SECTIONS,
  type HomeSection,
  type HomeSectionId,
  type TrustIcon,
} from "@/lib/storefront";
import { getHomepageData, type CardProduct, type HomeCategory } from "@/server/catalog";
import { getStorefront } from "@/server/storefront";

// Rebuilt at most every 5 minutes, and immediately when an admin changes the catalog or design
export const revalidate = 300;

const LARGE_IMAGE_WIDTHS = [480, 800, 1200, 1600];

/*
 * Layout: on phones the homepage behaves like a shopping app — a rounded banner slider, a
 * swipeable shelf of round category tiles, and swipeable product / brand rows. From the `sm`
 * breakpoint up the same rows become grids. Everything is set in admin → Website design.
 */

function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  /** No link when the section is hand-picked (a listing page would show other products) */
  href?: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6 lg:mb-8">
      <div className="min-w-0">
        <h2 className="font-serif text-2xl font-normal text-foreground sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground sm:text-sm">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[13px] font-semibold text-primary hover:bg-primary/10 sm:text-sm"
        >
          {linkLabel} <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

const SECTION = "container-x py-7 sm:py-10 lg:py-14";
/** Swipe row on phones, grid from sm up */
const RAIL_TO_GRID = "rail sm:grid sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0";

/** A product row (automatic or hand-picked). Hidden entirely when it has nothing to show. */
function ProductSection({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  products: CardProduct[];
}) {
  if (products.length === 0) return null;
  return (
    <section className={SECTION} aria-label={title}>
      <SectionHeading title={title} subtitle={subtitle} href={href} linkLabel="View all" />
      <ul className={`${RAIL_TO_GRID} sm:grid-cols-3 sm:gap-4 xl:grid-cols-4`}>
        {products.map((p) => (
          <li key={p.id} className="w-[46%] sm:w-auto">
            <ProductCard p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Round category tile: photo (or the category's best seller) with the name underneath. */
function CategoryTile({ category }: { category: HomeCategory }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex flex-col items-center gap-2 text-center focus-visible:outline-none"
    >
      <span
        className={`relative block aspect-square w-full overflow-hidden rounded-full border border-border/70 ring-primary/50 ring-offset-2 ring-offset-background transition-shadow group-hover:ring-2 group-focus-visible:ring-2 ${
          category.coverIsProduct || !category.cover ? "bg-white" : "bg-secondary"
        }`}
      >
        {category.cover ? (
          <img
            {...getResponsiveImage(category.cover, [160, 240, 320])}
            sizes="(min-width: 1024px) 140px, (min-width: 640px) 18vw, 22vw"
            alt=""
            width={240}
            height={240}
            loading="lazy"
            className={`absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105 ${
              category.coverIsProduct ? "object-contain p-[14%]" : "object-cover"
            }`}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-accent font-serif text-2xl text-primary">
            {category.name.charAt(0)}
          </span>
        )}
      </span>
      <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground group-hover:text-primary sm:text-sm">
        {category.name}
      </span>
      <span className="-mt-1.5 hidden text-[11px] text-muted-foreground sm:block">
        {category.productCount} products
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
  // Section settings decide what each product, category and brand section shows
  const config = await getStorefront();
  const data = await getHomepageData(config.sections);
  const { slider, promise, testimonials, newsletter } = config;

  const listingHref: Partial<Record<HomeSectionId, string>> = {
    bestsellers: "/products?flag=bestseller",
    newArrivals: "/products?flag=new",
    onSale: "/products?sale=1",
    featured: "/products?flag=featured",
    trending: "/products?flag=trending",
  };

  const render = (section: HomeSection, title: string): React.ReactNode => {
    const { id, subtitle } = section;
    const products = data.rows[id];
    if (products) {
      return (
        <ProductSection
          title={title}
          subtitle={subtitle}
          href={section.source === "auto" ? listingHref[id] : undefined}
          products={products}
        />
      );
    }

    switch (id) {
      case "hero":
        return (
          <HeroCarousel
            slides={slider.slides}
            autoplay={slider.autoplay}
            intervalSeconds={slider.intervalSeconds}
            height={slider.height}
          />
        );
      case "trust":
        return config.trust.items.length > 0 ? (
          <section aria-label="Why shop with us" className="container-x pt-4 sm:pt-6">
            <ul className="rail lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0">
              {config.trust.items.map((feature, i) => {
                const Icon = TRUST_ICON_COMPONENTS[feature.icon] ?? Sparkles;
                return (
                  <li
                    key={i}
                    className="flex w-[72%] items-center gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3 sm:w-[44%] lg:w-auto"
                  >
                    <span className="shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{feature.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{feature.summary}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null;
      case "categories":
        return data.categories.length > 0 ? (
          <section id="categories" className={SECTION} aria-label={title}>
            <SectionHeading title={title} subtitle={subtitle} href="/products" linkLabel="All products" />
            <ul
              className={`${RAIL_TO_GRID} gap-4 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-7 md:grid-cols-6 lg:grid-cols-8`}
            >
              {data.categories.map((c) => (
                <li key={c.id} className="w-[22%] sm:w-auto">
                  <CategoryTile category={c} />
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      case "brands":
        return data.brands.length > 0 ? (
          <section className={SECTION} aria-label={title}>
            <SectionHeading title={title} subtitle={subtitle} href="/brands" linkLabel="All brands" />
            <ul className={`${RAIL_TO_GRID} sm:grid-cols-4 sm:gap-3 lg:grid-cols-8`}>
              {data.brands.map((b) => (
                <li key={b.id} className="w-[30%] sm:w-auto">
                  <Link
                    href={`/brand/${b.slug}`}
                    className="flex h-full flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md"
                  >
                    <BrandMark name={b.name} logo={b.logo} size="sm" />
                    <span className="text-xs font-semibold leading-tight">{b.name}</span>
                    <span className="-mt-1 text-[11px] text-muted-foreground">
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
          <section className="container-x py-10 lg:py-20">
            <div className="relative grid items-center gap-6 overflow-hidden rounded-3xl border border-border bg-secondary/40 p-6 sm:p-10 md:grid-cols-2 md:gap-8 lg:p-16">
              <div>
                {promise.eyebrow && (
                  <p className="text-sm font-semibold text-primary">{promise.eyebrow}</p>
                )}
                <h2 className="mt-2 font-serif text-3xl font-normal leading-tight text-foreground md:text-5xl">
                  {promise.titleLine1} <br /> {promise.titleLine2}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                  {promise.description}
                </p>
                {promise.ctaLabel && promise.ctaHref && (
                  <Link
                    href={promise.ctaHref}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    {promise.ctaLabel} <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <img
                {...getResponsiveImage(promise.image, LARGE_IMAGE_WIDTHS)}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt=""
                width={1600}
                height={1200}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-2xl border border-border object-cover shadow-md"
              />
            </div>
          </section>
        );
      case "testimonials":
        return testimonials.items.length > 0 ? (
          <section className="mt-4 border-t border-border/80 bg-secondary/30">
            <div className="container-x py-10 lg:py-20">
              <div className="mb-6 text-center lg:mb-12">
                {testimonials.eyebrow && (
                  <p className="text-sm font-semibold text-primary">{testimonials.eyebrow}</p>
                )}
                <h2 className="mt-1 font-serif text-3xl font-normal tracking-tight text-foreground lg:text-5xl">
                  {testimonials.title}
                </h2>
              </div>
              <ul className="rail md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:mx-0 md:px-0 md:pb-0">
                {testimonials.items.map((review, i) => (
                  <li key={i} className="w-[84%] sm:w-[60%] md:w-auto">
                    <figure className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
                      <div>
                        <div className="mb-3 flex gap-1 text-amber-500" aria-label="5 out of 5 stars">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star key={s} className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
                          ))}
                        </div>
                        <blockquote className="text-sm leading-relaxed text-foreground/90">
                          “{review.quote}”
                        </blockquote>
                      </div>
                      <figcaption className="flex items-center justify-between border-t border-border/60 pt-3">
                        <span className="text-xs font-bold text-foreground">{review.name}</span>
                        {review.city && (
                          <span className="text-xs text-muted-foreground">{review.city}, Bangladesh</span>
                        )}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null;
      case "newsletter":
        return (
          <section className="container-x py-12 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              {newsletter.eyebrow && (
                <p className="text-sm font-semibold text-primary">{newsletter.eyebrow}</p>
              )}
              <h2 className="mt-1 font-serif text-3xl font-normal text-foreground lg:text-5xl">
                {newsletter.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{newsletter.description}</p>
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
          <Fragment key={s.id}>{render(s, s.title || HOME_SECTIONS[s.id])}</Fragment>
        ))}
    </>
  );
}
