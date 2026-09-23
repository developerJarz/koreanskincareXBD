"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck, RotateCcw, Sparkles, Star, Truck } from "lucide-react";

import {
  CATEGORIES,
  PRODUCTS,
  HOMEPAGE_FEATURES,
  HOMEPAGE_SETTINGS,
  HOMEPAGE_TESTIMONIALS,
} from "@/lib/site-data";
import { ProductCard } from "@/components/ProductCard";
import { getImageSrc } from "@/lib/image";

const HERO_KBEAUTY_IMAGE =
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&q=80";
const PROMISE_KBEAUTY_IMAGE =
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80";

export default function HomePage() {
  const bestsellers = PRODUCTS.slice(0, 4);
  const newArrivals = PRODUCTS.slice(4, 12);
  const flashSale = PRODUCTS.filter(
    (product) => product.tag === "Sale" || product.tag === "Limited",
  ).slice(0, 4);

  // Focus on K-Beauty categories first
  const displayCategories = CATEGORIES.slice(0, 6);

  return (
    <>
      {/* Hero Showcase */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/30 via-background to-background">
        <div className="container-x grid lg:grid-cols-2 gap-10 lg:gap-16 py-12 lg:py-20 items-center">
          <div className="animate-fade-up order-2 lg:order-1">
            {/* Elegant Luxury Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card/90 border border-primary/20 shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {HOMEPAGE_SETTINGS.hero.badge}
              </span>
              <span className="hidden sm:inline text-[11px] font-medium text-muted-foreground border-l border-border/80 pl-2.5">
                Direct from Seoul, Korea
              </span>
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mt-5 text-foreground font-normal">
              {HOMEPAGE_SETTINGS.hero.title[0]}
              <br />
              <span className="italic text-primary font-serif">
                {HOMEPAGE_SETTINGS.hero.title[1]}
              </span>
            </h1>
            <p className="mt-6 text-muted-foreground max-w-md text-base sm:text-lg leading-relaxed">
              {HOMEPAGE_SETTINGS.hero.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 shadow-lg shadow-primary/25 transition"
              >
                {HOMEPAGE_SETTINGS.hero.primaryAction} <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 border border-border bg-card/60 px-7 py-3.5 rounded-full text-sm font-semibold hover:bg-secondary transition"
              >
                {HOMEPAGE_SETTINGS.hero.secondaryAction}
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-primary text-primary" /> 4.95 / 5 Verified Rating
              </div>
              <div className="font-medium">15,000+ Happy Customers in BD</div>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 animate-fade-up">
            <div className="absolute -top-6 -left-6 w-40 h-40 rounded-full bg-primary/20 blur-3xl opacity-60" />
            <div className="absolute -bottom-6 -right-6 w-56 h-56 rounded-full bg-rose-500/20 blur-3xl opacity-40" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/80">
              <img
                src={HERO_KBEAUTY_IMAGE}
                alt="Authentic Korean Skincare Routine"
                width={1600}
                height={1200}
                className="w-full h-full object-cover aspect-[4/5] hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-5 left-5 right-5 bg-background/90 backdrop-blur-md px-5 py-4 rounded-2xl flex items-center justify-between border border-border/60 shadow-lg">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    {HOMEPAGE_SETTINGS.hero.featuredLabel}
                  </p>
                  <p className="font-semibold text-foreground text-sm">
                    {HOMEPAGE_SETTINGS.hero.featuredTitle}
                  </p>
                </div>
                <Link
                  href="/product/cosrx-advanced-snail-96-mucin-power-essence"
                  className="font-serif text-sm font-semibold text-primary hover:underline"
                >
                  Shop Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Bar */}
      <section className="border-y border-border/80 bg-secondary/30">
        <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
          {HOMEPAGE_FEATURES.map((feature) => {
            const Icon =
              feature.icon === "truck"
                ? Truck
                : feature.icon === "refresh"
                  ? RotateCcw
                  : feature.icon === "shield"
                    ? ShieldCheck
                    : Sparkles;

            return (
              <div
                key={feature.title}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-card border border-border/70 shadow-2xs"
              >
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="w-5 h-5" />
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

      {/* Routine Categories */}
      <section id="categories" className="container-x py-16 lg:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
              {HOMEPAGE_SETTINGS.categories.eyebrow}
            </span>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2 tracking-tight text-foreground font-normal">
              {HOMEPAGE_SETTINGS.categories.title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
          >
            View all categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
          {displayCategories.map((c) => (
            <Link
              href={`/shop?category=${encodeURIComponent(c.slug)}`}
              key={c.slug}
              className="group relative overflow-hidden rounded-3xl bg-secondary card-interactive aspect-square border border-border/50"
            >
              <img
                src={getImageSrc(c.img)}
                alt={c.name}
                width={800}
                height={1000}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1556228852-6d35a585d566?w=800";
                }}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                <p className="font-serif text-lg font-bold leading-tight">{c.name}</p>
                <p className="text-[10px] font-medium opacity-85 mt-0.5">{c.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="container-x pb-8 lg:pb-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
              {HOMEPAGE_SETTINGS.bestsellers.eyebrow}
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2 text-foreground font-normal">
              {HOMEPAGE_SETTINGS.bestsellers.title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Shop full collection <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {bestsellers.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      </section>

      {/* Brand Promise Section */}
      <section className="container-x py-16 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-secondary/40 border border-border p-8 md:p-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
              {HOMEPAGE_SETTINGS.promise.eyebrow}
            </p>
            <h2 className="font-serif text-3xl md:text-5xl mt-3 leading-tight text-foreground font-normal">
              {HOMEPAGE_SETTINGS.promise.title[0]} <br /> {HOMEPAGE_SETTINGS.promise.title[1]}
            </h2>
            <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
              {HOMEPAGE_SETTINGS.promise.description}
            </p>
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 shadow-sm transition"
            >
              {HOMEPAGE_SETTINGS.promise.cta} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative">
            <img
              src={PROMISE_KBEAUTY_IMAGE}
              alt="Authentic Korean Skincare Promise"
              width={1600}
              height={1200}
              loading="lazy"
              className="rounded-2xl object-cover w-full aspect-[4/3] shadow-md border border-border"
            />
          </div>
        </div>
      </section>

      {/* Fresh Drops / New Arrivals */}
      <section className="container-x pb-8 lg:pb-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
              {HOMEPAGE_SETTINGS.freshDrops.eyebrow}
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2 text-foreground font-normal">
              {HOMEPAGE_SETTINGS.freshDrops.title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Explore all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {newArrivals.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      </section>

      {/* Flash Sale Grid */}
      <section className="container-x py-16 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] items-start rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="space-y-4 lg:sticky lg:top-24">
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-bold">Flash Deals</p>
            <h2 className="font-serif text-4xl lg:text-5xl leading-tight text-foreground font-normal">
              Seoul Import Specials.
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Limited-batch authentic Korean skincare items at special import discounts. Moving fast
              with nationwide Cash on Delivery.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              Browse all deals <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {flashSale.map((product) => (
              <ProductCard key={product.slug} p={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Verified Testimonials */}
      <section className="border-t border-border/80 bg-secondary/30 mt-8">
        <div className="container-x py-16 lg:py-24">
          <div className="text-center mb-12">
            <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
              {HOMEPAGE_SETTINGS.testimonials.eyebrow}
            </span>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2 tracking-tight text-foreground font-normal">
              {HOMEPAGE_SETTINGS.testimonials.title}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOMEPAGE_TESTIMONIALS.map((review) => (
              <div
                key={review.name}
                className="card-interactive bg-card p-7 rounded-3xl border border-border/80 shadow-xs hover:shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Verified Buyer
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 font-normal">
                    "{review.quote}"
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.city}, Bangladesh</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-x py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
            {HOMEPAGE_SETTINGS.newsletter.eyebrow}
          </p>
          <h2 className="font-serif text-4xl lg:text-5xl mt-2 text-foreground font-normal">
            {HOMEPAGE_SETTINGS.newsletter.title}
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {HOMEPAGE_SETTINGS.newsletter.description}
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="flex-1 px-5 py-3.5 rounded-full border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <button
              type="submit"
              className="px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-md shadow-primary/20"
            >
              Join Club
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
