import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import mongoose from "mongoose";
import ts from "typescript";

async function importTypeScript(path, dependencies = {}) {
  const source = await fs.readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const resolved = outputText.replace(
    /from "([^"]+)"/g,
    (_, specifier) => `from "${dependencies[specifier] ?? import.meta.resolve(specifier)}"`,
  );
  return import(`data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`);
}

test("the static catalog contains no demo products", async () => {
  const { PRODUCTS } = await importTypeScript("../src/lib/site-data.ts");
  assert.equal(PRODUCTS.length, 0);
});

test("the maintenance catalog contains no demo products", async () => {
  const { PRODUCTS } = await import("../scripts/catalog-data.mjs");
  assert.equal(PRODUCTS.length, 0);
});

test("image descriptions stay attached to their URLs when product images are reordered", async () => {
  const { Product } = await importTypeScript("../src/server/db/models/product.model.ts");
  const media = [
    { url: "https://example.com/front.webp", alt: "Bottle viewed from the front" },
    { url: "https://example.com/back.webp", alt: "Bottle ingredients label" },
  ];
  const product = new Product({
    name: "Uploaded product",
    slug: "uploaded-product",
    category: new mongoose.Types.ObjectId(),
    price: 100,
    media,
  });
  await product.validate();
  assert.deepEqual(
    [...product.images],
    media.map((m) => m.url),
  );
  assert.equal(product.toObject().media[0].alt, media[0].alt);

  product.unmarkModified("media");
  product.images = [media[1].url, media[0].url];
  await product.validate();
  assert.deepEqual(product.toObject().media, [media[1], media[0]]);
});

async function vendorValidation() {
  const validation = await fs.readFile(
    new URL("../src/server/security/validation.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(validation, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const dataUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  return importTypeScript("../src/server/marketplace.ts", {
    "@/server/security/validation": dataUrl(
      outputText.replace('from "crypto"', 'from "node:crypto"'),
    ),
    // These tests exercise pure validation; database-backed functions are not called.
    "@/server/db/models": dataUrl("export const Order = {}, Product = {}, Vendor = {};"),
  });
}

const vendor = { limits: { maxDiscountPercent: 50, allowedCategories: [] } };
const vendorProduct = {
  name: "Uploaded product",
  price: 100,
  stock: 10,
  category: "000000000000000000000001",
};

test("vendor uploads validate image URLs and save trimmed alt text", async () => {
  const { checkVendorProduct } = await vendorValidation();
  const result = checkVendorProduct(vendor, {
    ...vendorProduct,
    media: [{ url: "https://example.com/front.webp", alt: "  Front of the bottle  " }],
  });
  assert.ok(result.value, result.error);
  assert.deepEqual(result.value.images, ["https://example.com/front.webp"]);
  assert.deepEqual(result.value.media, [
    { url: "https://example.com/front.webp", alt: "Front of the bottle" },
  ]);
  const invalid = checkVendorProduct(vendor, {
    ...vendorProduct,
    media: [{ url: "javascript:alert(1)", alt: "Unsafe image" }],
  });
  assert.ok(invalid.error);
});

test("legacy vendor edits do not replace existing image descriptions", async () => {
  const { checkVendorProduct } = await vendorValidation();
  const result = checkVendorProduct(vendor, {
    ...vendorProduct,
    images: ["https://example.com/front.webp"],
  });
  assert.ok(result.value, result.error);
  assert.equal(result.value.media, undefined);
});

test("changing vendor image alt text requires the same review as other visible content", async () => {
  const { checkVendorProduct, needsReReview } = await vendorValidation();
  const media = [{ url: "https://example.com/front.webp", alt: "Bottle front" }];
  const result = checkVendorProduct(vendor, { ...vendorProduct, media });
  assert.ok(result.value, result.error);
  const before = { ...result.value, media: [{ ...media[0], alt: "Old description" }] };
  assert.equal(needsReReview(before, result.value), true);
});
