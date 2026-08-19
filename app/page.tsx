import Link from "next/link";
import { ChevronRight, ShieldCheck, RotateCcw, Sparkles, Star, Truck } from "lucide-react";

import hero from "@/assets/hero.jpg";
import {
  CATEGORIES,
  PRODUCTS,
  HOMEPAGE_FEATURES,
  HOMEPAGE_SETTINGS,
  HOMEPAGE_TESTIMONIALS,
} from "@/lib/site-data";
import { ProductCard } from "@/components/ProductCard";
import { getImageSrc } from "@/lib/image";

export default function HomePage() {
  const bestsellers = PRODUCTS.slice(0, 4);
  const newArrivals = PRODUCTS.slice(4, 12);
  const flashSale = PRODUCTS.filter(
    (product) => product.tag === "Sale" || product.tag === "Limited",
  ).slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container-x grid lg:grid-cols-2 gap-10 lg:gap-16 py-12 lg:py-24 items-center">
          <div className="animate-fade-up order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary">
              <Sparkles className="w-3.5 h-3.5" /> {HOMEPAGE_SETTINGS.hero.badge}
            </span>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mt-5">
              {HOMEPAGE_SETTINGS.hero.title[0]}
              <br />
              <span className="italic text-primary">{HOMEPAGE_SETTINGS.hero.title[1]}</span>
            </h1>
            <p className="mt-6 text-muted-foreground max-w-md text-base sm:text-lg">
              {HOMEPAGE_SETTINGS.hero.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition"
              >
                {HOMEPAGE_SETTINGS.hero.primaryAction} <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 border border-border px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition"
              >
                {HOMEPAGE_SETTINGS.hero.secondaryAction}
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-primary text-primary" /> 4.9 / 5 rating
              </div>
              <div>15,000+ happy customers</div>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 animate-fade-up">
            <div className="absolute -top-6 -left-6 w-40 h-40 rounded-full bg-blush blur-3xl opacity-70" />
            <div className="absolute -bottom-6 -right-6 w-56 h-56 rounded-full bg-gold blur-3xl opacity-40" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={getImageSrc(hero)}
                alt="Flat lay of premium women's accessories"
                width={1600}
                height={1200}
                className="w-full h-full object-cover aspect-[4/5]"
              />
              <div className="absolute bottom-5 left-5 right-5 bg-background/85 backdrop-blur px-5 py-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {HOMEPAGE_SETTINGS.hero.featuredLabel}
                  </p>
                  <p className="font-medium">{HOMEPAGE_SETTINGS.hero.featuredTitle}</p>
                </div>
                <Link href="/shop" className="font-serif text-sm hover:text-primary">
                  Shop →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
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
              <div key={feature.title} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="categories" className="container-x py-16 lg:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary">
              {HOMEPAGE_SETTINGS.categories.eyebrow}
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2">
              {HOMEPAGE_SETTINGS.categories.title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1 text-sm hover:text-primary"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
          {CATEGORIES.map((c) => (
            <Link
              href="/shop"
              key={c.slug}
              className="group relative overflow-hidden rounded-2xl bg-secondary"
            >
              <img
                src={getImageSrc(c.img)}
                alt={c.name}
                width={800}
                height={1000}
                loading="lazy"
                className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-primary-foreground">
                <p className="font-serif text-lg">{c.name}</p>
                <p className="text-[10px] opacity-80">{c.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pb-8 lg:pb-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary">
              {HOMEPAGE_SETTINGS.bestsellers.eyebrow}
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2">
              {HOMEPAGE_SETTINGS.bestsellers.title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1 text-sm hover:text-primary"
          >
            Shop all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {bestsellers.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      </section>

      <section className="container-x py-16 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-accent p-8 md:p-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary">
              {HOMEPAGE_SETTINGS.promise.eyebrow}
            </p>
            <h2 className="font-serif text-3xl md:text-5xl mt-3 leading-tight">
              {HOMEPAGE_SETTINGS.promise.title[0]} <br /> {HOMEPAGE_SETTINGS.promise.title[1]}
            </h2>
            <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-md">
              {HOMEPAGE_SETTINGS.promise.description}
            </p>
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-2 border border-foreground/20 px-6 py-3 rounded-full text-sm hover:bg-background transition"
            >
              {HOMEPAGE_SETTINGS.promise.cta} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative">
            <img
              src={getImageSrc(hero)}
              alt="Editorial accessories"
              width={1600}
              height={1200}
              loading="lazy"
              className="rounded-2xl object-cover w-full aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      <section className="container-x pb-8 lg:pb-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary">
              {HOMEPAGE_SETTINGS.freshDrops.eyebrow}
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2">
              {HOMEPAGE_SETTINGS.freshDrops.title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1 text-sm hover:text-primary"
          >
            Shop all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {newArrivals.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      </section>

      <section className="container-x py-16 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] items-start rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="space-y-4 lg:sticky lg:top-24">
            <p className="text-xs tracking-[0.2em] uppercase text-primary">Flash sale</p>
            <h2 className="font-serif text-4xl lg:text-5xl leading-tight">
              Fresh markdowns, moving fast.
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              A rotating edit of sale and limited pieces so the homepage stays current without
              feeling overbuilt.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Browse the sale <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {flashSale.map((product) => (
              <div
                key={product.slug}
                className="rounded-3xl border border-border overflow-hidden bg-background"
              >
                <img
                  src={getImageSrc(product.img)}
                  alt={product.name}
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {product.tag}
                  </p>
                  <p className="mt-1 font-medium">{product.name}</p>
                  <p className="mt-2 font-sans font-bold text-lg text-foreground">
                    ৳{product.price.toLocaleString()}
                  </p>
                  <Link
                    href={`/product/${encodeURIComponent(product.slug)}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-primary"
                  >
                    View item <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40 mt-8">
        <div className="container-x py-16 lg:py-24">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.2em] uppercase text-primary">
              {HOMEPAGE_SETTINGS.testimonials.eyebrow}
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2">
              {HOMEPAGE_SETTINGS.testimonials.title}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOMEPAGE_TESTIMONIALS.map((review) => (
              <div key={review.name} className="bg-card p-7 rounded-2xl border border-border">
                <div className="flex gap-0.5 text-primary mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed">"{review.quote}"</p>
                <p className="mt-5 text-xs text-muted-foreground">
                  — {review.name}, {review.city}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-primary">
            {HOMEPAGE_SETTINGS.newsletter.eyebrow}
          </p>
          <h2 className="font-serif text-4xl lg:text-5xl mt-2">
            {HOMEPAGE_SETTINGS.newsletter.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{HOMEPAGE_SETTINGS.newsletter.description}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="Your email address"
              className="flex-1 px-5 py-3.5 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
