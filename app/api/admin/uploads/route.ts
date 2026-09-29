import { NextRequest, NextResponse } from "next/server";

import { requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import { requireVendor } from "@/server/auth/vendor";
import { connectDB } from "@/server/db/connection";
import { rateLimit } from "@/server/security/rate-limit";
import {
  isCloudinaryConfigured,
  isLocalUploadAllowed,
  saveLocalUpload,
  saveLocalUploadFromUrl,
  signCloudinaryUpload,
  UPLOAD_FOLDERS,
  type UploadFolder,
} from "@/server/uploads";

const NOT_CONFIGURED =
  "Image uploads aren't set up. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the server settings.";

function folderFrom(value: unknown): UploadFolder | null {
  return UPLOAD_FOLDERS.includes(value as UploadFolder) ? (value as UploadFolder) : null;
}

/**
 * Staff can upload to any folder. Approved vendors can upload product photos for their own
 * listings (the vendor product API still checks everything they save).
 */
async function authorizeUpload(
  request: NextRequest,
  folder: UploadFolder,
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  const staff = await requireAuth(request, STAFF_ROLES);
  if (staff.ok) return { ok: true, userId: String(staff.user._id) };
  // Signed in, but not staff — maybe a vendor
  if (folder === "products" && staff.response.status === 403) {
    await connectDB();
    const vendor = await requireVendor(request, { write: true });
    return vendor.ok ? { ok: true, userId: String(vendor.user._id) } : vendor;
  }
  return staff;
}

/**
 * GET ?folder=products — tells the browser where to upload:
 *  { provider: "cloudinary", uploadUrl, fields }  → POST the file (or an image link) straight to
 *    Cloudinary with a short-lived signature
 *  { provider: "local", uploadUrl: "/api/admin/uploads" } → POST the file here
 */
export async function GET(request: NextRequest) {
  try {
    const folder = folderFrom(new URL(request.url).searchParams.get("folder"));
    if (!folder) return NextResponse.json({ error: "Unknown upload folder." }, { status: 400 });

    const auth = await authorizeUpload(request, folder);
    if (!auth.ok) return auth.response;
    const limited = rateLimit(`upload-sign:${auth.userId}`, 200, 10 * 60_000);
    if (limited) return limited;

    if (isCloudinaryConfigured()) {
      return NextResponse.json({ provider: "cloudinary", ...signCloudinaryUpload(folder) });
    }
    if (isLocalUploadAllowed()) {
      return NextResponse.json({
        provider: "local",
        uploadUrl: "/api/admin/uploads",
        fields: { folder },
      });
    }
    return NextResponse.json({ error: NOT_CONFIGURED }, { status: 503 });
  } catch (err) {
    return serverError("Upload sign error", err, "Couldn't prepare the upload.");
  }
}

// POST multipart { file | url, folder } — local storage only (development / self-hosted)
export async function POST(request: NextRequest) {
  try {
    if (!isLocalUploadAllowed()) {
      return NextResponse.json({ error: NOT_CONFIGURED }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const url = form.get("url");
    const folder = folderFrom(form.get("folder"));
    if (!folder || (!(file instanceof File) && typeof url !== "string")) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    const auth = await authorizeUpload(request, folder);
    if (!auth.ok) return auth.response;
    const limited = rateLimit(`upload:${auth.userId}`, 120, 10 * 60_000);
    if (limited) return limited;

    const saved =
      file instanceof File
        ? await saveLocalUpload(file, folder)
        : await saveLocalUploadFromUrl(String(url), folder);
    if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return serverError("Local upload error", err, "Couldn't save the image.");
  }
}
