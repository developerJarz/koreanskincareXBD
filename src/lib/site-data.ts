import type { ImageSource } from "@/lib/image";

// Demo images hosted on Cloudinary (uploaded by scripts/migrate-images-to-cloudinary.mjs)
const CDN = "https://res.cloudinary.com/jxbnangy/image/upload";
const catBags = `${CDN}/v1790700913/koreanskincare/categories/cat-bags.jpg`;
const catRings = `${CDN}/v1790700917/koreanskincare/categories/cat-rings.jpg`;
const catEarrings = `${CDN}/v1790700914/koreanskincare/categories/cat-earrings.jpg`;
const catWatches = `${CDN}/v1790700918/koreanskincare/categories/cat-watches.jpg`;

export type Category = {
  slug: string;
  name: string;
  img: ImageSource;
  count: string;
  description?: string;
};

export type Product = {
  slug: string;
  name: string;
  brand?: string;
  category: string;
  categorySlug?: string;
  price: number;
  was: number | null;
  img: ImageSource;
  images?: string[];
  tag?: "New" | "Bestseller" | "Limited" | "Sale" | "Hot" | "Best Seller";
  rating?: number;
  reviewCount?: number;
  volume?: string;
  variants?: string[];
  sizes?: string[];
  colors?: string[];
  description?: string;
  benefits?: string[];
  howToUse?: string;
  keyIngredients?: string[];
  skinType?: string[];
  inStock?: boolean;
  stock?: number;
  stockCount?: number;
};

export type HomepageFeature = {
  icon: "truck" | "refresh" | "shield" | "sparkles";
  title: string;
  summary: string;
};

export type HomepageTestimonial = {
  name: string;
  city: string;
  quote: string;
};

export type AdminModule = {
  title: string;
  description: string;
};

export type CustomerModule = {
  title: string;
  description: string;
};

export type AuthProvider = {
  name: string;
  status: "ready" | "planned";
  description: string;
};

export type PaymentGateway = {
  name: string;
  enabled: boolean;
};

export type CourierPartner = {
  name: string;
  tracking: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "serums",
    name: "Serums & Ampoules",
    img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
    count: "48 products",
    description: "Targeted glow, hyperpigmentation & barrier repair formulas",
  },
  {
    slug: "toners",
    name: "Toners & Essences",
    img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
    count: "36 products",
    description: "Hydrating, soothing 7-skin method essences & toners",
  },
  {
    slug: "sunscreens",
    name: "Sun Care & SPF",
    img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800",
    count: "29 products",
    description: "Zero-white cast, lightweight Korean sunscreens with SPF50+ PA++++",
  },
  {
    slug: "cleansers",
    name: "Cleansers & Washes",
    img: "https://images.unsplash.com/photo-1556228852-6d35a585d566?w=800",
    count: "32 products",
    description: "Gentle low-pH gel washes and cleansing oils",
  },
  {
    slug: "moisturizers",
    name: "Moisturizers & Creams",
    img: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800",
    count: "44 products",
    description: "Ceramide barrier creams, gel moisturizers & sleeping packs",
  },
  {
    slug: "masks",
    name: "Sheet Masks & Peels",
    img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
    count: "25 products",
    description: "Instant glass-skin sheet masks and gentle chemical exfoliants",
  },
  {
    slug: "eye-lip-care",
    name: "Eye & Lip Treatments",
    img: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
    count: "18 products",
    description: "Overnight lip sleeping masks and caffeine peptide eye creams",
  },
  {
    slug: "sets",
    name: "K-Beauty Routine Sets",
    img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800",
    count: "15 curated sets",
    description: "Step-by-step complete Korean 5-step skincare rituals",
  },
  {
    slug: "bags",
    name: "Bags & Totes",
    img: catBags,
    count: "58 pieces",
    description: "Handcrafted luxury bags and everyday totes",
  },
  {
    slug: "rings",
    name: "Jewelry & Rings",
    img: catRings,
    count: "42 pieces",
    description: "Anti-tarnish rose gold and gold pavé rings",
  },
  {
    slug: "earrings",
    name: "Earrings & Drops",
    img: catEarrings,
    count: "76 pieces",
    description: "Freshwater pearls and minimalist studs",
  },
  {
    slug: "watches",
    name: "Luxury Watches",
    img: catWatches,
    count: "22 pieces",
    description: "Timeless classic and modern mesh watches",
  },
];

export const PRODUCTS: Product[] = [];

export const HOMEPAGE_FEATURES: HomepageFeature[] = [
  { icon: "shield", title: "100% Authentic Import", summary: "Direct Seoul batch verified" },
  { icon: "truck", title: "24h Dhaka Express", summary: "Nationwide COD in 48-72h" },
  { icon: "refresh", title: "7-Day Easy Return", summary: "Hassle-free exchange policy" },
  { icon: "sparkles", title: "Dermatologist Tested", summary: "Gentle on sensitive skin" },
];

export const HOMEPAGE_TESTIMONIALS: HomepageTestimonial[] = [
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
];

export const AUTH_PROVIDERS: AuthProvider[] = [
  {
    name: "Email & Password",
    status: "ready",
    description: "Primary authentication flow with secure session handling.",
  },
  {
    name: "Google Login",
    status: "ready",
    description: "Social sign-in for shoppers and staff accounts.",
  },
  {
    name: "Facebook Login",
    status: "planned",
    description: "Integration-ready provider slot for future rollout.",
  },
  {
    name: "OTP Login",
    status: "planned",
    description: "Phone and email OTP architecture reserved for expansion.",
  },
];

export const PAYMENT_GATEWAYS: PaymentGateway[] = [
  { name: "SSLCommerz", enabled: true },
  { name: "bKash", enabled: true },
  { name: "Nagad", enabled: true },
  { name: "Rocket", enabled: false },
  { name: "ShurjoPay", enabled: false },
  { name: "aamarPay", enabled: false },
  { name: "Cash on Delivery", enabled: true },
];

export const COURIER_PARTNERS: CourierPartner[] = [
  { name: "SteadFast", tracking: "Ready" },
  { name: "Pathao Courier", tracking: "Ready" },
  { name: "RedX", tracking: "Ready" },
  { name: "Sundarban", tracking: "Ready" },
  { name: "Paperfly", tracking: "Ready" },
];

export const CUSTOMER_MODULES: CustomerModule[] = [
  {
    title: "Dashboard Overview",
    description: "Orders, wallet, reward points, and recent activity at a glance.",
  },
  {
    title: "My Orders",
    description: "Track purchase status, delivery progress, and invoice downloads.",
  },
  {
    title: "Wishlist",
    description: "Save favorites across devices and move items to cart instantly.",
  },
  {
    title: "Addresses & Security",
    description: "Manage saved addresses, passwords, and account preferences.",
  },
];

export const ADMIN_MODULES: AdminModule[] = [
  { title: "Sales Analytics", description: "Revenue, conversion, AOV, and cohort views." },
  {
    title: "Products & Inventory",
    description: "Catalog, variants, stock, bulk edits, and media library.",
  },
  {
    title: "Homepage Builder",
    description: "Sections, banners, featured products, and publish controls.",
  },
  {
    title: "Operations",
    description: "Orders, payments, shipping, coupons, reviews, and audit logs.",
  },
];

export const HOMEPAGE_SETTINGS = {
  hero: {
    badge: "100% Authentic Korean Formulations",
    title: ["Radiant Glass Skin,", "Direct from Seoul."],
    description:
      "Clinically-proven Korean skincare essentials — snail mucin essences, soothing toners, lightweight SPF 50+ sunscreens, and ceramide barrier creams delivered anywhere in Bangladesh with Cash on Delivery.",
    primaryAction: "Shop K-Beauty Collection",
    secondaryAction: "Explore Categories",
    featuredLabel: "Seoul Bestseller Edit",
    featuredTitle: "COSRX Snail Mucin Essence",
  },
  categories: {
    eyebrow: "Shop by Step & Routine",
    title: "Essential K-Beauty Formulations",
  },
  bestsellers: {
    eyebrow: "Cult Favorites",
    title: "Most Loved by Bangladeshi Shoppers",
  },
  promise: {
    eyebrow: "The KoreanSkincare.bd Guarantee",
    title: ["100% Genuine Import,", "Clinically Proven Formulations."],
    description:
      "Every bottle is directly sourced from authorized Seoul laboratories and distributors. Batch-code verified, sealed packaging, and zero counterfeit compromise.",
    cta: "Discover Our Story",
  },
  freshDrops: {
    eyebrow: "New Arrivals",
    title: "Trending in Seoul This Season",
  },
  testimonials: {
    eyebrow: "Verified Buyer Stories",
    title: "Loved by 15,000+ Glowing Customers",
  },
  newsletter: {
    eyebrow: "Join the K-Beauty Club",
    title: "Exclusive Drops & Skincare Routine Guides",
    description:
      "Subscribe for early access to limited Seoul shipments and authentic skincare tips.",
  },
} as const;

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/shop", label: "Toners & Essences", params: { category: "toners" } },
  { to: "/shop", label: "Serums & Ampoules", params: { category: "serums" } },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;
