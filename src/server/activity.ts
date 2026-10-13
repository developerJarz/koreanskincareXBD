import crypto from "crypto";
import { after, type NextRequest } from "next/server";

import { connectDB } from "@/server/db/connection";
import { ActivityEvent, Settings, type ActivityType, type UserDocument } from "@/server/db/models";
import type { IActivityEvent } from "@/server/db/models/activity-event.model";
import { anonymizeIp, getGeo, parseUserAgent } from "@/server/request-info";
import { getClientIp } from "@/server/security/rate-limit";
import type { IActivitySettings } from "@/types";

/**
 * Visitor activity recording (admin "Site activity" tab).
 *
 * The browser tracker (src/components/ActivityTracker.tsx) posts page views, cart changes and
 * searches to /api/track; the server records purchases and sign-ins itself. Both share the
 * visitor/session cookies below, so one visit can be traced from landing page to order.
 */

export const VISITOR_COOKIE = "ksb_vid";
export const ACTIVITY_SESSION_COOKIE = "ksb_sid";

export const ACTIVITY_DEFAULTS: IActivitySettings = {
  enabled: true,
  retentionDays: 30,
  anonymizeIp: false,
  trackStaff: false,
  excludePaths: [],
};

/** 0 = keep forever (records get no delete date) */
export const KEEP_FOREVER = 0;
export const MIN_RETENTION_DAYS = 0;
export const MAX_RETENTION_DAYS = 365;

/** Security-relevant events are kept even for team members and when page tracking is off. */
const ALWAYS_RECORDED: ActivityType[] = ["login", "login_failed", "signup", "logout", "purchase"];
const STAFF_ROLES = ["super_admin", "admin", "staff"];

export function normalizeActivitySettings(raw: unknown): IActivitySettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<IActivitySettings>;
  const days = Math.round(Number(r.retentionDays));
  return {
    enabled: typeof r.enabled === "boolean" ? r.enabled : ACTIVITY_DEFAULTS.enabled,
    retentionDays:
      Number.isFinite(days) && days >= MIN_RETENTION_DAYS
        ? Math.min(MAX_RETENTION_DAYS, days)
        : ACTIVITY_DEFAULTS.retentionDays,
    anonymizeIp: typeof r.anonymizeIp === "boolean" ? r.anonymizeIp : ACTIVITY_DEFAULTS.anonymizeIp,
    trackStaff: typeof r.trackStaff === "boolean" ? r.trackStaff : ACTIVITY_DEFAULTS.trackStaff,
    excludePaths: Array.isArray(r.excludePaths)
      ? r.excludePaths
          .filter((p): p is string => typeof p === "string" && p.startsWith("/"))
          .map((p) => p.trim().slice(0, 200))
          .slice(0, 50)
      : [],
  };
}

const SETTINGS_CACHE_MS = 30_000;

declare global {
  // eslint-disable-next-line no-var
  var activitySettingsCache: { value: IActivitySettings; at: number } | undefined;
}

export function invalidateActivitySettings() {
  global.activitySettingsCache = undefined;
}

export async function getActivitySettings(): Promise<IActivitySettings> {
  const hit = global.activitySettingsCache;
  if (hit && Date.now() - hit.at < SETTINGS_CACHE_MS) return hit.value;
  await connectDB();
  const doc = await Settings.findOne().select("activityTracking").lean();
  const value = normalizeActivitySettings(doc?.activityTracking);
  global.activitySettingsCache = { value, at: Date.now() };
  return value;
}

/** When a new record should be deleted automatically; undefined = never (keep forever). */
export function expiryFor(settings: IActivitySettings, from = Date.now()): Date | undefined {
  if (settings.retentionDays === KEEP_FOREVER) return undefined;
  return new Date(from + settings.retentionDays * 86_400_000);
}

export function randomId() {
  return crypto.randomBytes(12).toString("base64url");
}

/** Fields every event gets from the request itself (never from the request body). */
export function requestContext(request: NextRequest, settings: IActivitySettings) {
  const ua = request.headers.get("user-agent")?.slice(0, 400) ?? "";
  const client = parseUserAgent(ua);
  const rawIp = getClientIp(request);
  const ip = rawIp === "unknown" ? undefined : settings.anonymizeIp ? anonymizeIp(rawIp) : rawIp;
  return {
    ip,
    userAgent: ua || undefined,
    device: client.device,
    browser: client.browser,
    os: client.os,
    isBot: client.isBot,
    ...getGeo(request),
  };
}

export function userFields(user: UserDocument | null | undefined) {
  if (!user) return {};
  return {
    user: user._id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
  };
}

export function isStaffUser(user: UserDocument | null | undefined) {
  return Boolean(user && STAFF_ROLES.includes(user.role));
}

type ServerEvent = Partial<Omit<IActivityEvent, "type" | "expiresAt">> & { type: ActivityType };

/**
 * Records an event that happens on the server (purchase, sign-in…). Runs after the response,
 * so it never delays the user, and failures are only logged.
 */
export function recordServerEvent(
  request: NextRequest,
  event: ServerEvent,
  user?: UserDocument | null,
) {
  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value?.slice(0, 64) || `srv-${randomId()}`;
  const sessionId =
    request.cookies.get(ACTIVITY_SESSION_COOKIE)?.value?.slice(0, 64) || `srv-${randomId()}`;
  const referer = request.headers.get("referer");
  let path: string | undefined;
  try {
    path = referer ? new URL(referer).pathname.slice(0, 300) : undefined;
  } catch {
    path = undefined;
  }

  after(async () => {
    try {
      const settings = await getActivitySettings();
      const always = ALWAYS_RECORDED.includes(event.type);
      if (!settings.enabled && !always) return;
      if (!always && !settings.trackStaff && isStaffUser(user)) return;

      const ctx = requestContext(request, settings);
      const { isBot: _isBot, ...context } = ctx;
      await ActivityEvent.create({
        path,
        ...context,
        ...userFields(user),
        ...event,
        visitorId,
        sessionId,
        expiresAt: expiryFor(settings),
      });
    } catch (err) {
      console.error("Failed to record activity:", err);
    }
  });
}
