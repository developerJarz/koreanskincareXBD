/**
 * Safe catalog seed + migration. Run with:  npm run seed      (or: node scripts/seed-catalog.mjs --dry-run)
 *
 *  1. Builds the Shajgoj-style category tree (Skin Care, Makeup, Hair Care, …) from
 *     scripts/catalog-data.mjs. Older flat categories (Serums, Toners, …) become subcategories:
 *     their URLs and products are kept, they just move under the new parent.
 *  2. Hides the old fashion categories (rings, earrings, bags, watches) and archives their
 *     products. Nothing is deleted — both can be restored from the admin dashboard.
 *  3. Adds the Korean beauty brands and links existing products to them (by product slug).
 *  4. Adds the demo products that don't exist yet.
 *  5. Backfills newer product fields on older products (media, isOnSale, legacy subcategory).
 *
 * Matching is by slug. Records that already exist are left as they are (edits made in the admin
 * dashboard are kept), so it is safe to run any number of times.
 */
import fs from "fs";
import mongoose from "mongoose";
import slugify from "slugify";

import {
  BRANDS,
  CATEGORIES,
  HOW_TO_USE,
  IMAGES,
  PRODUCTS,
  RETIRED_CATEGORY_SLUGS,
  SUBCATEGORY_OVERRIDES,
} from "./catalog-data.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const SITE = "KoreanSkincare.bd";
// "rom&nd" → "romand", "Skin & Body" → "skin-and-body"
const toSlug = (s) =>
  slugify(s.replace(/(\w)&(\w)/g, "$1$2").replace(/&/g, " and "), { lower: true, strict: true });

// Small deterministic number from a string, so demo stats stay the same between runs
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function loadEnv() {
  const env = { ...process.env };
  if (fs.existsSync(".env.local")) {
    for (const line of fs.readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

async function main() {
  const { MONGODB_URI } = loadEnv();
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set (.env.local or environment).");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const categories = db.collection("categories");
  const brands = db.collection("brands");
  const products = db.collection("products");
  const now = new Date();
  const log = {
    categoriesAdded: 0,
    categoriesMoved: 0,
    categoriesRetired: 0,
    productsRecategorised: 0,
    productsArchived: 0,
    brandsAdded: 0,
    productsLinkedToBrand: 0,
    productsAdded: 0,
    productsSkipped: 0,
  };
  const write = async (fn) => (DRY_RUN ? null : fn());

  console.log(DRY_RUN ? "DRY RUN — nothing will be written\n" : "");

  // ── 1. Category tree ──
  const movedLegacy = [];
  for (const [i, top] of CATEGORIES.entries()) {
    let topDoc = await categories.findOne({ slug: top.slug });
    if (!topDoc) {
      topDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: top.name,
        slug: top.slug,
        description: top.description,
        image: top.image,
        parent: null,
        children: [],
        productCount: 0,
        sortOrder: i,
        isActive: true,
        isFeatured: true,
        seoTitle: `${top.name} Price in Bangladesh | ${SITE}`,
        seoDescription: `Shop authentic Korean ${top.name.toLowerCase()} in Bangladesh. ${top.description}`,
        createdAt: now,
        updatedAt: now,
        __v: 0,
      };
      await write(() => categories.insertOne(topDoc));
      log.categoriesAdded++;
    } else if (!topDoc.image) {
      await write(() => categories.updateOne({ _id: topDoc._id }, { $set: { image: top.image } }));
    }

    for (const [j, child] of top.children.entries()) {
      const existing = await categories.findOne({ slug: child.slug });
      if (!existing) {
        await write(() =>
          categories.insertOne({
            name: child.name,
            slug: child.slug,
            description: "",
            image: "",
            parent: topDoc._id,
            children: [],
            productCount: 0,
            sortOrder: j,
            isActive: true,
            isFeatured: false,
            seoTitle: `${child.name} Price in Bangladesh | ${SITE}`,
            seoDescription: `Shop authentic Korean ${child.name.toLowerCase()} in Bangladesh.`,
            createdAt: now,
            updatedAt: now,
            __v: 0,
          }),
        );
        log.categoriesAdded++;
        continue;
      }

      // An old top-level category that belongs under the new parent: move it (once)
      const isLegacyTopLevel = child.legacyName && !existing.parent;
      if (!isLegacyTopLevel) continue;
      const hasChildren = await categories.findOne(
        { parent: existing._id },
        { projection: { _id: 1 } },
      );
      if (hasChildren) continue;

      const set = { parent: topDoc._id, sortOrder: j, isFeatured: false, updatedAt: now };
      // Rename only if it still has the original template name (keeps admin renames)
      if (existing.name === child.legacyName) {
        set.name = child.name;
        set.seoTitle = `${child.name} Price in Bangladesh | ${SITE}`;
      }
      await write(() => categories.updateOne({ _id: existing._id }, { $set: set }));
      log.categoriesMoved++;
      movedLegacy.push({ legacyId: existing._id, topId: topDoc._id });
    }
  }

  // Products of a moved category now live in the new parent, with that category as their
  // subcategory (or a more specific one — all subcategories exist by now)
  for (const { legacyId, topId } of movedLegacy) {
    const moved = await products
      .find(
        { category: legacyId, subcategory: { $not: { $type: "objectId" } } },
        { projection: { slug: 1 } },
      )
      .toArray();
    for (const prod of moved) {
      const overrideSlug = SUBCATEGORY_OVERRIDES[prod.slug];
      const override = overrideSlug
        ? await categories.findOne(
            { slug: overrideSlug, parent: topId },
            { projection: { _id: 1 } },
          )
        : null;
      await write(() =>
        products.updateOne(
          { _id: prod._id },
          { $set: { category: topId, subcategory: override?._id ?? legacyId, updatedAt: now } },
        ),
      );
      log.productsRecategorised++;
    }
  }

  // ── 2. Retire the old fashion categories ──
  const retired = await categories
    .find({ slug: { $in: RETIRED_CATEGORY_SLUGS }, parent: null, isActive: { $ne: false } })
    .toArray();
  for (const cat of retired) {
    await write(() =>
      categories.updateOne(
        { _id: cat._id },
        { $set: { isActive: false, isFeatured: false, updatedAt: now } },
      ),
    );
    log.categoriesRetired++;
    const res = await write(() =>
      products.updateMany(
        { category: cat._id, status: { $nin: ["archived"] } },
        { $set: { status: "archived", updatedAt: now } },
      ),
    );
    log.productsArchived +=
      res?.modifiedCount ?? (await products.countDocuments({ category: cat._id }));
  }

  // ── 3. Brands ──
  const brandIdByName = new Map();
  for (const [i, b] of BRANDS.entries()) {
    const slug = b.slug ?? toSlug(b.name);
    let doc = await brands.findOne({ slug });
    if (!doc) {
      doc = {
        _id: new mongoose.Types.ObjectId(),
        name: b.name,
        slug,
        description: b.description,
        logo: "",
        website: "",
        isActive: true,
        showOnHomepage: Boolean(b.featured),
        sortOrder: i,
        productCount: 0,
        seoTitle: `${b.name} Products Price in Bangladesh | ${SITE}`,
        seoDescription: `Shop 100% authentic ${b.name} products in Bangladesh. ${b.description}`,
        createdAt: now,
        updatedAt: now,
        __v: 0,
      };
      await write(() => brands.insertOne(doc));
      log.brandsAdded++;
    }
    brandIdByName.set(b.name, doc._id);

    if (b.prefix) {
      const res = await write(() =>
        products.updateMany(
          { slug: { $regex: `^${b.prefix}` }, brand: { $in: [null, ""] } },
          { $set: { brand: doc._id, updatedAt: now } },
        ),
      );
      log.productsLinkedToBrand +=
        res?.modifiedCount ??
        (await products.countDocuments({
          slug: { $regex: `^${b.prefix}` },
          brand: { $in: [null, ""] },
        }));
    }
  }

  // ── 4. Demo products ──
  const catBySlug = new Map(
    (await categories.find({}, { projection: { slug: 1, parent: 1 } }).toArray()).map((c) => [
      c.slug,
      c,
    ]),
  );
  const topSlugById = new Map(
    [...catBySlug.values()].filter((c) => !c.parent).map((c) => [String(c._id), c.slug]),
  );

  for (const [i, item] of PRODUCTS.entries()) {
    const slug = toSlug(item.name);
    if (await products.findOne({ slug }, { projection: { _id: 1 } })) {
      log.productsSkipped++;
      continue;
    }
    const sub = catBySlug.get(item.sub);
    if (!sub?.parent && !DRY_RUN) {
      console.warn(`  ! Skipped "${item.name}": subcategory "${item.sub}" not found`);
      continue;
    }
    const brandId = item.brand ? brandIdByName.get(item.brand) : null;
    const h = hash(slug);
    const url = IMAGES[item.img] ?? IMAGES.serum;
    const sku = `KSB-${String(1001 + i)}`;
    const skuTaken = await products.findOne({ sku }, { projection: { _id: 1 } });
    const topSlug = sub?.parent ? topSlugById.get(String(sub.parent)) : undefined;
    const brandSlug = item.brand
      ? (BRANDS.find((b) => b.name === item.brand)?.slug ?? toSlug(item.brand))
      : null;
    const created = new Date(now.getTime() - (PRODUCTS.length - i) * 60_000);

    await write(() =>
      products.insertOne({
        name: item.name,
        slug,
        shortDescription: item.desc,
        description: `${item.desc} 100% authentic — imported directly from Korea and stored in a climate-controlled warehouse in Dhaka.`,
        category: sub.parent,
        subcategory: sub._id,
        brand: brandId ?? null,
        collections: [],
        tags: [brandSlug, item.sub, topSlug].filter(Boolean),
        images: [url],
        media: [{ url, alt: item.name }],
        variants: [],
        price: item.price,
        ...(item.was ? { compareAtPrice: item.was } : {}),
        ...(skuTaken ? {} : { sku }),
        stock: 20 + (h % 100),
        lowStockThreshold: 5,
        trackInventory: true,
        colors: [],
        sizes: [],
        materials: [],
        status: "active",
        approvalStatus: "approved",
        vendorActive: true,
        isFeatured: Boolean(item.featured || item.bestseller),
        isNewArrival: Boolean(item.new),
        isBestseller: Boolean(item.bestseller),
        isOnSale: Boolean(item.was && item.was > item.price),
        isTrending: Boolean(item.trending),
        allowBackorders: false,
        howToUse: HOW_TO_USE[topSlug] ?? "",
        seoTitle: `${item.name} Price in Bangladesh | ${SITE}`,
        seoDescription:
          `${item.desc} Buy authentic ${item.name} in Bangladesh with fast delivery.`.slice(0, 320),
        seoKeywords: [],
        avgRating: Math.round((4.3 + (h % 7) / 10) * 10) / 10,
        totalReviews: 12 + (h % 180),
        totalSold: 40 + (h % 600),
        viewCount: 0,
        relatedProducts: [],
        frequentlyBoughtWith: [],
        createdAt: created,
        updatedAt: created,
        __v: 0,
      }),
    );
    log.productsAdded++;
  }

  // ── 5. Product backfill (idempotent) ──
  const backfill = { media: 0, onSale: 0, legacySubcategory: 0 };
  const cursor = products.find(
    {
      $or: [
        { media: { $exists: false }, "images.0": { $exists: true } },
        { isOnSale: { $exists: false } },
        { subcategory: { $type: "string" } },
      ],
    },
    {
      projection: { images: 1, media: 1, price: 1, compareAtPrice: 1, isOnSale: 1, subcategory: 1 },
    },
  );
  for await (const prod of cursor) {
    const set = {};
    const unset = {};
    if (!prod.media && prod.images?.length) {
      set.media = prod.images.map((u) => ({ url: u, alt: "" }));
      backfill.media++;
    }
    if (prod.isOnSale === undefined) {
      set.isOnSale = Boolean(prod.compareAtPrice && prod.compareAtPrice > prod.price);
      backfill.onSale++;
    }
    if (typeof prod.subcategory === "string") {
      unset.subcategory = "";
      backfill.legacySubcategory++;
    }
    if (!DRY_RUN && (Object.keys(set).length || Object.keys(unset).length)) {
      await products.updateOne(
        { _id: prod._id },
        {
          ...(Object.keys(set).length ? { $set: set } : {}),
          ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
      );
    }
  }

  console.log(
    `Categories: ${log.categoriesAdded} added, ${log.categoriesMoved} old categories moved under a new parent, ${log.categoriesRetired} fashion categories hidden`,
  );
  console.log(
    `Products:   ${log.productsRecategorised} moved into the new tree, ${log.productsArchived} fashion products archived`,
  );
  console.log(
    `Brands:     ${log.brandsAdded} added, ${log.productsLinkedToBrand} existing products linked to their brand`,
  );
  console.log(
    `Demo items: ${log.productsAdded} added, ${log.productsSkipped} already existed (left unchanged)`,
  );
  console.log(
    `Backfill:   ${backfill.media} got image/alt data, ${backfill.onSale} got an on-sale flag, ${backfill.legacySubcategory} had an old text subcategory removed`,
  );
  if (!DRY_RUN) {
    console.log(
      "\nThe storefront picks this up within 5 minutes, or immediately after any save in the admin dashboard.",
    );
  }
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
