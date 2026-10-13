"use client";

import React, { useEffect, useState } from "react";
import { Boxes, Download, PackagePlus, Search } from "lucide-react";
import { toast } from "sonner";

import { optimizedImageUrl } from "@/lib/image";
import { api, Field, inputClass, Modal, primaryButton, secondaryButton } from "./catalog/ui";
import {
  downloadCsv,
  EmptyState,
  ErrorNotice,
  fmtNumber,
  fmtRelative,
  fmtTaka,
  PageHeader,
  Pagination,
  Panel,
  Pill,
  qs,
  Segmented,
  Skeleton,
  StatTile,
  useAccess,
  useAdminData,
  useDebounced,
} from "./shared";

type Item = {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  barcode?: string;
  images?: string[];
  stock: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorders?: boolean;
  price: number;
  costPrice?: number;
  totalSold?: number;
  status: string;
  brand?: { name: string } | null;
  variants?: { sku: string; stock: number; color?: string; size?: string }[];
  updatedAt: string;
};

type Response = {
  items: Item[];
  total: number;
  totalPages: number;
  summary: {
    products: number;
    units: number;
    retailValue: number;
    costValue: number;
    uncosted: number;
    out: number;
    low: number;
  };
  adjustments: { _id: string; summary: string; actorName: string; createdAt: string }[];
};

const REASONS = [
  ["restock", "New stock received"],
  ["count", "Stock count correction"],
  ["returned", "Customer return"],
  ["damaged", "Damaged / expired"],
  ["lost", "Lost / stolen"],
  ["other", "Other"],
] as const;

function stockState(p: Item) {
  if (p.stock <= 0)
    return {
      label: p.allowBackorders ? "Out · backorders on" : "Out of stock",
      tone: "bad" as const,
    };
  if (p.stock <= (p.lowStockThreshold ?? 5)) return { label: "Low", tone: "warn" as const };
  return { label: "In stock", tone: "good" as const };
}

export function InventoryWarehouseModule() {
  const { can } = useAccess();
  const [stock, setStock] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("stock_asc");
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState<Item | null>(null);
  const q = useDebounced(search);
  useEffect(() => setPage(1), [stock, q, sort]);

  const { data, error, loading, reload } = useAdminData<Response>(
    `/api/admin/inventory${qs({ stock, q, sort, page })}`,
  );
  const s = data?.summary;

  const exportCsv = () =>
    data &&
    downloadCsv("stock.csv", [
      [
        "Product",
        "SKU",
        "Stock",
        "Low-stock level",
        "Price",
        "Cost price",
        "Retail value",
        "Cost value",
        "Sold",
      ],
      ...data.items.map((p) => [
        p.name,
        p.sku,
        p.stock,
        p.lowStockThreshold ?? 5,
        p.price,
        p.costPrice ?? "",
        p.price * Math.max(0, p.stock),
        (p.costPrice ?? 0) * Math.max(0, p.stock),
        p.totalSold ?? 0,
      ]),
    ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock"
        description="Live stock from the product catalogue. Orders take stock out automatically; adjust here for deliveries, counts and damages."
        actions={
          <button
            type="button"
            className={secondaryButton}
            onClick={exportCsv}
            disabled={!data?.items.length}
          >
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />
      {s && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Units in stock"
            value={fmtNumber(s.units)}
            hint={`${fmtNumber(s.products)} products`}
          />
          <StatTile label="Stock value (selling price)" value={fmtTaka(s.retailValue)} />
          <StatTile
            label="Stock value (cost)"
            value={fmtTaka(s.costValue)}
            hint={s.uncosted ? `${s.uncosted} products have no cost price` : "all products costed"}
          />
          <StatTile
            label="Need restocking"
            value={fmtNumber(s.low + s.out)}
            hint={`${s.out} out · ${s.low} low`}
          />
        </div>
      )}

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented
            label="Stock filter"
            value={stock}
            onChange={setStock}
            options={[
              { value: "all", label: "All" },
              { value: "low", label: `Low${s ? ` (${s.low})` : ""}` },
              { value: "out", label: `Out of stock${s ? ` (${s.out})` : ""}` },
              { value: "in", label: "In stock" },
            ]}
          />
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product, SKU or barcode"
              aria-label="Search stock"
              className={`${inputClass} h-9 pl-8`}
            />
          </div>
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`${inputClass} h-9 w-auto`}
          >
            <option value="stock_asc">Lowest stock first</option>
            <option value="stock_desc">Highest stock first</option>
            <option value="sold">Best sellers</option>
            <option value="name">Name</option>
            <option value="updated">Recently changed</option>
          </select>
        </div>

        {error && <ErrorNotice message={error} onRetry={reload} />}
        {!data && !error && <Skeleton className="h-80" />}
        {data && data.items.length === 0 && <EmptyState icon={Boxes} title="No products match." />}
        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table
              className={`w-full min-w-[50rem] text-left text-xs ${loading ? "opacity-60" : ""}`}
            >
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Product</th>
                  <th className="px-3 py-2 text-right font-medium">In stock</th>
                  <th className="px-3 py-2 font-medium">State</th>
                  <th className="px-3 py-2 text-right font-medium">Sold</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="py-2 pl-3 text-right font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((p) => {
                  const st = stockState(p);
                  return (
                    <tr key={p._id} className="align-top hover:bg-secondary/40">
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2.5">
                          {p.images?.[0] && (
                            <img
                              src={optimizedImageUrl(p.images[0], 80)}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-md object-cover"
                              loading="lazy"
                            />
                          )}
                          <span className="min-w-0">
                            <span className="block font-medium text-foreground">{p.name}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {[p.sku, p.brand?.name, p.status !== "active" ? p.status : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                            {p.variants && p.variants.length > 0 && (
                              <span className="block text-[11px] text-muted-foreground">
                                Variants:{" "}
                                {p.variants
                                  .map(
                                    (v) =>
                                      `${[v.color, v.size].filter(Boolean).join("/") || v.sku} ${v.stock}`,
                                  )
                                  .join(", ")}
                              </span>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums">
                        {p.trackInventory === false ? "∞" : p.stock}
                      </td>
                      <td className="px-3 py-2.5">
                        {p.trackInventory === false ? (
                          <Pill>Not tracked</Pill>
                        ) : (
                          <Pill tone={st.tone}>{st.label}</Pill>
                        )}
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          alert at {p.lowStockThreshold ?? 5}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {fmtNumber(p.totalSold ?? 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {fmtTaka(Math.max(0, p.stock) * p.price)}
                        {p.costPrice ? (
                          <span className="block text-[11px] text-muted-foreground">
                            cost {fmtTaka(Math.max(0, p.stock) * p.costPrice)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        {can("inventory.manage") && p.trackInventory !== false && (
                          <button
                            type="button"
                            className={secondaryButton}
                            onClick={() => setAdjusting(p)}
                          >
                            <PackagePlus className="h-3.5 w-3.5" /> Adjust
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            onPage={setPage}
            label="products"
          />
        )}
      </Panel>

      {data && data.adjustments.length > 0 && (
        <Panel title="Recent stock adjustments" description="From the team audit log">
          <ul className="divide-y divide-border text-xs">
            {data.adjustments.map((a) => (
              <li key={a._id} className="flex justify-between gap-3 py-2">
                <span className="text-foreground">{a.summary}</span>
                <span className="shrink-0 text-muted-foreground">
                  {a.actorName} · {fmtRelative(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {adjusting && (
        <AdjustDialog product={adjusting} onClose={() => setAdjusting(null)} onDone={reload} />
      )}
    </div>
  );
}

function AdjustDialog({
  product,
  onClose,
  onDone,
}: {
  product: Item;
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState<string>("restock");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const n = Math.max(0, Math.floor(Number(quantity) || 0));
  const result = mode === "add" ? product.stock + n : mode === "remove" ? product.stock - n : n;

  const save = async () => {
    setSaving(true);
    try {
      await api("/api/admin/inventory", {
        method: "PATCH",
        json: { productId: product._id, mode, quantity: n, reason, note },
      });
      toast.success(`${product.name}: stock is now ${result}.`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update stock.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Adjust stock"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            onClick={save}
            disabled={saving || result < 0 || (mode !== "set" && n === 0)}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <p className="text-sm font-medium">{product.name}</p>
      <p className="text-xs text-muted-foreground">Currently {product.stock} in stock</p>
      <Segmented
        label="Adjustment"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setReason(m === "add" ? "restock" : m === "remove" ? "damaged" : "count");
          setQuantity(m === "set" ? String(product.stock) : "1");
        }}
        options={[
          { value: "add", label: "Add" },
          { value: "remove", label: "Remove" },
          { value: "set", label: "Set exact count" },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={mode === "set" ? "New stock count" : "Units"} htmlFor="adj-q">
          <input
            id="adj-q"
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
            autoFocus
          />
        </Field>
        <Field label="Reason" htmlFor="adj-r">
          <select
            id="adj-r"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
          >
            {REASONS.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Note (optional)" htmlFor="adj-n" hint="e.g. supplier invoice number">
        <input
          id="adj-n"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </Field>
      <p className={`text-sm ${result < 0 ? "text-destructive" : "text-foreground"}`}>
        Stock after: <strong className="tabular-nums">{result}</strong>
      </p>
    </Modal>
  );
}
