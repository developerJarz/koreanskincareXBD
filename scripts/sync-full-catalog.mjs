import mongoose from "mongoose";
import fs from "fs";
import { EXPANDED_PRODUCTS } from "./populate-expanded-catalog.mjs";

let mongoUri = process.env.MONGODB_URI;

if (!mongoUri && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      mongoUri = trimmed
        .substring("MONGODB_URI=".length)
        .replace(/^["']|["']$/g, "")
        .trim();
      break;
    }
  }
}

const CATEGORIES = [
  {
    slug: "serums",
    name: "Serums & Ampoules",
    count: 48,
    description: "Targeted glow, hyperpigmentation & barrier repair formulas",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
  },
  {
    slug: "toners",
    name: "Toners & Essences",
    count: 36,
    description: "Hydrating, soothing 7-skin method essences & toners",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
  },
  {
    slug: "sunscreens",
    name: "Sun Care & SPF",
    count: 29,
    description: "Zero-white cast, lightweight Korean sunscreens with SPF50+ PA++++",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800",
  },
  {
    slug: "cleansers",
    name: "Cleansers & Washes",
    count: 32,
    description: "Gentle low-pH gel washes and cleansing oils",
    image: "https://images.unsplash.com/photo-1556228852-6d35a585d566?w=800",
  },
  {
    slug: "moisturizers",
    name: "Moisturizers & Creams",
    count: 44,
    description: "Ceramide barrier creams, gel moisturizers & sleeping packs",
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800",
  },
  {
    slug: "masks",
    name: "Sheet Masks & Peels",
    count: 25,
    description: "Instant glass-skin sheet masks and gentle chemical exfoliants",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
  },
  {
    slug: "eye-lip-care",
    name: "Eye & Lip Treatments",
    count: 18,
    description: "Overnight lip sleeping masks and caffeine peptide eye creams",
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
  },
  {
    slug: "sets",
    name: "K-Beauty Routine Sets",
    count: 15,
    description: "Step-by-step complete Korean 5-step skincare rituals",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800",
  },
  {
    slug: "bags",
    name: "Bags & Totes",
    count: 58,
    description: "Handcrafted luxury bags and everyday totes",
    image: "/cat-bags.jpg",
  },
  {
    slug: "rings",
    name: "Jewelry & Rings",
    count: 42,
    description: "Anti-tarnish rose gold and gold pavé rings",
    image: "/cat-rings.jpg",
  },
  {
    slug: "earrings",
    name: "Earrings & Drops",
    count: 76,
    description: "Freshwater pearls and minimalist studs",
    image: "/cat-earrings.jpg",
  },
  {
    slug: "watches",
    name: "Luxury Watches",
    count: 22,
    description: "Timeless classic and modern mesh watches",
    image: "/cat-watches.jpg",
  },
];

const ACCESSORIES = [
  {
    slug: "blush-mini-crossbody",
    name: "Blush Mini Crossbody Luxury Bag",
    categorySlug: "bags",
    price: 3490,
    compareAtPrice: 4200,
    images: ["/cat-bags.jpg"],
    isNewArrival: true,
    stock: 18,
    description: "Handcrafted with premium vegan leather, gold-tone hardware, and versatile shoulder strap.",
    tags: ["bags", "crossbody", "vegan-leather"],
  },
  {
    slug: "beige-woven-tote",
    name: "Beige Woven Artisan Tote",
    categorySlug: "bags",
    price: 4290,
    compareAtPrice: 4990,
    images: ["/cat-bags.jpg"],
    isBestseller: true,
    stock: 12,
    description: "Spacious luxury woven tote tailored for city commutes, laptop carriage, and weekend escapes.",
    tags: ["bags", "tote", "woven"],
  },
  {
    slug: "noir-quilted-flap",
    name: "Noir Quilted Flap Handbag",
    categorySlug: "bags",
    price: 4890,
    compareAtPrice: 5900,
    images: ["/cat-bags.jpg"],
    isFeatured: true,
    stock: 8,
    description: "Classic quilted geometric design with luxury polished chain strap and timeless turn-lock closure.",
    tags: ["bags", "quilted", "luxury"],
  },
  {
    slug: "gold-pave-stack",
    name: "Gold Pavé Ring Stack (Set of 3)",
    categorySlug: "rings",
    price: 1890,
    compareAtPrice: 2400,
    images: ["/cat-rings.jpg"],
    isBestseller: true,
    stock: 22,
    description: "18k gold-plated hypoallergenic triple ring stack embedded with micro-cubic zirconia crystals.",
    tags: ["jewelry", "rings", "gold-plated"],
  },
  {
    slug: "rose-pearl-hoops",
    name: "Rosé Freshwater Pearl Hoops",
    categorySlug: "earrings",
    price: 1490,
    compareAtPrice: 1890,
    images: ["/cat-earrings.jpg"],
    isNewArrival: true,
    stock: 15,
    description: "Delicate huggie hoops featuring genuine baroque freshwater pearls that catch light beautifully.",
    tags: ["jewelry", "earrings", "pearls"],
  },
  {
    slug: "ivory-classic-watch",
    name: "Ivory Classic Minimalist Watch",
    categorySlug: "watches",
    price: 4990,
    compareAtPrice: 5900,
    images: ["/cat-watches.jpg"],
    isBestseller: true,
    stock: 10,
    description: "Japanese quartz movement with scratch-resistant sapphire crystal glass and genuine leather strap.",
    tags: ["watches", "minimalist", "luxury"],
  },
];

const PRODUCTS = [
  ...EXPANDED_PRODUCTS.map((p) => ({
    slug: p.slug,
    name: p.name,
    categorySlug: p.category,
    price: p.price,
    compareAtPrice: p.was || p.price + 300,
    images: p.images,
    isBestseller: p.tag === "Bestseller",
    isNewArrival: p.tag === "New",
    isFeatured: p.tag === "Bestseller" || p.tag === "Hot" || p.tag === "Limited",
    stock: p.stockCount,
    description: p.description,
    tags: p.skinType.map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  })),
  ...ACCESSORIES,
];

async function sync() {
  if (!mongoUri) {
    console.error("No MONGODB_URI configured. Skipping remote sync.");
    return;
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const categorySchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      description: String,
      image: String,
      count: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  const productSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      description: String,
      price: { type: Number, required: true },
      compareAtPrice: Number,
      costPrice: Number,
      sku: String,
      barcode: String,
      stock: { type: Number, default: 0 },
      lowStockThreshold: { type: Number, default: 5 },
      category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      categorySlug: String,
      images: [String],
      isFeatured: { type: Boolean, default: false },
      isBestseller: { type: Boolean, default: false },
      isNewArrival: { type: Boolean, default: false },
      tags: [String],
      rating: { type: Number, default: 5 },
      reviewCount: { type: Number, default: 0 },
      brand: String,
      volume: String,
      keyIngredients: [String],
      benefits: [String],
      howToUse: String,
      skinType: [String],
    },
    { timestamps: true }
  );

  const Category =
    mongoose.models.Category || mongoose.model("Category", categorySchema);
  const Product =
    mongoose.models.Product || mongoose.model("Product", productSchema);

  console.log("Upserting categories...");
  const catMap = {};
  for (const cat of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, new: true }
    );
    catMap[cat.slug] = doc._id;
  }
  console.log("Upserted all categories. Now upserting", PRODUCTS.length, "products...");

  for (const p of PRODUCTS) {
    const raw = EXPANDED_PRODUCTS.find((ep) => ep.slug === p.slug);
    const updateData = {
      ...p,
      category: catMap[p.categorySlug],
      rating: raw?.rating || 4.9,
      reviewCount: raw?.reviewCount || 150,
      brand: raw?.brand || "KoreanSkincare",
      volume: raw?.volume || "Standard Size",
      keyIngredients: raw?.keyIngredients || [],
      benefits: raw?.benefits || [],
      howToUse: raw?.howToUse || "",
      skinType: raw?.skinType || [],
    };
    await Product.findOneAndUpdate(
      { slug: p.slug },
      { $set: updateData },
      { upsert: true, new: true }
    );
    console.log("Synced product:", p.name, `[${p.categorySlug}]`);
  }

  console.log(`SUCCESS: All ${PRODUCTS.length} products synced into MongoDB!`);
  await mongoose.disconnect();
}

sync().catch(console.error);
