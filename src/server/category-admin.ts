import type { Types } from "mongoose";

import { Category } from "@/server/db/models";
import { resolveSlug, type FieldErrors } from "@/server/catalog-admin";
import { cleanString, escapeRegex, isObjectId, isSafeUrl } from "@/server/security/validation";

/** Categories are two levels deep: top-level categories and their subcategories. */
export async function validateCategory(raw: any, existing?: { _id: Types.ObjectId }) {
  const errors: FieldErrors = {};
  const name = cleanString(raw?.name, 80) ?? "";
  if (!name) errors.name = "Enter the category name.";

  let parent: string | null = null;
  if (raw?.parent) {
    if (!isObjectId(raw.parent)) {
      errors.parent = "Choose a valid parent category.";
    } else if (existing && String(existing._id) === raw.parent) {
      errors.parent = "A category can't be its own parent.";
    } else {
      const p = await Category.findById(raw.parent).select("parent").lean();
      if (!p) errors.parent = "That parent category no longer exists.";
      else if (p.parent) errors.parent = "Subcategories can't have their own subcategories.";
      else if (existing && (await Category.exists({ parent: existing._id }))) {
        errors.parent = "This category has subcategories, so it can't become a subcategory itself.";
      } else parent = raw.parent;
    }
  }

  // Sibling names must be unique (e.g. only one "Toner" under Skincare)
  if (
    name &&
    !errors.parent &&
    (await Category.exists({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
      parent: parent ?? null,
      ...(existing ? { _id: { $ne: existing._id } } : {}),
    }))
  ) {
    errors.name = parent
      ? "This category already has a subcategory with that name."
      : "A top-level category with this name already exists.";
  }

  const image = cleanString(raw?.image, 1000) ?? "";
  if (image && !isSafeUrl(image)) errors.image = "The image link is invalid.";

  let slug = "";
  if (!errors.name && name) {
    const resolved = await resolveSlug(Category, raw?.slug, name, existing?._id);
    if ("error" in resolved) errors.slug = resolved.error;
    else slug = resolved.slug;
  }

  if (Object.keys(errors).length) return { errors };
  return {
    value: {
      name,
      slug,
      parent,
      image,
      description: cleanString(raw?.description, 2000) ?? "",
      isActive: raw?.isActive !== false,
      isFeatured: Boolean(raw?.isFeatured),
      seoTitle: cleanString(raw?.seoTitle, 120) ?? "",
      seoDescription: cleanString(raw?.seoDescription, 320) ?? "",
    },
  };
}
