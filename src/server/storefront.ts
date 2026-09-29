import { unstable_cache, revalidateTag } from "next/cache";

import { connectDB } from "@/server/db/connection";
import { Settings } from "@/server/db/models";
import { DEFAULT_STOREFRONT, normalizeStorefront, type StorefrontConfig } from "@/lib/storefront";

/**
 * The website design the team edits in the admin "Website design" tab.
 * Contact details and social links are also kept in the older Settings fields (contactEmail,
 * contactPhone, address, socialLinks, logo, favicon) so other code that reads them stays correct.
 */

export const STOREFRONT_TAG = "storefront";

export function revalidateStorefront() {
  revalidateTag(STOREFRONT_TAG);
}

type SettingsLike = {
  storefront?: unknown;
  siteName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logo?: string;
  favicon?: string;
  socialLinks?: Record<string, string | undefined>;
};

/** Builds the config from a Settings document (older fields fill in anything not saved yet). */
export function storefrontFromSettings(settings: SettingsLike | null): StorefrontConfig {
  const saved = (settings?.storefront ?? {}) as Record<string, any>;
  const social = settings?.socialLinks ?? {};
  // Before the first save from the new editor, show what the old Settings screen stored
  const merged = {
    ...saved,
    branding: {
      siteName: settings?.siteName,
      logoUrl: settings?.logo,
      faviconUrl: settings?.favicon,
      ...saved.branding,
    },
    contact: {
      email: settings?.contactEmail,
      phone: settings?.contactPhone,
      address: settings?.address,
      whatsapp: social.whatsapp,
      ...saved.contact,
    },
    social: {
      facebook: social.facebook,
      instagram: social.instagram,
      youtube: social.youtube,
      tiktok: social.tiktok,
      ...saved.social,
    },
  };
  // Drop undefined values so defaults apply
  return normalizeStorefront(JSON.parse(JSON.stringify(merged))).value;
}

async function loadStorefront(): Promise<StorefrontConfig> {
  try {
    await connectDB();
    const settings = await Settings.findOne()
      .select("storefront siteName contactEmail contactPhone address logo favicon socialLinks")
      .lean();
    return storefrontFromSettings(settings as SettingsLike | null);
  } catch (err) {
    // The shop must still render if the database is briefly unreachable
    console.error("Storefront settings load error:", err);
    return DEFAULT_STOREFRONT;
  }
}

/** Cached; refreshed immediately whenever an admin saves the website design. */
export const getStorefront = unstable_cache(loadStorefront, ["storefront-config"], {
  tags: [STOREFRONT_TAG],
  revalidate: 3600,
});
