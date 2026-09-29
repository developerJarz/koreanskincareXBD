/**
 * Everything about the public website that the team can change from the admin dashboard
 * ("Website design"): logo, announcement bar, homepage sections, footer and contact details.
 *
 * Shared by the server (validation, reading) and the admin editor. Stored in the Settings
 * document; anything missing falls back to DEFAULT_STOREFRONT, so the site always renders.
 */

export const TRUST_ICONS = ["shield", "truck", "refresh", "sparkles", "heart", "gift"] as const;
export type TrustIcon = (typeof TRUST_ICONS)[number];

export const HOME_SECTIONS = {
  hero: "Hero banner",
  trust: "Trust badges",
  categories: "Shop by category",
  bestsellers: "Best sellers",
  brands: "Shop by brand",
  newArrivals: "New arrivals",
  promise: "Brand promise",
  onSale: "On sale",
  featured: "Featured",
  trending: "Trending now",
  testimonials: "Customer reviews",
  newsletter: "Newsletter sign-up",
} as const;
export type HomeSectionId = keyof typeof HOME_SECTIONS;

/** Product rows whose heading can be renamed */
export const PRODUCT_ROW_SECTIONS: HomeSectionId[] = [
  "bestsellers",
  "newArrivals",
  "onSale",
  "featured",
  "trending",
];

export type NavLink = { label: string; href: string };

export type StorefrontConfig = {
  branding: {
    siteName: string;
    tagline: string;
    /** Uploaded logo image; empty = the built-in KoreanSkincare.bd wordmark */
    logoUrl: string;
    /** Optional light version for the dark footer; falls back to logoUrl */
    footerLogoUrl: string;
    /** Logo height in the header, in pixels */
    logoHeight: number;
    faviconUrl: string;
  };
  announcement: { enabled: boolean; messages: string[] };
  hero: {
    badge: string;
    badgeNote: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    image: string;
    imageAlt: string;
    featuredLabel: string;
    featuredTitle: string;
    featuredHref: string;
    ratingText: string;
    customersText: string;
  };
  trust: { items: Array<{ icon: TrustIcon; title: string; summary: string }> };
  promise: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Array<{ name: string; city: string; quote: string }>;
  };
  newsletter: { eyebrow: string; title: string; description: string };
  /** Homepage order and visibility; `title` renames product rows */
  sections: Array<{ id: HomeSectionId; enabled: boolean; title: string }>;
  footer: {
    about: string;
    columns: Array<{ title: string; links: NavLink[] }>;
    copyright: string;
    bottomNote: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    hours: string;
    mapUrl: string;
    heading: string;
    intro: string;
  };
  social: {
    facebook: string;
    instagram: string;
    youtube: string;
    tiktok: string;
  };
};

export const DEFAULT_STOREFRONT: StorefrontConfig = {
  branding: {
    siteName: "KoreanSkincare.bd",
    tagline: "Authentic Seoul Beauty",
    logoUrl: "",
    footerLogoUrl: "",
    logoHeight: 40,
    faviconUrl: "",
  },
  announcement: {
    enabled: true,
    messages: [
      "Free delivery inside Dhaka above ৳2,000",
      "Cash on delivery all over Bangladesh",
      "Easy 7-day exchange",
      "100% authentic Korean skincare",
    ],
  },
  hero: {
    badge: "100% Authentic Korean Formulations",
    badgeNote: "Direct from Seoul, Korea",
    titleLine1: "Radiant Glass Skin,",
    titleLine2: "Direct from Seoul.",
    description:
      "Clinically-proven Korean skincare essentials — snail mucin essences, soothing toners, lightweight SPF 50+ sunscreens, and ceramide barrier creams delivered anywhere in Bangladesh with Cash on Delivery.",
    primaryLabel: "Shop K-Beauty Collection",
    primaryHref: "/products",
    secondaryLabel: "Explore Categories",
    secondaryHref: "/products",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&q=80",
    imageAlt: "Authentic Korean skincare routine",
    featuredLabel: "Seoul Bestseller Edit",
    featuredTitle: "COSRX Snail Mucin Essence",
    featuredHref: "/products?flag=bestseller",
    ratingText: "4.95 / 5 Verified Rating",
    customersText: "15,000+ Happy Customers in BD",
  },
  trust: {
    items: [
      { icon: "shield", title: "100% Authentic Import", summary: "Direct Seoul batch verified" },
      { icon: "truck", title: "24h Dhaka Express", summary: "Nationwide COD in 48-72h" },
      { icon: "refresh", title: "7-Day Easy Return", summary: "Hassle-free exchange policy" },
      { icon: "sparkles", title: "Dermatologist Tested", summary: "Gentle on sensitive skin" },
    ],
  },
  promise: {
    eyebrow: "The KoreanSkincare.bd Guarantee",
    titleLine1: "100% Genuine Import,",
    titleLine2: "Clinically Proven Formulations.",
    description:
      "Every bottle is directly sourced from authorized Seoul laboratories and distributors. Batch-code verified, sealed packaging, and zero counterfeit compromise.",
    ctaLabel: "Discover Our Story",
    ctaHref: "/about",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80",
  },
  testimonials: {
    eyebrow: "Verified Buyer Stories",
    title: "Loved by 15,000+ Glowing Customers",
    items: [
      {
        name: "Dr. Sadia Rahman",
        city: "Dhaka",
        quote:
          "The COSRX Snail Mucin Essence transformed my skin barrier within 2 weeks. 100% authentic batch code, delivered in under 24 hours.",
      },
      {
        name: "Nusrat Khanom",
        city: "Chattogram",
        quote:
          "Beauty of Joseon Rice Sunscreen has zero white cast on Bangladeshi skin. KoreanSkincare.bd is now my holy-grail store for K-Beauty.",
      },
      {
        name: "Tasnia Chowdhury",
        city: "Sylhet",
        quote:
          "Super fast Cash on Delivery and genuine products directly imported from Korea. Best prices in Bangladesh with responsive customer support.",
      },
    ],
  },
  newsletter: {
    eyebrow: "Join the K-Beauty Club",
    title: "Exclusive Drops & Skincare Routine Guides",
    description:
      "Subscribe for early access to limited Seoul shipments and authentic skincare tips.",
  },
  sections: [
    { id: "hero", enabled: true, title: "" },
    { id: "trust", enabled: true, title: "" },
    { id: "categories", enabled: true, title: "Shop by category" },
    { id: "bestsellers", enabled: true, title: "Best sellers" },
    { id: "brands", enabled: true, title: "Shop by brand" },
    { id: "newArrivals", enabled: true, title: "New arrivals" },
    { id: "promise", enabled: true, title: "" },
    { id: "onSale", enabled: true, title: "On sale" },
    { id: "featured", enabled: true, title: "Featured" },
    { id: "trending", enabled: true, title: "Trending now" },
    { id: "testimonials", enabled: true, title: "" },
    { id: "newsletter", enabled: true, title: "" },
  ],
  footer: {
    about:
      "100% Authentic Korean skincare, clinically-proven beauty formulas & glass skin essentials delivered nationwide in Bangladesh with Cash on Delivery.",
    columns: [
      {
        title: "Shop K-Beauty",
        links: [
          { label: "All Products", href: "/products" },
          { label: "Serums & Ampoules", href: "/category/serums" },
          { label: "Toners & Essences", href: "/category/toners" },
          { label: "Sunscreen & UV Shield", href: "/category/sunscreens" },
          { label: "Cleansers & Washes", href: "/category/cleansers" },
          { label: "Barrier Moisturizers", href: "/category/moisturizers" },
        ],
      },
      {
        title: "Help & Support",
        links: [
          { label: "Track Your Order", href: "/track-order" },
          { label: "Shopping Bag", href: "/cart" },
          { label: "Contact & Support", href: "/contact" },
          { label: "My Account", href: "/account" },
        ],
      },
      {
        title: "About KoreanSkincare.bd",
        links: [
          { label: "Our Story & Authenticity", href: "/about" },
          { label: "K-Beauty Skincare Journal", href: "/blog" },
          { label: "All Brands", href: "/brands" },
        ],
      },
    ],
    copyright: "KoreanSkincare.bd — All rights reserved.",
    bottomNote: "bKash · Nagad · Cash on Delivery",
  },
  contact: {
    email: "hello@koreanskincare.bd",
    phone: "+880 1711-223344",
    whatsapp: "+8801711223344",
    address: "House 42, Road 11, Banani, Dhaka 1213",
    hours: "Saturday – Thursday, 10am – 8pm",
    mapUrl: "",
    heading: "We’re here to help.",
    intro:
      "Questions about a product, your skin routine or an order? Message us and we’ll get back to you quickly.",
  },
  social: {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  },
};

// ─── Validation ───────────────────────────────────────────────────────────────

type Errors = Record<string, string>;

const str = (value: unknown, fallback: string, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : fallback;

/** Site paths ("/about") and http(s) links are allowed; anything else (javascript:, data:) is not. */
export function isAllowedLink(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (/^(mailto:|tel:)/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function link(value: unknown, fallback: string, key: string, errors: Errors, max = 500) {
  const v = str(value, fallback, max);
  if (!isAllowedLink(v)) {
    errors[key] = "Use a page path like /about or a full https:// link.";
    return fallback;
  }
  return v;
}

function imageUrl(value: unknown, fallback: string, key: string, errors: Errors) {
  const v = str(value, fallback, 1000);
  if (v && !/^https:\/\//i.test(v) && !(v.startsWith("/") && !v.startsWith("//"))) {
    errors[key] = "Images must be uploaded or use an https:// link.";
    return fallback;
  }
  return v;
}

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/**
 * Turns anything (a saved document, or the admin's form) into a complete, safe StorefrontConfig.
 * Unknown fields are dropped, text is trimmed and length-limited, links are checked.
 */
export function normalizeStorefront(input: unknown): { value: StorefrontConfig; errors: Errors } {
  const errors: Errors = {};
  const raw = obj(input);
  const D = DEFAULT_STOREFRONT;

  const b = obj(raw.branding);
  const branding: StorefrontConfig["branding"] = {
    siteName: str(b.siteName, D.branding.siteName, 80) || D.branding.siteName,
    tagline: str(b.tagline, D.branding.tagline, 80),
    logoUrl: imageUrl(b.logoUrl, D.branding.logoUrl, "branding.logoUrl", errors),
    footerLogoUrl: imageUrl(
      b.footerLogoUrl,
      D.branding.footerLogoUrl,
      "branding.footerLogoUrl",
      errors,
    ),
    logoHeight: Math.min(
      80,
      Math.max(24, Math.round(Number(b.logoHeight) || D.branding.logoHeight)),
    ),
    faviconUrl: imageUrl(b.faviconUrl, D.branding.faviconUrl, "branding.faviconUrl", errors),
  };

  const a = obj(raw.announcement);
  const announcement = {
    enabled: typeof a.enabled === "boolean" ? a.enabled : D.announcement.enabled,
    messages: Array.isArray(a.messages)
      ? a.messages
          .map((m) => str(m, "", 140))
          .filter(Boolean)
          .slice(0, 8)
      : D.announcement.messages,
  };

  const h = obj(raw.hero);
  const hero: StorefrontConfig["hero"] = {
    badge: str(h.badge, D.hero.badge, 80),
    badgeNote: str(h.badgeNote, D.hero.badgeNote, 80),
    titleLine1: str(h.titleLine1, D.hero.titleLine1, 80),
    titleLine2: str(h.titleLine2, D.hero.titleLine2, 80),
    description: str(h.description, D.hero.description, 400),
    primaryLabel: str(h.primaryLabel, D.hero.primaryLabel, 40),
    primaryHref: link(h.primaryHref, D.hero.primaryHref, "hero.primaryHref", errors),
    secondaryLabel: str(h.secondaryLabel, D.hero.secondaryLabel, 40),
    secondaryHref: link(h.secondaryHref, D.hero.secondaryHref, "hero.secondaryHref", errors),
    image: imageUrl(h.image, D.hero.image, "hero.image", errors) || D.hero.image,
    imageAlt: str(h.imageAlt, D.hero.imageAlt, 150),
    featuredLabel: str(h.featuredLabel, D.hero.featuredLabel, 60),
    featuredTitle: str(h.featuredTitle, D.hero.featuredTitle, 80),
    featuredHref: link(h.featuredHref, D.hero.featuredHref, "hero.featuredHref", errors),
    ratingText: str(h.ratingText, D.hero.ratingText, 60),
    customersText: str(h.customersText, D.hero.customersText, 60),
  };

  const t = obj(raw.trust);
  const trust = {
    items: Array.isArray(t.items)
      ? t.items.slice(0, 6).map((item) => {
          const i = obj(item);
          return {
            icon: TRUST_ICONS.includes(i.icon as TrustIcon) ? (i.icon as TrustIcon) : "sparkles",
            title: str(i.title, "", 60),
            summary: str(i.summary, "", 100),
          };
        })
      : D.trust.items,
  };
  trust.items = trust.items.filter((i) => i.title);

  const p = obj(raw.promise);
  const promise: StorefrontConfig["promise"] = {
    eyebrow: str(p.eyebrow, D.promise.eyebrow, 80),
    titleLine1: str(p.titleLine1, D.promise.titleLine1, 80),
    titleLine2: str(p.titleLine2, D.promise.titleLine2, 80),
    description: str(p.description, D.promise.description, 500),
    ctaLabel: str(p.ctaLabel, D.promise.ctaLabel, 40),
    ctaHref: link(p.ctaHref, D.promise.ctaHref, "promise.ctaHref", errors),
    image: imageUrl(p.image, D.promise.image, "promise.image", errors) || D.promise.image,
  };

  const ts = obj(raw.testimonials);
  const testimonials: StorefrontConfig["testimonials"] = {
    eyebrow: str(ts.eyebrow, D.testimonials.eyebrow, 80),
    title: str(ts.title, D.testimonials.title, 100),
    items: Array.isArray(ts.items)
      ? ts.items
          .slice(0, 9)
          .map((item) => {
            const i = obj(item);
            return {
              name: str(i.name, "", 60),
              city: str(i.city, "", 40),
              quote: str(i.quote, "", 400),
            };
          })
          .filter((i) => i.name && i.quote)
      : D.testimonials.items,
  };

  const n = obj(raw.newsletter);
  const newsletter = {
    eyebrow: str(n.eyebrow, D.newsletter.eyebrow, 80),
    title: str(n.title, D.newsletter.title, 100),
    description: str(n.description, D.newsletter.description, 300),
  };

  // Every known section appears exactly once: saved order first, new ones appended
  const sections: StorefrontConfig["sections"] = [];
  for (const s of arr(raw.sections)) {
    const o = obj(s);
    const id = o.id as HomeSectionId;
    if (!(id in HOME_SECTIONS) || sections.some((x) => x.id === id)) continue;
    const def = D.sections.find((x) => x.id === id)!;
    sections.push({
      id,
      enabled: typeof o.enabled === "boolean" ? o.enabled : true,
      title: str(o.title, def.title, 60) || def.title,
    });
  }
  for (const def of D.sections) {
    if (!sections.some((x) => x.id === def.id)) sections.push({ ...def });
  }

  const f = obj(raw.footer);
  const footer: StorefrontConfig["footer"] = {
    about: str(f.about, D.footer.about, 400),
    columns: Array.isArray(f.columns)
      ? f.columns.slice(0, 4).map((col, ci) => {
          const c = obj(col);
          return {
            title: str(c.title, "", 60),
            links: arr(c.links)
              .slice(0, 10)
              .map((l, li) => {
                const o = obj(l);
                return {
                  label: str(o.label, "", 60),
                  href: link(o.href, "", `footer.columns.${ci}.links.${li}`, errors),
                };
              })
              .filter((l) => l.label && l.href),
          };
        })
      : D.footer.columns,
    copyright: str(f.copyright, D.footer.copyright, 150),
    bottomNote: str(f.bottomNote, D.footer.bottomNote, 150),
  };

  const c = obj(raw.contact);
  const email = str(c.email, D.contact.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors["contact.email"] = "Enter a valid email address.";
  const contact: StorefrontConfig["contact"] = {
    email,
    phone: str(c.phone, D.contact.phone, 40),
    whatsapp: str(c.whatsapp, D.contact.whatsapp, 40),
    address: str(c.address, D.contact.address, 300),
    hours: str(c.hours, D.contact.hours, 120),
    mapUrl: link(c.mapUrl, D.contact.mapUrl, "contact.mapUrl", errors, 1000),
    heading: str(c.heading, D.contact.heading, 100),
    intro: str(c.intro, D.contact.intro, 400),
  };

  const so = obj(raw.social);
  const social = {} as StorefrontConfig["social"];
  for (const key of ["facebook", "instagram", "youtube", "tiktok"] as const) {
    const v = str(so[key], D.social[key], 300);
    if (v && !/^https?:\/\//i.test(v)) {
      errors[`social.${key}`] = "Use the full link, starting with https://";
      social[key] = D.social[key];
    } else social[key] = v;
  }

  return {
    value: {
      branding,
      announcement,
      hero,
      trust,
      promise,
      testimonials,
      newsletter,
      sections,
      footer,
      contact,
      social,
    },
    errors,
  };
}

/** "+880 1711-223344" → "8801711223344" for wa.me links */
export function whatsappLink(number: string) {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}
