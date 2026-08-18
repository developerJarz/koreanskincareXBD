"use client";

import Link from "next/link";
import {
  ChevronRight,
  Leaf,
  Gem,
  Users,
  Heart,
  ArrowRight,
} from "lucide-react";
import { use } from "react";

import hero from "@/assets/hero.jpg";
import { getImageSrc } from "@/lib/image";
import { COURIER_PARTNERS } from "@/lib/site-data";

type RouteParams = { slug: string };

export default function SingleSegmentPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = use(params);
  const decodedSlug = decodeURIComponent(slug);

  if (decodedSlug === "about") return <AboutPage />;
  if (decodedSlug === "contact") return <ContactPage />;
  if (decodedSlug === "wishlist") return <WishlistPage />;
  if (decodedSlug === "track-order") return <TrackOrderPage />;

  return (
    <section className="container-x py-20 text-center">
      <p className="text-xs tracking-[0.2em] uppercase text-primary">Page not found</p>
      <h1 className="font-serif text-5xl mt-3">We couldn't find that page.</h1>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium"
      >
        Back home <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}

function AboutPage() {
  return (
    <>
      <section className="container-x py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">Our story</p>
          <h1 className="font-serif text-5xl lg:text-6xl mt-3 leading-tight">
            Softly modern.
            <br />
            <span className="italic text-primary">Made in Bangladesh.</span>
          </h1>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Shajgoj.bd was born in Dhaka out of a simple frustration — that the modern women of
            Bangladesh deserved better than the same tired accessories, sold the same tired way.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We curate every ring, every bag and every pair of earrings ourselves. Small drops,
            premium materials, honest prices. No bulk, no compromise.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition"
          >
            Shop the collection <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-blush blur-3xl opacity-40 rounded-3xl" />
          <img
            src={getImageSrc(hero)}
            alt="Shajgoj.bd accessories"
            className="relative rounded-3xl w-full object-cover aspect-[4/5]"
          />
        </div>
      </section>

      <section className="bg-secondary/40 border-y border-border">
        <div className="container-x py-16 lg:py-24">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">What we stand for</p>
            <h2 className="font-serif text-4xl lg:text-5xl mt-2">Four quiet promises</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Gem,
                t: "Premium quality",
                d: "Every piece is inspected by hand before it ships.",
              },
              {
                icon: Heart,
                t: "Made with love",
                d: "Small drops, curated with care for the modern woman.",
              },
              {
                icon: Leaf,
                t: "Mindful sourcing",
                d: "We work only with makers who share our values.",
              },
              {
                icon: Users,
                t: "Real support",
                d: "A human answers every message — usually within an hour.",
              },
            ].map((v) => (
              <div key={v.t} className="bg-card p-7 rounded-2xl border border-border shadow-sm">
                <v.icon className="w-6 h-6 text-primary" />
                <p className="mt-5 font-medium">{v.t}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16 lg:py-24 text-center max-w-2xl mx-auto">
        <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">By the numbers</p>
        <h2 className="font-serif text-4xl mt-2">A quiet rise</h2>
        <div className="mt-10 grid grid-cols-3 gap-6">
          {[
            { k: "15K+", v: "Happy customers" },
            { k: "250+", v: "Curated pieces" },
            { k: "4.9", v: "Average rating" },
          ].map((s) => (
            <div key={s.v}>
              <p className="font-serif text-4xl text-primary font-bold">{s.k}</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ContactPage() {
  return (
    <section className="container-x py-16 lg:py-24 grid lg:grid-cols-2 gap-12">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">Contact</p>
        <h1 className="font-serif text-5xl mt-3">We’re here to help.</h1>
        <p className="mt-5 text-muted-foreground max-w-xl">
          Need size advice, order updates, or wholesale information? Send us a note and we’ll get
          back to you quickly.
        </p>
        <div className="mt-8 space-y-3 text-sm">
          <p>Email: hello@shajgoj.bd</p>
          <p>Phone: +880 1711-223344</p>
          <p>Banani, Dhaka, Bangladesh</p>
        </div>
      </div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm"
      >
        <input
          className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm"
          placeholder="Your name"
        />
        <input
          className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm"
          placeholder="Your email"
        />
        <textarea
          className="w-full px-4 py-3 rounded-2xl border border-border bg-background min-h-40 text-sm"
          placeholder="How can we help?"
        />
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition">
          Send message <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}

function WishlistPage() {
  return (
    <section className="container-x py-16 lg:py-24 max-w-2xl mx-auto text-center">
      <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">Wishlist</p>
      <h1 className="font-serif text-5xl mt-3">Saved Favorites</h1>
      <p className="mt-4 text-muted-foreground">
        Explore our curated collection and save your favorite items.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium"
      >
        Explore Shop <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}

function TrackOrderPage() {
  return (
    <section className="container-x py-16 lg:py-24 max-w-2xl mx-auto">
      <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">Track Order</p>
      <h1 className="font-serif text-5xl mt-3">Track Your Package</h1>
      <form onSubmit={(e) => e.preventDefault()} className="mt-8 flex flex-col sm:flex-row gap-3">
        <input
          className="flex-1 px-4 py-3 rounded-full border border-border bg-background text-sm"
          placeholder="Order number (e.g. NB-102938) or Phone"
        />
        <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium">
          Track
        </button>
      </form>
      <div className="mt-8 grid sm:grid-cols-3 gap-4 text-sm">
        {COURIER_PARTNERS.map((partner) => (
          <div key={partner.name} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <p className="font-medium">{partner.name}</p>
            <p className="text-muted-foreground text-xs mt-1">{partner.tracking}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
