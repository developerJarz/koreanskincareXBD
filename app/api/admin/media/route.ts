import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Brand, Category, Product, Settings } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { storefrontFromSettings } from "@/server/storefront";

type Asset = {
  url: string;
  folder: "products" | "brands" | "categories" | "site";
  usedBy: { label: string; kind: string; id?: string }[];
  alt?: string;
};

/**
 * GET — Every image the shop uses, gathered from products, brands, categories and the website
 * design, with where each one appears. ?folder= &q=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "media.view");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const folder = sp.get("folder");
    const q = sp.get("q")?.trim().toLowerCase().slice(0, 100);

    await connectDB();
    const [products, brands, categories, settings] = await Promise.all([
      Product.find({ status: { $ne: "archived" } }).select("name images media").lean(),
      Brand.find().select("name logo").lean(),
      Category.find().select("name image").lean(),
      Settings.findOne()
        .select("storefront siteName contactEmail contactPhone address logo favicon socialLinks")
        .lean(),
    ]);

    const map = new Map<string, Asset>();
    const add = (url: unknown, folder: Asset["folder"], usedBy: Asset["usedBy"][number], alt?: string) => {
      if (typeof url !== "string" || !url || url.startsWith("data:")) return;
      const asset = map.get(url) ?? { url, folder, usedBy: [], alt };
      if (!asset.usedBy.some((u) => u.label === usedBy.label)) asset.usedBy.push(usedBy);
      if (!asset.alt && alt) asset.alt = alt;
      map.set(url, asset);
    };

    for (const p of products as any[]) {
      const media: { url: string; alt?: string }[] = p.media?.length
        ? p.media
        : (p.images ?? []).map((url: string) => ({ url }));
      media.forEach((m, i) =>
        add(m.url, "products", { label: p.name + (i === 0 ? " (main)" : ""), kind: "product", id: String(p._id) }, m.alt),
      );
    }
    for (const b of brands as any[]) add(b.logo, "brands", { label: b.name, kind: "brand", id: String(b._id) });
    for (const c of categories as any[]) add(c.image, "categories", { label: c.name, kind: "category", id: String(c._id) });

    const store = storefrontFromSettings(settings as any);
    add(store.branding.logoUrl, "site", { label: "Logo", kind: "site" });
    add(store.branding.footerLogoUrl, "site", { label: "Footer logo", kind: "site" });
    add(store.branding.faviconUrl, "site", { label: "Browser icon", kind: "site" });
    // Homepage banners and any other images in the website design
    const walk = (value: unknown, path: string) => {
      if (typeof value === "string") {
        if (/^(https?:\/\/|\/uploads\/)/.test(value) && /\.(png|jpe?g|webp|avif|gif|svg)(\?|$)|res\.cloudinary\.com|\/uploads\//i.test(value)) {
          add(value, "site", { label: `Website design: ${path}`, kind: "site" });
        }
        return;
      }
      if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path} ${i + 1}`));
      else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) {
          if (k === "branding") continue;
          walk(v, path ? `${path} › ${k}` : k);
        }
      }
    };
    walk(store, "");

    let assets = [...map.values()];
    const counts = {
      all: assets.length,
      products: assets.filter((a) => a.folder === "products").length,
      brands: assets.filter((a) => a.folder === "brands").length,
      categories: assets.filter((a) => a.folder === "categories").length,
      site: assets.filter((a) => a.folder === "site").length,
      cloudinary: assets.filter((a) => a.url.includes("res.cloudinary.com")).length,
      missingAlt: assets.filter((a) => a.folder === "products" && !a.alt).length,
    };
    if (folder && ["products", "brands", "categories", "site"].includes(folder)) {
      assets = assets.filter((a) => a.folder === folder);
    }
    if (q) {
      assets = assets.filter(
        (a) => a.url.toLowerCase().includes(q) || a.usedBy.some((u) => u.label.toLowerCase().includes(q)),
      );
    }

    return NextResponse.json({ counts, items: assets.slice(0, 600), truncated: assets.length > 600 });
  } catch (err) {
    return serverError("Media library error", err, "Couldn't load the media library.");
  }
}
