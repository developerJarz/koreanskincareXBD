import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { breadcrumbJsonLd, jsonLd } from "@/lib/site";

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Array<{ name: string; path: string }> }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="text-foreground font-medium">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="hover:text-primary">
                      {item.name}
                    </Link>
                    <ChevronRight className="w-3 h-3" aria-hidden="true" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd(items))}
      />
    </>
  );
}
