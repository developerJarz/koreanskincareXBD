import { permanentRedirect } from "next/navigation";

/**
 * The old /shop page is replaced by /products (and /category/…, /brand/…).
 * Old links keep working: ?category=, ?tag=Bestseller|Sale|New and ?search= are carried over.
 */
export default async function ShopRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim();
  };

  const category = one("category");
  if (category && category !== "all")
    permanentRedirect(`/category/${encodeURIComponent(category)}`);

  const params = new URLSearchParams();
  const tag = one("tag")?.toLowerCase().replace(/\s+/g, "");
  if (tag === "sale") params.set("sale", "1");
  else if (tag === "bestseller") params.set("flag", "bestseller");
  else if (tag === "new") params.set("flag", "new");
  const q = one("search") ?? one("q");
  if (q) params.set("q", q.slice(0, 100));

  const qs = params.toString();
  permanentRedirect(qs ? `/products?${qs}` : "/products");
}
