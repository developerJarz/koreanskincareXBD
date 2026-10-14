import { createServerFn } from "@tanstack/react-start";
import { connectDB } from "@/server/db/connection";
import { Category, HomepageSection, Settings, User } from "@/server/db/models";
import bcryptjs from "bcryptjs";

/**
 * Seeds initial store settings and categories without creating demo products.
 *
 * Run this once by visiting /api/seed or calling seedDatabase() from a route.
 */
export const seedDatabase = createServerFn({ method: "POST" }).handler(async () => {
  await connectDB();

  // Check if already seeded
  const existingCategories = await Category.countDocuments();
  if (existingCategories > 0) {
    return { message: "Database already seeded", skipped: true };
  }

  // ─── 1. Create Super Admin (password from environment variable) ───
  const seedPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error("Set a strong SEED_SUPER_ADMIN_PASSWORD (12+ chars) before seeding.");
  }
  const hashedPassword = await bcryptjs.hash(seedPassword, 12);
  const admin = await User.create({
    name: "koreanskincare.bd Admin",
    email: "admin@koreanskincare.bd",
    password: hashedPassword,
    role: "super_admin",
    emailVerified: true,
    provider: "credentials",
  });

  // ─── 2. Create Categories ───
  const categoryData = [
    {
      name: "Bags",
      slug: "bags",
      description: "Premium handbags, totes, and crossbody bags",
      productCount: 58,
      sortOrder: 0,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Rings",
      slug: "rings",
      description: "Elegant rings and ring stacks",
      productCount: 42,
      sortOrder: 1,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Earrings",
      slug: "earrings",
      description: "Studs, hoops, and drop earrings",
      productCount: 76,
      sortOrder: 2,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Necklaces",
      slug: "necklaces",
      description: "Chains, pendants, and layered necklaces",
      productCount: 34,
      sortOrder: 3,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Watches",
      slug: "watches",
      description: "Classic and modern timepieces",
      productCount: 22,
      sortOrder: 4,
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Sunglasses",
      slug: "sunglasses",
      description: "Designer-inspired shades",
      productCount: 19,
      sortOrder: 5,
      isFeatured: true,
      isActive: true,
    },
  ];

  const categories = await Category.insertMany(categoryData);

  // ─── 4. Create Homepage Sections ───
  await HomepageSection.insertMany([
    {
      type: "hero",
      title: "Hero",
      sortOrder: 0,
      isActive: true,
      content: {
        badge: "Autumn Edit 2026",
        title: ["The details", "that define you."],
        description:
          "Bags, rings, earrings, watches — a curated collection of premium accessories designed for the confident, elegant woman of Bangladesh.",
        primaryAction: "Shop the edit",
        secondaryAction: "Explore categories",
        featuredLabel: "Featured edit",
        featuredTitle: "The Rose Gold Story",
      },
    },
    {
      type: "features",
      title: "Features Bar",
      sortOrder: 1,
      isActive: true,
      content: {
        items: [
          { icon: "truck", title: "Free Delivery", summary: "Inside Dhaka over ৳2,000" },
          { icon: "refresh", title: "7-Day Exchange", summary: "Hassle-free returns" },
          { icon: "shield", title: "Cash on Delivery", summary: "All over Bangladesh" },
          { icon: "sparkles", title: "Premium Quality", summary: "Thoughtfully curated" },
        ],
      },
    },
    {
      type: "categories",
      title: "Shop by Category",
      eyebrow: "Shop by category",
      sortOrder: 2,
      isActive: true,
      content: { title: "Curated for every mood" },
    },
    {
      type: "products",
      title: "Bestsellers",
      eyebrow: "Bestsellers",
      sortOrder: 3,
      isActive: true,
      content: {
        title: "Loved by our customers",
        filter: "bestseller",
        limit: 4,
      },
    },
    {
      type: "banner",
      title: "The Noors Promise",
      sortOrder: 4,
      isActive: true,
      content: {
        eyebrow: "The Noors Promise",
        title: ["Small details,", "big statements."],
        description:
          "Every piece is handpicked from premium makers, so you carry pieces that feel as good as they look.",
        cta: "Discover our story",
      },
    },
    {
      type: "products",
      title: "Fresh Drops",
      eyebrow: "Fresh drops",
      sortOrder: 5,
      isActive: true,
      content: {
        title: "New this week",
        filter: "new_arrival",
        limit: 8,
      },
    },
    {
      type: "testimonials",
      title: "Testimonials",
      eyebrow: "Kind words",
      sortOrder: 6,
      isActive: true,
      content: {
        title: "Loved across Bangladesh",
        items: [
          {
            name: "Ayesha R.",
            city: "Dhaka",
            quote:
              "The rose gold ring stack is exquisite. Packaging felt like a real luxury brand.",
          },
          {
            name: "Nusrat K.",
            city: "Chattogram",
            quote: "My blush crossbody is my new favorite piece — everyone asks where I got it.",
          },
          {
            name: "Tasnia H.",
            city: "Sylhet",
            quote:
              "Fast delivery, authentic products. koreanskincare.bd is my go-to for daily skincare.",
          },
        ],
      },
    },
    {
      type: "newsletter",
      title: "Newsletter",
      eyebrow: "Join the list",
      sortOrder: 7,
      isActive: true,
      content: {
        title: "First to know, first to shop",
        description: "Sign up and enjoy 10% off your first order plus early access to new drops.",
      },
    },
  ]);

  // ─── 5. Create Default Settings ───
  await Settings.create({
    siteName: "koreanskincare.bd",
    siteDescription: "Premium authentic Korean skincare & beauty essentials for Bangladesh",
    contactEmail: "hello@koreanskincare.bd",
    contactPhone: "+880 1711-223344",
    address: "House 42, Road 11, Banani, Dhaka 1213",
    shipping: {
      freeShippingThreshold: 2000,
      defaultShippingCost: 120,
      insideDhakaCost: 70,
      outsideDhakaCost: 120,
    },
    paymentGateways: [
      { name: "SSLCommerz", enabled: true, config: {} },
      { name: "bKash", enabled: true, config: {} },
      { name: "Nagad", enabled: true, config: {} },
      { name: "Rocket", enabled: false, config: {} },
      { name: "ShurjoPay", enabled: false, config: {} },
      { name: "aamarPay", enabled: false, config: {} },
      { name: "Cash on Delivery", enabled: true, config: {} },
    ],
    courierServices: [
      { name: "SteadFast", enabled: true, config: {} },
      { name: "Pathao Courier", enabled: true, config: {} },
      { name: "RedX", enabled: true, config: {} },
      { name: "Sundarban", enabled: true, config: {} },
      { name: "Paperfly", enabled: true, config: {} },
    ],
  });

  return {
    message: "Database seeded successfully!",
    skipped: false,
    data: {
      admin: { email: "admin@koreanskincare.bd", role: "super_admin" },
      categories: categories.length,
      products: 0,
      homepageSections: 8,
    },
    note: "Password is set from SEED_SUPER_ADMIN_PASSWORD environment variable. Never exposed in responses.",
  };
});
