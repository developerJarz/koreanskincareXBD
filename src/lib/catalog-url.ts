/** Builds listing URLs while keeping the other filters. Used on the server and in the browser. */

export type QueryRecord = Record<string, string>;

/** The listing query params we keep in URLs (anything else is dropped). */
export const LISTING_KEYS = [
  "q",
  "category",
  "brand",
  "minPrice",
  "maxPrice",
  "rating",
  "inStock",
  "sale",
  "flag",
  "sort",
  "page",
] as const;

export function pickListingQuery(sp: Record<string, string | string[] | undefined>): QueryRecord {
  const out: QueryRecord = {};
  for (const key of LISTING_KEYS) {
    const v = sp[key];
    const value = (Array.isArray(v) ? v[0] : v)?.trim();
    if (value) out[key] = value.slice(0, 200);
  }
  return out;
}

/**
 * Returns `basePath?query` with `changes` applied (null/"" removes a key).
 * Any change other than the page itself resets pagination to page 1.
 */
export function listingHref(
  basePath: string,
  current: QueryRecord,
  changes: Record<string, string | null | undefined> = {},
) {
  const next: QueryRecord = { ...current };
  for (const [k, v] of Object.entries(changes)) {
    if (v === null || v === undefined || v === "") delete next[k];
    else next[k] = v;
  }
  if (!("page" in changes)) delete next.page;
  if (next.page === "1") delete next.page;
  const qs = new URLSearchParams(next).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
