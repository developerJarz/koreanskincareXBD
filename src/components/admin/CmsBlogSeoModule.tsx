"use client";

import React from "react";
import { Copy, ExternalLink, FileText, Search } from "lucide-react";
import { toast } from "sonner";

import { secondaryButton } from "./catalog/ui";
import {
  ErrorNotice,
  fmtNumber,
  PageHeader,
  Panel,
  Pill,
  Skeleton,
  StatTile,
  useAdminData,
} from "./shared";

type Data = {
  products: {
    total: number;
    noSeoTitle: number;
    noSeoDesc: number;
    shortDesc: number;
    noAlt: number;
  };
  categories: { total: number; noDescription: number };
  brands: { total: number; noDescription: number };
  toFix: { id: string; name: string; slug: string; sold: number; issues: string[] }[];
  schema: Record<string, unknown>;
};

const pct = (part: number, total: number) =>
  total ? Math.round(((total - part) / total) * 100) : 100;

/** How the live catalogue appears in Google, measured from the database. */
export function CmsBlogSeoModule() {
  const { data, error, reload } = useAdminData<Data>("/api/admin/seo");
  if (error && !data) return <ErrorNotice message={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  const p = data.products;
  const schemaText = JSON.stringify(data.schema, null, 2);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pages & SEO"
        description="Search-appearance health of your published products, categories and brands."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Products with a search title"
          value={`${pct(p.noSeoTitle, p.total)}%`}
          hint={`${fmtNumber(p.noSeoTitle)} of ${fmtNumber(p.total)} missing`}
        />
        <StatTile
          label="With a search description"
          value={`${pct(p.noSeoDesc, p.total)}%`}
          hint={`${fmtNumber(p.noSeoDesc)} missing`}
        />
        <StatTile
          label="Descriptions 120+ characters"
          value={`${pct(p.shortDesc, p.total)}%`}
          hint={`${fmtNumber(p.shortDesc)} too short`}
        />
        <StatTile
          label="Images described (alt text)"
          value={`${pct(p.noAlt, p.total)}%`}
          hint={`${fmtNumber(p.noAlt)} products have undescribed images`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Panel
          title="Best sellers to improve first"
          description="Live products with missing or thin search information, best sellers first"
        >
          {data.toFix.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Every live product has its search details filled in.
            </p>
          ) : (
            <ul className="divide-y divide-border text-xs">
              {data.toFix.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="min-w-0">
                    <a
                      href={`/product/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:text-primary"
                    >
                      {item.name} <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
                    </a>
                    <span className="block text-muted-foreground">{fmtNumber(item.sold)} sold</span>
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {item.issues.map((i) => (
                      <Pill key={i} tone="warn">
                        {i}
                      </Pill>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Fix them in Products → edit → Search appearance, or draft text with the AI writer.
          </p>
        </Panel>
        <div className="space-y-5">
          <Panel title="Categories & brands">
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Categories without a description</dt>
                <dd className="font-semibold tabular-nums">
                  {data.categories.noDescription} / {data.categories.total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Brands without a description</dt>
                <dd className="font-semibold tabular-nums">
                  {data.brands.noDescription} / {data.brands.total}
                </dd>
              </div>
            </dl>
          </Panel>
          <Panel
            title="Blog"
            description="Blog posts are currently written in the website code (app/(store)/blog), so they can't be edited here yet."
          >
            <a href="/blog" target="_blank" rel="noreferrer" className={secondaryButton}>
              <FileText className="h-4 w-4" /> View the blog
            </a>
          </Panel>
        </div>
      </div>

      <Panel
        title="Organization schema (JSON-LD)"
        description="Built from your store name, logo, contact details and social links in Website design"
        action={
          <button
            type="button"
            className={secondaryButton}
            onClick={() => {
              navigator.clipboard.writeText(
                `<script type="application/ld+json">\n${schemaText}\n</script>`,
              );
              toast.success("Schema copied.");
            }}
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
        }
      >
        <pre className="max-h-80 overflow-auto rounded-xl bg-secondary/60 p-3 text-[11px] leading-relaxed">
          {schemaText}
        </pre>
        <a
          href={`https://search.google.com/test/rich-results`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Search className="h-3 w-3" /> Test it in Google's Rich Results Test
        </a>
      </Panel>
    </div>
  );
}
