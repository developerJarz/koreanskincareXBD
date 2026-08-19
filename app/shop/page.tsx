import type { Metadata } from "next";

import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
  title: "Shop All Beauty & Accessories — Shajgoj.bd",
  description:
    "Shop the full Shajgoj.bd collection — premium bags, rings, earrings, necklaces, watches and lifestyle accessories.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ShopPageClient initialCategory={resolvedSearchParams?.category ?? "all"} />;
}
