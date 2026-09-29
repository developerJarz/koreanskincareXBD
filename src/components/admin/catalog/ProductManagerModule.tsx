"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { optimizedImageUrl } from "@/lib/image";

import { ProductEditor, type AdminBrand, type AdminCategory } from "./ProductEditor";
import {
  api,
  iconButton,
  inputClass,
  primaryButton,
  secondaryButton,
  shortDate,
  Switch,
  taka,
} from "./ui";

type Row = {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  allowBackorders?: boolean;
  images?: string[];
  status: "draft" | "active" | "archived";
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  isTrending?: boolean;
  brand?: { _id: string; name: string } | null;
  category?: { _id: string; name: string } | null;
  subcategory?: { _id: string; name: string } | null;
  vendor?: { storeName: string } | null;
  approvalStatus?: string;
  createdAt: string;
};

type ListResponse = {
  items: Row[];
  total: number;
  page: number;
  totalPages: number;
  statusCounts: Record<string, number>;
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "archived", label: "Archived" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "updated", label: "Recently edited" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "price_asc", label: "Price low–high" },
  { value: "price_desc", label: "Price high–low" },
  { value: "stock_asc", label: "Lowest stock" },
];

function StatusBadge({ row }: { row: Row }) {
  const out = row.status === "active" && row.stock <= 0 && !row.allowBackorders;
  const [label, cls] =
    row.status === "archived"
      ? ["Archived", "bg-secondary text-muted-foreground"]
      : row.status === "draft"
        ? ["Draft", "bg-amber-500/15 text-amber-800 dark:text-amber-300"]
        : row.approvalStatus === "pending"
          ? ["In review", "bg-amber-500/15 text-amber-800 dark:text-amber-300"]
          : out
            ? ["Out of stock", "bg-destructive/10 text-destructive"]
            : ["Published", "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}

export function ProductManagerModule() {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  // Stable, so the editor doesn't reload its product every time this list re-renders
  const closeEditor = useCallback(() => setEditing(null), []);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [flag, setFlag] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Any filter change goes back to page 1
  useEffect(
    () => setPage(1),
    [debouncedQ, status, brand, category, stock, flag, minPrice, maxPrice, sort],
  );

  useEffect(() => {
    Promise.all([
      api<AdminBrand[]>("/api/admin/brands"),
      api<AdminCategory[]>("/api/admin/categories"),
    ])
      .then(([b, c]) => {
        setBrands(b);
        setCategories(c);
      })
      .catch((err) => toast.error(err.message));
  }, []);

  const queryString = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: "20", sort });
    if (debouncedQ) p.set("q", debouncedQ);
    if (status) p.set("status", status);
    if (brand) p.set("brand", brand);
    if (category) p.set("category", category);
    if (stock) p.set("stock", stock);
    if (flag) p.set("flag", flag);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    return p.toString();
  }, [page, sort, debouncedQ, status, brand, category, stock, flag, minPrice, maxPrice]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<ListResponse>(`/api/admin/products?${queryString}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load products.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  // Products that still have no SKU/barcode (e.g. added before codes were automatic)
  const [missingCodes, setMissingCodes] = useState(0);
  const [fillingCodes, setFillingCodes] = useState(false);
  const checkCodes = useCallback(() => {
    api<{ missing: { sku: number; barcode: number } }>("/api/admin/products/codes?want=sku")
      .then((d) => setMissingCodes(Math.max(d.missing.sku, d.missing.barcode)))
      .catch(() => {});
  }, []);
  useEffect(() => {
    checkCodes();
  }, [checkCodes, data]);

  const fillCodes = async () => {
    setFillingCodes(true);
    try {
      const res = await api<{ updated: number; skus: number; barcodes: number }>(
        "/api/admin/products/codes",
        { method: "POST" },
      );
      toast.success(
        `Done — ${res.skus} SKU${res.skus === 1 ? "" : "s"} and ${res.barcodes} barcode${res.barcodes === 1 ? "" : "s"} created.`,
      );
      setMissingCodes(0);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate codes.");
    } finally {
      setFillingCodes(false);
    }
  };

  const patch = async (row: Row, body: Record<string, unknown>, message: string) => {
    try {
      await api(`/api/admin/products/${row._id}`, { method: "PATCH", json: body });
      toast.success(message);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the product.");
    }
  };

  const duplicate = async (row: Row) => {
    try {
      const copy = await api<{ _id: string }>(`/api/admin/products/${row._id}/duplicate`, {
        method: "POST",
      });
      toast.success("Copy created as a draft");
      load();
      setEditing(copy._id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't duplicate the product.");
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete “${row.name}”? This can't be undone.`)) return;
    try {
      const res = await api<{ archived?: boolean; message?: string }>(
        `/api/admin/products/${row._id}`,
        { method: "DELETE" },
      );
      toast.success(res.archived ? res.message! : "Product deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the product.");
    }
  };

  const categoryName = useMemo(() => new Map(categories.map((c) => [c._id, c.name])), [categories]);
  const topCategories = categories.filter((c) => !c.parent);
  const counts = data?.statusCounts ?? {};
  const allCount = (counts.active ?? 0) + (counts.draft ?? 0);
  const anyFilter = Boolean(
    debouncedQ || brand || category || stock || flag || minPrice || maxPrice,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Products</h2>
          <p className="text-sm text-muted-foreground">
            Add, edit and publish what customers see in the shop.
          </p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Add product
        </button>
      </div>

      {missingCodes > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-foreground">
            <strong>{missingCodes}</strong> product{missingCodes === 1 ? " has" : "s have"} no SKU
            or barcode yet. Generate them in one click (existing codes are kept).
          </p>
          <button
            type="button"
            onClick={fillCodes}
            disabled={fillingCodes}
            className={secondaryButton}
          >
            {fillingCodes ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wand2 className="w-4 h-4" aria-hidden="true" />
            )}
            Generate missing codes
          </button>
        </div>
      )}

      <nav aria-label="Product status" className="-mx-1 overflow-x-auto">
        <ul className="flex gap-1 px-1 w-max">
          {STATUS_TABS.map((t) => {
            const n =
              t.value === ""
                ? allCount
                : t.value === "out_of_stock"
                  ? undefined
                  : (counts[t.value] ?? 0);
            const active = status === t.value;
            return (
              <li key={t.value}>
                <button
                  type="button"
                  onClick={() => setStatus(t.value)}
                  aria-current={active ? "true" : undefined}
                  className={`h-9 px-3.5 rounded-full text-sm whitespace-nowrap ${active ? "bg-foreground text-background font-semibold" : "hover:bg-secondary"}`}
                >
                  {t.label}
                  {n !== undefined && (
                    <span
                      className={`ml-1.5 text-xs ${active ? "opacity-70" : "text-muted-foreground"}`}
                    >
                      {n}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-2xl border border-border bg-card p-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <label className="relative lg:col-span-2">
          <span className="sr-only">Search products</span>
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, SKU or tag"
            className={`${inputClass} pl-9`}
          />
        </label>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filter by brand"
          className={inputClass}
        >
          <option value="">All brands</option>
          <option value="none">No brand</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className={inputClass}
        >
          <option value="">All categories</option>
          {topCategories.map((c) => (
            <React.Fragment key={c._id}>
              <option value={c._id}>{c.name}</option>
              {categories
                .filter((s) => s.parent === c._id)
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {"   "}
                    {s.name}
                  </option>
                ))}
            </React.Fragment>
          ))}
        </select>
        <select
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          aria-label="Filter by stock"
          className={inputClass}
        >
          <option value="">Any stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
          className={inputClass}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          aria-label="Filter by shop section"
          className={inputClass}
        >
          <option value="">Any section</option>
          <option value="featured">Featured</option>
          <option value="bestseller">Bestseller</option>
          <option value="new">New arrival</option>
          <option value="sale">On sale</option>
          <option value="trending">Trending</option>
        </select>
        <div className="flex items-center gap-2 lg:col-span-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min ৳"
            aria-label="Minimum price"
            className={inputClass}
          />
          <span aria-hidden="true">–</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max ৳"
            aria-label="Maximum price"
            className={inputClass}
          />
        </div>
        {anyFilter && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setBrand("");
              setCategory("");
              setStock("");
              setFlag("");
              setMinPrice("");
              setMaxPrice("");
            }}
            className="text-sm text-primary font-medium hover:underline justify-self-start self-center"
          >
            Clear filters
          </button>
        )}
      </div>

      <div
        className="relative rounded-2xl border border-border bg-card overflow-x-auto"
        aria-busy={loading}
      >
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3 pl-4 text-left font-medium" colSpan={2}>
                Product
              </th>
              <th className="p-3 text-left font-medium">SKU</th>
              <th className="p-3 text-left font-medium">Brand</th>
              <th className="p-3 text-left font-medium">Category</th>
              <th className="p-3 text-right font-medium">Price</th>
              <th className="p-3 text-right font-medium">Sale price</th>
              <th className="p-3 text-right font-medium">Stock</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-center font-medium">Featured</th>
              <th className="p-3 text-center font-medium">Bestseller</th>
              <th className="p-3 text-left font-medium">Created</th>
              <th className="p-3 pr-4 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-border transition-opacity ${loading ? "opacity-60" : ""}`}
          >
            {data?.items.map((row) => {
              const onSale = Boolean(row.compareAtPrice && row.compareAtPrice > row.price);
              const low = row.stock > 0 && row.stock <= (row.lowStockThreshold ?? 5);
              return (
                <tr key={row._id} className="hover:bg-secondary/40">
                  <td className="p-3 pl-4 w-14">
                    {row.images?.[0] ? (
                      <img
                        src={optimizedImageUrl(row.images[0], 96)}
                        alt=""
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-lg object-cover bg-secondary"
                      />
                    ) : (
                      <span
                        className="block w-11 h-11 rounded-lg bg-secondary"
                        aria-label="No image"
                      />
                    )}
                  </td>
                  <td className="p-3 max-w-72">
                    <button
                      type="button"
                      onClick={() => setEditing(row._id)}
                      className="text-left font-medium hover:text-primary line-clamp-2"
                    >
                      {row.name}
                    </button>
                    {row.vendor?.storeName && (
                      <span className="block text-xs text-muted-foreground">
                        Vendor: {row.vendor.storeName}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                    {row.sku || "—"}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {row.brand?.name ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">
                    <span className="block whitespace-nowrap">
                      {row.category?.name ?? categoryName.get(String(row.category)) ?? "—"}
                    </span>
                    {row.subcategory?.name && (
                      <span className="block text-xs text-muted-foreground">
                        {row.subcategory.name}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums whitespace-nowrap">
                    {taka(onSale ? row.compareAtPrice! : row.price)}
                  </td>
                  <td className="p-3 text-right tabular-nums whitespace-nowrap">
                    {onSale ? (
                      <span className="text-primary font-medium">{taka(row.price)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td
                    className={`p-3 text-right tabular-nums ${row.stock <= 0 ? "text-destructive font-semibold" : low ? "text-amber-700 dark:text-amber-400 font-semibold" : ""}`}
                  >
                    {row.stock}
                  </td>
                  <td className="p-3">
                    <StatusBadge row={row} />
                  </td>
                  <td className="p-3 text-center">
                    <Switch
                      checked={Boolean(row.isFeatured)}
                      onChange={(v) =>
                        patch(
                          row,
                          { isFeatured: v },
                          v ? "Marked as featured" : "Removed from featured",
                        )
                      }
                      label={`Featured: ${row.name}`}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <Switch
                      checked={Boolean(row.isBestseller)}
                      onChange={(v) =>
                        patch(
                          row,
                          { isBestseller: v },
                          v ? "Marked as bestseller" : "Removed from bestsellers",
                        )
                      }
                      label={`Bestseller: ${row.name}`}
                    />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {shortDate(row.createdAt)}
                  </td>
                  <td className="p-3 pr-4">
                    <div className="flex justify-end gap-0.5">
                      {row.status === "active" && (
                        <a
                          href={`/product/${row.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={iconButton}
                          aria-label={`View ${row.name} in the shop`}
                          title="View in shop"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => setEditing(row._id)}
                        aria-label={`Edit ${row.name}`}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => duplicate(row)}
                        aria-label={`Duplicate ${row.name}`}
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {row.status === "active" ? (
                        <button
                          type="button"
                          className={iconButton}
                          onClick={() =>
                            patch(row, { status: "draft" }, "Unpublished — hidden from the shop")
                          }
                          aria-label={`Unpublish ${row.name}`}
                          title="Unpublish"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={iconButton}
                          onClick={() => patch(row, { status: "active" }, "Published")}
                          aria-label={`Publish ${row.name}`}
                          title="Publish"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${iconButton} text-destructive hover:bg-destructive/10`}
                        onClick={() => remove(row)}
                        aria-label={`Delete ${row.name}`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data && data.items.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-medium">
              {anyFilter || status ? "No products match these filters." : "No products yet."}
            </p>
            {!anyFilter && !status && (
              <button
                type="button"
                onClick={() => setEditing("new")}
                className={`${primaryButton} mt-4`}
              >
                <Plus className="w-4 h-4" /> Add your first product
              </button>
            )}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} products
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={secondaryButton}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className={secondaryButton}
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editing && (
        <ProductEditor
          productId={editing === "new" ? null : editing}
          brands={brands}
          categories={categories}
          onClose={closeEditor}
          onSaved={load}
        />
      )}
    </div>
  );
}
