import catBags from "@/assets/cat-bags.jpg";
import catRings from "@/assets/cat-rings.jpg";
import catEarrings from "@/assets/cat-earrings.jpg";
import catNecklaces from "@/assets/cat-necklaces.jpg";
import catSunglasses from "@/assets/cat-sunglasses.jpg";
import catWatches from "@/assets/cat-watches.jpg";

import prBag1 from "@/assets/pr-bag1.jpg";
import prBag2 from "@/assets/pr-bag2.jpg";
import prRing1 from "@/assets/pr-ring1.jpg";
import prEar1 from "@/assets/pr-ear1.jpg";
import prNeck1 from "@/assets/pr-neck1.jpg";
import prWatch1 from "@/assets/pr-watch1.jpg";
import prScarf1 from "@/assets/pr-scarf1.jpg";
import type { ImageSource } from "@/lib/image";

export type Category = { slug: string; name: string; img: ImageSource; count: string };
export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  was: number | null;
  img: ImageSource;
  tag?: "New" | "Bestseller" | "Limited" | "Sale";
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
  { slug: "bags", name: "Bags", img: catBags, count: "58 pieces" },
  { slug: "rings", name: "Rings", img: catRings, count: "42 pieces" },
  { slug: "earrings", name: "Earrings", img: catEarrings, count: "76 pieces" },
  { slug: "necklaces", name: "Necklaces", img: catNecklaces, count: "34 pieces" },
  { slug: "watches", name: "Watches", img: catWatches, count: "22 pieces" },
  { slug: "sunglasses", name: "Sunglasses", img: catSunglasses, count: "19 pieces" },
];

export const PRODUCTS: Product[] = [
  {
    slug: "blush-mini-crossbody",
    name: "Blush Mini Crossbody",
    category: "bags",
    price: 3490,
    was: 4200,
    img: catBags,
    tag: "New",
  },
  {
    slug: "beige-woven-tote",
    name: "Beige Woven Tote",
    category: "bags",
    price: 4290,
    was: null,
    img: prBag1,
    tag: "Bestseller",
  },
  {
    slug: "noir-quilted-flap",
    name: "Noir Quilted Flap Bag",
    category: "bags",
    price: 4890,
    was: 5900,
    img: prBag2,
    tag: "Limited",
  },
  {
    slug: "rosé-crystal-band",
    name: "Rosé Crystal Band Ring",
    category: "rings",
    price: 1290,
    was: 1690,
    img: catRings,
    tag: "New",
  },
  {
    slug: "gold-pavé-stack",
    name: "Gold Pavé Ring Stack",
    category: "rings",
    price: 1890,
    was: null,
    img: prRing1,
    tag: "Bestseller",
  },
  {
    slug: "pearl-drop-studs",
    name: "Pearl Drop Studs",
    category: "earrings",
    price: 990,
    was: 1290,
    img: catEarrings,
    tag: "Sale",
  },
  {
    slug: "rosé-pearl-hoops",
    name: "Rosé Pearl Hoops",
    category: "earrings",
    price: 1490,
    was: null,
    img: prEar1,
    tag: "New",
  },
  {
    slug: "petite-gold-pendant",
    name: "Petite Gold Pendant",
    category: "necklaces",
    price: 1790,
    was: 2200,
    img: catNecklaces,
    tag: "Bestseller",
  },
  {
    slug: "layered-charm-chain",
    name: "Layered Charm Chain",
    category: "necklaces",
    price: 2490,
    was: null,
    img: prNeck1,
    tag: "New",
  },
  {
    slug: "ivory-classic-watch",
    name: "Ivory Classic Watch",
    category: "watches",
    price: 4990,
    was: 5900,
    img: catWatches,
    tag: "Bestseller",
  },
  {
    slug: "rosé-leather-watch",
    name: "Rosé Leather Watch",
    category: "watches",
    price: 5290,
    was: null,
    img: prWatch1,
    tag: "Limited",
  },
  {
    slug: "amber-cat-eye-shades",
    name: "Amber Cat-Eye Shades",
    category: "sunglasses",
    price: 1890,
    was: 2290,
    img: catSunglasses,
    tag: "Sale",
  },
  {
    slug: "blush-silk-scarf",
    name: "Blush Silk Hair Scarf",
    category: "bags",
    price: 790,
    was: null,
    img: prScarf1,
    tag: "New",
  },
];

export const HOMEPAGE_FEATURES: HomepageFeature[] = [
  { icon: "truck", title: "Free Delivery", summary: "Inside Dhaka over ৳2,000" },
  { icon: "refresh", title: "7-Day Exchange", summary: "Hassle-free returns" },
  { icon: "shield", title: "Cash on Delivery", summary: "All over Bangladesh" },
  { icon: "sparkles", title: "Premium Quality", summary: "Thoughtfully curated" },
];

export const HOMEPAGE_TESTIMONIALS: HomepageTestimonial[] = [
  {
    name: "Ayesha R.",
    city: "Dhaka",
    quote: "The rose gold ring stack is exquisite. Packaging felt like a real luxury brand.",
  },
  {
    name: "Nusrat K.",
    city: "Chattogram",
    quote: "My blush crossbody is my new favorite piece — everyone asks where I got it.",
  },
  {
    name: "Tasnia H.",
    city: "Sylhet",
    quote: "Fast delivery, beautiful pieces. Noors is my go-to for gifting.",
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
    badge: "Autumn Edit 2026",
    title: ["The details", "that define you."],
    description:
      "Bags, rings, earrings, watches — a curated collection of premium accessories designed for the confident, elegant woman of Bangladesh.",
    primaryAction: "Shop",
    secondaryAction: "Explore categories",
    featuredLabel: "Featured edit",
    featuredTitle: "The Rose Gold Story",
  },
  categories: {
    eyebrow: "Shop by category",
    title: "Curated for every mood",
  },
  bestsellers: {
    eyebrow: "Bestsellers",
    title: "Loved by our customers",
  },
  promise: {
    eyebrow: "The Noors Promise",
    title: ["Small details,", "big statements."],
    description:
      "Every piece is handpicked from premium makers, so you carry pieces that feel as good as they look.",
    cta: "Discover our story",
  },
  freshDrops: {
    eyebrow: "Fresh drops",
    title: "New this week",
  },
  testimonials: {
    eyebrow: "Kind words",
    title: "Loved across Bangladesh",
  },
  newsletter: {
    eyebrow: "Join the list",
    title: "First to know, first to shop",
    description: "Sign up and enjoy 10% off your first order plus early access to new drops.",
  },
} as const;

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/shop", label: "Bags", params: { category: "bags" } },
  { to: "/shop", label: "Jewelry" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;
