"use client";

import React, { useEffect, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Monitor,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import {
  META_RANGE,
  SEO_GROUPS,
  seoLevel,
  TITLE_RANGE,
  type SeoGroup,
  type SeoResult,
  type SeoStatus,
} from "@/lib/product-seo";

import { inputClass, secondaryButton } from "./ui";

const TONE_TEXT: Record<SeoStatus, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  ok: "text-amber-700 dark:text-amber-400",
  bad: "text-destructive",
};
const TONE_STROKE: Record<SeoStatus, string> = {
  good: "stroke-emerald-600 dark:stroke-emerald-400",
  ok: "stroke-amber-500",
  bad: "stroke-destructive",
};
const TONE_BG: Record<SeoStatus, string> = {
  good: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  ok: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  bad: "bg-destructive/10 text-destructive",
};

export function SeoScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const { tone } = seoLevel(score);
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`SEO score ${score} out of 100`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={6}
        className="stroke-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className={`${TONE_STROKE[tone]} transition-[stroke-dashoffset] duration-500`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-foreground font-semibold"
        style={{ fontSize: size * 0.28 }}
      >
        {score}
      </text>
    </svg>
  );
}

/** Small coloured badge for tables (products saved before SEO scoring show a dash). */
export function SeoBadge({ score }: { score?: number | null }) {
  if (score === undefined || score === null)
    return <span className="text-muted-foreground">—</span>;
  const { tone, label } = seoLevel(score);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${TONE_BG[tone]}`}
      title={`SEO: ${label}`}
    >
      {score}
    </span>
  );
}

/** Sidebar summary: score + the most important things to fix. */
export function SeoSummary({ result, onOpen }: { result: SeoResult; onOpen: () => void }) {
  const { label, tone } = seoLevel(result.score);
  const todo = result.checks
    .filter((c) => c.status === "bad")
    .sort((a, b) => b.weight - a.weight)
    // Without a focus keyword several checks share the same message
    .filter((c, i, all) => all.findIndex((x) => x.label === c.label) === i)
    .slice(0, 3);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <SeoScoreRing score={result.score} />
        <div>
          <p className={`text-sm font-semibold ${TONE_TEXT[tone]}`}>{label}</p>
          <p className="text-xs text-muted-foreground">
            {result.checks.filter((c) => c.status === "good").length} of {result.checks.length}{" "}
            checks passed
          </p>
        </div>
      </div>
      {todo.length > 0 && (
        <ul className="space-y-1.5 text-xs">
          {todo.map((c) => (
            <li key={c.id} className="flex gap-1.5">
              <CircleAlert
                className="w-3.5 h-3.5 mt-0.5 shrink-0 text-destructive"
                aria-hidden="true"
              />
              {c.label}
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onOpen} className={`${secondaryButton} w-full`}>
        See full SEO analysis
      </button>
    </div>
  );
}

function highlight(text: string, keyword: string) {
  const kw = keyword.trim();
  if (!kw) return text;
  const re = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text
    .split(re)
    .map((part, i) =>
      part.toLowerCase() === kw.toLowerCase() ? <strong key={i}>{part}</strong> : part,
    );
}

/** Approximate Google result, so the title and description can be judged before publishing. */
export function SerpPreview({
  title,
  description,
  slug,
  keyword,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  keyword: string;
  image?: string;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const mobile = device === "mobile";
  const titleCut =
    title.length > TITLE_RANGE[1] + 2 ? `${title.slice(0, TITLE_RANGE[1] - 1)}…` : title;
  const max = mobile ? 120 : META_RANGE[1];
  const desc = description.length > max ? `${description.slice(0, max - 1)}…` : description;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">Google preview</p>
        <div
          className="inline-flex rounded-lg border border-border p-0.5"
          role="group"
          aria-label="Preview device"
        >
          {(
            [
              ["desktop", "Desktop", Monitor],
              ["mobile", "Mobile", Smartphone],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={device === value}
              onClick={() => setDevice(value)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${device === value ? "bg-secondary font-medium" : "text-muted-foreground"}`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`rounded-xl border border-border bg-white p-4 text-left font-[arial,sans-serif] text-[#202124] ${mobile ? "max-w-[380px]" : "max-w-[620px]"}`}
      >
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#f1f3f4] flex items-center justify-center text-[11px] font-bold text-[#5f6368]">
            K
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[14px] text-[#202124]">KoreanSkincare.bd</span>
            <span className="block truncate text-[12px] text-[#4d5156]">
              https://koreanskincare.bd › product › {slug || "…"}
            </span>
          </span>
        </div>
        <div className="mt-1.5 flex gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={`text-[#1a0dab] leading-snug ${mobile ? "text-[18px] line-clamp-2" : "text-[20px] truncate"} hover:underline`}
            >
              {titleCut || "Page title"}
            </p>
            <p className="mt-1 text-[14px] leading-[1.58] text-[#4d5156]">
              {desc
                ? highlight(desc, keyword)
                : "Add a meta description to control what shows here."}
            </p>
          </div>
          {mobile && image && (
            <img
              src={image}
              alt=""
              className="w-[92px] h-[92px] rounded-lg object-cover shrink-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}

const ICON: Record<SeoStatus, React.ElementType> = {
  good: CircleCheck,
  ok: TriangleAlert,
  bad: CircleAlert,
};

/** Full analysis: focus keyword, quick fixes and every check, grouped. */
export function SeoAnalysis({
  result,
  focusKeyword,
  onFocusKeyword,
  suggestions,
  productId,
  quickFixes,
}: {
  result: SeoResult;
  focusKeyword: string;
  onFocusKeyword: (v: string) => void;
  suggestions: string[];
  productId?: string;
  quickFixes: Array<{ label: string; run: () => void; show: boolean }>;
}) {
  // Warn when another product already targets the same phrase (they would compete in Google)
  const [usedBy, setUsedBy] = useState<Array<{ _id: string; name: string }>>([]);
  useEffect(() => {
    const q = focusKeyword.trim();
    if (q.length < 2) {
      setUsedBy([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q, ...(productId ? { exclude: productId } : {}) });
      fetch(`/api/admin/products/keyword?${params}`, { cache: "no-store", signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => setUsedBy(d.items ?? []))
        .catch(() => {});
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [focusKeyword, productId]);

  const groups = Object.keys(SEO_GROUPS) as SeoGroup[];
  const order: Record<SeoStatus, number> = { bad: 0, ok: 1, good: 2 };
  const fixes = quickFixes.filter((f) => f.show);
  const unusedSuggestions = suggestions
    .filter((s) => s.toLowerCase() !== focusKeyword.trim().toLowerCase())
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] items-start">
        <div className="flex items-center gap-3">
          <SeoScoreRing score={result.score} size={76} />
          <div className="sm:hidden">
            <p className={`text-sm font-semibold ${TONE_TEXT[seoLevel(result.score).tone]}`}>
              {seoLevel(result.score).label}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="p-focus-kw" className="block text-xs font-medium">
            Focus keyword
          </label>
          <input
            id="p-focus-kw"
            value={focusKeyword}
            maxLength={100}
            onChange={(e) => onFocusKeyword(e.target.value)}
            placeholder="e.g. snail mucin essence"
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground">
            The main phrase shoppers type into Google to find this product.
          </p>
          {unusedSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground">Ideas:</span>
              {unusedSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onFocusKeyword(s)}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:bg-secondary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {usedBy.length > 0 && (
            <p className="flex gap-1.5 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
              <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Also the focus keyword of{" "}
                {usedBy
                  .slice(0, 3)
                  .map((p) => `“${p.name}”`)
                  .join(", ")}
                {usedBy.length > 3 ? ` and ${usedBy.length - 3} more` : ""}. Products with the same
                keyword compete with each other — make this one more specific.
              </span>
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {(
          [
            ["Words", result.wordCount],
            ["Keyword uses", result.keywordCount],
            ["Density", `${result.density.toFixed(1)}%`],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-secondary/60 p-2">
            <dt className="text-[11px] text-muted-foreground">{k}</dt>
            <dd className="text-sm font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {fixes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fixes.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={f.run}
              className={`${secondaryButton} h-8 text-xs`}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {groups.map((g) => {
          const items = result.checks
            .filter((c) => c.group === g)
            .sort((a, b) => order[a.status] - order[b.status]);
          const problems = items.filter((c) => c.status !== "good").length;
          return (
            <details key={g} open={problems > 0} className="group rounded-xl border border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium">
                {SEO_GROUPS[g]}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${problems ? TONE_BG.ok : TONE_BG.good}`}
                >
                  {problems ? `${problems} to improve` : "All good"}
                </span>
              </summary>
              <ul className="space-y-1.5 border-t border-border px-3 py-2.5 text-xs">
                {items.map((c) => {
                  const Icon = ICON[c.status];
                  return (
                    <li key={c.id} className="flex gap-2">
                      <Icon
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${TONE_TEXT[c.status]}`}
                        aria-hidden="true"
                      />
                      <span className="sr-only">
                        {c.status === "good"
                          ? "Passed:"
                          : c.status === "ok"
                            ? "Could improve:"
                            : "Problem:"}
                      </span>
                      {c.label}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
