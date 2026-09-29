import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Settings } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import { revalidateStorefront, storefrontFromSettings } from "@/server/storefront";
import { DEFAULT_STOREFRONT, normalizeStorefront, whatsappLink } from "@/lib/storefront";

// GET — the current website design (staff can view; only admins can change it)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;
    await connectDB();
    const settings = await Settings.findOne().lean();
    return NextResponse.json({
      config: storefrontFromSettings(settings as any),
      defaults: DEFAULT_STOREFRONT,
      canEdit: ADMIN_ROLES.includes(auth.user.role),
    });
  } catch (err) {
    return serverError("Get storefront error", err, "Couldn't load the website settings.");
  }
}

// PUT — save the whole website design; every field is validated in normalizeStorefront()
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
    }
    const { value, errors } = normalizeStorefront(body);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Some fields need attention.", fields: errors },
        { status: 400 },
      );
    }

    await connectDB();
    const existing = await Settings.findOne().select("_id").lean();
    if (!existing) await Settings.create({});

    // Written with $set (value is already validated) rather than doc.save(): a dev server that
    // loaded the Settings model before `storefront` existed would otherwise drop the field
    const set: Record<string, unknown> = {
      storefront: value,
      // Keep the older fields in step (checkout emails, SEO and other code read these)
      siteName: value.branding.siteName,
      contactEmail: value.contact.email,
      contactPhone: value.contact.phone,
      address: value.contact.address,
      "socialLinks.facebook": value.social.facebook || null,
      "socialLinks.instagram": value.social.instagram || null,
      "socialLinks.youtube": value.social.youtube || null,
      "socialLinks.tiktok": value.social.tiktok || null,
      "socialLinks.whatsapp": whatsappLink(value.contact.whatsapp) || null,
      logo: value.branding.logoUrl || null,
      favicon: value.branding.faviconUrl || null,
    };
    await Settings.updateOne({}, { $set: set }, { strict: false });

    revalidateStorefront();
    // Pages built ahead of time (homepage, footer on every page) pick up the change now
    revalidatePath("/", "layout");

    return NextResponse.json({ config: value });
  } catch (err) {
    return serverError("Save storefront error", err, "Couldn't save the website settings.");
  }
}
