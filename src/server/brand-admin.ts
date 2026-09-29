import type { Types } from "mongoose";

import { Brand } from "@/server/db/models";
import { resolveSlug, type FieldErrors } from "@/server/catalog-admin";
import { cleanString, escapeRegex, isSafeUrl } from "@/server/security/validation";

export async function validateBrand(raw: any, excludeId?: Types.ObjectId | string) {
  const errors: FieldErrors = {};
  const name = cleanString(raw?.name, 80) ?? "";
  if (name.length < 1) errors.name = "Enter the brand name.";
  else if (
    await Brand.exists({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    errors.name = "A brand with this name already exists.";
  }

  const logo = cleanString(raw?.logo, 1000) ?? "";
  if (logo && !isSafeUrl(logo)) errors.logo = "The logo link is invalid.";

  let slug = "";
  if (!errors.name) {
    const resolved = await resolveSlug(Brand, raw?.slug, name, excludeId);
    if ("error" in resolved) errors.slug = resolved.error;
    else slug = resolved.slug;
  }

  if (Object.keys(errors).length) return { errors };
  return {
    value: {
      name,
      slug,
      logo,
      description: cleanString(raw?.description, 2000) ?? "",
      isActive: raw?.isActive !== false,
      showOnHomepage: Boolean(raw?.showOnHomepage),
      sortOrder: Math.round(Number(raw?.sortOrder) || 0),
      seoTitle: cleanString(raw?.seoTitle, 120) ?? "",
      seoDescription: cleanString(raw?.seoDescription, 320) ?? "",
    },
  };
}
