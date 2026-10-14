/** Preview with npm run products:clear; delete with npm run products:clear -- --apply. */
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const env = { ...process.env };
try {
  for (const line of (await fs.readFile(".env.local", "utf8")).split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && env[match[1]] === undefined) {
      env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const { EJSON } = mongoose.mongo.BSON;
const fingerprint = (docs) => createHash("sha256").update(EJSON.stringify(docs)).digest("hex");
const snapshot = (db, name) => db.collection(name).find({}).sort({ _id: 1 }).toArray();

async function main() {
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const [products, brands, categories] = await Promise.all([
    snapshot(db, "products"),
    snapshot(db, "brands"),
    snapshot(db, "categories"),
  ]);
  console.log(
    JSON.stringify({
      mode: apply ? "apply" : "preview",
      database: db.databaseName,
      products: products.length,
      brands: brands.length,
      categories: categories.length,
    }),
  );
  if (!apply) return;

  let deleted = 0;
  if (products.length) {
    // Keep a local recovery copy before deleting. *.local files are ignored by Git.
    const backup = `products-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.local`;
    await fs.writeFile(backup, EJSON.stringify(products, { relaxed: false }), { flag: "wx" });
    console.log(`Product backup saved to ${backup}`);
    // Delete only the inspected products, so a concurrent upload is never caught by this run.
    const result = await db.collection("products").deleteMany({
      _id: { $in: products.map((product) => product._id) },
    });
    deleted = result.deletedCount;
  }

  const [remaining, brandsAfter, categoriesAfter] = await Promise.all([
    db.collection("products").countDocuments(),
    snapshot(db, "brands"),
    snapshot(db, "categories"),
  ]);
  const brandsUnchanged = fingerprint(brands) === fingerprint(brandsAfter);
  const categoriesUnchanged = fingerprint(categories) === fingerprint(categoriesAfter);
  console.log(JSON.stringify({ deleted, remaining, brandsUnchanged, categoriesUnchanged }));
  if (remaining || !brandsUnchanged || !categoriesUnchanged) {
    throw new Error("Verification failed; inspect the reported counts and preserved records.");
  }
}

try {
  await main();
} catch (error) {
  // Avoid printing database connection strings from driver errors.
  console.error(`Product cleanup failed (${error.codeName || error.name}).`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
