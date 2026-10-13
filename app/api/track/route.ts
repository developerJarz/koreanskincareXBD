import { after, NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { ActivityEvent, ACTIVITY_TYPES, type ActivityType } from "@/server/db/models";
import {
  ACTIVITY_SESSION_COOKIE,
  expiryFor,
  getActivitySettings,
  isStaffUser,
  requestContext,
  userFields,
  VISITOR_COOKIE,
} from "@/server/activity";
import { getSessionUser, isCrossSiteRequest } from "@/server/auth/session";
import { isIpBlocked } from "@/server/security/ip-block";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";
import { cleanString, isObjectId } from "@/server/security/validation";

/**
 * POST /api/track — visitor activity from the storefront tracker (navigator.sendBeacon).
 * Always answers 204 straight away; validation and the database write happen after the
 * response. Events are never trusted for identity: user, IP, device and location come from
 * the request, not the body.
 */

const MAX_EVENTS = 25;
// Client-sent types; purchases and sign-ins are recorded by the server itself
const CLIENT_TYPES: ActivityType[] = ["page_view", "add_to_cart", "remove_from_cart", "search", "click"];
const IGNORED_PREFIXES = ["/admin", "/vendor", "/api", "/_next"];
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_DURATION_MS = 4 * 60 * 60 * 1000;

const noContent = () => new NextResponse(null, { status: 204 });

function num(value: unknown, max: number): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : undefined;
}

function cleanPath(value: unknown): string | undefined {
  const path = cleanString(value, 300);
  return path && path.startsWith("/") && !path.startsWith("//") ? path : undefined;
}

function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  if (isCrossSiteRequest(request)) return noContent();

  const ip = getClientIp(request);
  if (rateLimit(`track:${ip}`, 300, 5 * 60_000)) return noContent();

  let body: any;
  try {
    // sendBeacon posts text/plain, so parse the raw body rather than request.json()
    body = JSON.parse((await request.text()).slice(0, 64_000));
  } catch {
    return noContent();
  }

  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value ?? body?.vid;
  const sessionId = request.cookies.get(ACTIVITY_SESSION_COOKIE)?.value ?? body?.sid;
  if (typeof visitorId !== "string" || !ID_RE.test(visitorId)) return noContent();
  if (typeof sessionId !== "string" || !ID_RE.test(sessionId)) return noContent();
  const events: any[] = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS) : [];
  if (events.length === 0) return noContent();

  after(async () => {
    try {
      const settings = await getActivitySettings();
      if (!settings.enabled || (await isIpBlocked(ip))) return;

      const ctx = requestContext(request, settings);
      if (ctx.isBot) return;
      const { isBot: _isBot, ...context } = ctx;

      const user = await getSessionUser(request).catch(() => null);
      if (!settings.trackStaff && isStaffUser(user)) return;
      const who = userFields(user);
      const expiresAt = expiryFor(settings);

      const docs = [];
      for (const raw of events) {
        // Time spent on a page arrives when the visitor leaves it
        if (raw?.kind === "leave") {
          const eid = cleanString(raw.eid, 64);
          const durationMs = num(raw.durationMs, MAX_DURATION_MS);
          if (eid && ID_RE.test(eid) && durationMs !== undefined) {
            await ActivityEvent.updateOne(
              { eid, sessionId, type: "page_view" },
              { $set: { durationMs: Math.round(durationMs) } },
            );
          }
          continue;
        }

        const type = raw?.type as ActivityType;
        if (!CLIENT_TYPES.includes(type) || !ACTIVITY_TYPES.includes(type)) continue;

        const path = cleanPath(raw.path);
        if (!path || IGNORED_PREFIXES.some((p) => path.startsWith(p))) continue;
        if (settings.excludePaths.some((p) => path.startsWith(p))) continue;

        const referrer = cleanString(raw.referrer, 500) || undefined;
        const referrerHost = hostOf(referrer);
        const productMatch = /^\/product\/([^/?#]+)/.exec(path);
        const productId = cleanString(raw.productId, 200);
        const eid = cleanString(raw.eid, 64);

        docs.push({
          type,
          eid: eid && ID_RE.test(eid) ? eid : undefined,
          visitorId,
          sessionId,
          path,
          url: cleanString(raw.url, 1000) || undefined,
          title: cleanString(raw.title, 200) || undefined,
          query: cleanString(raw.query, 500) || undefined,
          referrer,
          // Same-site navigation is not a traffic source
          referrerHost: referrerHost && referrerHost !== hostOf(`https://${request.headers.get("host")}`) ? referrerHost : undefined,
          utmSource: cleanString(raw.utmSource, 100) || undefined,
          utmMedium: cleanString(raw.utmMedium, 100) || undefined,
          utmCampaign: cleanString(raw.utmCampaign, 150) || undefined,
          product: isObjectId(productId) ? new Types.ObjectId(productId) : undefined,
          productSlug:
            cleanString(raw.productSlug, 200) ||
            (productMatch ? decodeURIComponent(productMatch[1]).slice(0, 200) : undefined),
          productName: cleanString(raw.productName, 200) || undefined,
          variant: cleanString(raw.variant, 120) || undefined,
          quantity: num(raw.quantity, 999),
          value: num(raw.value, 10_000_000),
          searchTerm: cleanString(raw.searchTerm, 120) || undefined,
          label: cleanString(raw.label, 120) || undefined,
          language: cleanString(raw.language, 20) || undefined,
          screen: cleanString(raw.screen, 20) || undefined,
          ...context,
          ...who,
          expiresAt,
        });
      }

      if (docs.length) await ActivityEvent.insertMany(docs, { ordered: false });
    } catch (err) {
      console.error("Track error:", err);
    }
  });

  return noContent();
}
