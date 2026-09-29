/**
 * Moves the images stored in this project's folders to Cloudinary and points the database at them.
 * Run with:  npm run images:migrate      (or: node scripts/migrate-images-to-cloudinary.mjs --dry-run)
 *
 *  1. Uploads the local images to Cloudinary under koreanskincare/…:
 *       public/brand-logos/*      → koreanskincare/brands
 *       src/assets/cat-*.jpg      → koreanskincare/categories
 *       src/assets/pr-*.jpg       → koreanskincare/products
 *       src/assets/hero.jpg, public/ logos → koreanskincare/site
 *  2. Rewrites local image paths saved in MongoDB (brand logos, category images, product
 *     images/media, order item images) to the Cloudinary URLs. Build-hashed paths such as
 *     /_next/static/media/cat-bags.396e4727.jpg are matched to src/assets/cat-bags.jpg.
 *  3. Saves the local path → Cloudinary URL list to scripts/cloudinary-images.json.
 *
 * Each image gets a fixed Cloudinary name, so running this again doesn't upload duplicates.
 * Remote images (Unsplash etc.) are left as they are.
 */
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT_FOLDER = "koreanskincare";
const MANIFEST = "scripts/cloudinary-images.json";
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

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

const list = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => IMAGE_EXT.test(f))
        .map((f) => path.posix.join(dir, f))
    : [];

/** Which Cloudinary folder each local image belongs in. */
function localImages() {
  const images = [];
  for (const file of list("public/brand-logos")) images.push({ file, folder: "brands" });
  for (const file of list("src/assets")) {
    const name = path.basename(file);
    const folder = name.startsWith("cat-")
      ? "categories"
      : name.startsWith("pr-")
        ? "products"
        : "site";
    images.push({ file, folder });
  }
  for (const file of list("public")) {
    if (!/^favicon\./.test(path.basename(file))) images.push({ file, folder: "site" });
  }
  // logo.png and logo.svg would both become "logo" — give the non-PNG/JPG one its own name
  const taken = new Map();
  for (const image of images) {
    image.publicId = publicIdFor(image.file);
    const key = `${image.folder}/${image.publicId}`;
    if (taken.has(key)) image.publicId += `-${path.extname(image.file).slice(1).toLowerCase()}`;
    taken.set(key, true);
  }
  return images;
}

// "logo shajgojbd.png" → "logo-shajgojbd"
const publicIdFor = (file) =>
  path
    .basename(file)
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function upload({ file, folder, publicId }) {
  if (DRY_RUN)
    return `https://res.cloudinary.com/${cloudinary.config().cloud_name}/image/upload/${ROOT_FOLDER}/${folder}/${publicId}${path.extname(file)}`;
  const result = await cloudinary.uploader.upload(file, {
    folder: `${ROOT_FOLDER}/${folder}`,
    public_id: publicId,
    // Keep an already uploaded copy instead of uploading it again
    overwrite: false,
    resource_type: "image",
  });
  return result.secure_url;
}

async function main() {
  const env = loadEnv();
  const { MONGODB_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET first.");
    process.exit(1);
  }
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set (.env.local or environment).");
    process.exit(1);
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  if (DRY_RUN) console.log("Dry run — nothing will be uploaded or saved.\n");

  // 1. Upload
  const manifest = {}; // "public/brand-logos/anua.webp" → Cloudinary URL
  const byName = new Map(); // "cat-bags.jpg" → Cloudinary URL (for build-hashed /_next paths)
  let failed = 0;
  for (const image of localImages()) {
    try {
      const url = await upload(image);
      manifest[image.file] = url;
      byName.set(path.basename(image.file).toLowerCase(), url);
      console.log(`  ✓ ${image.file} → ${url}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${image.file}: ${err?.message ?? err?.error?.message ?? err}`);
    }
  }
  console.log(`\nUploaded ${Object.keys(manifest).length} images (${failed} failed).\n`);

  /** Cloudinary URL for a local image path saved in the database, or null to leave it alone. */
  const cloudUrlFor = (value) => {
    if (typeof value !== "string") return null;
    if (value.startsWith("/_next/static/media/")) {
      // cat-bags.396e4727.jpg → cat-bags.jpg
      const name = path.posix.basename(value).replace(/\.[0-9a-f]{6,}(\.[a-z]+)$/i, "$1");
      return byName.get(name.toLowerCase()) ?? null;
    }
    if (value.startsWith("/") && !value.startsWith("/uploads/")) {
      return manifest[path.posix.join("public", decodeURIComponent(value))] ?? null;
    }
    return null;
  };

  // 2. Rewrite database references
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  let changedDocs = 0;
  const missing = new Set();

  const rewrite = async (collection, fields, filter) => {
    const col = db.collection(collection);
    for await (const doc of col.find(filter, {
      projection: Object.fromEntries(fields.map((f) => [f, 1])),
    })) {
      const set = {};
      const swap = (value) => {
        const next = cloudUrlFor(value);
        if (next) return next;
        if (typeof value === "string" && value.startsWith("/") && !value.startsWith("/uploads/"))
          missing.add(value);
        return value;
      };
      for (const field of fields) {
        const value = doc[field];
        if (typeof value === "string") {
          const next = swap(value);
          if (next !== value) set[field] = next;
        } else if (Array.isArray(value)) {
          let touched = false;
          const next = value.map((item) => {
            if (typeof item === "string") {
              const url = swap(item);
              if (url !== item) touched = true;
              return url;
            }
            if (item && typeof item === "object") {
              const key = "url" in item ? "url" : "productImage" in item ? "productImage" : null;
              if (!key) return item;
              const url = swap(item[key]);
              if (url === item[key]) return item;
              touched = true;
              return { ...item, [key]: url };
            }
            return item;
          });
          if (touched) set[field] = next;
        }
      }
      if (Object.keys(set).length === 0) continue;
      changedDocs++;
      console.log(`  ${collection} ${doc._id}: ${Object.keys(set).join(", ")}`);
      if (!DRY_RUN) await col.updateOne({ _id: doc._id }, { $set: set });
    }
  };

  const local = /^\/(?!\/)/; // starts with a single "/" — a path on our own site
  await rewrite("brands", ["logo"], { logo: local });
  await rewrite("categories", ["image", "banner"], {
    $or: [{ image: local }, { banner: local }],
  });
  await rewrite("products", ["images", "media"], {
    $or: [{ images: local }, { "media.url": local }],
  });
  await rewrite("orders", ["items"], { "items.productImage": local });
  await rewrite("banners", ["image", "mobileImage"], {
    $or: [{ image: local }, { mobileImage: local }],
  });
  await rewrite("settings", ["logo", "favicon"], { $or: [{ logo: local }, { favicon: local }] });
  await mongoose.disconnect();

  console.log(`\n${DRY_RUN ? "Would update" : "Updated"} ${changedDocs} database records.`);
  if (missing.size)
    console.log(
      `Local paths with no matching image file (left unchanged):\n  ${[...missing].join("\n  ")}`,
    );

  // 3. Manifest
  if (!DRY_RUN) {
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Saved ${MANIFEST}`);
  }
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
