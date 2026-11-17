import { BlockList, isIP } from "node:net";
import type { IOrderLocation } from "@/types";

// Do not send local, documentation, multicast or reserved addresses to a lookup service.
const nonPublic = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  nonPublic.addSubnet(address, prefix, "ipv4");
nonPublic.addSubnet("2001:db8::", 32, "ipv6");
const globalIPv6 = new BlockList();
globalIPv6.addSubnet("2000::", 3, "ipv6");

function publicIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return !nonPublic.check(ip, "ipv4");
  if (version === 6) return globalIPv6.check(ip, "ipv6") && !nonPublic.check(ip, "ipv6");
  return false;
}

function text(value: unknown, max = 100): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value
    .replace(/\p{Cc}/gu, "")
    .trim()
    .slice(0, max);
  return clean || undefined;
}

/** Coarse checkout metadata only. This must never prevent an order from being placed. */
export async function captureOrderLocation(
  headers: Headers,
  {
    fetcher = fetch,
    trustedVercel = process.env.VERCEL === "1",
  }: { fetcher?: typeof fetch; trustedVercel?: boolean } = {},
): Promise<IOrderLocation> {
  const capturedAt = new Date();
  const unavailable: IOrderLocation = { status: "unavailable", capturedAt };
  try {
    const ip = (
      (trustedVercel ? headers.get("x-vercel-forwarded-for") : null) ||
      headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      ""
    )
      .split(",")[0]
      .trim();

    if (!publicIp(ip)) {
      return { status: isIP(ip) ? "private_network" : "unavailable", capturedAt };
    }

    if (trustedVercel) {
      const rawCity = headers.get("x-vercel-ip-city");
      const city = rawCity ? text(decodeURIComponent(rawCity)) : undefined;
      if (city) {
        return {
          status: "located",
          city,
          region: text(headers.get("x-vercel-ip-country-region")),
          countryCode: text(headers.get("x-vercel-ip-country"), 2),
          source: "vercel",
          capturedAt,
        };
      }
    }

    const response = await fetcher(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,region,country,country_code`,
      { signal: AbortSignal.timeout(1800), cache: "no-store" },
    );
    if (!response.ok) return unavailable;
    const body = await response.json();
    const city = text(body?.city);
    if (body?.success !== true || !city) return unavailable;
    return {
      status: "located",
      city,
      region: text(body.region),
      country: text(body.country),
      countryCode: text(body.country_code, 2),
      source: "ipwhois",
      capturedAt,
    };
  } catch {
    return unavailable;
  }
}
