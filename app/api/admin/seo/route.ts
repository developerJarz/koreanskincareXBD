import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Brand, Category, Product, Settings } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { storefrontFromSettings } from "@/server/storefront";
import { SITE_URL } from "@/lib/site";

/**
 * GET — Search-appearance health of the live catalogue: which products, categories and brands
 * are missing titles, descriptions or image descriptions, plus Organization schema built from
 * the real store details.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "content.manage");
    if (!auth.ok) return auth.response;

    await connectDB();
    type Filter = Record<string, unknown>;
    const live: Filter = { status: "active" };
    const empty = (field: string): Filter[] => [{ [field]: { $exists: false } }, { [field]: "" }, { [field]: null }];
    const missing = (field: string): Filter => ({ $or: empty(field) });
    const shortText: Filter = { $expr: { $lt: [{ $strLenCP: { $ifNull: ["$description", ""] } }, 120] } };

    const [total, noSeoTitle, noSeoDesc, shortDesc, noAlt, products, catTotal, catNoDesc, brandTotal, brandNoDesc, settings] = await Promise.all([
      Product.countDocuments(<any>live),
      Product.countDocuments(<any>{ ...live, ...missing("seoTitle") }),
      Product.countDocuments(<any>{ ...live, ...missing("seoDescription") }),
      Product.countDocuments(<any>{ ...live, ...shortText }),
      Product.countDocuments(<any>{ ...live, "media.0": { $exists: true }, media: { $elemMatch: { $or: [{ alt: { $exists: false } }, { alt: "" }] } } }),
      Product.find(<any>{
        ...live,
        $or: [...empty("seoTitle"), ...empty("seoDescription"), shortText],
      })
        .sort({ totalSold: -1, viewCount: -1 })
        .limit(25)
        .select("name slug seoTitle seoDescription description totalSold")
        .lean(),
      Category.countDocuments(<any>{ isActive: true }),
      Category.countDocuments(<any>{ isActive: true, ...missing("description") }),
      Brand.countDocuments(<any>{ isActive: true }),
      Brand.countDocuments(<any>{ isActive: true, ...missing("description") }),
      Settings.findOne().select("storefront siteName contactEmail contactPhone address logo favicon socialLinks").lean(),
    ]);

    const store = storefrontFromSettings(settings as any);
    const social = Object.values(store.social ?? {}).filter((v): v is string => typeof v === "string" && v.startsWith("http"));
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: store.branding.siteName,
      url: SITE_URL,
      ...(store.branding.logoUrl ? { logo: store.branding.logoUrl.startsWith("http") ? store.branding.logoUrl : `${SITE_URL}${store.branding.logoUrl}` } : {}),
      ...(store.contact.phone || store.contact.email
        ? {
            contactPoint: {
              "@type": "ContactPoint",
              ...(store.contact.phone ? { telephone: store.contact.phone } : {}),
              ...(store.contact.email ? { email: store.contact.email } : {}),
              contactType: "customer support",
              areaServed: "BD",
              availableLanguage: ["en", "bn"],
            },
          }
        : {}),
      ...(store.contact.address ? { address: { "@type": "PostalAddress", streetAddress: store.contact.address, addressCountry: "BD" } } : {}),
      ...(social.length ? { sameAs: social } : {}),
    };

    return NextResponse.json({
      products: { total, noSeoTitle, noSeoDesc, shortDesc, noAlt },
      categories: { total: catTotal, noDescription: catNoDesc },
      brands: { total: brandTotal, noDescription: brandNoDesc },
      toFix: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        sold: p.totalSold ?? 0,
        issues: [
          !p.seoTitle ? "no search title" : null,
          !p.seoDescription ? "no search description" : null,
          (p.description ?? "").length < 120 ? "short description" : null,
        ].filter(Boolean),
      })),
      schema,
    });
  } catch (err) {
    return serverError("SEO report error", err, "Couldn't check search appearance.");
  }
}
