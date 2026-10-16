/**
 * Helpers for product descriptions, which are stored as HTML from the admin rich-text editor.
 * Older products (and vendor uploads) are plain text, so everything here accepts both.
 * Safe to import in the browser and on the server — sanitizing lives in src/server/rich-text.ts.
 */

const TAG_RE = /<\/?[a-z][\s\S]*?>/i;

/** True when the value looks like HTML rather than plain text. */
export function isRichText(value: string | undefined | null): boolean {
  return Boolean(value && TAG_RE.test(value));
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string) {
  return s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+\d*);/gi, (m, code: string) => {
    const lower = code.toLowerCase();
    if (ENTITIES[lower]) return ENTITIES[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16) || 32);
    if (lower.startsWith("#")) return String.fromCodePoint(Number(lower.slice(1)) || 32);
    return m;
  });
}

/** Readable plain text from HTML (block elements become line breaks). Plain text passes through. */
export function htmlToText(value: string | undefined | null): string {
  if (!value) return "";
  if (!isRichText(value)) return value.trim();
  return decodeEntities(
    value
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|h[1-6]|li|blockquote|tr|div|table|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Plain text on one line, for meta descriptions and structured data. */
export function htmlToSnippet(value: string | undefined | null, max = 160): string {
  const text = htmlToText(value).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6))}…`;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Converts an older plain-text description (blank line = new paragraph) into editor HTML. */
export function plainToHtml(value: string | undefined | null): string {
  if (!value) return "";
  if (isRichText(value)) return value;
  return value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** An editor that has been cleared still holds "<p></p>"; treat that as empty. */
export function isEmptyRichText(value: string | undefined | null): boolean {
  if (!value) return true;
  if (/<(img|table|hr)\b/i.test(value)) return false;
  return htmlToText(value).length === 0;
}
