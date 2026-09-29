"use client";

import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { optimizedImageUrl } from "@/lib/image";

import { iconButton, inputClass } from "./ui";

export type MediaItem = { url: string; alt: string };
type Folder = "products" | "brands" | "categories" | "site";

type SignResponse = {
  provider: "cloudinary" | "local";
  uploadUrl: string;
  fields: Record<string, string | number>;
};

const MAX_DIMENSION = 2000;

/** Shrinks large photos in the browser before upload (keeps GIFs and small images untouched). */
async function prepareFile(file: File): Promise<Blob> {
  if (file.type === "image/gif" || !("createImageBitmap" in window)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.86),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

async function signUpload(folder: Folder): Promise<SignResponse> {
  const signRes = await fetch(`/api/admin/uploads?folder=${folder}`, { cache: "no-store" });
  const sign = (await signRes.json().catch(() => ({}))) as SignResponse & { error?: string };
  if (!signRes.ok) throw new Error(sign.error || "Uploads aren't available right now.");
  return sign;
}

async function sendUpload(sign: SignResponse, body: FormData, what: string): Promise<string> {
  const res = await fetch(sign.uploadUrl, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || data?.error || `Couldn't upload ${what}.`);
  return sign.provider === "cloudinary" ? data.secure_url : data.url;
}

export async function uploadImage(file: File, folder: Folder): Promise<string> {
  const sign = await signUpload(folder);
  const body = new FormData();
  for (const [k, v] of Object.entries(sign.fields)) body.append(k, String(v));
  const blob = await prepareFile(file);
  body.append(
    "file",
    blob,
    file.name.replace(/\.[^.]+$/, "") + (blob.type === "image/webp" ? ".webp" : ""),
  );
  return sendUpload(sign, body, file.name);
}

/**
 * Copies an image from a web address into our storage (Cloudinary fetches it directly), so the
 * store never depends on another site keeping the picture online.
 */
export async function uploadImageFromUrl(url: string, folder: Folder): Promise<string> {
  const sign = await signUpload(folder);
  const body = new FormData();
  for (const [k, v] of Object.entries(sign.fields)) body.append(k, String(v));
  body.append(sign.provider === "cloudinary" ? "file" : "url", url);
  return sendUpload(sign, body, "that image");
}

function parseImageUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Multiple images with drag & drop upload, reordering (drag or arrow buttons), a main image
 * (always the first) and alt text. With `max={1}` it works as a single-image picker (logos).
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  max = 12,
  label = "Images",
  error,
  altPlaceholder = "Describe the image (for screen readers and Google)",
  withAlt = true,
}: {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  folder: Folder;
  max?: number;
  label?: string;
  error?: string;
  altPlaceholder?: string;
  /** Hide the alt-text field where the form doesn't save it */
  withAlt?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<Array<{ id: string; preview: string }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Latest list, so parallel uploads don't overwrite each other's results
  const latest = useRef(value);
  latest.current = value;

  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");

  const single = max === 1;
  const room = max - value.length - uploading.length;

  const runUploads = async (
    pending: Array<{ id: string; preview: string; upload: () => Promise<string> }>,
  ) => {
    setUploading((u) => [...u, ...pending.map(({ id, preview }) => ({ id, preview }))]);
    await Promise.all(
      pending.map(async ({ id, preview, upload }) => {
        try {
          const url = await upload();
          const next = single
            ? [{ url, alt: latest.current[0]?.alt ?? "" }]
            : [...latest.current, { url, alt: "" }];
          latest.current = next;
          onChange(next);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed.");
        } finally {
          setUploading((u) => u.filter((x) => x.id !== id));
          if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
        }
      }),
    );
  };

  const handleFiles = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return toast.error("Choose image files (JPG, PNG, WebP).");
    const accepted = single ? images.slice(0, 1) : images.slice(0, Math.max(0, room));
    if (!single && accepted.length < images.length)
      toast.info(`Only ${max} images are allowed; extra ones were skipped.`);

    await runUploads(
      accepted.map((file) => ({
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(file),
        upload: () => uploadImage(file, folder),
      })),
    );
  };

  const handleLink = async () => {
    const url = parseImageUrl(link);
    if (!url) return setLinkError("Paste a full image address starting with https://");
    if (!single && room <= 0) return setLinkError(`Only ${max} images are allowed.`);
    if (value.some((m) => m.url === url)) return setLinkError("That image is already added.");
    setLinkError("");
    setLink("");
    await runUploads([
      { id: crypto.randomUUID(), preview: url, upload: () => uploadImageFromUrl(url, folder) },
    ]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          if (dragIndex !== null) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragIndex !== null) return;
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : error
              ? "border-destructive/60"
              : "border-border"
        }`}
      >
        <ImagePlus className="w-7 h-7 mx-auto text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 text-sm">
          Drag {single ? "an image" : "images"} here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!single && room <= 0}
            className="font-semibold text-primary hover:underline disabled:text-muted-foreground"
          >
            choose {single ? "a file" : "files"}
          </button>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPG, PNG or WebP. Large photos are resized automatically.
          {!single && ` Up to ${max} images; the first one is the main image.`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple={!single}
          className="sr-only"
          aria-label={`Upload ${label.toLowerCase()}`}
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="url"
              inputMode="url"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                if (linkError) setLinkError("");
              }}
              onKeyDown={(e) => {
                // Don't submit the surrounding product/brand form
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLink();
                }
              }}
              placeholder="…or paste an image link (https://…)"
              aria-label={`Add ${single ? "image" : "images"} from a link`}
              aria-invalid={Boolean(linkError)}
              disabled={!single && room <= 0}
              className={`${inputClass} pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={handleLink}
            disabled={!link.trim() || (!single && room <= 0)}
            className="shrink-0 h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add from link
          </button>
        </div>
        {linkError ? (
          <p className="text-xs text-destructive mt-1" role="alert">
            {linkError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            The image is copied to our image CDN, so it keeps working even if the original site
            removes it.
          </p>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {(value.length > 0 || uploading.length > 0) && (
        <ul
          className={
            single ? "grid grid-cols-1 max-w-xs gap-3" : "grid grid-cols-2 sm:grid-cols-3 gap-3"
          }
        >
          {value.map((item, i) => (
            <li
              key={item.url}
              draggable={!single}
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                move(dragIndex, i);
                setDragIndex(null);
              }}
              className={`rounded-xl border bg-background overflow-hidden ${
                i === 0 && !single ? "border-primary" : "border-border"
              } ${dragIndex === i ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-square bg-secondary">
                <img
                  src={optimizedImageUrl(item.url, 400)}
                  alt={item.alt || ""}
                  className="w-full h-full object-cover"
                />
                {i === 0 && !single && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                    Main image
                  </span>
                )}
              </div>
              <div className="p-2 space-y-2">
                {withAlt && (
                  <input
                    value={item.alt}
                    onChange={(e) =>
                      onChange(value.map((m, j) => (j === i ? { ...m, alt: e.target.value } : m)))
                    }
                    placeholder={altPlaceholder}
                    aria-label={`Alt text for image ${i + 1}`}
                    maxLength={200}
                    className={`${inputClass} h-8 text-xs`}
                  />
                )}
                <div className="flex items-center justify-between">
                  {!single ? (
                    <div className="flex">
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => move(i, i - 1)}
                        disabled={i === 0}
                        aria-label={`Move image ${i + 1} left`}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => move(i, i + 1)}
                        disabled={i === value.length - 1}
                        aria-label={`Move image ${i + 1} right`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      {i !== 0 && (
                        <button
                          type="button"
                          className={iconButton}
                          onClick={() => move(i, 0)}
                          aria-label={`Make image ${i + 1} the main image`}
                          title="Set as main image"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    className={`${iconButton} text-destructive hover:bg-destructive/10`}
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                    aria-label={`Remove image ${i + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {uploading.map((u) => (
            <li key={u.id} className="rounded-xl border border-border overflow-hidden">
              <div className="relative aspect-square bg-secondary">
                <img src={u.preview} alt="" className="w-full h-full object-cover opacity-50" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" aria-label="Uploading" />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
