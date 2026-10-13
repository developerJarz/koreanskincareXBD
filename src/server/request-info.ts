import type { NextRequest } from "next/server";

/**
 * Lightweight request fingerprinting for activity logs: device type, browser, OS, and the
 * country/city headers that hosting providers (Vercel, Cloudflare) add. No external lookups.
 */

export type ClientInfo = {
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
  isBot: boolean;
};

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp|telegram|preview|monitor|curl|wget|python-requests|axios|node-fetch/i;

export function parseUserAgent(ua: string): ClientInfo {
  const isBot = !ua || BOT_RE.test(ua);

  const isTablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua);
  const isMobile =
    !isTablet && /mobi|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  // Order matters: Edge and Opera include "Chrome", Chrome includes "Safari"
  let browser = "Other";
  if (/edg(e|a|ios)?\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/ucbrowser/i.test(ua)) browser = "UC Browser";
  else if (/fban|fbav|fb_iab/i.test(ua)) browser = "Facebook app";
  else if (/instagram/i.test(ua)) browser = "Instagram app";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "Other";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/cros/i.test(ua)) os = "ChromeOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { device, browser, os, isBot };
}

export function getGeo(request: NextRequest): { country?: string; city?: string } {
  const h = request.headers;
  const country =
    h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || h.get("x-country-code") || undefined;
  const rawCity = h.get("x-vercel-ip-city") || h.get("cf-ipcity") || undefined;
  let city: string | undefined;
  try {
    city = rawCity ? decodeURIComponent(rawCity) : undefined;
  } catch {
    city = rawCity;
  }
  return {
    country: country && country !== "XX" ? country.toUpperCase().slice(0, 2) : undefined,
    city: city?.slice(0, 80),
  };
}

/** 103.145.118.22 → 103.145.118.0, 2001:db8:1:2::5 → 2001:db8:1::  */
export function anonymizeIp(ip: string): string {
  if (ip.includes(".")) return ip.replace(/\.\d+$/, ".0");
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + "::";
  return ip;
}
