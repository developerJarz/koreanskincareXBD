"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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

type Category = {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
  description?: string;
  image?: string;
  isActive: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  productCount: number;
};

type FormState = {
  name: string;
  slug: string;
  parent: string;
  image: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
};

export function CategoryManagerModule({ canManage }: { canManage: boolean }) {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ category: Category | null; parent: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      setCats(await api<Category[]>("/api/admin/categories"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load categories.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tops = useMemo(() => (cats ?? []).filter((c) => !c.parent), [cats]);
  const childrenOf = useCallback(
    (id: string) => (cats ?? []).filter((c) => c.parent === id),
    [cats],
  );

  const toggle = async (c: Category, body: Partial<Category>, message: string) => {
    setCats((list) => list?.map((x) => (x._id === c._id ? { ...x, ...body } : x)) ?? null);
    try {
      await api(`/api/admin/categories/${c._id}`, { method: "PATCH", json: body });
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the category.");
      load();
    }
  };

  const move = async (siblings: Category[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= siblings.length) return;
    const ordered = [...siblings];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const order = new Map(ordered.map((c, i) => [c._id, i]));
    setCats(
      (list) =>
        list
          ?.map((c) => (order.has(c._id) ? { ...c, sortOrder: order.get(c._id) } : c))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) ?? null,
    );
    try {
      await api("/api/admin/categories/reorder", {
        method: "PATCH",
        json: { orderedIds: ordered.map((c) => c._id) },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the order.");
      load();
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete the category “${c.name}”?`)) return;
    try {
      await api(`/api/admin/categories/${c._id}`, { method: "DELETE" });
      toast.success("Category deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the category.");
    }
  };

  const row = (c: Category, siblings: Category[], index: number, isChild: boolean) => {
    const kids = isChild ? [] : childrenOf(c._id);
    const open = expanded.has(c._id);
    return (
      <li key={c._id} className={isChild ? "" : "border-b border-border last:border-b-0"}>
        <div
          className={`flex flex-wrap items-center gap-3 px-3 py-2.5 ${isChild ? "pl-12 bg-secondary/30" : ""}`}
        >
          {!isChild ? (
            <button
              type="button"
              className={iconButton}
              onClick={() =>
                setExpanded((s) => {
                  const n = new Set(s);
                  if (n.has(c._id)) n.delete(c._id);
                  else n.add(c._id);
                  return n;
                })
              }
              aria-expanded={open}
              aria-label={`${open ? "Hide" : "Show"} subcategories of ${c.name}`}
            >
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : null}
          <span className="w-10 h-10 rounded-lg bg-secondary overflow-hidden shrink-0">
            {c.image && (
              <img
                src={optimizedImageUrl(c.image, 96)}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </span>
          <div className="flex-1 min-w-40">
            <p className="font-medium text-sm">
              {c.name}
              {!c.isActive && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(hidden)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              /category/{c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"}
              {!isChild && ` · ${kids.length} subcategor${kids.length === 1 ? "y" : "ies"}`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Active
            <Switch
              checked={c.isActive}
              disabled={!canManage}
              onChange={(v) =>
                toggle(c, { isActive: v }, v ? "Category shown" : "Category hidden from the shop")
              }
              label={`${c.name} active`}
            />
          </label>
          {!isChild && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Homepage
              <Switch
                checked={Boolean(c.isFeatured)}
                disabled={!canManage}
                onChange={(v) =>
                  toggle(
                    c,
                    { isFeatured: v },
                    v ? "Shown on the homepage" : "Removed from the homepage",
                  )
                }
                label={`Show ${c.name} on homepage`}
              />
            </label>
          )}
          <div className="flex items-center gap-0.5">
            {canManage && (
              <>
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => move(siblings, index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${c.name} up`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => move(siblings, index, 1)}
                  disabled={index === siblings.length - 1}
                  aria-label={`Move ${c.name} down`}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </>
            )}
            {c.isActive && (
              <a
                href={`/category/${c.slug}`}
                target="_blank"
                rel="noreferrer"
                className={iconButton}
                aria-label={`View ${c.name} in the shop`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {canManage && (
              <>
                {!isChild && (
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => setEditing({ category: null, parent: c._id })}
                    aria-label={`Add a subcategory to ${c.name}`}
                    title="Add subcategory"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => setEditing({ category: c, parent: c.parent ?? "" })}
                  aria-label={`Edit ${c.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`${iconButton} text-destructive hover:bg-destructive/10`}
                  onClick={() => remove(c)}
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        {open && kids.length > 0 && (
          <ul className="border-t border-border divide-y divide-border">
            {kids.map((k, i) => row(k, kids, i, true))}
          </ul>
        )}
        {open && kids.length === 0 && (
          <p className="pl-12 pb-3 text-xs text-muted-foreground">No subcategories yet.</p>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Categories and their subcategories. Use the arrows to change the order in the shop.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setEditing({ category: null, parent: "" })}
            className={primaryButton}
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Add category
          </button>
        )}
      </div>
      {!cats ? (
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
      ) : tops.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No categories yet. Add one, or run <code>npm run seed</code> for the starter categories.
        </p>
      ) : (
        <ul className="rounded-2xl border border-border bg-card overflow-hidden">
          {tops.map((c, i) => row(c, tops, i, false))}
        </ul>
      )}

      {editing && (
        <CategoryForm
          category={editing.category}
          defaultParent={editing.parent}
          parents={tops.filter((t) => t._id !== editing.category?._id)}
          onClose={() => setEditing(null)}
          onSaved={(parentId) => {
            if (parentId) setExpanded((s) => new Set(s).add(parentId));
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryForm({
  category,
  defaultParent,
  parents,
  onClose,
  onSaved,
}: {
  category: Category | null;
  defaultParent: string;
  parents: Category[];
  onClose: () => void;
  onSaved: (parentId: string) => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    parent: category ? (category.parent ?? "") : defaultParent,
    image: category?.image ?? "",
    description: category?.description ?? "",
    isActive: category?.isActive ?? true,
    isFeatured: Boolean(category?.isFeatured),
    seoTitle: category?.seoTitle ?? "",
    seoDescription: category?.seoDescription ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const parentName = parents.find((p) => p._id === form.parent)?.name;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api(category ? `/api/admin/categories/${category._id}` : "/api/admin/categories", {
        method: category ? "PUT" : "POST",
        json: { ...form, parent: form.parent || null },
      });
      toast.success(category ? "Category saved" : `${form.name} added`);
      onSaved(form.parent);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Couldn't save the category.");
    } finally {
      setSaving(false);
    }
  };

  const title = category
    ? `Edit ${category.name}`
    : form.parent
      ? `Add subcategory${parentName ? ` to ${parentName}` : ""}`
      : "Add category";

  return (
    <Modal
      title={title}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" form="category-form" disabled={saving} className={primaryButton}>
            {saving ? "Saving…" : category ? "Save category" : "Add"}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="c-name" error={errors.name}>
            <input
              id="c-name"
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
            htmlFor="c-slug"
            error={errors.slug}
            hint={`/category/${form.slug || "made-from-the-name"}`}
          >
            <input
              id="c-slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="Leave empty to use the name"
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          label="Parent category"
          htmlFor="c-parent"
          error={errors.parent}
          hint="Choose a parent to make this a subcategory."
        >
          <select
            id="c-parent"
            value={form.parent}
            onChange={(e) => set("parent", e.target.value)}
            className={inputClass}
          >
            <option value="">None (top-level category)</option>
            {parents.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Image" error={errors.image}>
          <ImageUploader
            value={form.image ? [{ url: form.image, alt: form.name }] : []}
            onChange={(items) => set("image", items[0]?.url ?? "")}
            folder="categories"
            max={1}
            label="Image"
            altPlaceholder="Category name"
          />
        </Field>
        <Field label="Description" htmlFor="c-desc" hint="Shown at the top of the category page.">
          <textarea
            id="c-desc"
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
          {!form.parent && (
            <label className="flex items-center gap-2">
              <Switch
                checked={form.isFeatured}
                onChange={(v) => set("isFeatured", v)}
                label="Show on homepage"
              />{" "}
              Show on homepage
            </label>
          )}
        </div>
        <details className="rounded-xl border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">Search engine listing</summary>
          <div className="mt-3 space-y-3">
            <Field label="Page title" htmlFor="c-seo-title">
              <input
                id="c-seo-title"
                maxLength={120}
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Meta description" htmlFor="c-seo-desc">
              <textarea
                id="c-seo-desc"
                rows={2}
                maxLength={320}
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                className={textareaClass}
              />
            </Field>
          </div>
        </details>
      </form>
    </Modal>
  );
}
