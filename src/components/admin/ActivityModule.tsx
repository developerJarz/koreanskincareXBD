"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  Database,
  Eye,
  Globe,
  HardDrive,
  LogIn,
  LogOut,
  MousePointerClick,
  Plug,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api, inputClass, Modal, primaryButton, secondaryButton, Switch } from "./catalog/ui";
import { Funnel, TimeSeriesChart } from "./charts";
import {
  BarList,
  EmptyState,
  ErrorNotice,
  fmtDateTime,
  fmtDuration,
  fmtNumber,
  fmtPercent,
  fmtRelative,
  fmtTaka,
  PageHeader,
  Pagination,
  Panel,
  Pill,
  qs,
  rangeQuery,
  RangePicker,
  Segmented,
  Skeleton,
  StatTile,
  todayInput,
  useAccess,
  useAdminData,
  useDebounced,
  type RangeValue,
} from "./shared";

// ─── Event vocabulary ───

type EventRow = {
  _id: string;
  type: string;
  path?: string;
  title?: string;
  query?: string;
  productName?: string;
  productSlug?: string;
  searchTerm?: string;
  value?: number;
  quantity?: number;
  variant?: string;
  userName?: string;
  userEmail?: string;
  sessionId: string;
  visitorId: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  ip?: string;
  referrer?: string;
  referrerHost?: string;
  utmSource?: string;
  orderNumber?: string;
  label?: string;
  durationMs?: number;
  createdAt: string;
};

const EVENT_TYPES: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    tone: "neutral" | "good" | "warn" | "bad" | "info" | "accent";
  }
> = {
  page_view: { label: "Page view", icon: Eye, tone: "neutral" },
  add_to_cart: { label: "Add to cart", icon: ShoppingCart, tone: "accent" },
  remove_from_cart: { label: "Remove from cart", icon: ShoppingCart, tone: "warn" },
  search: { label: "Search", icon: Search, tone: "info" },
  purchase: { label: "Order placed", icon: ShoppingBag, tone: "good" },
  login: { label: "Sign in", icon: LogIn, tone: "info" },
  login_failed: { label: "Failed sign-in", icon: ShieldAlert, tone: "bad" },
  signup: { label: "New account", icon: UserPlus, tone: "good" },
  logout: { label: "Sign out", icon: LogOut, tone: "neutral" },
  click: { label: "Click", icon: MousePointerClick, tone: "neutral" },
};

function describe(e: EventRow): string {
  switch (e.type) {
    case "page_view":
      return e.title ? `${e.title} — ${e.path}` : (e.path ?? "");
    case "add_to_cart":
    case "remove_from_cart":
      return `${e.quantity ?? 1} × ${e.productName ?? e.productSlug ?? "product"}${e.variant ? ` (${e.variant})` : ""}${
        e.value ? ` · ${fmtTaka(e.value)}` : ""
      }`;
    case "search":
      return `“${e.searchTerm ?? ""}”`;
    case "purchase":
      return `${e.orderNumber ?? "Order"} · ${fmtTaka(e.value)}${e.label ? ` · ${e.label}` : ""}`;
    case "login_failed":
      return e.label ? `Tried ${e.label}` : "Wrong email or password";
    default:
      return e.path ?? e.label ?? "";
  }
}

function TypePill({ type }: { type: string }) {
  const t = EVENT_TYPES[type] ?? { label: type, icon: Activity, tone: "neutral" as const };
  const Icon = t.icon;
  return (
    <Pill tone={t.tone}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t.label}
    </Pill>
  );
}

function where(e: { city?: string; country?: string }) {
  return [e.city, e.country].filter(Boolean).join(", ");
}

// ─── Module ───

type Tab = "overview" | "visits" | "events" | "data";

export function ActivityModule() {
  const { can } = useAccess();
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<RangeValue>({ key: "7d" });
  const [traceId, setTraceId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Site activity"
        description="Every visit to your website — pages viewed, products added to cart, searches, sign-ins and orders — recorded in MongoDB."
        actions={
          tab !== "data" ? (
            <RangePicker
              value={range}
              onChange={setRange}
              options={["today", "24h", "7d", "30d", "90d", "custom"]}
            />
          ) : undefined
        }
      />
      <Segmented
        label="Activity sections"
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Overview" },
          { value: "visits", label: "Visits & traces" },
          { value: "events", label: "Event log" },
          { value: "data", label: can("activity.manage") ? "Data & database" : "Database" },
        ]}
      />

      {tab === "overview" && <Overview range={range} onTrace={setTraceId} />}
      {tab === "visits" && <Visits range={range} onTrace={setTraceId} />}
      {tab === "events" && <EventLog range={range} onTrace={setTraceId} />}
      {tab === "data" && <DataAndDatabase />}

      {traceId && (
        <TraceDrawer sessionId={traceId} onClose={() => setTraceId(null)} onTrace={setTraceId} />
      )}
    </div>
  );
}

// ─── Overview ───

type Summary = {
  totals: {
    pageViews: number;
    visitors: number;
    sessions: number;
    bounceRate: number;
    avgSessionMs: number;
    pagesPerSession: number;
    addToCarts: number;
    removeFromCarts: number;
    purchases: number;
    revenue: number;
    cartValue: number;
    searches: number;
    logins: number;
    failedLogins: number;
    signups: number;
    signedInVisitors: number;
    conversionRate: number;
    events: number;
  };
  series: {
    label: string;
    pageViews: number;
    visitors: number;
    addToCarts: number;
    purchases: number;
  }[];
  topPages: {
    path: string;
    title?: string;
    views: number;
    visitors: number;
    avgDurationMs: number | null;
  }[];
  topProductsViewed: { slug: string; title?: string; views: number; visitors: number }[];
  topCartProducts: {
    key: string;
    name: string;
    adds: number;
    quantity: number;
    value: number;
    visitors: number;
  }[];
  topSearches: { name: string; value: number }[];
  referrers: { name: string; value: number }[];
  campaigns: { name: string; value: number }[];
  devices: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  os: { name: string; value: number }[];
  countries: { name: string; value: number }[];
  funnel: {
    visitors: number;
    productViewers: number;
    carters: number;
    checkouts: number;
    buyers: number;
  };
  live: {
    visitorId: string;
    sessionId: string;
    path: string;
    title?: string;
    at: string;
    userName?: string;
    device?: string;
    country?: string;
    views: number;
  }[];
  recent: EventRow[];
};

function Overview({ range, onTrace }: { range: RangeValue; onTrace: (id: string) => void }) {
  const url = `/api/admin/activity${qs(rangeQuery(range))}`;
  const { data, error, loading, reload } = useAdminData<Summary>(url);
  const [metric, setMetric] = useState<"traffic" | "shopping">("traffic");

  // Live numbers refresh every 30 seconds while this tab is open
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && reload(), 30_000);
    return () => clearInterval(t);
  }, [reload]);

  if (error && !data) return <ErrorNotice message={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  const t = data.totals;
  const noData = t.events === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {data.live.length} {data.live.length === 1 ? "person" : "people"} on the site now
            </p>
            <p className="text-xs text-muted-foreground">
              Active in the last 5 minutes · updates every 30 seconds
            </p>
          </div>
        </div>
        <button type="button" onClick={reload} className={secondaryButton} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {data.live.length > 0 && (
        <Panel title="Right now" description="The page each active visitor is on">
          <ul className="divide-y divide-border text-xs">
            {data.live.slice(0, 8).map((v) => (
              <li key={v.visitorId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="min-w-0 flex-1 truncate text-foreground" title={v.path}>
                  {v.title || v.path}
                </span>
                <span className="text-muted-foreground">{v.userName ?? "Guest"}</span>
                <span className="text-muted-foreground">
                  {[v.device, v.country].filter(Boolean).join(" · ")}
                </span>
                <span className="tabular-nums text-muted-foreground">{fmtRelative(v.at)}</span>
                <button
                  type="button"
                  onClick={() => onTrace(v.sessionId)}
                  className="font-medium text-primary hover:underline"
                >
                  Trace
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {noData ? (
        <Panel>
          <EmptyState icon={Activity} title="No activity recorded in this period yet">
            Visits are recorded from now on as people browse the shop. Open your website in another
            tab to see your own visit appear here (team members are skipped unless “Record team
            visits” is on in Data & database).
          </EmptyState>
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Visitors"
              value={fmtNumber(t.visitors)}
              hint={`${fmtNumber(t.signedInVisitors)} signed in`}
            />
            <StatTile
              label="Page views"
              value={fmtNumber(t.pageViews)}
              hint={`${t.pagesPerSession.toFixed(1)} pages per visit`}
            />
            <StatTile
              label="Visits"
              value={fmtNumber(t.sessions)}
              hint={`${fmtPercent(t.bounceRate, 0)} left after one page`}
            />
            <StatTile
              label="Average visit"
              value={fmtDuration(t.avgSessionMs)}
              hint="time with the page on screen"
            />
            <StatTile
              label="Added to cart"
              value={fmtNumber(t.addToCarts)}
              hint={`${fmtTaka(t.cartValue)} of products`}
            />
            <StatTile
              label="Orders placed"
              value={fmtNumber(t.purchases)}
              hint={fmtTaka(t.revenue)}
            />
            <StatTile
              label="Visitor → order"
              value={fmtPercent(t.conversionRate)}
              hint="share of visitors who ordered"
            />
            <StatTile
              label="Sign-ins"
              value={fmtNumber(t.logins)}
              hint={`${fmtNumber(t.signups)} new accounts · ${fmtNumber(t.failedLogins)} failed`}
            />
          </div>

          <Panel
            title={metric === "traffic" ? "Visitors and page views" : "Cart adds and orders"}
            action={
              <Segmented
                label="Chart"
                value={metric}
                onChange={setMetric}
                options={[
                  { value: "traffic", label: "Traffic" },
                  { value: "shopping", label: "Shopping" },
                ]}
              />
            }
          >
            <TimeSeriesChart
              ariaLabel={
                metric === "traffic"
                  ? "Visitors and page views over time"
                  : "Cart adds and orders over time"
              }
              data={data.series}
              kind="line"
              series={
                metric === "traffic"
                  ? [
                      { key: "pageViews", label: "Page views" },
                      { key: "visitors", label: "Visitors" },
                    ]
                  : [
                      { key: "addToCarts", label: "Added to cart" },
                      { key: "purchases", label: "Orders" },
                    ]
              }
            />
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Shopping funnel" description="Unique visitors reaching each step">
              <Funnel
                steps={[
                  { label: "Visited the shop", value: data.funnel.visitors },
                  { label: "Viewed a product", value: data.funnel.productViewers },
                  { label: "Added to cart", value: data.funnel.carters },
                  { label: "Opened checkout", value: data.funnel.checkouts },
                  { label: "Placed an order", value: data.funnel.buyers },
                ]}
              />
            </Panel>
            <Panel
              title="Where visitors come from"
              description="Visits by website that sent them (direct visits not shown)"
            >
              <BarList
                rows={data.referrers}
                empty="No visits from other websites in this period."
              />
              {data.campaigns.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium text-foreground">Campaigns (utm_source)</p>
                  <BarList rows={data.campaigns} />
                </div>
              )}
            </Panel>
          </div>

          <Panel
            title="Most viewed pages"
            description="Every URL hit, with unique visitors and average time on page"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Page</th>
                    <th className="py-2 px-3 text-right font-medium">Views</th>
                    <th className="py-2 px-3 text-right font-medium">Visitors</th>
                    <th className="py-2 pl-3 text-right font-medium">Avg. time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.topPages.map((p) => (
                    <tr key={p.path}>
                      <td className="max-w-[22rem] py-2 pr-3">
                        <a
                          href={p.path}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate font-medium text-foreground hover:text-primary"
                          title={p.path}
                        >
                          {p.path}
                        </a>
                        {p.title && (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {p.title}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNumber(p.views)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNumber(p.visitors)}</td>
                      <td className="py-2 pl-3 text-right tabular-nums">
                        {fmtDuration(p.avgDurationMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Products added to cart" description="Who put what in their cart">
              {data.topCartProducts.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nothing added to cart in this period.
                </p>
              ) : (
                <ul className="divide-y divide-border text-xs">
                  {data.topCartProducts.map((p) => (
                    <li key={p.key} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 truncate text-foreground">{p.name}</span>
                      <span className="shrink-0 text-right tabular-nums text-muted-foreground">
                        <span className="font-semibold text-foreground">{fmtNumber(p.adds)}</span>{" "}
                        adds · {fmtNumber(p.quantity)} units · {fmtNumber(p.visitors)} people
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Most viewed products">
              <BarList
                rows={data.topProductsViewed.map((p) => ({
                  name: p.title?.split(" — ")[0]?.split(" | ")[0] || p.slug,
                  value: p.views,
                }))}
                empty="No product pages viewed in this period."
                format={(n) => `${fmtNumber(n)} views`}
              />
            </Panel>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Panel title="Devices">
              <BarList rows={data.devices} format={(n) => `${fmtNumber(n)} visits`} />
            </Panel>
            <Panel title="Browsers">
              <BarList rows={data.browsers} format={(n) => `${fmtNumber(n)}`} />
            </Panel>
            <Panel title="Operating systems">
              <BarList rows={data.os} format={(n) => `${fmtNumber(n)}`} />
            </Panel>
            <Panel title="Countries" description="Shown when your host adds location headers">
              <BarList
                rows={data.countries}
                format={(n) => `${fmtNumber(n)}`}
                empty="No location data yet."
              />
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="What people searched for">
              <BarList
                rows={data.topSearches}
                format={(n) => `${fmtNumber(n)}×`}
                empty="No searches in this period."
              />
            </Panel>
            <Panel title="Latest activity">
              <ul className="divide-y divide-border text-xs">
                {data.recent.slice(0, 12).map((e) => (
                  <li key={e._id} className="flex items-start gap-2 py-2">
                    <TypePill type={e.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{describe(e)}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {e.userName ?? "Guest"} · {fmtRelative(e.createdAt)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onTrace(e.sessionId)}
                      className="shrink-0 text-[11px] font-medium text-primary hover:underline"
                    >
                      Trace
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Visits ───

type Visit = {
  sessionId: string;
  visitorId: string;
  start: string;
  end: string;
  events: number;
  pageViews: number;
  addToCarts: number;
  cartValue: number;
  purchases: number;
  revenue: number;
  duration: number;
  landing?: string;
  exit?: string;
  referrerHost?: string;
  utmSource?: string;
  userName?: string;
  userEmail?: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  ip?: string;
};

function Visits({ range, onTrace }: { range: RangeValue; onTrace: (id: string) => void }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  useEffect(() => setPage(1), [filter, q, range]);

  const { data, error, loading, reload } = useAdminData<{
    items: Visit[];
    total: number;
    totalPages: number;
  }>(`/api/admin/activity/sessions${qs({ ...rangeQuery(range), filter, q, page })}`);

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          label="Filter visits"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All visits" },
            { value: "cart", label: "Added to cart" },
            { value: "abandoned", label: "Cart, no order" },
            { value: "purchased", label: "Ordered" },
            { value: "members", label: "Signed in" },
          ]}
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email, IP or landing page"
          aria-label="Search visits"
          className={`${inputClass} h-9 max-w-xs`}
        />
        {loading && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading" />
        )}
      </div>
      {error && <ErrorNotice message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState icon={Globe} title="No visits match." />}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Visitor</th>
                <th className="px-3 py-2 font-medium">Started</th>
                <th className="px-3 py-2 font-medium">Landing → exit</th>
                <th className="px-3 py-2 text-right font-medium">Pages</th>
                <th className="px-3 py-2 text-right font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Cart / order</th>
                <th className="px-3 py-2 font-medium">Device & source</th>
                <th className="py-2 pl-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((v) => (
                <tr key={v.sessionId} className="align-top hover:bg-secondary/40">
                  <td className="py-2.5 pr-3">
                    <span className="block font-medium text-foreground">
                      {v.userName ?? "Guest"}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {v.userEmail ?? v.ip ?? v.visitorId.slice(0, 10)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {fmtDateTime(v.start)}
                    <span className="block text-[11px] text-muted-foreground">
                      {fmtRelative(v.end)}
                    </span>
                  </td>
                  <td className="max-w-[16rem] px-3 py-2.5">
                    <span className="block truncate" title={v.landing}>
                      {v.landing ?? "—"}
                    </span>
                    {v.exit && v.exit !== v.landing && (
                      <span
                        className="block truncate text-[11px] text-muted-foreground"
                        title={v.exit}
                      >
                        → {v.exit}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{v.pageViews}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtDuration(v.duration)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {v.addToCarts > 0 && (
                        <Pill tone="accent">
                          {v.addToCarts} added · {fmtTaka(v.cartValue)}
                        </Pill>
                      )}
                      {v.purchases > 0 && <Pill tone="good">Ordered {fmtTaka(v.revenue)}</Pill>}
                      {v.addToCarts > 0 && v.purchases === 0 && <Pill tone="warn">No order</Pill>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {[v.device, v.browser].filter(Boolean).join(" · ")}
                    <span className="block text-[11px]">
                      {v.referrerHost ?? v.utmSource ?? "Direct"}
                      {where(v) ? ` · ${where(v)}` : ""}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onTrace(v.sessionId)}
                      className="font-medium text-primary hover:underline"
                    >
                      Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          onPage={setPage}
          label="visits"
        />
      )}
    </Panel>
  );
}

// ─── Event log ───

function EventLog({ range, onTrace }: { range: RangeValue; onTrace: (id: string) => void }) {
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [device, setDevice] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  useEffect(() => setPage(1), [type, q, device, range]);

  const { data, error, loading, reload } = useAdminData<{
    items: EventRow[];
    total: number;
    totalPages: number;
  }>(`/api/admin/activity/events${qs({ ...rangeQuery(range), type, q, device, page })}`);

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          aria-label="Event type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`${inputClass} h-9 w-auto`}
        >
          <option value="">All events</option>
          {Object.entries(EVENT_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Device"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          className={`${inputClass} h-9 w-auto`}
        >
          <option value="">All devices</option>
          <option value="mobile">Mobile</option>
          <option value="tablet">Tablet</option>
          <option value="desktop">Desktop</option>
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="URL, product, search term, name, email, IP, order…"
          aria-label="Search events"
          className={`${inputClass} h-9 max-w-sm`}
        />
        {loading && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading" />
        )}
      </div>
      {error && <ErrorNotice message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState icon={Activity} title="No events match." />}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Details</th>
                <th className="px-3 py-2 font-medium">Who</th>
                <th className="px-3 py-2 font-medium">Device</th>
                <th className="px-3 py-2 font-medium">IP & place</th>
                <th className="py-2 pl-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((e) => (
                <tr key={e._id} className="align-top hover:bg-secondary/40">
                  <td className="whitespace-nowrap py-2 pr-3 tabular-nums">
                    {fmtDateTime(e.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <TypePill type={e.type} />
                  </td>
                  <td className="max-w-[20rem] px-3 py-2">
                    <span className="block truncate text-foreground" title={describe(e)}>
                      {describe(e)}
                    </span>
                    {e.type === "page_view" && e.durationMs ? (
                      <span className="text-[11px] text-muted-foreground">
                        on screen {fmtDuration(e.durationMs)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {e.userName ?? "Guest"}
                    {e.userEmail && (
                      <span className="block text-[11px] text-muted-foreground">{e.userEmail}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {[e.device, e.browser, e.os].filter(Boolean).join(" · ")}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <span className="font-mono">{e.ip ?? "—"}</span>
                    {where(e) && <span className="block text-[11px]">{where(e)}</span>}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onTrace(e.sessionId)}
                      className="font-medium text-primary hover:underline"
                    >
                      Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          onPage={setPage}
          label="events"
        />
      )}
    </Panel>
  );
}

// ─── Trace ───

type Trace = {
  sessionId: string;
  visitorId: string;
  events: EventRow[];
  otherVisits: {
    sessionId: string;
    start: string;
    end: string;
    pageViews: number;
    purchases: number;
    landing?: string;
  }[];
};

function TraceDrawer({
  sessionId,
  onClose,
  onTrace,
}: {
  sessionId: string;
  onClose: () => void;
  onTrace: (id: string) => void;
}) {
  const { data, error, reload } = useAdminData<Trace>(
    `/api/admin/activity/sessions/${encodeURIComponent(sessionId)}`,
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const first = data?.events[0];
  const start = first ? new Date(first.createdAt).getTime() : 0;
  const who = data?.events.find((e) => e.userName);
  const info = data?.events.find((e) => e.device) ?? first;
  const totalTime = data?.events.reduce((s, e) => s + (e.durationMs ?? 0), 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Visit trace"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="font-serif text-lg">Visit trace</h3>
            <p className="font-mono text-[11px] text-muted-foreground">visit {sessionId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4 text-xs">
          {error && <ErrorNotice message={error} onRetry={reload} />}
          {!data && !error && <Skeleton className="h-64" />}
          {data && first && (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-border p-3">
                {[
                  [
                    "Visitor",
                    who ? `${who.userName}${who.userEmail ? ` (${who.userEmail})` : ""}` : "Guest",
                  ],
                  ["Started", fmtDateTime(first.createdAt)],
                  ["Time on site", fmtDuration(totalTime)],
                  ["Events", String(data.events.length)],
                  [
                    "Device",
                    [info?.device, info?.browser, info?.os].filter(Boolean).join(" · ") || "—",
                  ],
                  ["IP address", info?.ip ?? "—"],
                  ["Location", (info && where(info)) || "—"],
                  [
                    "Came from",
                    first.referrerHost ??
                      first.utmSource ??
                      (first.referrer ? first.referrer : "Direct / bookmark"),
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-[11px] text-muted-foreground">{k}</dt>
                    <dd className="truncate font-medium text-foreground" title={v}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <div>
                <p className="mb-2 font-medium text-foreground">Step by step</p>
                <ol className="relative space-y-3 border-l border-border pl-4">
                  {data.events.map((e) => {
                    const t = EVENT_TYPES[e.type] ?? { icon: Activity, label: e.type };
                    const Icon = t.icon;
                    const offset = new Date(e.createdAt).getTime() - start;
                    return (
                      <li key={e._id} className="relative">
                        <span className="absolute -left-[1.42rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card">
                          <Icon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        </span>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="font-medium text-foreground">{t.label}</span>
                          <span className="tabular-nums text-[11px] text-muted-foreground">
                            {new Intl.DateTimeFormat("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              timeZone: "Asia/Dhaka",
                            }).format(new Date(e.createdAt))}
                            {offset > 0 && ` · +${fmtDuration(offset)}`}
                          </span>
                        </div>
                        <p className="break-all text-muted-foreground">{describe(e)}</p>
                        {e.type === "page_view" && e.durationMs ? (
                          <p className="text-[11px] text-muted-foreground">
                            Stayed {fmtDuration(e.durationMs)}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {data.otherVisits.length > 0 && (
                <div>
                  <p className="mb-2 font-medium text-foreground">Other visits by this visitor</p>
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {data.otherVisits.map((v) => (
                      <li key={v.sessionId}>
                        <button
                          type="button"
                          onClick={() => onTrace(v.sessionId)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-secondary/50"
                        >
                          <span>
                            {fmtDateTime(v.start)}
                            <span className="block text-[11px] text-muted-foreground">
                              {v.landing}
                            </span>
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {v.pageViews} pages{v.purchases ? ` · ${v.purchases} order` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Data & database ───

type DbReport = {
  status: {
    state: string;
    connected: boolean;
    database?: string;
    host?: string;
    pingMs?: number;
    serverVersion?: string;
    error?: string;
    checkedAt: string;
  };
  storage: null | {
    settings: {
      enabled: boolean;
      retentionDays: number;
      anonymizeIp: boolean;
      trackStaff: boolean;
      excludePaths: string[];
    };
    collection: {
      documents: number;
      sizeBytes: number | null;
      storageBytes: number | null;
      indexBytes: number | null;
    };
    oldest: string | null;
    newest: string | null;
    byType: { type: string; count: number }[];
    age: { olderThan7: number; olderThan30: number; olderThan90: number };
    autoDelete: { indexReady: boolean; description: string };
  };
};

const fmtBytes = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
};

const RETENTION_PRESETS = [7, 14, 30, 60, 90, 180, 365];
/** retentionDays 0 = keep forever */
const FOREVER = 0;

function DataAndDatabase() {
  const { can } = useAccess();
  const manage = can("activity.manage");
  const { data, error, loading, reload, setData } =
    useAdminData<DbReport>("/api/admin/activity/db");
  const [busy, setBusy] = useState<string | null>(null);

  const runDb = async (action: "connect" | "repair") => {
    setBusy(action);
    try {
      const result = await api<DbReport>("/api/admin/activity/db", {
        method: "POST",
        json: { action },
      });
      setData(result);
      if (result.status.connected) {
        toast.success(
          action === "repair"
            ? "Indexes checked and repaired."
            : `Connected to MongoDB in ${result.status.pingMs} ms.`,
        );
      } else {
        toast.error(result.status.error ?? "Couldn't connect to the database.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Database action failed.");
    } finally {
      setBusy(null);
    }
  };

  if (error && !data) return <ErrorNotice message={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  const s = data.status;
  const st = data.storage;

  return (
    <div className="space-y-5">
      <Panel
        title="Database connection"
        description="Live connection between this admin panel and MongoDB"
        action={
          <button
            type="button"
            onClick={() => runDb("connect")}
            className={primaryButton}
            disabled={busy !== null}
          >
            <Plug className={`h-4 w-4 ${busy === "connect" ? "animate-pulse" : ""}`} />
            {busy === "connect"
              ? "Connecting…"
              : s.connected
                ? "Test connection"
                : "Connect to database"}
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-xs">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${s.connected ? "bg-emerald-500" : "bg-rose-500"}`}
            aria-hidden="true"
          />
          <span className="font-semibold text-foreground">
            {s.connected ? "Connected" : `Not connected (${s.state})`}
          </span>
          {s.pingMs !== undefined && (
            <span className="text-muted-foreground">Round trip {s.pingMs} ms</span>
          )}
          {s.database && (
            <span className="text-muted-foreground">
              Database <span className="font-mono text-foreground">{s.database}</span>
            </span>
          )}
          {s.host && (
            <span className="text-muted-foreground">
              Host <span className="font-mono text-foreground">{s.host}</span>
            </span>
          )}
          {s.serverVersion && (
            <span className="text-muted-foreground">MongoDB {s.serverVersion}</span>
          )}
          <span className="ml-auto text-muted-foreground">checked {fmtRelative(s.checkedAt)}</span>
        </div>
        {s.error && <p className="mt-2 text-xs text-destructive">{s.error}</p>}
      </Panel>

      {st && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Activity records"
              value={fmtNumber(st.collection.documents)}
              hint={`collection activity_events`}
            />
            <StatTile
              label="Storage used"
              value={fmtBytes(st.collection.storageBytes)}
              hint={`data ${fmtBytes(st.collection.sizeBytes)} · indexes ${fmtBytes(st.collection.indexBytes)}`}
            />
            <StatTile
              label="Oldest record"
              value={st.oldest ? fmtRelative(st.oldest) : "—"}
              hint={st.oldest ? fmtDateTime(st.oldest) : "nothing stored yet"}
            />
            <StatTile
              label="Kept for"
              value={
                st.settings.retentionDays === FOREVER
                  ? "Forever"
                  : `${st.settings.retentionDays} days`
              }
              hint={
                st.settings.retentionDays === FOREVER
                  ? "never deleted automatically"
                  : st.autoDelete.indexReady
                    ? "then deleted automatically"
                    : "auto-delete index missing"
              }
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="What is stored" description="Records by type">
              <BarList
                rows={st.byType.map((t) => ({
                  name: EVENT_TYPES[t.type]?.label ?? t.type,
                  value: t.count,
                }))}
                empty="No activity stored yet."
              />
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {[
                  ["Older than 7 days", st.age.olderThan7],
                  ["Older than 30 days", st.age.olderThan30],
                  ["Older than 90 days", st.age.olderThan90],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-secondary/50 p-2">
                    <dt className="text-[11px] text-muted-foreground">{k}</dt>
                    <dd className="font-semibold tabular-nums">{fmtNumber(v as number)}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel
              title="Automatic delete"
              description={st.autoDelete.description}
              action={
                manage ? (
                  <button
                    type="button"
                    onClick={() => runDb("repair")}
                    className={secondaryButton}
                    disabled={busy !== null}
                  >
                    <Wrench className="h-3.5 w-3.5" />{" "}
                    {busy === "repair" ? "Repairing…" : "Repair indexes"}
                  </button>
                ) : undefined
              }
            >
              <TrackingSettings initial={st.settings} canEdit={manage} onSaved={reload} />
            </Panel>
          </div>

          {manage ? (
            <PurgePanel onDone={reload} total={st.collection.documents} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Only admins can delete activity data or change how long it is kept.
            </p>
          )}
        </>
      )}
      {loading && <p className="text-xs text-muted-foreground">Refreshing…</p>}
    </div>
  );
}

function TrackingSettings({
  initial,
  canEdit,
  onSaved,
}: {
  initial: {
    enabled: boolean;
    retentionDays: number;
    anonymizeIp: boolean;
    trackStaff: boolean;
    excludePaths: string[];
  };
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...initial, excludeText: initial.excludePaths.join("\n") });
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const dirty =
    form.enabled !== initial.enabled ||
    form.retentionDays !== initial.retentionDays ||
    form.anonymizeIp !== initial.anonymizeIp ||
    form.trackStaff !== initial.trackStaff ||
    form.excludeText.trim() !== initial.excludePaths.join("\n");

  const save = async () => {
    setSaving(true);
    try {
      const result = await api<{ deleted: number }>("/api/admin/activity/settings", {
        method: "PUT",
        json: {
          enabled: form.enabled,
          retentionDays: form.retentionDays,
          anonymizeIp: form.anonymizeIp,
          trackStaff: form.trackStaff,
          excludePaths: form.excludeText
            .split(/\n|,/)
            .map((p) => p.trim())
            .filter(Boolean),
          applyToExisting: applyToExisting && form.retentionDays !== initial.retentionDays,
        },
      });
      toast.success(
        result.deleted
          ? `Saved. ${fmtNumber(result.deleted)} older records deleted.`
          : form.retentionDays === FOREVER && initial.retentionDays !== FOREVER
            ? "Saved. Activity is now kept forever."
            : "Activity settings saved.",
      );
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const row = (label: string, hint: string, control: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      {control}
    </div>
  );

  return (
    <div className="divide-y divide-border">
      {row(
        "Record site activity",
        "Page views, carts and searches. Orders and sign-ins are always recorded.",
        <Switch
          label="Record site activity"
          checked={form.enabled}
          disabled={!canEdit}
          onChange={(v) => setForm({ ...form, enabled: v })}
        />,
      )}
      <div className="py-2.5">
        <p className="text-xs font-medium text-foreground">Keep activity for</p>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Default 30 days, after which MongoDB removes records on its own. Choose “Keep forever” to
          never delete automatically (storage grows over time; you can still delete by hand below).
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {RETENTION_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              disabled={!canEdit}
              onClick={() => setForm({ ...form, retentionDays: d })}
              className={`h-8 rounded-lg border px-2.5 text-xs font-medium disabled:opacity-50 ${
                form.retentionDays === d
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-secondary"
              }`}
            >
              {d} days
            </button>
          ))}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => setForm({ ...form, retentionDays: FOREVER })}
            className={`h-8 rounded-lg border px-2.5 text-xs font-medium disabled:opacity-50 ${
              form.retentionDays === FOREVER
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary"
            }`}
          >
            Keep forever
          </button>
          <input
            type="number"
            min={1}
            max={365}
            disabled={!canEdit}
            aria-label="Days to keep activity"
            placeholder="days"
            value={form.retentionDays === FOREVER ? "" : form.retentionDays}
            onChange={(e) =>
              setForm({
                ...form,
                retentionDays: Math.max(1, Math.min(365, Number(e.target.value) || 1)),
              })
            }
            className={`${inputClass} h-8 w-20 text-xs`}
          />
        </div>
        {form.retentionDays !== initial.retentionDays && canEdit && (
          <label className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={applyToExisting}
              onChange={(e) => setApplyToExisting(e.target.checked)}
            />
            {form.retentionDays === FOREVER
              ? "Also keep the records already stored forever (removes their delete dates)"
              : `Also apply to records already stored (deletes anything older than ${form.retentionDays} days now)`}
          </label>
        )}
      </div>
      {row(
        "Hide full IP addresses",
        "Store 103.145.118.0 instead of 103.145.118.22",
        <Switch
          label="Hide full IP addresses"
          checked={form.anonymizeIp}
          disabled={!canEdit}
          onChange={(v) => setForm({ ...form, anonymizeIp: v })}
        />,
      )}
      {row(
        "Record team visits",
        "Include visits by signed-in admins and staff",
        <Switch
          label="Record team visits"
          checked={form.trackStaff}
          disabled={!canEdit}
          onChange={(v) => setForm({ ...form, trackStaff: v })}
        />,
      )}
      <div className="py-2.5">
        <label htmlFor="exclude-paths" className="text-xs font-medium text-foreground">
          Don't record these pages
        </label>
        <p className="mb-1.5 text-[11px] text-muted-foreground">One path per line, e.g. /account</p>
        <textarea
          id="exclude-paths"
          rows={2}
          disabled={!canEdit}
          value={form.excludeText}
          onChange={(e) => setForm({ ...form, excludeText: e.target.value })}
          className={`${inputClass} h-auto py-2 font-mono text-xs`}
        />
      </div>
      {canEdit && (
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className={primaryButton}
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
    </div>
  );
}

type PurgeRequest =
  | { mode: "older_than"; days: number }
  | { mode: "range"; from: string; to: string }
  | { mode: "type"; type: string }
  | { mode: "all"; confirm: string };

function PurgePanel({ onDone, total }: { onDone: () => void; total: number }) {
  const [days, setDays] = useState(30);
  const [from, setFrom] = useState(todayInput(-30));
  const [to, setTo] = useState(todayInput(-1));
  const [type, setType] = useState("page_view");
  const [pending, setPending] = useState<{ request: PurgeRequest; text: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (!pending) return;
    setRunning(true);
    try {
      const body =
        pending.request.mode === "all" ? { mode: "all", confirm: confirmText } : pending.request;
      const result = await api<{ deleted: number }>("/api/admin/activity", {
        method: "DELETE",
        json: body,
      });
      toast.success(`Deleted ${fmtNumber(result.deleted)} records.`);
      setPending(null);
      setConfirmText("");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setRunning(false);
    }
  };

  const options = useMemo(
    () => Object.entries(EVENT_TYPES).map(([k, v]) => ({ value: k, label: v.label })),
    [],
  );

  return (
    <Panel
      title="Delete activity data now"
      description="Permanently removes records from MongoDB. This can't be undone."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-medium text-foreground">Older than</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={3650}
              aria-label="Days"
              value={days}
              onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))}
              className={`${inputClass} h-9 w-24`}
            />
            <span className="text-xs text-muted-foreground">days</span>
            <button
              type="button"
              className={`${secondaryButton} ml-auto`}
              onClick={() =>
                setPending({
                  request: { mode: "older_than", days },
                  text: `Delete all activity older than ${days} days?`,
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-medium text-foreground">Date range</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="From"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className={`${inputClass} h-9 w-auto`}
            />
            <input
              type="date"
              aria-label="To"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className={`${inputClass} h-9 w-auto`}
            />
            <button
              type="button"
              className={`${secondaryButton} ml-auto`}
              onClick={() =>
                setPending({
                  request: { mode: "range", from, to },
                  text: `Delete all activity from ${from} to ${to}?`,
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-medium text-foreground">One kind of event</p>
          <div className="mt-2 flex items-center gap-2">
            <select
              aria-label="Event type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`${inputClass} h-9 w-auto`}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${secondaryButton} ml-auto`}
              onClick={() =>
                setPending({
                  request: { mode: "type", type },
                  text: `Delete every “${EVENT_TYPES[type]?.label ?? type}” record?`,
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium text-foreground">Everything</p>
          <p className="text-[11px] text-muted-foreground">
            All {fmtNumber(total)} activity records
          </p>
          <button
            type="button"
            className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-4 text-sm font-semibold text-white hover:bg-destructive/90"
            onClick={() =>
              setPending({
                request: { mode: "all", confirm: "" },
                text: "Delete ALL site activity data?",
              })
            }
          >
            <Database className="h-3.5 w-3.5" /> Delete all activity
          </button>
        </div>
      </div>

      {pending && (
        <Modal
          title="Delete activity data"
          onClose={() => !running && setPending(null)}
          footer={
            <>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setPending(null)}
                disabled={running}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={run}
                disabled={running || (pending.request.mode === "all" && confirmText !== "DELETE")}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-4 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> {running ? "Deleting…" : "Delete permanently"}
              </button>
            </>
          }
        >
          <p className="text-sm text-foreground">{pending.text}</p>
          <p className="text-xs text-muted-foreground">
            The records are removed from MongoDB straight away. Orders, customers and invoices are
            not affected.
          </p>
          {pending.request.mode === "all" && (
            <label className="block text-xs">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={`${inputClass} mt-1`}
                autoFocus
              />
            </label>
          )}
        </Modal>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <HardDrive className="h-3 w-3" /> Every deletion is written to the team audit log.
        <Clock className="ml-2 h-3 w-3" /> Automatic deletion keeps running in the background.
      </p>
    </Panel>
  );
}
