"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Loader2, Wand2, X } from "lucide-react";
import { toast } from "sonner";

import { ImageUploader, type MediaItem } from "./ImageUploader";
import { SearchableSelect } from "./SearchableSelect";
import {
  api,
  ApiError,
  Card,
  Field,
  inputClass,
  primaryButton,
  secondaryButton,
  Switch,
  taka,
  textareaClass,
} from "./ui";

export type AdminBrand = { _id: string; name: string; slug: string; isActive?: boolean };
export type AdminCategory = {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
  isActive?: boolean;
};

type Status = "draft" | "active" | "archived";

type EditorState = {
  _id?: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  shortDescription: string;
  description: string;
  brand: string;
  category: string;
  subcategory: string;
  tags: string[];
  regularPrice: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  lowStockThreshold: string;
  trackInventory: boolean;
  allowBackorders: boolean;
  status: Status;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  media: MediaItem[];
  ingredients: string;
  howToUse: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  vendor?: string | null;
};

const EMPTY: EditorState = {
  name: "",
  slug: "",
  sku: "",
  barcode: "",
  shortDescription: "",
  description: "",
  brand: "",
  category: "",
  subcategory: "",
  tags: [],
  regularPrice: "",
  salePrice: "",
  costPrice: "",
  stock: "0",
  lowStockThreshold: "5",
  trackInventory: true,
  allowBackorders: false,
  status: "draft",
  isFeatured: false,
  isBestseller: false,
  isNewArrival: true,
  isTrending: false,
  media: [],
  ingredients: "",
  howToUse: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
};

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));

function fromServer(p: any): EditorState {
  return {
    ...EMPTY,
    _id: p._id,
    name: p.name ?? "",
    slug: p.slug ?? "",
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    brand: p.brand ?? "",
    category: p.category ?? "",
    subcategory: p.subcategory ?? "",
    tags: p.tags ?? [],
    regularPrice: str(p.regularPrice),
    salePrice: str(p.salePrice),
    costPrice: str(p.costPrice),
    stock: str(p.stock ?? 0),
    lowStockThreshold: str(p.lowStockThreshold ?? 5),
    trackInventory: p.trackInventory !== false,
    allowBackorders: Boolean(p.allowBackorders),
    status: p.status ?? "draft",
    isFeatured: Boolean(p.isFeatured),
    isBestseller: Boolean(p.isBestseller),
    isNewArrival: Boolean(p.isNewArrival),
    isTrending: Boolean(p.isTrending),
    media: p.media ?? [],
    ingredients: p.ingredients ?? "",
    howToUse: p.howToUse ?? "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    seoKeywords: (p.seoKeywords ?? []).join(", "),
    canonicalUrl: p.canonicalUrl ?? "",
    vendor: p.vendor ?? null,
  };
}

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export function ProductEditor({
  productId,
  brands,
  categories,
  onClose,
  onSaved,
}: {
  productId: string | null;
  brands: AdminBrand[];
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditorState>(EMPTY);
  const [initial, setInitial] = useState<string>(JSON.stringify(EMPTY));
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState<Status | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(productId));
  const [tagDraft, setTagDraft] = useState("");
  const [onSale, setOnSale] = useState(false);

  useEffect(() => {
    if (!productId) {
      setForm(EMPTY);
      setInitial(JSON.stringify(EMPTY));
      return;
    }
    let cancelled = false;
    api<any>(`/api/admin/products/${productId}`)
      .then((p) => {
        if (cancelled) return;
        const state = fromServer(p);
        setForm(state);
        setInitial(JSON.stringify(state));
        setOnSale(Boolean(state.salePrice));
      })
      .catch((err) => {
        toast.error(err.message);
        onClose();
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId, onClose]);

  const dirty = JSON.stringify(form) !== initial;
  const set = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const { [key as string]: _removed, ...rest } = e;
      return rest;
    });
  };

  // The SKU/barcode the server will assign if these fields are left empty (updates with brand
  // and category, e.g. COS-SER-0008)
  const [suggested, setSuggested] = useState<{ sku?: string; barcode?: string }>({});
  const needCodes = !form.sku || !form.barcode;
  useEffect(() => {
    if (!needCodes || loading) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      const q = new URLSearchParams({ brand: form.brand, category: form.category });
      fetch(`/api/admin/products/codes?${q}`, { cache: "no-store", signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setSuggested({ sku: d.sku, barcode: d.barcode }))
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [form.brand, form.category, needCodes, loading]);

  const topCategories = useMemo(() => categories.filter((c) => !c.parent), [categories]);
  const subcategories = useMemo(
    () => categories.filter((c) => c.parent && c.parent === form.category),
    [categories, form.category],
  );

  const regular = Number(form.regularPrice);
  const sale = Number(form.salePrice);
  const discount =
    onSale && regular > 0 && sale > 0 && sale < regular
      ? Math.round(((regular - sale) / regular) * 100)
      : 0;
  const cost = Number(form.costPrice);
  const sellPrice = onSale && sale > 0 ? sale : regular;
  const margin =
    cost > 0 && sellPrice > 0 ? Math.round(((sellPrice - cost) / sellPrice) * 100) : null;

  // What's missing before this product can go live (the server checks the same things)
  const checklist = [
    { ok: form.name.trim().length >= 2, label: "Product name" },
    { ok: Boolean(form.category), label: "Category" },
    { ok: regular > 0, label: "Price" },
    { ok: form.media.length > 0, label: "At least one image" },
    { ok: !onSale || (sale > 0 && sale < regular), label: "Sale price below regular price" },
  ];
  const ready = checklist.every((c) => c.ok);

  const addTag = (raw: string) => {
    const tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!tags.length) return;
    const next = [...form.tags];
    for (const t of tags)
      if (!next.some((x) => x.toLowerCase() === t.toLowerCase()) && next.length < 20)
        next.push(t.slice(0, 40));
    set("tags", next);
    setTagDraft("");
  };

  const close = () => {
    if (dirty && !confirm("Discard your unsaved changes?")) return;
    onClose();
  };

  const save = async (status: Status) => {
    if (status === "active" && !ready) {
      toast.error("Complete the checklist before publishing.");
      return;
    }
    setSaving(status);
    setErrors({});
    const payload = {
      ...form,
      status,
      salePrice: onSale ? form.salePrice : "",
      seoKeywords: form.seoKeywords,
      subcategory: form.subcategory || null,
      brand: form.brand || null,
    };
    try {
      const saved = await api<any>(
        form._id ? `/api/admin/products/${form._id}` : "/api/admin/products",
        {
          method: form._id ? "PUT" : "POST",
          json: payload,
        },
      );
      toast.success(
        status === "active"
          ? `“${form.name}” is live in the shop`
          : status === "archived"
            ? "Product archived"
            : "Saved as draft",
      );
      onSaved();
      if (status === "active") {
        setInitial(JSON.stringify(form));
        onClose();
        return;
      }
      // Stay in the editor with exactly what the server stored (slug, cleaned values…)
      const state = fromServer(saved);
      setForm(state);
      setInitial(JSON.stringify(state));
      setOnSale(Boolean(state.salePrice));
      setSlugTouched(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Couldn't save the product.");
    } finally {
      setSaving(null);
    }
  };

  const isNew = !form._id;
  const published = form.status === "active";

  return (
    <div
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? "Add product" : "Edit product"}
    >
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary"
            aria-label="Back to products"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold font-sans tracking-normal truncate">
              {isNew ? "Add product" : form.name || "Edit product"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {published ? "Published" : form.status === "archived" ? "Archived" : "Draft"}
              {dirty && " · Unsaved changes"}
            </p>
          </div>
          {!isNew && published && form.slug && (
            <a
              href={`/product/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className={`${secondaryButton} hidden sm:inline-flex`}
            >
              View <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
          {published ? (
            <>
              <button
                type="button"
                onClick={() => save("draft")}
                disabled={Boolean(saving)}
                className={`${secondaryButton} hidden sm:inline-flex`}
              >
                Unpublish
              </button>
              <button
                type="button"
                onClick={() => save("active")}
                disabled={Boolean(saving) || !ready}
                className={primaryButton}
              >
                {saving === "active" && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => save("draft")}
                disabled={Boolean(saving) || form.name.trim().length < 2 || !form.category}
                className={secondaryButton}
              >
                {saving === "draft" && <Loader2 className="w-4 h-4 animate-spin" />}
                Save draft
              </button>
              <button
                type="button"
                onClick={() => save("active")}
                disabled={Boolean(saving) || !ready}
                title={ready ? undefined : "Complete the checklist to publish"}
                className={primaryButton}
              >
                {saving === "active" && <Loader2 className="w-4 h-4 animate-spin" />}
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="max-w-7xl mx-auto p-6">
          <div className="h-96 rounded-2xl bg-card border border-border animate-pulse" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
          {/* Main column */}
          <div className="space-y-5 min-w-0">
            {form.vendor && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                This product belongs to a marketplace vendor. Changes you make here are saved
                directly.
              </p>
            )}
            <Card title="Product">
              <Field label="Product name" htmlFor="p-name" error={errors.name}>
                <input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", toSlug(e.target.value));
                  }}
                  placeholder="e.g. COSRX Advanced Snail 96 Mucin Power Essence 100ml"
                  aria-invalid={Boolean(errors.name) || undefined}
                  className={inputClass}
                  autoFocus={isNew}
                />
              </Field>
              <Field
                label="Short description"
                htmlFor="p-short"
                hint="One or two sentences shown near the price."
              >
                <textarea
                  id="p-short"
                  rows={2}
                  maxLength={500}
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  className={textareaClass}
                />
              </Field>
              <Field
                label="Full description"
                htmlFor="p-desc"
                hint="Leave a blank line between paragraphs."
              >
                <textarea
                  id="p-desc"
                  rows={8}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={textareaClass}
                />
              </Field>
            </Card>

            <Card
              title="Images"
              description="Drag to reorder. The first image is the main image in the shop."
            >
              <ImageUploader
                value={form.media}
                onChange={(m) => set("media", m)}
                folder="products"
                error={errors.media}
              />
            </Card>

            <Card title="Pricing">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Regular price (৳)" htmlFor="p-price" error={errors.regularPrice}>
                  <input
                    id="p-price"
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    value={form.regularPrice}
                    onChange={(e) => set("regularPrice", e.target.value)}
                    aria-invalid={Boolean(errors.regularPrice) || undefined}
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Cost price (৳)"
                  htmlFor="p-cost"
                  hint={
                    margin !== null
                      ? `Margin ${margin}% (never shown to customers)`
                      : "Admin only, never shown to customers."
                  }
                >
                  <input
                    id="p-cost"
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    value={form.costPrice}
                    onChange={(e) => set("costPrice", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={onSale}
                  onChange={(v) => {
                    setOnSale(v);
                    if (!v) set("salePrice", "");
                  }}
                  label="On sale"
                />
                On sale
              </label>
              {onSale && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Sale price (৳)" htmlFor="p-sale" error={errors.salePrice}>
                    <input
                      id="p-sale"
                      type="number"
                      min={0}
                      step="1"
                      inputMode="numeric"
                      value={form.salePrice}
                      onChange={(e) => set("salePrice", e.target.value)}
                      aria-invalid={Boolean(errors.salePrice) || undefined}
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Discount (%)"
                    htmlFor="p-discount"
                    hint="Type a % to calculate the sale price."
                  >
                    <input
                      id="p-discount"
                      type="number"
                      min={1}
                      max={90}
                      value={discount || ""}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        if (regular > 0 && pct > 0 && pct < 100)
                          set("salePrice", String(Math.round(regular * (1 - pct / 100))));
                      }}
                      disabled={!(regular > 0)}
                      className={inputClass}
                    />
                  </Field>
                  <div className="self-end pb-2 text-sm">
                    {discount > 0 && (
                      <span>
                        Customers pay <strong>{taka(sale)}</strong>{" "}
                        <span className="line-through text-muted-foreground">{taka(regular)}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card
              title="Inventory"
              description="SKU and barcode are created automatically when you save. Type your own to override."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="SKU (stock code)"
                  htmlFor="p-sku"
                  error={errors.sku}
                  hint={
                    form.sku
                      ? "Must be unique."
                      : suggested.sku
                        ? `Will be ${suggested.sku} — based on brand and category.`
                        : "Created automatically when you save."
                  }
                >
                  <div className="flex gap-2">
                    <input
                      id="p-sku"
                      value={form.sku}
                      onChange={(e) => set("sku", e.target.value.toUpperCase().replace(/\s/g, "-"))}
                      placeholder={suggested.sku ? `Auto: ${suggested.sku}` : "Automatic"}
                      aria-invalid={Boolean(errors.sku) || undefined}
                      className={`${inputClass} font-mono`}
                    />
                    <button
                      type="button"
                      className={`${secondaryButton} h-10 shrink-0`}
                      disabled={!suggested.sku}
                      onClick={() => suggested.sku && set("sku", suggested.sku)}
                      title="Fill in the next free SKU for this brand and category"
                    >
                      <Wand2 className="w-4 h-4" aria-hidden="true" /> Generate
                    </button>
                  </div>
                </Field>
                <Field
                  label="Barcode (EAN-13)"
                  htmlFor="p-barcode"
                  error={errors.barcode}
                  hint={
                    form.barcode
                      ? "Scan the product's own barcode, or keep the generated one."
                      : "Created automatically — or scan the barcode on the box."
                  }
                >
                  <div className="flex gap-2">
                    <input
                      id="p-barcode"
                      value={form.barcode}
                      inputMode="numeric"
                      onChange={(e) =>
                        set("barcode", e.target.value.replace(/\D/g, "").slice(0, 14))
                      }
                      placeholder={suggested.barcode ? `Auto: ${suggested.barcode}` : "Automatic"}
                      aria-invalid={Boolean(errors.barcode) || undefined}
                      className={`${inputClass} font-mono`}
                    />
                    <button
                      type="button"
                      className={`${secondaryButton} h-10 shrink-0`}
                      disabled={!suggested.barcode}
                      onClick={() => suggested.barcode && set("barcode", suggested.barcode)}
                      title="Fill in a new in-store barcode"
                    >
                      <Wand2 className="w-4 h-4" aria-hidden="true" /> Generate
                    </button>
                  </div>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {cost > 0 && (
                  <div className="sm:col-span-3 -mb-1 text-xs text-muted-foreground">
                    Stock value at cost:{" "}
                    <strong className="text-foreground">
                      {taka(cost * (Number(form.stock) || 0))}
                    </strong>
                  </div>
                )}
                <Field label="Stock quantity" htmlFor="p-stock" error={errors.stock}>
                  <input
                    id="p-stock"
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Low-stock alert at" htmlFor="p-low">
                  <input
                    id="p-low"
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    value={form.lowStockThreshold}
                    onChange={(e) => set("lowStockThreshold", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={form.trackInventory}
                    onChange={(v) => set("trackInventory", v)}
                    label="Track stock"
                  />
                  Track stock
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={form.allowBackorders}
                    onChange={(v) => set("allowBackorders", v)}
                    label="Allow orders when out of stock"
                  />
                  Allow orders when out of stock
                </label>
              </div>
            </Card>

            <Card title="Product details" description="Shown on the product page when filled in.">
              <Field label="Ingredients" htmlFor="p-ingredients">
                <textarea
                  id="p-ingredients"
                  rows={4}
                  value={form.ingredients}
                  onChange={(e) => set("ingredients", e.target.value)}
                  className={textareaClass}
                />
              </Field>
              <Field label="How to use" htmlFor="p-howto">
                <textarea
                  id="p-howto"
                  rows={4}
                  value={form.howToUse}
                  onChange={(e) => set("howToUse", e.target.value)}
                  className={textareaClass}
                />
              </Field>
            </Card>

            <Card
              title="Search engine listing"
              description="Optional. Filled from the product name and description when left empty."
            >
              <Field
                label="URL"
                htmlFor="p-slug"
                error={errors.slug}
                hint={`koreanskincare.bd/product/${form.slug || "…"}`}
              >
                <input
                  id="p-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", toSlug(e.target.value));
                  }}
                  aria-invalid={Boolean(errors.slug) || undefined}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Page title"
                htmlFor="p-seo-title"
                hint={`${form.seoTitle.length}/60 characters recommended`}
              >
                <input
                  id="p-seo-title"
                  maxLength={120}
                  value={form.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  placeholder={form.name ? `${form.name} | KoreanSkincare.bd` : ""}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Meta description"
                htmlFor="p-seo-desc"
                hint={`${form.seoDescription.length}/160 characters recommended`}
              >
                <textarea
                  id="p-seo-desc"
                  rows={3}
                  maxLength={320}
                  value={form.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  className={textareaClass}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Keywords" htmlFor="p-seo-kw" hint="Comma separated">
                  <input
                    id="p-seo-kw"
                    value={form.seoKeywords}
                    onChange={(e) => set("seoKeywords", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Canonical URL"
                  htmlFor="p-canonical"
                  error={errors.canonicalUrl}
                  hint="Only if this product's main page is elsewhere"
                >
                  <input
                    id="p-canonical"
                    value={form.canonicalUrl}
                    onChange={(e) => set("canonicalUrl", e.target.value)}
                    placeholder="https://"
                    className={inputClass}
                  />
                </Field>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-20">
            <Card title="Status">
              <fieldset className="space-y-1.5 text-sm">
                <legend className="sr-only">Status</legend>
                {(
                  [
                    ["draft", "Draft", "Hidden from the shop"],
                    ["active", "Published", "Visible in the shop"],
                    ["archived", "Archived", "Hidden everywhere, kept for records"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label
                    key={value}
                    className="flex items-start gap-2 rounded-lg p-2 hover:bg-secondary cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={form.status === value}
                      onChange={() => set("status", value)}
                      className="mt-1 accent-[var(--primary)]"
                    />
                    <span>
                      <span className="font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">{hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {form.status !== (JSON.parse(initial).status as Status) && (
                <button
                  type="button"
                  onClick={() => save(form.status)}
                  disabled={Boolean(saving) || (form.status === "active" && !ready)}
                  className={`${primaryButton} w-full`}
                >
                  Save as {form.status === "active" ? "published" : form.status}
                </button>
              )}
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-xs font-semibold mb-1.5">
                  {ready ? "Ready to publish" : "Needed to publish"}
                </p>
                <ul className="space-y-1 text-xs">
                  {checklist.map((c) => (
                    <li
                      key={c.label}
                      className={`flex items-center gap-1.5 ${c.ok ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}
                    >
                      {c.ok ? (
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span className="sr-only">{c.ok ? "Done:" : "Missing:"}</span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card title="Organisation">
              <Field label="Brand" htmlFor="p-brand" error={errors.brand}>
                <SearchableSelect
                  id="p-brand"
                  value={form.brand}
                  onChange={(v) => set("brand", v)}
                  options={brands.map((b) => ({
                    value: b._id,
                    label: b.name,
                    hint: b.isActive === false ? "inactive" : undefined,
                  }))}
                  placeholder="Search brands…"
                  emptyText="No brand with that name. Add it under Brands."
                  invalid={Boolean(errors.brand)}
                />
              </Field>
              <Field label="Category" htmlFor="p-category" error={errors.category}>
                <select
                  id="p-category"
                  value={form.category}
                  onChange={(e) => {
                    set("category", e.target.value);
                    set("subcategory", "");
                  }}
                  aria-invalid={Boolean(errors.category) || undefined}
                  className={inputClass}
                >
                  <option value="">Choose a category</option>
                  {topCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {c.isActive === false ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Subcategory"
                htmlFor="p-subcategory"
                error={errors.subcategory}
                hint={
                  form.category && subcategories.length === 0
                    ? "This category has no subcategories."
                    : undefined
                }
              >
                <select
                  id="p-subcategory"
                  value={form.subcategory}
                  onChange={(e) => set("subcategory", e.target.value)}
                  disabled={!form.category || subcategories.length === 0}
                  className={inputClass}
                >
                  <option value="">{form.category ? "None" : "Choose a category first"}</option>
                  {subcategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Tags"
                htmlFor="p-tags"
                hint="Press Enter or comma to add. Tags help search."
              >
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring/40">
                  {form.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "tags",
                            form.tags.filter((x) => x !== t),
                          )
                        }
                        aria-label={`Remove tag ${t}`}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="p-tags"
                    value={tagDraft}
                    onChange={(e) =>
                      e.target.value.endsWith(",")
                        ? addTag(e.target.value)
                        : setTagDraft(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagDraft);
                      } else if (e.key === "Backspace" && !tagDraft && form.tags.length) {
                        set("tags", form.tags.slice(0, -1));
                      }
                    }}
                    onBlur={() => addTag(tagDraft)}
                    placeholder={form.tags.length ? "" : "e.g. snail, hydrating"}
                    className="flex-1 min-w-24 h-7 bg-transparent text-sm focus:outline-none px-1"
                  />
                </div>
              </Field>
            </Card>

            <Card title="Show in shop sections">
              <div className="space-y-2.5 text-sm">
                {(
                  [
                    ["isFeatured", "Featured"],
                    ["isBestseller", "Bestseller"],
                    ["isNewArrival", "New arrival"],
                    ["isTrending", "Trending"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-2">
                    {label}
                    <Switch checked={form[key]} onChange={(v) => set(key, v)} label={label} />
                  </label>
                ))}
                <label className="flex items-center justify-between gap-2">
                  <span>
                    On sale
                    <span className="block text-xs text-muted-foreground">
                      Set by the sale price
                    </span>
                  </span>
                  <Switch
                    checked={onSale}
                    onChange={(v) => {
                      setOnSale(v);
                      if (!v) set("salePrice", "");
                    }}
                    label="On sale"
                  />
                </label>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
