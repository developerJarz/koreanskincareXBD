/**
 * Date ranges for admin reports. Days start at midnight Bangladesh time (UTC+6, no DST),
 * so "today" and daily charts match what the shop team sees on the clock.
 */

export const TIMEZONE = "Asia/Dhaka";
const OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export const RANGE_KEYS = ["today", "24h", "7d", "30d", "90d", "year", "all", "custom"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export type Bucket = "hour" | "day" | "month";

export type ResolvedRange = {
  key: RangeKey;
  /** null = since the beginning */
  from: Date | null;
  to: Date;
  /** Same-length window just before `from`, for "vs previous period" */
  previous: { from: Date; to: Date } | null;
  bucket: Bucket;
};

/** Midnight (Dhaka) of the day containing `date`, as a UTC Date. */
export function startOfDhakaDay(date: Date): Date {
  const local = date.getTime() + OFFSET_MS;
  return new Date(local - (local % DAY_MS) - OFFSET_MS);
}

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const d = new Date(value.length === 10 ? `${value}T00:00:00+06:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function resolveRange(
  searchParams: URLSearchParams,
  fallback: RangeKey = "30d",
): ResolvedRange {
  const raw = searchParams.get("range");
  const key: RangeKey = RANGE_KEYS.includes(raw as RangeKey) ? (raw as RangeKey) : fallback;
  const now = new Date();

  let from: Date | null;
  let to = now;
  switch (key) {
    case "today":
      from = startOfDhakaDay(now);
      break;
    case "24h":
      from = new Date(now.getTime() - DAY_MS);
      break;
    case "7d":
      from = startOfDhakaDay(new Date(now.getTime() - 6 * DAY_MS));
      break;
    case "30d":
      from = startOfDhakaDay(new Date(now.getTime() - 29 * DAY_MS));
      break;
    case "90d":
      from = startOfDhakaDay(new Date(now.getTime() - 89 * DAY_MS));
      break;
    case "year":
      from = startOfDhakaDay(new Date(now.getTime() - 364 * DAY_MS));
      break;
    case "custom": {
      const f = parseDate(searchParams.get("from"));
      const t = parseDate(searchParams.get("to"));
      from = f ?? startOfDhakaDay(new Date(now.getTime() - 29 * DAY_MS));
      // "to" is inclusive of the whole day
      to = t ? new Date(startOfDhakaDay(t).getTime() + DAY_MS - 1) : now;
      if (to < from) [from, to] = [to, from];
      break;
    }
    default:
      from = null;
  }

  const span = from ? to.getTime() - from.getTime() : 0;
  const bucket: Bucket =
    from === null ? "month" : span <= 2 * DAY_MS ? "hour" : span <= 180 * DAY_MS ? "day" : "month";

  return {
    key,
    from,
    to,
    previous: from ? { from: new Date(from.getTime() - span), to: from } : null,
    bucket,
  };
}

/** $dateToString format for a bucket */
export function bucketFormat(bucket: Bucket): string {
  return bucket === "hour" ? "%Y-%m-%d %H:00" : bucket === "day" ? "%Y-%m-%d" : "%Y-%m";
}

/** Every bucket label between from and to, so charts show empty days as zero. */
export function bucketLabels(from: Date, to: Date, bucket: Bucket): string[] {
  const labels: string[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (ms: number) => {
    const d = new Date(ms + OFFSET_MS);
    const day = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    if (bucket === "hour") return `${day} ${pad(d.getUTCHours())}:00`;
    if (bucket === "day") return day;
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
  };

  if (bucket === "month") {
    const start = new Date(from.getTime() + OFFSET_MS);
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    const end = new Date(to.getTime() + OFFSET_MS);
    while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
      labels.push(`${y}-${pad(m + 1)}`);
      m += 1;
      if (m === 12) {
        m = 0;
        y += 1;
      }
      if (labels.length > 240) break;
    }
    return labels;
  }

  const step = bucket === "hour" ? 3_600_000 : DAY_MS;
  let t =
    bucket === "hour"
      ? from.getTime() - (from.getTime() % 3_600_000)
      : startOfDhakaDay(from).getTime();
  while (t <= to.getTime() && labels.length < 2000) {
    labels.push(fmt(t));
    t += step;
  }
  return labels;
}

export function createdAtMatch(range: { from: Date | null; to: Date }, field = "createdAt") {
  return range.from
    ? { [field]: { $gte: range.from, $lte: range.to } }
    : { [field]: { $lte: range.to } };
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}
