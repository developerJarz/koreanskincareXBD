import crypto from "crypto";
import dns from "dns/promises";
import fs from "fs/promises";
import net from "net";
import path from "path";
import sharp from "sharp";

/**
 * Image storage.
 *  - Cloudinary (preferred, and required on Vercel): the browser uploads straight to Cloudinary
 *    with a short-lived signature from our server, so the API secret never reaches the browser
 *    and large photos don't pass through our server.
 *  - Local disk (development / self-hosted only): images are resized, converted to WebP and saved
 *    under ./uploads, then served by app/uploads/[...path]/route.ts.
 */

// "site" = logo, favicon and homepage banners (Website design)
export const UPLOAD_FOLDERS = ["products", "brands", "categories", "site"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

/** Local storage is allowed in development, or in production only when explicitly enabled. */
export function isLocalUploadAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.UPLOAD_STORAGE === "local";
}

export const CLOUDINARY_ROOT_FOLDER = "koreanskincare";

export function signCloudinaryUpload(folder: UploadFolder) {
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = {
    // Raster images only (no SVG/PDF), and never store anything larger than 2000px — uploads
    // "from a link" skip the browser-side resize, so Cloudinary shrinks them on the way in
    allowed_formats: "jpg,jpeg,png,webp,avif,gif",
    folder: `${CLOUDINARY_ROOT_FOLDER}/${folder}`,
    timestamp,
    transformation: "c_limit,w_2000,h_2000",
  };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = crypto
    .createHash("sha1")
    .update(toSign + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    fields: { ...params, api_key: process.env.CLOUDINARY_API_KEY!, signature },
  };
}

export type LocalUploadResult = { url: string; width: number; height: number } | { error: string };

export async function saveLocalUpload(
  file: File,
  folder: UploadFolder,
): Promise<LocalUploadResult> {
  if (!ALLOWED_TYPES.has(file.type))
    return { error: "Upload a JPG, PNG, WebP, AVIF or GIF image." };
  if (file.size > MAX_BYTES) return { error: "Images must be 8 MB or smaller." };
  return saveLocalImage(Buffer.from(await file.arrayBuffer()), folder);
}

function isPrivateAddress(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80")
  );
}

/**
 * Local storage for "add from link". (With Cloudinary, Cloudinary downloads the link itself and
 * this never runs.) Only public http(s) addresses are fetched, so the link can't be used to
 * reach services on our own network.
 */
export async function saveLocalUploadFromUrl(
  value: string,
  folder: UploadFolder,
): Promise<LocalUploadResult> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: "That isn't a valid link." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    return { error: "Use a link that starts with https://" };

  try {
    const addresses = await dns.lookup(url.hostname, { all: true });
    if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address)))
      return { error: "That link can't be used." };
  } catch {
    return { error: "Couldn't reach that website." };
  }

  let res: Response;
  try {
    // Redirects are refused so a public link can't bounce us to a private address
    res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15_000) });
  } catch {
    return { error: "Couldn't download that image." };
  }
  if (!res.ok || !res.body) return { error: "Couldn't download that image." };
  if (!ALLOWED_TYPES.has((res.headers.get("content-type") ?? "").split(";")[0].trim()))
    return { error: "That link isn't a JPG, PNG, WebP, AVIF or GIF image." };
  if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES)
    return { error: "Images must be 8 MB or smaller." };

  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    size += chunk.byteLength;
    if (size > MAX_BYTES) return { error: "Images must be 8 MB or smaller." };
    chunks.push(chunk);
  }
  return saveLocalImage(Buffer.concat(chunks), folder);
}

async function saveLocalImage(input: Buffer, folder: UploadFolder): Promise<LocalUploadResult> {
  let output: Buffer;
  let info: sharp.OutputInfo;
  try {
    // Re-encoding also strips anything that isn't pixel data (e.g. embedded scripts, EXIF/GPS)
    ({ data: output, info } = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true }));
  } catch {
    return { error: "That file isn't a readable image." };
  }

  const now = new Date();
  const rel = path.posix.join(
    folder,
    `${now.getFullYear()}`,
    `${String(now.getMonth() + 1).padStart(2, "0")}`,
    `${crypto.randomBytes(12).toString("hex")}.webp`,
  );
  const abs = path.join(LOCAL_UPLOAD_DIR, ...rel.split("/"));
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, output);
  return { url: `/uploads/${rel}`, width: info.width, height: info.height };
}
