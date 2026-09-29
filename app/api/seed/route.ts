import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Category, Product, User, Coupon, Settings } from "@/server/db/models";
import bcryptjs from "bcryptjs";
import { PRODUCTS, CATEGORIES } from "@/lib/site-data";
import { requireAuth, serverError, SUPER_ADMIN_ROLES } from "@/server/auth/session";
import { passwordStrengthError } from "@/server/security/validation";

/**
 * Database Seeder API — DISABLED unless ALLOW_DB_SEED=true is set on the server.
 *
 * POST /api/seed            — Seed demo catalog if the database is empty
 * POST /api/seed?force=true — Replace catalog, coupons, settings and sample orders
 *
 * Security rules:
 *  - Existing users are NEVER deleted.
 *  - Seed accounts are only created when their SEED_*_PASSWORD env var is set and strong;
 *    passwords are never hard-coded and never returned in the response.
 *  - Once any user exists, only a signed-in super admin can run it.
 */

// Initial staff accounts — passwords come only from environment variables
const SEED_USERS = [
  {
    name: "koreanskincare.bd Super Admin",
    email: "superadmin@koreanskincare.bd",
    passwordEnv: "SEED_SUPER_ADMIN_PASSWORD",
    role: "super_admin" as const,
  },
  {
    name: "koreanskincare.bd Store Admin",
    email: "admin@koreanskincare.bd",
    passwordEnv: "SEED_ADMIN_PASSWORD",
    role: "admin" as const,
  },
  {
    name: "Store Staff (Moderator)",
    email: "staff@koreanskincare.bd",
    passwordEnv: "SEED_STAFF_PASSWORD",
    role: "staff" as const,
  },
];

export async function POST(request: NextRequest) {
  try {
    if (process.env.ALLOW_DB_SEED !== "true") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await connectDB();

    // Bootstrap (empty DB) needs no login; afterwards only a super admin may seed
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      const auth = await requireAuth(request, SUPER_ADMIN_ROLES);
      if (!auth.ok) return auth.response;
    }

    return await handleSeed(request);
  } catch (err) {
    return serverError("Seed API error", err, "Failed to seed database");
  }
}

async function handleSeed(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const existingProducts = await Product.countDocuments();

  if (!force && existingProducts > 0) {
    return NextResponse.json({
      message: "Database is already seeded.",
      status: "already_seeded",
      productsCount: existingProducts,
    });
  }

  // ─── 1. Seed staff users — only missing ones, only with strong env passwords ───
  const seededUsers = [];
  for (const u of SEED_USERS) {
    const password = process.env[u.passwordEnv];
    if (!password || passwordStrengthError(password)) continue;
    if (await User.exists({ email: u.email })) continue;
    seededUsers.push(
      await User.create({
        name: u.name,
        email: u.email,
        password: await bcryptjs.hash(password, 12),
        role: u.role,
        emailVerified: true,
        provider: "credentials",
        isActive: true,
      }),
    );
  }

  // ─── 2. Seed Categories ───
  await Category.deleteMany({});
  const categoryDocs = await Category.insertMany(
    CATEGORIES.map((c, i) => ({
      name: c.name,
      slug: c.slug,
      description: `Premium authentic ${c.name.toLowerCase()} for koreanskincare.bd`,
      image: typeof c.img === "string" ? c.img : (c.img as any)?.src || "",
      sortOrder: i,
      isActive: true,
      isFeatured: true,
      productCount: parseInt(c.count) || 20,
    })),
  );

  const categoryMap = new Map(categoryDocs.map((c) => [c.slug, c._id]));
  const defaultCatId = categoryDocs[0]?._id;

  // ─── 3. Seed Products ───
  await Product.deleteMany({});
  const productDocs = await Product.insertMany(
    PRODUCTS.map((p, index) => ({
      name: p.name,
      slug: p.slug,
      description: `Thoughtfully designed ${p.name.toLowerCase()} crafted for modern elegance. Premium grade materials, lightweight feel, and durable long-lasting finish.`,
      category: categoryMap.get(p.category) || defaultCatId,
      price: p.price,
      compareAtPrice: p.was || undefined,
      stock: 35 + ((index * 5) % 40),
      lowStockThreshold: 5,
      trackInventory: true,
      colors: ["Default", "Rose Gold", "Noir Black", "Champagne Gold"],
      sizes: ["Standard", "Adjustable"],
      images: [typeof p.img === "string" ? p.img : (p.img as any)?.src || ""],
      isFeatured: true,
      isNewArrival: p.tag === "New" || index % 3 === 0,
      isBestseller: p.tag === "Bestseller" || index % 2 === 0,
      tags: p.tag ? [p.tag, p.category, "luxury"] : [p.category, "luxury"],
      status: "active",
      avgRating: 4.9,
      totalReviews: 24 + index * 4,
      totalSold: 45 + index * 12,
    })),
  );

  // ─── 4. Seed Coupons ───
  await Coupon.deleteMany({});
  await Coupon.insertMany([
    {
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      minOrderAmount: 1000,
      maxDiscount: 500,
      usageLimit: 1000,
      usageCount: 42,
      isActive: true,
      startsAt: new Date(),
    },
    {
      code: "EID2026",
      type: "percentage",
      value: 15,
      minOrderAmount: 2000,
      maxDiscount: 1000,
      usageLimit: 500,
      usageCount: 88,
      isActive: true,
      startsAt: new Date(),
    },
    {
      code: "KOREANVIP",
      type: "percentage",
      value: 20,
      minOrderAmount: 3000,
      maxDiscount: 1500,
      usageLimit: 200,
      usageCount: 15,
      isActive: true,
      startsAt: new Date(),
    },
  ]);

  // ─── 5. Seed Store Settings ───
  await Settings.deleteMany({});
  await Settings.create({
    siteName: "koreanskincare.bd",
    siteDescription: "Premium authentic Korean skincare & beauty essentials for Bangladesh",
    contactEmail: "hello@koreanskincare.bd",
    contactPhone: "+880 1711-223344",
    address: "House 42, Road 11, Banani, Dhaka 1213, Bangladesh",
    socialLinks: {
      instagram: "https://instagram.com/koreanskincarebd",
      facebook: "https://facebook.com/koreanskincarebd",
      whatsapp: "https://wa.me/8801711223344",
    },
    shipping: {
      freeShippingThreshold: 2000,
      defaultShippingCost: 120,
      insideDhakaCost: 70,
      outsideDhakaCost: 120,
    },
    paymentGateways: [
      { name: "Cash on Delivery", enabled: true, config: {} },
      { name: "bKash", enabled: true, config: {} },
      { name: "Nagad", enabled: true, config: {} },
      { name: "SSLCommerz", enabled: true, config: {} },
    ],
  });

  // Real customer orders are never deleted or replaced by the seeder.

  return NextResponse.json({
    message: "Database seeded successfully.",
    status: "success",
    counts: {
      usersCreated: seededUsers.length,
      categories: categoryDocs.length,
      products: productDocs.length,
      coupons: 3,
    },
    accountsCreated: seededUsers.map((u) => ({ email: u.email, role: u.role })),
  });
}
