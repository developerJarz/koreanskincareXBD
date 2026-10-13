/**
 * Browser side of the visitor activity log (see src/server/activity.ts).
 *
 * Events are queued and sent in small batches with navigator.sendBeacon, which survives the
 * page closing and never blocks the UI. Ids live in first-party cookies so the server can link
 * its own events (orders, sign-ins) to the same visit:
 *   ksb_vid — anonymous visitor id, 1 year
 *   ksb_sid — visit (session) id, renewed on activity, ends after 30 idle minutes
 */

export type TrackType = "page_view" | "add_to_cart" | "remove_from_cart" | "search" | "click";

export type TrackData = {
  eid?: string;
  path?: string;
  url?: string;
  title?: string;
  query?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  productId?: string;
  productSlug?: string;
  productName?: string;
  variant?: string;
  quantity?: number;
  value?: number;
  searchTerm?: string;
  label?: string;
};

type QueuedEvent =
  (TrackData & { type: TrackType }) | { kind: "leave"; eid: string; durationMs: number };

const VISITOR_COOKIE = "ksb_vid";
const SESSION_COOKIE = "ksb_sid";
const SESSION_IDLE_SECONDS = 30 * 60;
const FLUSH_DELAY_MS = 1500;

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

/** Returns the visitor and visit ids, creating or renewing them. */
export function getIds(): { vid: string; sid: string; isNewSession: boolean } {
  let vid = readCookie(VISITOR_COOKIE);
  if (!vid) vid = randomId();
  writeCookie(VISITOR_COOKIE, vid, 365 * 24 * 60 * 60);

  let sid = readCookie(SESSION_COOKIE);
  const isNewSession = !sid;
  if (!sid) sid = randomId();
  writeCookie(SESSION_COOKIE, sid, SESSION_IDLE_SECONDS);
  return { vid, sid, isNewSession };
}

export function flush() {
  if (typeof window === "undefined" || queue.length === 0) return;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const { vid, sid } = getIds();
  const payload = JSON.stringify({ vid, sid, events: queue.splice(0, queue.length) });
  try {
    const sent = navigator.sendBeacon?.("/api/track", payload);
    if (!sent) {
      void fetch("/api/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
    }
  } catch {
    // Tracking must never break the shop
  }
}

function enqueue(event: QueuedEvent, immediate = false) {
  if (typeof window === "undefined") return;
  queue.push(event);
  if (immediate || queue.length >= 20) {
    flush();
    return;
  }
  if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
}

/** Records a visitor action, e.g. trackEvent("add_to_cart", { productId, quantity }). */
export function trackEvent(type: TrackType, data: TrackData = {}) {
  if (typeof window === "undefined") return;
  enqueue({ path: location.pathname, ...data, type });
}

/** Called by the page tracker when a page view starts. */
export function trackPageView(data: TrackData & { eid: string }) {
  enqueue({ ...data, type: "page_view" }, true);
}

/** Called when the visitor leaves a page, with the time they actually had it on screen. */
export function trackLeave(eid: string, durationMs: number) {
  if (durationMs < 300) return;
  enqueue({ kind: "leave", eid, durationMs: Math.round(durationMs) }, true);
}
