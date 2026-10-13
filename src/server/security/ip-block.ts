import { connectDB } from "@/server/db/connection";
import { Settings } from "@/server/db/models";

/**
 * IP block list edited in "Team & security". Read through a short in-memory cache so the
 * check costs nothing on most requests; saving the list clears the cache.
 */

const CACHE_MS = 60_000;

declare global {
  // eslint-disable-next-line no-var
  var blockedIpCache: { ips: Set<string>; at: number } | undefined;
}

export function invalidateBlockedIps() {
  global.blockedIpCache = undefined;
}

export async function getBlockedIps(): Promise<Set<string>> {
  const hit = global.blockedIpCache;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.ips;
  try {
    await connectDB();
    const doc = await Settings.findOne().select("security").lean();
    const ips = new Set((doc?.security?.blockedIps ?? []).map((ip) => ip.trim()).filter(Boolean));
    global.blockedIpCache = { ips, at: Date.now() };
    return ips;
  } catch {
    return new Set();
  }
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ip === "unknown") return false;
  const ips = await getBlockedIps();
  return ips.size > 0 && ips.has(ip);
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-fA-F:]{2,39}$/;

export function isValidIp(value: unknown): value is string {
  return (
    typeof value === "string" && (IPV4.test(value) || (value.includes(":") && IPV6.test(value)))
  );
}
