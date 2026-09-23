import type { Metadata } from "next";

import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
  title: "Shop All Korean Skincare & Beauty — KoreanSkincare.bd",
  description:
    "Shop the full KoreanSkincare.bd collection — 100% authentic Korean skincare, clinical toners, serums, sunscreens, and glass skin essentials.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ShopPageClient initialCategory={resolvedSearchParams?.category ?? "all"} />;
}
