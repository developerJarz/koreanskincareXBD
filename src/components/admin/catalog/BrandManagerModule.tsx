"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { optimizedImageUrl } from "@/lib/image";

import { ImageUploader } from "./ImageUploader";
import {
  api,
  ApiError,
  Field,
  iconButton,
  inputClass,
  Modal,
  primaryButton,
  secondaryButton,
  Switch,
  textareaClass,
} from "./ui";

type Brand = {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  showOnHomepage?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  productCount: number;
  liveProductCount: number;
};

type FormState = {
  name: string;
  slug: string;
  logo: string;
  description: string;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  logo: "",
  description: "",
  isActive: true,
  showOnHomepage: false,
  sortOrder: "0",
  seoTitle: "",
  seoDescription: "",
};

export function BrandManagerModule({ canManage }: { canManage: boolean }) {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Brand | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      setBrands(await api<Brand[]>("/api/admin/brands"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load brands.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (brand: Brand, body: Partial<Brand>, message: string) => {
    setBrands((list) => list?.map((b) => (b._id === brand._id ? { ...b, ...body } : b)) ?? null);
    try {
      await api(`/api/admin/brands/${brand._id}`, { method: "PATCH", json: body });
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the brand.");
      load();
    }
  };

  const remove = async (brand: Brand) => {
    if (!confirm(`Delete the brand “${brand.name}”?`)) return;
    try {
      await api(`/api/admin/brands/${brand._id}`, { method: "DELETE" });
      toast.success("Brand deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the brand.");
    }
  };

  const shown = (brands ?? []).filter((b) =>
    b.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Brands</h2>
          <p className="text-sm text-muted-foreground">
            {brands ? `${brands.length} brands. ` : ""}Each brand gets its own page in the shop.
          </p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add brand
          </button>
        )}
      </div>

      <label className="relative block max-w-sm">
        <span className="sr-only">Search brands</span>
        <Search
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brands"
          className={`${inputClass} pl-9`}
        />
      </label>

      {!brands ? (
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
      ) : (
        <div className="relative rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3 pl-4 text-left font-medium" colSpan={2}>
                  Brand
                </th>
                <th className="p-3 text-right font-medium">Products</th>
                <th className="p-3 text-center font-medium">Active</th>
                <th className="p-3 text-center font-medium">Featured</th>
                <th className="p-3 pr-4 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((b) => (
                <tr key={b._id} className="hover:bg-secondary/40">
                  <td className="p-3 pl-4 w-16">
                    <span className="w-11 h-11 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                      {b.logo ? (
                        <img
                          src={optimizedImageUrl(b.logo, 200)}
                          alt=""
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          No logo
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{b.name}</span>
                    <span className="block text-xs text-muted-foreground">/brand/{b.slug}</span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {b.liveProductCount}
                    <span className="block text-xs text-muted-foreground">
                      {b.productCount} incl. drafts
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Switch
                      checked={b.isActive}
                      disabled={!canManage}
                      onChange={(v) =>
                        toggle(
                          b,
                          { isActive: v },
                          v ? "Brand activated" : "Brand hidden from the shop",
                        )
                      }
                      label={`${b.name} active`}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <Switch
                      checked={Boolean(b.showOnHomepage)}
                      disabled={!canManage}
                      onChange={(v) =>
                        toggle(
                          b,
                          { showOnHomepage: v },
                          v ? "Featured on the homepage and menu" : "No longer featured",
                        )
                      }
                      label={`Feature ${b.name} on the homepage and menu`}
                    />
                  </td>
                  <td className="p-3 pr-4">
                    <div className="flex justify-end gap-0.5">
                      {b.isActive && (
                        <a
                          href={`/brand/${b.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={iconButton}
                          aria-label={`View ${b.name} page`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {canManage && (
                        <>
                          <button
                            type="button"
                            className={iconButton}
                            onClick={() => setEditing(b)}
                            aria-label={`Edit ${b.name}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className={`${iconButton} text-destructive hover:bg-destructive/10`}
                            onClick={() => remove(b)}
                            aria-label={`Delete ${b.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {brands.length === 0
                ? "No brands yet. Add your first brand, or run npm run seed for the starter list."
                : "No brands match your search."}
            </p>
          )}
        </div>
      )}

      {editing && (
        <BrandForm
          brand={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function BrandForm({
  brand,
  onClose,
  onSaved,
}: {
  brand: Brand | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    brand
      ? {
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo ?? "",
          description: brand.description ?? "",
          isActive: brand.isActive,
          showOnHomepage: Boolean(brand.showOnHomepage),
          sortOrder: String(brand.sortOrder ?? 0),
          seoTitle: brand.seoTitle ?? "",
          seoDescription: brand.seoDescription ?? "",
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api(brand ? `/api/admin/brands/${brand._id}` : "/api/admin/brands", {
        method: brand ? "PUT" : "POST",
        json: form,
      });
      toast.success(brand ? "Brand saved" : `${form.name} added`);
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Couldn't save the brand.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={brand ? `Edit ${brand.name}` : "Add brand"}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" form="brand-form" disabled={saving} className={primaryButton}>
            {saving ? "Saving…" : brand ? "Save brand" : "Add brand"}
          </button>
        </>
      }
    >
      <form id="brand-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand name" htmlFor="b-name" error={errors.name}>
            <input
              id="b-name"
              required
              autoFocus
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={Boolean(errors.name) || undefined}
              className={inputClass}
            />
          </Field>
          <Field
            label="Page link"
            htmlFor="b-slug"
            error={errors.slug}
            hint={`/brand/${form.slug || "made-from-the-name"}`}
          >
            <input
              id="b-slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="Leave empty to use the name"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Logo" error={errors.logo}>
          <ImageUploader
            value={form.logo ? [{ url: form.logo, alt: form.name }] : []}
            onChange={(items) => set("logo", items[0]?.url ?? "")}
            folder="brands"
            max={1}
            label="Logo"
            altPlaceholder="Brand name"
          />
        </Field>
        <Field label="Description" htmlFor="b-desc">
          <textarea
            id="b-desc"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={textareaClass}
          />
        </Field>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <label className="flex items-center gap-2">
            <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active" />{" "}
            Active (visible in the shop)
          </label>
          <label className="flex items-center gap-2">
            <Switch
              checked={form.showOnHomepage}
              onChange={(v) => set("showOnHomepage", v)}
              label="Featured brand"
            />{" "}
            Featured (homepage and menu)
          </label>
        </div>
        <details className="rounded-xl border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Search engine listing and order
          </summary>
          <div className="mt-3 space-y-3">
            <Field label="Page title" htmlFor="b-seo-title">
              <input
                id="b-seo-title"
                maxLength={120}
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                placeholder={`${form.name || "Brand"} in Bangladesh | KoreanSkincare.bd`}
                className={inputClass}
              />
            </Field>
            <Field label="Meta description" htmlFor="b-seo-desc">
              <textarea
                id="b-seo-desc"
                rows={2}
                maxLength={320}
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field
              label="Display order"
              htmlFor="b-order"
              hint="Lower numbers appear first on the homepage and in the menu."
            >
              <input
                id="b-order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                className={`${inputClass} max-w-32`}
              />
            </Field>
          </div>
        </details>
      </form>
    </Modal>
  );
}
