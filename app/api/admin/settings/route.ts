import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Settings } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError } from "@/server/auth/session";
import { cleanString, isEmail, isSafeUrl, toNonNegativeNumber } from "@/server/security/validation";

const SOCIAL_KEYS = ["instagram", "facebook", "youtube", "tiktok", "whatsapp"] as const;
const SHIPPING_KEYS = [
  "freeShippingThreshold",
  "defaultShippingCost",
  "insideDhakaCost",
  "outsideDhakaCost",
] as const;

// GET — Fetch current store settings (admins only: may contain gateway configuration)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    await connectDB();
    let settings = await Settings.findOne().lean();

    if (!settings) {
      // Create default settings if not exists
      settings = await Settings.create({
        siteName: "koreanskincare.bd",
        siteDescription: "Authentic Korean skincare, beauty & lifestyle accessories for Bangladesh",
        contactEmail: "hello@koreanskincare.bd",
        contactPhone: "+880 1711-223344",
        address: "House 42, Road 11, Banani, Dhaka 1213",
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
    }

    return NextResponse.json(JSON.parse(JSON.stringify(settings)));
  } catch (err) {
    return serverError("Get settings error", err, "Failed to fetch settings");
  }
}

// PUT — Update store settings (only known fields are accepted)
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    const data = await request.json().catch(() => ({}));
    await connectDB();

    const settings = (await Settings.findOne()) ?? new Settings({});

    const siteName = cleanString(data.siteName, 120);
    if (siteName) settings.siteName = siteName;
    const siteDescription = cleanString(data.siteDescription, 1000);
    if (siteDescription) settings.siteDescription = siteDescription;
    if (data.contactEmail !== undefined) {
      if (!isEmail(data.contactEmail)) {
        return NextResponse.json({ error: "Invalid contact email" }, { status: 400 });
      }
      settings.contactEmail = data.contactEmail.trim();
    }
    const contactPhone = cleanString(data.contactPhone, 40);
    if (contactPhone) settings.contactPhone = contactPhone;
    const address = cleanString(data.address, 500);
    if (address) settings.address = address;

    if (data.socialLinks && typeof data.socialLinks === "object") {
      const links: Record<string, string | undefined> = { ...(settings.socialLinks ?? {}) };
      for (const key of SOCIAL_KEYS) {
        const value = data.socialLinks[key];
        if (value === undefined) continue;
        if (value && !isSafeUrl(value)) {
          return NextResponse.json({ error: `Invalid ${key} link` }, { status: 400 });
        }
        links[key] = value || undefined;
      }
      settings.socialLinks = links as typeof settings.socialLinks;
    }

    if (data.shipping && typeof data.shipping === "object") {
      const shipping: Record<string, number> = { ...(settings.shipping ?? {}) };
      for (const key of SHIPPING_KEYS) {
        if (data.shipping[key] === undefined) continue;
        const value = toNonNegativeNumber(data.shipping[key]);
        if (value === undefined) {
          return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
        }
        shipping[key] = value;
      }
      settings.shipping = shipping as unknown as typeof settings.shipping;
    }

    if (Array.isArray(data.paymentGateways)) {
      settings.paymentGateways = data.paymentGateways.slice(0, 20).map((g: any) => ({
        name: cleanString(g?.name, 60) || "Gateway",
        enabled: Boolean(g?.enabled),
        config: g?.config && typeof g.config === "object" ? g.config : {},
      }));
    }

    await settings.save();
    return NextResponse.json(JSON.parse(JSON.stringify(settings)));
  } catch (err) {
    return serverError("Update settings error", err, "Failed to update settings");
  }
}
