import { SITE_NAME } from "@/lib/site";
import { htmlToSnippet, htmlToText } from "@/lib/rich-text";

/**
 * Product SEO analysis (in the spirit of Yoast / Rank Math). Runs live in the product editor and
 * again on the server when a product is saved, so the stored `seoScore` always matches what the
 * editor showed.
 */

export type SeoStatus = "good" | "ok" | "bad";
export type SeoGroup = "keyword" | "meta" | "content" | "readability";

export type SeoCheck = {
  id: string;
  group: SeoGroup;
  status: SeoStatus;
  label: string;
  weight: number;
};

export type SeoInput = {
  focusKeyword: string;
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  shortDescription: string;
  description: string;
  media: Array<{ url: string; alt: string }>;
};

export type SeoResult = {
  score: number;
  checks: SeoCheck[];
  /** What Google will most likely show */
  title: string;
  metaDescription: string;
  wordCount: number;
  keywordCount: number;
  density: number;
};

export const SEO_GROUPS: Record<SeoGroup, string> = {
  keyword: "Focus keyword",
  meta: "Title & meta description",
  content: "Content",
  readability: "Readability",
};

export const TITLE_RANGE = [30, 60] as const;
export const META_RANGE = [120, 160] as const;

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

const slugPart = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const words = (text: string) => text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];

function keywordRegex(keyword: string) {
  const escaped = keyword
    .split(" ")
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s-]+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu");
}

const countMatches = (text: string, re: RegExp) => (text.match(re) ?? []).length;

function rate(value: number, good: [number, number], ok: [number, number]): SeoStatus {
  if (value >= good[0] && value <= good[1]) return "good";
  if (value >= ok[0] && value <= ok[1]) return "ok";
  return "bad";
}

const POINTS: Record<SeoStatus, number> = { good: 1, ok: 0.5, bad: 0 };

export function seoLevel(score: number): { label: string; tone: SeoStatus } {
  if (score >= 80) return { label: "Good", tone: "good" };
  if (score >= 50) return { label: "OK", tone: "ok" };
  return { label: "Needs work", tone: "bad" };
}

export function analyzeProductSeo(input: SeoInput): SeoResult {
  const keyword = normalize(input.focusKeyword ?? "");
  const kwRe = keyword ? keywordRegex(keyword) : null;
  const has = (text: string) => Boolean(kwRe && countMatches(text, kwRe) > 0);

  const html = input.description ?? "";
  const bodyText = htmlToText(html);
  const bodyWords = words(bodyText);
  const wordCount = bodyWords.length;
  const shortText = htmlToText(input.shortDescription);

  const title = (input.seoTitle || `${input.name} | ${SITE_NAME}`).trim();
  const metaDescription = (
    input.seoDescription ||
    htmlToSnippet(input.shortDescription, 160) ||
    htmlToSnippet(input.description, 160)
  ).trim();

  const keywordCount = kwRe ? countMatches(bodyText, kwRe) : 0;
  const kwWords = keyword ? keyword.split(" ").length : 1;
  const density = wordCount ? (keywordCount * kwWords * 100) / wordCount : 0;

  const headings = [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map((m) =>
    htmlToText(m[1]),
  );
  const links = [...html.matchAll(/<a\s[^>]*href="([^"]*)"/gi)].map((m) => m[1]);
  const internalLinks = links.filter(
    (href) => href.startsWith("/") || /koreanskincare\.bd/i.test(href),
  ).length;
  const externalLinks = links.length - internalLinks;
  const firstParagraph = htmlToText(html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? bodyText).slice(
    0,
    400,
  );

  const alts = input.media.map((m) => m.alt?.trim() ?? "");
  const altCount = alts.filter(Boolean).length;

  const sentences = bodyText.split(/(?<=[.!?।])\s+|\n+/).filter((s) => words(s).length > 0);
  const avgSentence = sentences.length ? wordCount / sentences.length : 0;
  const paragraphs = bodyText.split(/\n+/).filter((p) => words(p).length > 0);
  const longestParagraph = paragraphs.reduce((max, p) => Math.max(max, words(p).length), 0);

  const checks: SeoCheck[] = [];
  const add = (c: SeoCheck) => checks.push(c);
  const needKeyword = "Add a focus keyword to check this.";

  // ── Focus keyword ──
  add({
    id: "kw-set",
    group: "keyword",
    weight: 6,
    status: keyword ? "good" : "bad",
    label: keyword
      ? `Focus keyword: “${input.focusKeyword.trim()}”.`
      : "No focus keyword. Enter the search phrase you want this product to rank for.",
  });
  add({
    id: "kw-title",
    group: "keyword",
    weight: 10,
    status: keyword && has(title) ? "good" : "bad",
    label: !keyword
      ? needKeyword
      : has(title)
        ? "The focus keyword appears in the page title."
        : "Put the focus keyword in the page title.",
  });
  add({
    id: "kw-meta",
    group: "keyword",
    weight: 8,
    status: !keyword ? "bad" : has(metaDescription) ? "good" : "bad",
    label: !keyword
      ? needKeyword
      : has(metaDescription)
        ? "The focus keyword appears in the meta description."
        : "Use the focus keyword in the meta description.",
  });
  add({
    id: "kw-url",
    group: "keyword",
    weight: 6,
    status: !keyword ? "bad" : input.slug.includes(slugPart(keyword)) ? "good" : "ok",
    label: !keyword
      ? needKeyword
      : input.slug.includes(slugPart(keyword))
        ? "The focus keyword is in the URL."
        : "The URL doesn't contain the focus keyword.",
  });
  add({
    id: "kw-intro",
    group: "keyword",
    weight: 6,
    status: !keyword ? "bad" : has(firstParagraph) ? "good" : has(bodyText) ? "ok" : "bad",
    label: !keyword
      ? needKeyword
      : has(firstParagraph)
        ? "The focus keyword is used in the first paragraph."
        : "Mention the focus keyword in the first paragraph of the description.",
  });
  add({
    id: "kw-density",
    group: "keyword",
    weight: 8,
    status:
      !keyword || keywordCount === 0
        ? "bad"
        : wordCount < 100
          ? "ok"
          : rate(density, [0.5, 2.5], [0.1, 3.5]),
    label: !keyword
      ? needKeyword
      : keywordCount === 0
        ? "The focus keyword isn't in the description yet."
        : wordCount < 100
          ? `Keyword used ${keywordCount}×. Density is checked once the description has 100+ words.`
          : density > 3.5
            ? `Keyword density ${density.toFixed(1)}% is too high — it reads as keyword stuffing.`
            : `Keyword used ${keywordCount}× — density ${density.toFixed(1)}% (aim for 0.5–2.5%).`,
  });
  add({
    id: "kw-heading",
    group: "keyword",
    weight: 4,
    status: !keyword ? "bad" : headings.some(has) ? "good" : headings.length ? "ok" : "bad",
    label: !keyword
      ? needKeyword
      : headings.some(has)
        ? "The focus keyword is in a subheading."
        : "Use the focus keyword in at least one subheading (H2 or H3).",
  });
  add({
    id: "kw-alt",
    group: "keyword",
    weight: 4,
    status: !keyword ? "bad" : alts.some(has) ? "good" : "ok",
    label: !keyword
      ? needKeyword
      : alts.some(has)
        ? "An image's alt text contains the focus keyword."
        : "Add the focus keyword to the main image's alt text.",
  });

  // ── Title & meta ──
  add({
    id: "title-length",
    group: "meta",
    weight: 6,
    status: rate(title.length, [...TITLE_RANGE], [15, 70]),
    label:
      title.length > TITLE_RANGE[1]
        ? `Page title is ${title.length} characters — Google cuts it after about 60.`
        : title.length < TITLE_RANGE[0]
          ? `Page title is short (${title.length} characters). Aim for 30–60.`
          : `Page title length is good (${title.length} characters).`,
  });
  add({
    id: "meta-length",
    group: "meta",
    weight: 6,
    status: !metaDescription
      ? "bad"
      : input.seoDescription
        ? rate(metaDescription.length, [...META_RANGE], [70, 200])
        : "ok",
    label: !metaDescription
      ? "No meta description. Write one, or add a short description."
      : !input.seoDescription
        ? "Meta description is taken from the description. Write your own for better clicks."
        : metaDescription.length > META_RANGE[1]
          ? `Meta description is ${metaDescription.length} characters — it will be cut off after ~160.`
          : metaDescription.length < META_RANGE[0]
            ? `Meta description is short (${metaDescription.length} characters). Aim for 120–160.`
            : `Meta description length is good (${metaDescription.length} characters).`,
  });

  // ── Content ──
  add({
    id: "length",
    group: "content",
    weight: 10,
    status: rate(wordCount, [300, Infinity], [150, 299]),
    label:
      wordCount >= 300
        ? `The description has ${wordCount} words. Great.`
        : `The description has ${wordCount} words. Aim for at least 300 (150 minimum).`,
  });
  add({
    id: "short",
    group: "content",
    weight: 5,
    status: rate(shortText.length, [50, 320], [1, 600]),
    label: !shortText
      ? "Add a short description — it's shown next to the price and used in search results."
      : shortText.length < 50
        ? "The short description is very short. Write one or two full sentences."
        : shortText.length > 320
          ? "The short description is long. Keep it to one or two sentences."
          : "The short description is a good length.",
  });
  add({
    id: "headings",
    group: "content",
    weight: 6,
    status:
      headings.length >= 2 ? "good" : headings.length === 1 ? "ok" : wordCount < 150 ? "ok" : "bad",
    label: headings.length
      ? `${headings.length} subheading${headings.length === 1 ? "" : "s"} used${headings.length === 1 ? " — add another to break up the text." : "."}`
      : "Use subheadings (H2/H3) such as “Key benefits” and “Who it's for”.",
  });
  add({
    id: "lists",
    group: "content",
    weight: 3,
    status: /<(ul|ol|table)\b/i.test(html) ? "good" : "ok",
    label: /<(ul|ol|table)\b/i.test(html)
      ? "Lists or tables make the description easy to scan."
      : "Add a bullet list (e.g. key benefits) so shoppers can scan it quickly.",
  });
  add({
    id: "internal-links",
    group: "content",
    weight: 4,
    status: internalLinks > 0 ? "good" : "ok",
    label:
      internalLinks > 0
        ? `${internalLinks} internal link${internalLinks === 1 ? "" : "s"} to other pages on the shop.`
        : "Link to a related category, brand or product on the shop.",
  });
  add({
    id: "external-links",
    group: "content",
    weight: 2,
    status: externalLinks > 0 ? "good" : "ok",
    label:
      externalLinks > 0
        ? `${externalLinks} outbound link${externalLinks === 1 ? "" : "s"} (e.g. to the brand's site).`
        : "Optional: link to a trusted source such as the brand's official site.",
  });
  add({
    id: "images",
    group: "content",
    weight: 4,
    status: input.media.length >= 3 ? "good" : input.media.length >= 1 ? "ok" : "bad",
    label:
      input.media.length >= 3
        ? `${input.media.length} product images.`
        : input.media.length
          ? `${input.media.length} image${input.media.length === 1 ? "" : "s"} — 3 or more help shoppers and image search.`
          : "Add product images.",
  });
  add({
    id: "alt-text",
    group: "content",
    weight: 5,
    status: !input.media.length
      ? "bad"
      : altCount === input.media.length
        ? "good"
        : altCount > 0
          ? "ok"
          : "bad",
    label: !input.media.length
      ? "No images to describe yet."
      : altCount === input.media.length
        ? "Every image has alt text."
        : `${input.media.length - altCount} image${input.media.length - altCount === 1 ? " is" : "s are"} missing alt text.`,
  });

  // ── Readability ──
  add({
    id: "sentences",
    group: "readability",
    weight: 4,
    status: !wordCount ? "bad" : rate(avgSentence, [0, 20], [0, 25]),
    label: !wordCount
      ? "Write a description to check readability."
      : avgSentence > 20
        ? `Sentences average ${Math.round(avgSentence)} words. Shorter sentences (under 20) read better.`
        : `Sentences average ${Math.round(avgSentence)} words — easy to read.`,
  });
  add({
    id: "paragraphs",
    group: "readability",
    weight: 3,
    status: !wordCount ? "bad" : rate(longestParagraph, [0, 150], [0, 220]),
    label: !wordCount
      ? "Write a description to check readability."
      : longestParagraph > 150
        ? `One paragraph has ${longestParagraph} words. Split long paragraphs up.`
        : "Paragraphs are a comfortable length.",
  });

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + c.weight * POINTS[c.status], 0);

  return {
    score: Math.round((earned / total) * 100),
    checks,
    title,
    metaDescription,
    wordCount,
    keywordCount,
    density,
  };
}
