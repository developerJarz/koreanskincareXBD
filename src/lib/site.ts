export const SITE_NAME = "KoreanSkincare.bd";

/** Public site origin used for canonical URLs and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://koreanskincare.bd").replace(
  /\/$/,
  "",
);

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Serialises JSON-LD safely for a <script> tag ("<" can't break out of the script element). */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
