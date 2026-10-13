"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { optimizedImageUrl } from "@/lib/image";
import {
  AUTO_SOURCE_LABELS,
  HOME_SECTIONS,
  PRODUCT_ROW_SECTIONS,
  PRODUCT_SORTS,
  sectionLimits,
  type HomeSection,
  type ProductSort,
} from "@/lib/storefront";
import { api, iconButton, inputClass, primaryButton, secondaryButton } from "../catalog/ui";
import { useAccess, useDebounced } from "../shared";

type Item = { id: string; name: string; image: string; meta: string; href: string };
type Kind = "product" | "category" | "brand";

/** Product flag that an automatic row reads (On sale comes from prices, so it has none). */
const FLAG: Partial<Record<HomeSection["id"], string>> = {
  bestsellers: "isBestseller",
  newArrivals: "isNewArrival",
  featured: "isFeatured",
  trending: "isTrending",
};

function kindOf(id: HomeSection["id"]): Kind {
  return id === "categories" ? "category" : id === "brands" ? "brand" : "product";
}

const NOUN: Record<Kind, [string, string]> = {
  product: ["product", "products"],
  category: ["category", "categories"],
  brand: ["brand", "brands"],
};

/**
 * Edit what one homepage section shows: heading, subtitle, automatic vs hand-picked items,
 * order and count — with a live preview built by the same code as the homepage.
 * Section settings are saved with "Save & publish"; adding or removing a product from an
 * automatic section changes the product's flag and is saved straight away.
 */
export function SectionContentEditor({
  section,
  canEdit,
  onChange,
  onClose,
}: {
  section: HomeSection;
  canEdit: boolean;
  onChange: (patch: Partial<HomeSection>) => void;
  onClose: () => void;
}) {
  const { can } = useAccess();
  const kind = kindOf(section.id);
  const [one, many] = NOUN[kind];
  const limits = sectionLimits(section.id);
  const isProductRow = PRODUCT_ROW_SECTIONS.includes(section.id);
  // Who may change the flags behind automatic sections
  const canEditFlags =
    kind === "product"
      ? can("catalog.manage") && Boolean(FLAG[section.id])
      : can("catalog.structure");

  const [preview, setPreview] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  const [adding, setAdding] = useState(false);

  // Preview the current (unsaved) settings
  const key = JSON.stringify({
    s: section.source,
    o: section.sort,
    l: section.limit,
    i: section.itemIds,
    version,
  });
  const debouncedKey = useDebounced(key, 250);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<{ items: Item[] }>("/api/admin/storefront/section-preview", {
      method: "POST",
      json: { section },
    })
      .then((r) => alive && setPreview(r.items))
      .catch(
        (err) =>
          alive && toast.error(err instanceof Error ? err.message : "Couldn't load the preview."),
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !adding && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, adding]);

  const previewById = useMemo(() => new Map((preview ?? []).map((i) => [i.id, i])), [preview]);

  // Automatic sections: add / remove by switching the flag on the product, category or brand
  const setFlag = async (item: { id: string; name: string }, on: boolean) => {
    try {
      if (kind === "product") {
        await api(`/api/admin/products/${item.id}`, {
          method: "PATCH",
          json: { [FLAG[section.id]!]: on },
        });
      } else if (kind === "category") {
        await api(`/api/admin/categories/${item.id}`, {
          method: "PATCH",
          json: { isFeatured: on },
        });
      } else {
        await api(`/api/admin/brands/${item.id}`, {
          method: "PATCH",
          json: { showOnHomepage: on },
        });
      }
      toast.success(
        `${item.name} ${on ? "added to" : "removed from"} ${section.title || HOME_SECTIONS[section.id]} — saved.`,
      );
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update.");
    }
  };

  const moveManual = (from: number, to: number) => {
    if (to < 0 || to >= section.itemIds.length) return;
    const next = [...section.itemIds];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange({ itemIds: next });
  };

  const pick = (item: { id: string; name: string }) => {
    if (section.source === "manual") {
      if (section.itemIds.includes(item.id)) {
        toast.info(`${item.name} is already in this section.`);
        return;
      }
      onChange({ itemIds: [...section.itemIds, item.id] });
    } else {
      setFlag(item, true);
    }
  };

  const shownCount = preview?.length ?? 0;
  const autoLabel = AUTO_SOURCE_LABELS[section.id] ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${HOME_SECTIONS[section.id]}`}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-5xl flex-col overflow-hidden bg-card sm:rounded-2xl sm:border sm:border-border"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <div className="mr-auto">
            <h2 className="font-serif text-xl">{HOME_SECTIONS[section.id]}</h2>
            <p className="text-xs text-muted-foreground">
              Section settings are saved with <strong>Save & publish</strong>. Adding or removing in
              an automatic section is saved immediately.
            </p>
          </div>
          <button type="button" className={primaryButton} onClick={onClose}>
            Done
          </button>
          <button type="button" className={iconButton} onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* Settings */}
          <div className="space-y-4 overflow-y-auto border-b border-border p-5 lg:border-b-0 lg:border-r">
            <label className="block text-xs font-medium">
              Heading
              <input
                className={`${inputClass} mt-1`}
                value={section.title}
                maxLength={60}
                disabled={!canEdit}
                onChange={(e) => onChange({ title: e.target.value })}
              />
            </label>
            <label className="block text-xs font-medium">
              Line under the heading{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
              <input
                className={`${inputClass} mt-1`}
                value={section.subtitle}
                maxLength={160}
                disabled={!canEdit}
                placeholder="e.g. Loved by 10,000+ customers"
                onChange={(e) => onChange({ subtitle: e.target.value })}
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium">What it shows</legend>
              {(
                [
                  ["auto", "Automatic", autoLabel],
                  ["manual", "Hand-picked", `You choose exactly which ${many} and their order`],
                ] as const
              ).map(([value, title, hint]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs ${
                    section.source === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="section-source"
                    className="mt-0.5"
                    checked={section.source === value}
                    disabled={!canEdit}
                    onChange={() =>
                      onChange(
                        value === "manual" && section.itemIds.length === 0 && preview?.length
                          ? // Start the hand-picked list from what is showing now
                            { source: "manual", itemIds: preview.map((p) => p.id) }
                          : { source: value },
                      )
                    }
                  />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {isProductRow && section.source === "auto" && (
              <label className="block text-xs font-medium">
                Order
                <select
                  className={`${inputClass} mt-1`}
                  value={section.sort}
                  disabled={!canEdit}
                  onChange={(e) => onChange({ sort: e.target.value as ProductSort })}
                >
                  {Object.entries(PRODUCT_SORTS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-xs font-medium">
              How many to show{" "}
              <span className="font-normal text-muted-foreground">
                ({limits.min}–{limits.max})
              </span>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="range"
                  min={limits.min}
                  max={limits.max}
                  step={kind === "product" ? 4 : 1}
                  value={section.limit}
                  disabled={!canEdit}
                  onChange={(e) => onChange({ limit: Number(e.target.value) })}
                  className="flex-1 accent-[var(--primary)]"
                  aria-label="How many to show"
                />
                <span className="w-8 text-right text-sm font-semibold tabular-nums">
                  {section.limit}
                </span>
              </div>
              {kind === "product" && (
                <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
                  Rows of 4 look best on large screens.
                </span>
              )}
            </label>

            {section.source === "auto" &&
              !canEditFlags &&
              kind === "product" &&
              !FLAG[section.id] && (
                <p className="rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground">
                  On sale fills itself: any product whose “was” price is higher than its price
                  appears here. Set prices in Products, or switch to Hand-picked.
                </p>
              )}
          </div>

          {/* Preview / picked list */}
          <div className="flex min-h-0 flex-col p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="mr-auto text-sm font-semibold">
                {section.source === "manual" ? `Hand-picked ${many}` : "Showing on the homepage"}{" "}
                <span className="font-normal text-muted-foreground">
                  ({section.source === "manual" ? section.itemIds.length : shownCount}
                  {section.source === "manual" && section.itemIds.length > section.limit
                    ? `, first ${section.limit} shown`
                    : ""}
                  )
                </span>
                {loading && (
                  <Loader2
                    className="ml-2 inline h-4 w-4 animate-spin text-muted-foreground"
                    aria-label="Updating"
                  />
                )}
              </p>
              {canEdit && (section.source === "manual" || canEditFlags) && (
                <button type="button" className={secondaryButton} onClick={() => setAdding(true)}>
                  <Plus className="h-4 w-4" /> Add {one}
                </button>
              )}
            </div>

            <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
              {section.source === "manual"
                ? section.itemIds.map((id, i) => {
                    const item = previewById.get(id);
                    const beyond = i >= section.limit;
                    return (
                      <Row
                        key={id}
                        item={item}
                        missingLabel={`This ${one} isn't live (draft, archived or hidden) so it won't show.`}
                        dim={beyond}
                        note={beyond ? `Not shown — over the limit of ${section.limit}` : undefined}
                        actions={
                          canEdit && (
                            <>
                              <button
                                type="button"
                                className={iconButton}
                                aria-label="Move up"
                                disabled={i === 0}
                                onClick={() => moveManual(i, i - 1)}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={iconButton}
                                aria-label="Move down"
                                disabled={i === section.itemIds.length - 1}
                                onClick={() => moveManual(i, i + 1)}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={`${iconButton} text-destructive`}
                                aria-label="Remove"
                                onClick={() =>
                                  onChange({ itemIds: section.itemIds.filter((x) => x !== id) })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )
                        }
                      />
                    );
                  })
                : (preview ?? []).map((item) => (
                    <Row
                      key={item.id}
                      item={item}
                      actions={
                        canEditFlags && (
                          <button
                            type="button"
                            className={`${iconButton} text-destructive`}
                            aria-label={`Remove ${item.name} from this section`}
                            title="Remove from this section (saved now)"
                            onClick={() => setFlag(item, false)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )
                      }
                    />
                  ))}
              {section.source === "manual" && section.itemIds.length === 0 && (
                <li className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  Nothing picked yet. Use “Add {one}”. An empty section is hidden on the homepage.
                </li>
              )}
              {section.source === "auto" && preview && preview.length === 0 && (
                <li className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No {many} match yet, so this section is hidden on the homepage.{" "}
                  {canEditFlags ? `Use “Add ${one}”.` : ""}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {adding && (
        <Picker
          kind={kind}
          exclude={
            new Set(
              section.source === "manual" ? section.itemIds : (preview ?? []).map((p) => p.id),
            )
          }
          onPick={pick}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}

function Row({
  item,
  actions,
  missingLabel,
  dim,
  note,
}: {
  item?: Item;
  actions?: React.ReactNode;
  missingLabel?: string;
  dim?: boolean;
  note?: string;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border border-border p-2 text-xs ${dim ? "opacity-50" : ""}`}
    >
      {item?.image ? (
        <img
          src={optimizedImageUrl(item.image, 96)}
          alt=""
          className="h-11 w-11 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <span className="h-11 w-11 shrink-0 rounded-lg bg-secondary" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">
        {item ? (
          <>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="block truncate font-medium hover:text-primary"
            >
              {item.name}{" "}
              <ExternalLink className="inline h-3 w-3 text-muted-foreground" aria-hidden="true" />
            </a>
            <span className="block truncate text-muted-foreground">{note ?? item.meta}</span>
          </>
        ) : (
          <span className="block text-amber-700 dark:text-amber-400">{missingLabel}</span>
        )}
      </span>
      {actions && <span className="flex shrink-0 items-center">{actions}</span>}
    </li>
  );
}

type Candidate = { id: string; name: string; image: string; meta: string };

/** Search products, or filter all categories / brands, to add to a section. */
function Picker({
  kind,
  exclude,
  onPick,
  onClose,
}: {
  kind: Kind;
  exclude: Set<string>;
  onPick: (item: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim(), 250);
  const [all, setAll] = useState<Candidate[] | null>(null);
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<string>>(() => new Set(exclude));

  // Categories and brands are short lists: load once and filter here
  useEffect(() => {
    if (kind === "product") return;
    api<any[]>(kind === "category" ? "/api/admin/categories" : "/api/admin/brands")
      .then((list) =>
        setAll(
          list
            .filter((x) => x.isActive !== false)
            .map((x) => ({
              id: String(x._id),
              name: x.name,
              image: (kind === "category" ? x.image : x.logo) ?? "",
              meta: `${x.productCount ?? 0} products${kind === "category" && x.parent ? " · sub-category" : ""}`,
            })),
        ),
      )
      .catch((err) => toast.error(err instanceof Error ? err.message : "Couldn't load the list."));
  }, [kind]);

  useEffect(() => {
    if (kind !== "product") {
      const needle = q.toLowerCase();
      setResults(
        (all ?? []).filter((c) => !needle || c.name.toLowerCase().includes(needle)).slice(0, 60),
      );
      return;
    }
    let alive = true;
    setLoading(true);
    api<{ items: any[] }>(
      `/api/admin/products?status=active&pageSize=20${q ? `&q=${encodeURIComponent(q)}` : "&sort=updated"}`,
    )
      .then((r) => {
        if (!alive) return;
        setResults(
          r.items.map((p) => ({
            id: String(p._id),
            name: p.name,
            image: p.media?.[0]?.url ?? p.images?.[0] ?? "",
            meta: `৳${Number(p.price).toLocaleString("en-US")} · ${p.stock ?? 0} in stock${p.brand?.name ? ` · ${p.brand.name}` : ""}`,
          })),
        );
      })
      .catch((err) => alive && toast.error(err instanceof Error ? err.message : "Search failed."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, kind, all]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-16"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${NOUN[kind][0]}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              kind === "product" ? "Search live products by name or SKU" : `Find a ${NOUN[kind][0]}`
            }
            className="flex-1 bg-transparent text-sm outline-none"
            aria-label="Search"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <button type="button" className={iconButton} onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="flex-1 divide-y divide-border overflow-y-auto">
          {results.map((r) => {
            const isAdded = added.has(r.id);
            return (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                {r.image ? (
                  <img
                    src={optimizedImageUrl(r.image, 80)}
                    alt=""
                    className="h-10 w-10 rounded-md object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="h-10 w-10 rounded-md bg-secondary" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="block truncate text-muted-foreground">{r.meta}</span>
                </span>
                <button
                  type="button"
                  className={isAdded ? secondaryButton : primaryButton}
                  disabled={isAdded}
                  onClick={() => {
                    onPick(r);
                    setAdded((set) => new Set(set).add(r.id));
                  }}
                >
                  {isAdded ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
          {!loading && results.length === 0 && (
            <li className="px-4 py-8 text-center text-xs text-muted-foreground">Nothing found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
