"use client";

import React, { useState } from "react";
import { Check, Copy, ExternalLink, Image as ImageIcon, Search } from "lucide-react";
import { toast } from "sonner";

import { optimizedImageUrl } from "@/lib/image";
import { inputClass } from "./catalog/ui";
import {
  EmptyState,
  ErrorNotice,
  fmtNumber,
  PageHeader,
  Panel,
  Pill,
  qs,
  Segmented,
  Skeleton,
  StatTile,
  useAdminData,
  useDebounced,
} from "./shared";

type Asset = {
  url: string;
  folder: string;
  alt?: string;
  usedBy: { label: string; kind: string }[];
};
type Data = {
  counts: {
    all: number;
    products: number;
    brands: number;
    categories: number;
    site: number;
    cloudinary: number;
    missingAlt: number;
  };
  items: Asset[];
  truncated: boolean;
};

/** Every image the shop uses, read from products, brands, categories and the website design. */
export function MediaLibraryModule() {
  const [folder, setFolder] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, error, loading, reload } = useAdminData<Data>(
    `/api/admin/media${qs({ folder, q })}`,
  );
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("Image link copied.");
    setTimeout(() => setCopied(null), 1500);
  };

  const c = data?.counts;
  return (
    <div className="space-y-5">
      <PageHeader
        title="Media"
        description="Images in use across the shop. Upload new images from the product, brand, category or website design editors."
      />
      {c && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Images in use" value={fmtNumber(c.all)} />
          <StatTile
            label="On Cloudinary CDN"
            value={fmtNumber(c.cloudinary)}
            hint={`${fmtNumber(c.all - c.cloudinary)} stored elsewhere`}
          />
          <StatTile
            label="Product images"
            value={fmtNumber(c.products)}
            hint={
              c.missingAlt ? `${c.missingAlt} without a description (alt text)` : "all described"
            }
          />
          <StatTile
            label="Brand, category & site"
            value={fmtNumber(c.brands + c.categories + c.site)}
          />
        </div>
      )}
      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented
            label="Folder"
            value={folder}
            onChange={setFolder}
            options={[
              { value: "", label: "All" },
              { value: "products", label: "Products" },
              { value: "brands", label: "Brands" },
              { value: "categories", label: "Categories" },
              { value: "site", label: "Website" },
            ]}
          />
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product name or file name"
              aria-label="Search images"
              className={`${inputClass} h-9 pl-8`}
            />
          </div>
        </div>
        {error && <ErrorNotice message={error} onRetry={reload} />}
        {!data && !error && <Skeleton className="h-80" />}
        {data && data.items.length === 0 && (
          <EmptyState icon={ImageIcon} title="No images match." />
        )}
        {data && data.items.length > 0 && (
          <ul
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 ${loading ? "opacity-60" : ""}`}
          >
            {data.items.map((a) => (
              <li
                key={a.url}
                className="group overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="relative aspect-square bg-secondary">
                  <img
                    src={optimizedImageUrl(a.url, 320)}
                    alt={a.alt ?? ""}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => copy(a.url)}
                      className="rounded-md bg-card/90 p-1.5 shadow"
                      aria-label="Copy image link"
                    >
                      {copied === a.url ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-card/90 p-1.5 shadow"
                      aria-label="Open image"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <div className="space-y-1 p-2 text-[11px]">
                  <Pill>{a.folder}</Pill>
                  <p
                    className="line-clamp-2 text-foreground"
                    title={a.usedBy.map((u) => u.label).join(", ")}
                  >
                    {a.usedBy[0]?.label}
                    {a.usedBy.length > 1 && (
                      <span className="text-muted-foreground"> +{a.usedBy.length - 1} more</span>
                    )}
                  </p>
                  {a.folder === "products" && !a.alt && (
                    <p className="text-amber-700 dark:text-amber-400">No description</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {data?.truncated && (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing the first 600 — search to narrow down.
          </p>
        )}
      </Panel>
    </div>
  );
}
