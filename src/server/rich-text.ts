import sanitizeHtml from "sanitize-html";

import { isEmptyRichText, isRichText, plainToHtml } from "@/lib/rich-text";

/**
 * The only HTML a product description may contain: what the admin rich-text editor produces.
 * Applied when saving and again when rendering, so nothing unsafe reaches the shop even if a
 * description was written by another tool (vendor API, imports, seed scripts).
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "h2",
    "h3",
    "h4",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "mark",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "hr",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "colgroup",
    "col",
    "code",
    "pre",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    th: ["colspan", "rowspan", "colwidth"],
    td: ["colspan", "rowspan", "colwidth"],
    col: ["style"],
    "*": ["style"],
  },
  allowedStyles: {
    "*": { "text-align": [/^(left|right|center|justify)$/] },
    col: { "min-width": [/^\d+px$/], width: [/^\d+px$/] },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  // An image whose src was removed as unsafe would render as a broken picture
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
  transformTags: {
    h1: "h2",
    a: (tagName, attribs) => {
      const rel = new Set((attribs.rel ?? "").split(/\s+/).filter(Boolean));
      if (attribs.target === "_blank") rel.add("noopener").add("noreferrer");
      else delete attribs.target;
      return {
        tagName,
        attribs: { ...attribs, ...(rel.size ? { rel: [...rel].join(" ") } : {}) },
      };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy" },
    }),
  },
};

/** Cleans editor HTML for storage. Plain text is converted to paragraphs. */
export function sanitizeRichText(value: string | undefined | null): string {
  if (!value || isEmptyRichText(value)) return "";
  return sanitizeHtml(isRichText(value) ? value : plainToHtml(value), OPTIONS).trim();
}
