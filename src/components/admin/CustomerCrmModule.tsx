"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  KeyRound,
  Mail,
  MessageCircle,
  Phone,
  Search,
  UserX,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import {
  api,
  Field,
  iconButton,
  inputClass,
  Modal,
  primaryButton,
  secondaryButton,
} from "./catalog/ui";
import {
  downloadCsv,
  EmptyState,
  ErrorNotice,
  fmtDate,
  fmtDateTime,
  fmtNumber,
  fmtRelative,
  fmtTaka,
  PageHeader,
  Pagination,
  Panel,
  Pill,
  qs,
  Segmented,
  Skeleton,
  StatTile,
  useAccess,
  useAdminData,
  useDebounced,
} from "./shared";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  walletBalance: number;
  rewardPoints: number;
  createdAt: string | null;
  lastLoginAt: string | null;
  orders: number;
  allOrders: number;
  spent: number;
  avgOrder: number;
  lastOrderAt: string | null;
  district: string | null;
  segment: string;
};

type ListResponse = {
  items: Customer[];
  total: number;
  totalPages: number;
  segments: Record<string, number> & { lifetimeValue: number };
};

const SEGMENTS: Record<
  string,
  { label: string; tone: "accent" | "good" | "info" | "warn" | "bad" | "neutral"; rule: string }
> = {
  vip: { label: "VIP", tone: "accent", rule: "Spent ৳20,000+ or 5+ orders" },
  loyal: { label: "Loyal", tone: "good", rule: "2 or more orders" },
  new: { label: "New", tone: "info", rule: "Joined in the last 30 days" },
  at_risk: { label: "At risk", tone: "warn", rule: "No order for 90+ days" },
  no_orders: { label: "No orders", tone: "neutral", rule: "Signed up, never ordered" },
  inactive: { label: "Suspended", tone: "bad", rule: "Account switched off" },
  regular: { label: "Regular", tone: "neutral", rule: "One order" },
};

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("880") ? digits : digits.startsWith("0") ? `88${digits}` : digits;
  return `https://wa.me/${intl}`;
}

export function CustomerCrmModule({ initialSearch = "" }: { initialSearch?: string }) {
  const { can } = useAccess();
  const [segment, setSegment] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDebounced(search);
  useEffect(() => setSearch(initialSearch), [initialSearch]);
  useEffect(() => setPage(1), [segment, q, sort]);

  const { data, error, loading, reload, setData } = useAdminData<ListResponse>(
    `/api/admin/customers${qs({ segment, q, sort, page })}`,
  );

  const toggleActive = async (c: Customer) => {
    try {
      await api("/api/admin/users", {
        method: "PATCH",
        json: { userId: c.id, isActive: !c.isActive },
      });
      setData((d) =>
        d
          ? {
              ...d,
              items: d.items.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)),
            }
          : d,
      );
      toast.success(c.isActive ? `${c.name} suspended.` : `${c.name} re-activated.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the account.");
    }
  };

  const seg = data?.segments;
  const exportCsv = () =>
    data &&
    downloadCsv("customers.csv", [
      [
        "Name",
        "Email",
        "Phone",
        "District",
        "Orders",
        "Spent (BDT)",
        "Average order",
        "Last order",
        "Joined",
        "Segment",
        "Active",
      ],
      ...data.items.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.district,
        c.orders,
        Math.round(c.spent),
        Math.round(c.avgOrder),
        c.lastOrderAt ? fmtDate(c.lastOrderAt) : "",
        c.createdAt ? fmtDate(c.createdAt) : "",
        SEGMENTS[c.segment]?.label ?? c.segment,
        c.isActive ? "yes" : "no",
      ]),
    ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Lifetime orders and spend are calculated from real orders (cancelled, returned and refunded orders don't count)."
        actions={
          <button
            type="button"
            className={secondaryButton}
            onClick={exportCsv}
            disabled={!data?.items.length}
          >
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {seg && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Customer accounts"
            value={fmtNumber(seg.all)}
            hint={`${fmtNumber(seg.new)} joined in 30 days`}
          />
          <StatTile
            label="Lifetime value"
            value={fmtTaka(seg.lifetimeValue)}
            hint={seg.all ? `${fmtTaka(seg.lifetimeValue / seg.all)} per account` : undefined}
          />
          <StatTile
            label="Repeat buyers"
            value={fmtNumber(seg.loyal)}
            hint={`${fmtNumber(seg.vip)} VIP`}
          />
          <StatTile
            label="Never ordered"
            value={fmtNumber(seg.no_orders)}
            hint={`${fmtNumber(seg.at_risk)} at risk · ${fmtNumber(seg.inactive)} suspended`}
          />
        </div>
      )}

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented
            label="Customer segment"
            value={segment}
            onChange={setSegment}
            options={[
              { value: "all", label: `All${seg ? ` (${seg.all})` : ""}` },
              ...["vip", "loyal", "new", "at_risk", "no_orders", "inactive"].map((k) => ({
                value: k,
                label: `${SEGMENTS[k].label}${seg ? ` (${seg[k] ?? 0})` : ""}`,
              })),
            ]}
          />
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email or phone"
              aria-label="Search customers"
              className={`${inputClass} h-9 pl-8`}
            />
          </div>
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`${inputClass} h-9 w-auto`}
          >
            <option value="newest">Newest accounts</option>
            <option value="spent">Highest spend</option>
            <option value="orders">Most orders</option>
            <option value="last_order">Latest order</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
        {segment !== "all" && SEGMENTS[segment] && (
          <p className="mb-3 text-xs text-muted-foreground">{SEGMENTS[segment].rule}</p>
        )}

        {error && <ErrorNotice message={error} onRetry={reload} />}
        {!data && !error && <Skeleton className="h-80" />}
        {data && data.items.length === 0 && <EmptyState icon={Users} title="No customers match." />}
        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table
              className={`w-full min-w-[54rem] text-left text-xs ${loading ? "opacity-60" : ""}`}
            >
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Segment</th>
                  <th className="px-3 py-2 text-right font-medium">Orders</th>
                  <th className="px-3 py-2 text-right font-medium">Spent</th>
                  <th className="px-3 py-2 text-right font-medium">Avg order</th>
                  <th className="px-3 py-2 font-medium">Last order</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                  <th className="py-2 pl-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/40">
                    <td className="py-2.5 pr-3">
                      <button type="button" onClick={() => setOpenId(c.id)} className="text-left">
                        <span className="block font-medium text-foreground hover:text-primary">
                          {c.name}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{c.email}</span>
                        {(c.phone || c.district) && (
                          <span className="block text-[11px] text-muted-foreground">
                            {[c.phone, c.district].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill tone={SEGMENTS[c.segment]?.tone ?? "neutral"}>
                        {SEGMENTS[c.segment]?.label ?? c.segment}
                      </Pill>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {c.orders}
                      {c.allOrders > c.orders && (
                        <span className="block text-[11px] text-muted-foreground">
                          +{c.allOrders - c.orders} cancelled
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {fmtTaka(c.spent)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {c.orders ? fmtTaka(c.avgOrder) : "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.lastOrderAt ? fmtRelative(c.lastOrderAt) : "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                    <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                      {c.phone && (
                        <a
                          href={whatsappLink(c.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className={iconButton}
                          title="WhatsApp"
                          aria-label={`WhatsApp ${c.name}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      <a
                        href={`mailto:${c.email}`}
                        className={iconButton}
                        title="Email"
                        aria-label={`Email ${c.name}`}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                      {can("customers.manage") && (
                        <button
                          type="button"
                          className={`${iconButton} ${c.isActive ? "" : "text-emerald-600"}`}
                          title={c.isActive ? "Suspend account" : "Re-activate account"}
                          aria-label={c.isActive ? `Suspend ${c.name}` : `Re-activate ${c.name}`}
                          onClick={() => toggleActive(c)}
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
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
            label="customers"
          />
        )}
      </Panel>

      {openId && <CustomerDrawer id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

type Detail = {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    emailVerified: boolean;
    provider: string;
    walletBalance: number;
    rewardPoints: number;
    createdAt: string | null;
    lastLoginAt: string | null;
    role: string;
  };
  stats: {
    orders: number;
    allOrders: number;
    spent: number;
    avgOrder: number;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
    reviews: number;
    wishlist: number;
    favouriteProducts: { name: string; quantity: number }[];
  };
  addresses: {
    _id: string;
    label: string;
    fullName: string;
    phone: string;
    streetAddress: string;
    area: string;
    district: string;
    division: string;
    isDefault: boolean;
  }[];
  orders: {
    _id: string;
    orderNumber: string;
    total: number;
    status: keyof typeof ORDER_STATUS_CONFIG;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    items: { productName: string; quantity: number }[];
  }[];
  activity:
    | {
        _id: string;
        type: string;
        path?: string;
        title?: string;
        productName?: string;
        searchTerm?: string;
        orderNumber?: string;
        device?: string;
        createdAt: string;
      }[]
    | null;
};

function CustomerDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { can } = useAccess();
  const { data, error, reload } = useAdminData<Detail>(`/api/admin/customers/${id}`);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !resetting && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, resetting]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Customer"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="font-serif text-lg">{data?.customer.name ?? "Customer"}</h3>
            {data && <p className="text-xs text-muted-foreground">{data.customer.email}</p>}
          </div>
          <button type="button" className={iconButton} onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4 text-xs">
          {error && <ErrorNotice message={error} onRetry={reload} />}
          {!data && !error && <Skeleton className="h-80" />}
          {data && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Orders", fmtNumber(data.stats.orders)],
                  ["Spent", fmtTaka(data.stats.spent)],
                  ["Avg order", data.stats.orders ? fmtTaka(data.stats.avgOrder) : "—"],
                  ["Wishlist", fmtNumber(data.stats.wishlist)],
                  ["Reviews", fmtNumber(data.stats.reviews)],
                  ["Reward points", fmtNumber(data.customer.rewardPoints)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-secondary/60 p-2.5">
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                    <p className="text-sm font-semibold tabular-nums">{v}</p>
                  </div>
                ))}
              </div>

              <dl className="grid grid-cols-2 gap-2">
                {[
                  ["Phone", data.customer.phone || data.addresses[0]?.phone || "—"],
                  ["Joined", fmtDate(data.customer.createdAt)],
                  [
                    "Last sign-in",
                    data.customer.lastLoginAt ? fmtDateTime(data.customer.lastLoginAt) : "—",
                  ],
                  ["Sign-in method", data.customer.provider],
                  ["Email verified", data.customer.emailVerified ? "Yes" : "No"],
                  ["Account", data.customer.isActive ? "Active" : "Suspended"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-2">
                {(data.customer.phone || data.addresses[0]?.phone) && (
                  <a
                    className={secondaryButton}
                    href={whatsappLink(data.customer.phone || data.addresses[0].phone)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                {(data.customer.phone || data.addresses[0]?.phone) && (
                  <a
                    className={secondaryButton}
                    href={`tel:${data.customer.phone || data.addresses[0].phone}`}
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                )}
                {can("roles.manage") && (
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={() => setResetting(true)}
                  >
                    <KeyRound className="h-4 w-4" /> Set new password
                  </button>
                )}
              </div>

              {data.stats.favouriteProducts.length > 0 && (
                <section>
                  <p className="mb-1.5 font-medium">Buys most</p>
                  <div className="flex flex-wrap gap-1">
                    {data.stats.favouriteProducts.map((p) => (
                      <Pill key={p.name}>
                        {p.quantity}× {p.name}
                      </Pill>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <p className="mb-1.5 font-medium">Orders ({data.stats.allOrders})</p>
                {data.orders.length === 0 ? (
                  <p className="text-muted-foreground">No orders yet.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {data.orders.map((o) => (
                      <li key={o._id} className="flex items-center justify-between gap-3 p-2.5">
                        <span className="min-w-0">
                          <span className="font-mono font-semibold">{o.orderNumber}</span>
                          <span className="block truncate text-muted-foreground">
                            {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-semibold tabular-nums">
                            {fmtTaka(o.total)}
                          </span>
                          <span className="text-muted-foreground">
                            {ORDER_STATUS_CONFIG[o.status]?.label ?? o.status} ·{" "}
                            {fmtDate(o.createdAt)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {data.addresses.length > 0 && (
                <section>
                  <p className="mb-1.5 font-medium">Saved addresses</p>
                  <ul className="space-y-1.5">
                    {data.addresses.map((a) => (
                      <li key={a._id} className="rounded-lg border border-border p-2">
                        <span className="font-medium">
                          {a.label}
                          {a.isDefault ? " · default" : ""}
                        </span>
                        <span className="block text-muted-foreground">
                          {[a.streetAddress, a.area, a.district, a.division]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.activity && (
                <section>
                  <p className="mb-1.5 font-medium">Recent site activity</p>
                  {data.activity.length === 0 ? (
                    <p className="text-muted-foreground">No recorded activity while signed in.</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {data.activity.slice(0, 20).map((e) => (
                        <li key={e._id} className="flex justify-between gap-3 p-2">
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{e.type.replace(/_/g, " ")}</span>{" "}
                            <span className="text-muted-foreground">
                              {e.productName ?? e.searchTerm ?? e.orderNumber ?? e.title ?? e.path}
                            </span>
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {fmtRelative(e.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
      {resetting && data && (
        <ResetPassword userId={id} name={data.customer.name} onClose={() => setResetting(false)} />
      )}
    </div>
  );
}

function ResetPassword({
  userId,
  name,
  onClose,
}: {
  userId: string;
  name: string;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Modal
        title={`New password for ${name}`}
        onClose={onClose}
        footer={
          <>
            <button type="button" className={secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={primaryButton}
              disabled={saving || password.length < 10}
              onClick={async () => {
                setSaving(true);
                try {
                  await api("/api/admin/users/password", {
                    method: "POST",
                    json: { userId, newPassword: password },
                  });
                  toast.success(`Password changed for ${name}. They were signed out everywhere.`);
                  onClose();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Couldn't change the password.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Set password"}
            </button>
          </>
        }
      >
        <Field
          label="New password"
          htmlFor="cp-new"
          hint="At least 10 characters with 3 of: lowercase, uppercase, number, symbol."
        >
          <input
            id="cp-new"
            type="text"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </Field>
      </Modal>
    </div>
  );
}
