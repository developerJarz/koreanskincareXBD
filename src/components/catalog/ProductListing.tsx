import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { ListingFilters } from "@/components/catalog/ListingFilters";
import { SortSelect } from "@/components/catalog/SortSelect";
import type { ListingResult } from "@/server/catalog";
import { listingHref, type QueryRecord } from "@/lib/catalog-url";

type Props = {
  basePath: string;
  query: QueryRecord;
  result: ListingResult;
  defaultSort: string;
  showBrandFilter?: boolean;
  showCategoryFilter?: boolean;
  emptyMessage?: string;
};

/** Filter sidebar + sort + product grid + pagination, shared by all listing pages. */
export function ProductListing({
  basePath,
  query,
  result,
  defaultSort,
  showBrandFilter = true,
  showCategoryFilter = false,
  emptyMessage = "No products match these filters.",
}: Props) {
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <ListingFilters
          basePath={basePath}
          query={query}
          brandFacets={result.brandFacets}
          categoryFacets={result.categoryFacets}
          showBrands={showBrandFilter}
          showCategories={showCategoryFilter}
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result.total === 0
              ? "No products"
              : `Showing ${from}–${to} of ${result.total} product${result.total === 1 ? "" : "s"}`}
          </p>
          <SortSelect basePath={basePath} query={query} defaultSort={defaultSort} />
        </div>

        {result.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-serif text-2xl">{emptyMessage}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try removing a filter, or{" "}
              <Link href={basePath} className="text-primary font-medium hover:underline">
                clear them all
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {result.items.map((p, i) => (
              <li key={p.id}>
                <ProductCard p={p} priority={i < 4} />
              </li>
            ))}
          </ul>
        )}

        {result.totalPages > 1 && (
          <Pagination
            basePath={basePath}
            query={query}
            page={result.page}
            totalPages={result.totalPages}
          />
        )}
      </div>
    </div>
  );
}

function Pagination({
  basePath,
  query,
  page,
  totalPages,
}: {
  basePath: string;
  query: QueryRecord;
  page: number;
  totalPages: number;
}) {
  // Current page ±2, plus first and last
  const pages = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, totalPages])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const href = (n: number) => listingHref(basePath, query, { page: String(n) });
  const link =
    "inline-flex items-center justify-center min-w-10 h-10 px-3 rounded-full text-sm font-medium";

  return (
    <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-1 flex-wrap">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className={`${link} border border-border hover:bg-secondary`}
          rel="prev"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : null}
      {pages.map((n, i) => (
        <span key={n} className="contents">
          {i > 0 && n - pages[i - 1] > 1 && (
            <span className="px-1 text-muted-foreground" aria-hidden="true">
              …
            </span>
          )}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${link} ${n === page ? "bg-foreground text-background" : "hover:bg-secondary"}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          className={`${link} border border-border hover:bg-secondary`}
          rel="next"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Next page</span>
        </Link>
      ) : null}
    </nav>
  );
}
