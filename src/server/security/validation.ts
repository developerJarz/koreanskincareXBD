import { randomInt } from "crypto";

/**
 * Small input-validation helpers shared by API routes.
 * Every value coming from a request body or query string is untrusted.
 */

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && OBJECT_ID_RE.test(value);
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

/** Returns a trimmed string capped at `max` chars, or undefined when the value is not a string. */
export function cleanString(value: unknown, max = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

/** Escapes user text so it can be used literally inside a RegExp / Mongo $regex (prevents ReDoS & regex injection). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Allows only http(s) URLs or site-relative paths — blocks javascript:, data: etc. */
export function isSafeUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function toNonNegativeNumber(value: unknown, max = 100_000_000): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) return undefined;
  return n;
}

/** Returns an error message when the password is too weak, otherwise null. */
export function passwordStrengthError(password: unknown): string | null {
  if (typeof password !== "string") return "Password is required.";
  if (password.length < 10) return "Password must be at least 10 characters long.";
  if (password.length > 128) return "Password must be at most 128 characters long.";
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password));
  if (classes.length < 3) {
    return "Password must contain at least three of: lowercase, uppercase, number, symbol.";
  }
  return null;
}

/** Random password that always passes passwordStrengthError (used for new staff/vendor accounts). */
export function generateStrongPassword(length = 16): string {
  const sets = ["abcdefghijkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#%*-_=+?"];
  const all = sets.join("");
  const chars = sets.map((set) => set[randomInt(set.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
