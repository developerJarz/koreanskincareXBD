import type { Metadata } from "next";

import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
  title: "Shop All Accessories — Noors.bd",
  description:
    "Shop the full Noors.bd collection — premium bags, rings, earrings, necklaces, watches and sunglasses.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ShopPageClient initialCategory={resolvedSearchParams?.category ?? "all"} />;
}