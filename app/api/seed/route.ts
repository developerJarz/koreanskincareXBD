import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Category, Product, User, Coupon, Settings, Order } from "@/server/db/models";
import bcryptjs from "bcryptjs";
import { PRODUCTS, CATEGORIES } from "@/lib/site-data";

export async function GET(request: NextRequest) {
  return handleSeed(request);
}

export async function POST(request: NextRequest) {
  return handleSeed(request);
}

async function handleSeed(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const existingUsers = await User.countDocuments();
    const existingProducts = await Product.countDocuments();

    if (!force && existingUsers > 0 && existingProducts > 0) {
      return NextResponse.json({
        message: "Database is already initialized and seeded with users and products.",
        status: "already_seeded",
        usersCount: existingUsers,
        productsCount: existingProducts,
        credentials: {
          superAdmin: {
            email: "superadmin@koreanskincare.bd",
            password: "Shajgoj#SuperAdmin!2026$X9",
            role: "super_admin",
          },
          admin: {
            email: "admin@koreanskincare.bd",
            password: "Shajgoj#Admin!9982*Secure",
            role: "admin",
          },
          staff: {
            email: "staff@koreanskincare.bd",
            password: "Staff#Mod@Shajgoj8821$",
            role: "staff",
          },
          customer: {
            email: "customer@koreanskincare.bd",
            password: "Customer#Lux!Nusrat2026@",
            role: "customer",
          },
          ayesha: { email: "ayesha@example.com", password: "Ayesha#Luxe2026!Bd", role: "customer" },
        },
      });
    }

    // 1. Seed Users with Secure Hashed Passwords
    const superAdminPasswordHash = await bcryptjs.hash("Shajgoj#SuperAdmin!2026$X9", 12);
    const adminPasswordHash = await bcryptjs.hash("Shajgoj#Admin!9982*Secure", 12);
    const staffPasswordHash = await bcryptjs.hash("Staff#Mod@Shajgoj8821$", 12);
    const customerPasswordHash = await bcryptjs.hash("Customer#Lux!Nusrat2026@", 12);
    const ayeshaPasswordHash = await bcryptjs.hash("Ayesha#Luxe2026!Bd", 12);

    await User.deleteMany({});
    const seededUsers = await User.insertMany([
      {
        name: "koreanskincare.bd Super Admin",
        email: "superadmin@koreanskincare.bd",
        password: superAdminPasswordHash,
        role: "super_admin",
        emailVerified: true,
        phone: "+880 1711-000001",
        provider: "credentials",
        isActive: true,
        walletBalance: 15000,
        rewardPoints: 1200,
      },
      {
        name: "koreanskincare.bd Store Admin",
        email: "admin@koreanskincare.bd",
        password: adminPasswordHash,
        role: "admin",
        emailVerified: true,
        phone: "+880 1711-000002",
        provider: "credentials",
        isActive: true,
        walletBalance: 5000,
        rewardPoints: 500,
      },
      {
        name: "Store Staff (Moderator)",
        email: "staff@koreanskincare.bd",
        password: staffPasswordHash,
        role: "staff",
        emailVerified: true,
        phone: "+880 1711-000003",
        provider: "credentials",
        isActive: true,
        walletBalance: 2000,
        rewardPoints: 200,
      },
      {
        name: "Nusrat Jahan",
        email: "customer@koreanskincare.bd",
        password: customerPasswordHash,
        role: "customer",
        emailVerified: true,
        phone: "+880 1711-223344",
        provider: "credentials",
        isActive: true,
        walletBalance: 1200,
        rewardPoints: 350,
      },
      // Backwards-compatible aliases
      {
        name: "Super Admin (Alias)",
        email: "superadmin@shajgoj.bd",
        password: superAdminPasswordHash,
        role: "super_admin",
        emailVerified: true,
        phone: "+880 1711-000001",
        provider: "credentials",
        isActive: true,
        walletBalance: 15000,
        rewardPoints: 1200,
      },
      {
        name: "Store Admin (Alias)",
        email: "admin@shajgoj.bd",
        password: adminPasswordHash,
        role: "admin",
        emailVerified: true,
        phone: "+880 1711-000002",
        provider: "credentials",
        isActive: true,
        walletBalance: 5000,
        rewardPoints: 500,
      },
      {
        name: "Ayesha Rahman",
        email: "ayesha@example.com",
        password: ayeshaPasswordHash,
        role: "customer",
        emailVerified: true,
        phone: "+880 1819-445566",
        provider: "credentials",
        isActive: true,
        walletBalance: 850,
        rewardPoints: 180,
      },
    ]);

    // 2. Seed Categories
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

    // 3. Seed Products
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

    // 4. Seed Promo Coupons
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

    // 5. Seed Store Settings
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

    // 6. Seed Realistic Sample Orders for Analytics & Testing
    await Order.deleteMany({});
    const customerUser =
      seededUsers.find((u) => u.email === "customer@koreanskincare.bd") || seededUsers[3];
    await Order.insertMany([
      {
        orderNumber: "ORD-2026-8801",
        user: customerUser._id,
        items: [
          {
            product: productDocs[0]._id,
            productName: productDocs[0].name,
            productImage: productDocs[0].images[0] || "",
            price: productDocs[0].price,
            quantity: 1,
            total: productDocs[0].price,
          },
          {
            product: productDocs[3]._id,
            productName: productDocs[3].name,
            productImage: productDocs[3].images[0] || "",
            price: productDocs[3].price,
            quantity: 1,
            total: productDocs[3].price,
          },
        ],
        subtotal: productDocs[0].price + productDocs[3].price,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        total: productDocs[0].price + productDocs[3].price,
        status: "delivered",
        paymentStatus: "paid",
        paymentMethod: "bKash",
        shippingAddress: {
          fullName: "Nusrat Jahan",
          phone: "01711223344",
          division: "Dhaka",
          district: "Dhaka",
          area: "Banani",
          streetAddress: "House 12, Road 7, Block F",
        },
      },
      {
        orderNumber: "ORD-2026-8802",
        user: customerUser._id,
        items: [
          {
            product: productDocs[1]._id,
            productName: productDocs[1].name,
            productImage: productDocs[1].images[0] || "",
            price: productDocs[1].price,
            quantity: 1,
            total: productDocs[1].price,
          },
        ],
        subtotal: productDocs[1].price,
        shippingCost: 70,
        tax: 0,
        discount: 0,
        total: productDocs[1].price + 70,
        status: "processing",
        paymentStatus: "pending",
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Ayesha Rahman",
          phone: "01819445566",
          division: "Dhaka",
          district: "Dhaka",
          area: "Dhanmondi",
          streetAddress: "House 28, Road 4A",
        },
      },
      {
        orderNumber: "ORD-2026-8803",
        items: [
          {
            product: productDocs[2]._id,
            productName: productDocs[2].name,
            productImage: productDocs[2].images[0] || "",
            price: productDocs[2].price,
            quantity: 1,
            total: productDocs[2].price,
          },
        ],
        subtotal: productDocs[2].price,
        shippingCost: 120,
        tax: 0,
        discount: 200,
        couponCode: "WELCOME10",
        total: productDocs[2].price - 200 + 120,
        status: "pending",
        paymentStatus: "paid",
        paymentMethod: "Nagad",
        guestPhone: "01912334455",
        guestEmail: "tanjina@gmail.com",
        shippingAddress: {
          fullName: "Tanjina Akter",
          phone: "01912334455",
          division: "Chittagong",
          district: "Chattogram",
          area: "GEC Circle",
          streetAddress: "Apartment 4B, Hill View Road",
        },
      },
    ]);

    return NextResponse.json({
      message: "Database seeded and initialized successfully with full sample data!",
      status: "success",
      counts: {
        users: seededUsers.length,
        categories: categoryDocs.length,
        products: productDocs.length,
        coupons: 3,
        orders: 3,
      },
      credentials: {
        superAdmin: {
          email: "superadmin@koreanskincare.bd",
          password: "Shajgoj#SuperAdmin!2026$X9",
          role: "super_admin",
        },
        admin: {
          email: "admin@koreanskincare.bd",
          password: "Shajgoj#Admin!9982*Secure",
          role: "admin",
        },
        staff: {
          email: "staff@koreanskincare.bd",
          password: "Staff#Mod@Shajgoj8821$",
          role: "staff",
        },
        customer: {
          email: "customer@koreanskincare.bd",
          password: "Customer#Lux!Nusrat2026@",
          role: "customer",
        },
        ayesha: { email: "ayesha@example.com", password: "Ayesha#Luxe2026!Bd", role: "customer" },
      },
    });
  } catch (err: any) {
    console.error("Seed API error:", err);
    return NextResponse.json({ error: err.message || "Failed to seed database" }, { status: 500 });
  }
}
