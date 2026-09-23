import { createServerFn } from "@tanstack/react-start";
import { connectDB } from "@/backend/db/connection";
import { Category, Product, HomepageSection, Settings, User } from "@/backend/db/models";
import bcryptjs from "bcryptjs";

export const seedDatabase = createServerFn({ method: "POST" }).handler(async () => {
  await connectDB();

  const existingProducts = await Product.countDocuments();
  if (existingProducts > 0) {
    return { message: "Database already seeded", skipped: true };
  }

  // ─── 1. Create Role-Based Demo Users ───
  const superAdminPasswordHash = await bcryptjs.hash("Shajgoj#SuperAdmin!2026$X9", 12);
  const adminPasswordHash = await bcryptjs.hash("Shajgoj#Admin!9982*Secure", 12);
  const staffPasswordHash = await bcryptjs.hash("Staff#Mod@Shajgoj8821$", 12);
  const customerPasswordHash = await bcryptjs.hash("Customer#Lux!Nusrat2026@", 12);

  await User.create([
    {
      name: "Super Admin",
      email: "superadmin@koreanskincare.bd",
      password: superAdminPasswordHash,
      role: "super_admin",
      emailVerified: true,
      provider: "credentials",
    },
    {
      name: "koreanskincare.bd Admin",
      email: "admin@koreanskincare.bd",
      password: adminPasswordHash,
      role: "admin",
      emailVerified: true,
      provider: "credentials",
    },
    {
      name: "Store Staff",
      email: "staff@koreanskincare.bd",
      password: staffPasswordHash,
      role: "staff",
      emailVerified: true,
      provider: "credentials",
    },
    {
      name: "Nusrat Jahan",
      email: "customer@koreanskincare.bd",
      password: customerPasswordHash,
      role: "customer",
      emailVerified: true,
      provider: "credentials",
    },
  ]);

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
  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  // ─── 3. Create Products ───
  const productData = [
    {
      name: "Blush Mini Crossbody",
      slug: "blush-mini-crossbody",
      description:
        "A delicate blush-toned crossbody bag perfect for everyday elegance. Crafted from premium faux leather with gold-tone hardware.",
      category: categoryMap["bags"],
      price: 3490,
      compareAtPrice: 4200,
      stock: 25,
      colors: ["Blush", "Rose Gold"],
      tags: ["crossbody", "mini", "blush", "everyday"],
      status: "active" as const,
      isNewArrival: true,
      isBestseller: false,
      isFeatured: true,
      images: [],
    },
    {
      name: "Beige Woven Tote",
      slug: "beige-woven-tote",
      description:
        "A beautifully woven tote bag in natural beige. Spacious interior with magnetic closure and interior pockets.",
      category: categoryMap["bags"],
      price: 4290,
      stock: 18,
      colors: ["Beige", "Ivory"],
      tags: ["tote", "woven", "beige", "spacious"],
      status: "active" as const,
      isBestseller: true,
      isFeatured: true,
      images: [],
    },
    {
      name: "Noir Quilted Flap Bag",
      slug: "noir-quilted-flap",
      description:
        "A timeless quilted flap bag in noir. Chain strap with leather weave, quilted lambskin-inspired exterior.",
      category: categoryMap["bags"],
      price: 4890,
      compareAtPrice: 5900,
      stock: 8,
      colors: ["Black"],
      tags: ["quilted", "flap", "noir", "limited", "chain"],
      status: "active" as const,
      isFeatured: true,
      images: [],
    },
    {
      name: "Rosé Crystal Band Ring",
      slug: "rose-crystal-band",
      description:
        "A stunning rosé gold crystal band ring. Set with micro-pavé crystals for maximum sparkle.",
      category: categoryMap["rings"],
      price: 1290,
      compareAtPrice: 1690,
      stock: 40,
      sizes: ["S", "M", "L"],
      colors: ["Rose Gold"],
      tags: ["crystal", "band", "rosé", "sparkle"],
      status: "active" as const,
      isNewArrival: true,
      isFeatured: true,
      images: [],
    },
    {
      name: "Gold Pavé Ring Stack",
      slug: "gold-pave-stack",
      description: "A set of three stackable gold pavé rings. Mix and match for your perfect look.",
      category: categoryMap["rings"],
      price: 1890,
      stock: 30,
      sizes: ["S", "M", "L"],
      colors: ["Gold"],
      tags: ["pavé", "stack", "gold", "set"],
      status: "active" as const,
      isBestseller: true,
      isFeatured: true,
      images: [],
    },
    {
      name: "Pearl Drop Studs",
      slug: "pearl-drop-studs",
      description: "Classic pearl drop stud earrings. Freshwater pearls on sterling silver posts.",
      category: categoryMap["earrings"],
      price: 990,
      compareAtPrice: 1290,
      stock: 50,
      colors: ["White", "Gold"],
      materials: ["Pearl", "Sterling Silver"],
      tags: ["pearl", "studs", "classic", "sale"],
      status: "active" as const,
      isFeatured: true,
      images: [],
    },
    {
      name: "Rosé Pearl Hoops",
      slug: "rose-pearl-hoops",
      description:
        "Elegant rosé gold hoops adorned with tiny freshwater pearls. A modern take on a classic.",
      category: categoryMap["earrings"],
      price: 1490,
      stock: 35,
      colors: ["Rose Gold"],
      materials: ["Pearl", "Rose Gold Plated"],
      tags: ["hoops", "pearl", "rosé", "elegant"],
      status: "active" as const,
      isNewArrival: true,
      isFeatured: true,
      images: [],
    },
    {
      name: "Petite Gold Pendant",
      slug: "petite-gold-pendant",
      description:
        "A delicate gold pendant necklace. Minimalist design perfect for layering or wearing solo.",
      category: categoryMap["necklaces"],
      price: 1790,
      compareAtPrice: 2200,
      stock: 45,
      colors: ["Gold"],
      materials: ["Gold Plated"],
      tags: ["pendant", "gold", "petite", "minimalist"],
      status: "active" as const,
      isBestseller: true,
      isFeatured: true,
      images: [],
    },
    {
      name: "Layered Charm Chain",
      slug: "layered-charm-chain",
      description:
        "A multi-layered charm chain necklace. Features delicate charms on three tiers of varying length.",
      category: categoryMap["necklaces"],
      price: 2490,
      stock: 20,
      colors: ["Gold", "Silver"],
      tags: ["layered", "charm", "chain", "multi-tier"],
      status: "active" as const,
      isNewArrival: true,
      isFeatured: true,
      images: [],
    },
    {
      name: "Ivory Classic Watch",
      slug: "ivory-classic-watch",
      description:
        "A classic ivory dial watch with rose gold case. Japanese quartz movement, genuine leather strap.",
      category: categoryMap["watches"],
      price: 4990,
      compareAtPrice: 5900,
      stock: 12,
      colors: ["Ivory", "Rose Gold"],
      materials: ["Leather", "Stainless Steel"],
      tags: ["classic", "ivory", "watch", "quartz"],
      status: "active" as const,
      isBestseller: true,
      isFeatured: true,
      images: [],
    },
    {
      name: "Rosé Leather Watch",
      slug: "rose-leather-watch",
      description:
        "A modern rosé gold watch with Italian leather strap. Slim profile, water-resistant.",
      category: categoryMap["watches"],
      price: 5290,
      stock: 6,
      colors: ["Rose Gold"],
      materials: ["Leather", "Stainless Steel"],
      tags: ["rosé", "leather", "watch", "limited", "modern"],
      status: "active" as const,
      isFeatured: true,
      images: [],
    },
    {
      name: "Amber Cat-Eye Shades",
      slug: "amber-cat-eye-shades",
      description:
        "Vintage-inspired amber cat-eye sunglasses. UV400 protection, lightweight acetate frame.",
      category: categoryMap["sunglasses"],
      price: 1890,
      compareAtPrice: 2290,
      stock: 22,
      colors: ["Amber"],
      tags: ["cat-eye", "amber", "vintage", "sale", "UV400"],
      status: "active" as const,
      isFeatured: true,
      images: [],
    },
    {
      name: "Blush Silk Hair Scarf",
      slug: "blush-silk-scarf",
      description:
        "A luxurious blush silk hair scarf. Versatile — wear as a headband, bag tie, or neck scarf.",
      category: categoryMap["bags"],
      price: 790,
      stock: 60,
      colors: ["Blush"],
      materials: ["Silk"],
      tags: ["scarf", "silk", "blush", "versatile", "hair"],
      status: "active" as const,
      isNewArrival: true,
      isFeatured: true,
      images: [],
    },
  ];

  await Product.insertMany(productData);

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
    roles: {
      super_admin: {
        email: "superadmin@koreanskincare.bd",
        password: "Shajgoj#SuperAdmin!2026$X9",
      },
      admin: { email: "admin@koreanskincare.bd", password: "Shajgoj#Admin!9982*Secure" },
      staff: { email: "staff@koreanskincare.bd", password: "Staff#Mod@Shajgoj8821$" },
      customer: { email: "customer@koreanskincare.bd", password: "Customer#Lux!Nusrat2026@" },
    },
  };
});
