"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { SORT_OPTIONS } from "@/lib/catalog-shared";
import { listingHref, type QueryRecord } from "@/lib/catalog-url";

export function SortSelect({
  basePath,
  query,
  defaultSort,
}: {
  basePath: string;
  query: QueryRecord;
  defaultSort: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground hidden sm:inline">Sort by</span>
      <select
        value={query.sort ?? defaultSort}
        aria-label="Sort products"
        aria-busy={pending}
        onChange={(e) =>
          startTransition(() =>
            router.push(
              listingHref(basePath, query, {
                sort: e.target.value === defaultSort ? null : e.target.value,
              }),
              { scroll: false },
            ),
          )
        }
        className="h-10 pl-3 pr-8 rounded-full border border-border bg-card text-sm font-medium"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
