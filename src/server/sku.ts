import crypto from "crypto";

import { Brand, Category, Product } from "@/server/db/models";
import { escapeRegex } from "@/server/security/validation";

/**
 * Automatic inventory codes.
 *
 *  SKU:     <BRAND>-<CATEGORY>-<NUMBER>   e.g. COS-SER-0007, BOJ-SUN-0012, KSB-GEN-0001
 *           The number counts up per brand + category, so SKUs sort and read naturally.
 *  Barcode: an EAN-13 number in the 200–299 "in-store" range (never clashes with manufacturer
 *           barcodes), with a valid check digit so any barcode scanner or label printer reads it.
 */

const words = (name: string | undefined) =>
  (name ?? "")
    .normalize("NFKD")
    .split(/[\s&/+-]+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);

/**
 * 3-letter brand code: "COSRX" → COS, "Beauty of Joseon" → BOJ, "Round Lab" → ROL,
 * "Axis-Y" → AXY, "Some By Mi" → SBM.
 */
export function brandCode(name: string | undefined): string {
  const w = words(name);
  if (w.length === 0) return "KSB";
  const code =
    w.length >= 3
      ? w
          .slice(0, 3)
          .map((x) => x[0])
          .join("")
      : w.length === 2
        ? w[0].slice(0, 2) + w[1][0]
        : w[0].slice(0, 3);
  return code.toUpperCase().padEnd(3, "X");
}

/**
 * 3-letter category code from the first word: "Serum & Ampoule" → SER, "Sunscreen" → SUN,
 * "BB & CC Cream" → BBC (short words borrow letters from the next word).
 */
export function categoryCode(name: string | undefined): string {
  const w = words(name);
  if (w.length === 0) return "GEN";
  let code = w[0].slice(0, 3);
  for (let i = 1; code.length < 3 && i < w.length; i++) code += w[i][0];
  return code.toUpperCase().padEnd(3, "X");
}

export async function skuPrefix(brandId?: string | null, categoryId?: string | null) {
  const [brand, category] = await Promise.all([
    brandId ? Brand.findById(brandId).select("name").lean() : null,
    categoryId ? Category.findById(categoryId).select("name").lean() : null,
  ]);
  return `${brandCode(brand?.name)}-${categoryCode(category?.name)}`;
}

/** The next free SKU for this brand + category (e.g. COS-SER-0008 after COS-SER-0007). */
export async function generateSku(
  brandId?: string | null,
  categoryId?: string | null,
  reserved: Set<string> = new Set(),
): Promise<string> {
  const prefix = await skuPrefix(brandId, categoryId);
  const pattern = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`);
  const existing = await Product.find({ sku: pattern }).select("sku").lean();
  let next = 1;
  for (const p of existing) {
    const n = Number(pattern.exec(p.sku ?? "")?.[1]);
    if (n >= next) next = n + 1;
  }
  for (const r of reserved) {
    const n = Number(pattern.exec(r)?.[1]);
    if (n >= next) next = n + 1;
  }
  // The number is the highest in use + 1; the loop only matters if two saves race
  for (let attempt = 0; attempt < 50; attempt++, next++) {
    const sku = `${prefix}-${String(next).padStart(4, "0")}`;
    if (!reserved.has(sku) && !(await Product.exists({ sku }))) return sku;
  }
  return `${prefix}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function ean13CheckDigit(first12: string) {
  const sum = [...first12].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return String((10 - (sum % 10)) % 10);
}

export function isValidEan13(code: string) {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === code[12];
}

/** A unique in-store EAN-13 barcode, e.g. 2004815263947. */
export async function generateBarcode(reserved: Set<string> = new Set()): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const body = "20" + String(crypto.randomInt(0, 10_000_000_000)).padStart(10, "0");
    const code = body + ean13CheckDigit(body);
    if (!reserved.has(code) && !(await Product.exists({ barcode: code }))) return code;
  }
  throw new Error("Couldn't find a free barcode.");
}
