"use client";

import React, { useEffect, useState } from "react";
import { Ban, History, KeyRound, LogOut, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PERMISSIONS, type Permission } from "@/lib/permissions";
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
  EmptyState,
  ErrorNotice,
  fmtDateTime,
  fmtNumber,
  fmtRelative,
  PageHeader,
  Pagination,
  Panel,
  Pill,
  qs,
  rangeQuery,
  RangePicker,
  Skeleton,
  useAccess,
  useAdminData,
  useDebounced,
  type RangeValue,
} from "./shared";

type SecurityData = {
  me: {
    name: string;
    email: string;
    role: string;
    roleName: string;
    permissions: Permission[];
    lastLoginAt: string | null;
    currentIp: string;
  };
  myLogins: {
    _id: string;
    type: string;
    ip?: string;
    device?: string;
    browser?: string;
    os?: string;
    city?: string;
    country?: string;
    createdAt: string;
  }[];
  failedLogins: null | {
    total: number;
    byIp: { ip: string; attempts: number; emails: string[]; last: string; country?: string }[];
  };
  blockedIps: string[] | null;
};

export function SecurityRbacModule({ onChangePassword }: { onChangePassword: () => void }) {
  const { can } = useAccess();
  const { data, error, reload, setData } = useAdminData<SecurityData>("/api/admin/security");
  const [signingOut, setSigningOut] = useState(false);

  const saveBlocked = async (ips: string[], message: string) => {
    try {
      const r = await api<{ blockedIps: string[] }>("/api/admin/security", {
        method: "PUT",
        json: { blockedIps: ips },
      });
      setData((d) => (d ? { ...d, blockedIps: r.blockedIps } : d));
      toast.success(message);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
      return false;
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Security"
        description="Your account, sign-in history, blocked networks and everything the team changed."
      />
      {error && !data && <ErrorNotice message={error} onRetry={reload} />}
      {!data && !error && <Skeleton className="h-64" />}
      {data && (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Your account">
              <dl className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Name", data.me.name],
                  ["Email", data.me.email],
                  ["Role", data.me.roleName],
                  ["Last sign-in", data.me.lastLoginAt ? fmtDateTime(data.me.lastLoginAt) : "—"],
                  ["Your IP right now", data.me.currentIp],
                  [
                    "Permissions",
                    `${data.me.permissions.length} of ${Object.keys(PERMISSIONS).length}`,
                  ],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] text-muted-foreground">{k}</dt>
                    <dd className="truncate font-medium" title={v}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={primaryButton} onClick={onChangePassword}>
                  <KeyRound className="h-4 w-4" /> Change password
                </button>
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => setSigningOut(true)}
                >
                  <LogOut className="h-4 w-4" /> Sign out other devices
                </button>
              </div>
              {data.me.role === "staff" && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer font-medium text-primary">
                    What my role can do
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {data.me.permissions.map((p) => (
                      <Pill key={p}>{PERMISSIONS[p]?.label ?? p}</Pill>
                    ))}
                  </div>
                </details>
              )}
            </Panel>

            <Panel title="Your recent sign-ins" description="From the site activity log">
              {data.myLogins.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No sign-ins recorded yet (recording started with this update).
                </p>
              ) : (
                <ul className="divide-y divide-border text-xs">
                  {data.myLogins.map((l) => (
                    <li key={l._id} className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-2">
                        {l.type === "login_failed" ? (
                          <ShieldAlert className="h-4 w-4 text-rose-600" aria-label="Failed" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-label="Success" />
                        )}
                        <span>
                          {l.type === "login"
                            ? "Signed in"
                            : l.type === "logout"
                              ? "Signed out"
                              : "Wrong password"}
                          <span className="block text-[11px] text-muted-foreground">
                            {[l.browser, l.os, l.device].filter(Boolean).join(" · ")} ·{" "}
                            <span className="font-mono">{l.ip ?? "—"}</span>
                            {l.city || l.country
                              ? ` · ${[l.city, l.country].filter(Boolean).join(", ")}`
                              : ""}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {fmtRelative(l.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {(data.failedLogins || data.blockedIps) && (
            <div className="grid gap-5 lg:grid-cols-2">
              {data.failedLogins && (
                <Panel
                  title="Failed sign-in attempts"
                  description={`${fmtNumber(data.failedLogins.total)} in the last 7 days, by network`}
                >
                  {data.failedLogins.byIp.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No failed attempts.{" "}
                    </p>
                  ) : (
                    <ul className="divide-y divide-border text-xs">
                      {data.failedLogins.byIp.map((r) => {
                        const blocked = data.blockedIps?.includes(r.ip);
                        return (
                          <li key={r.ip} className="flex items-center justify-between gap-3 py-2">
                            <span className="min-w-0">
                              <span className="font-mono font-medium">{r.ip}</span>{" "}
                              {r.country && (
                                <span className="text-muted-foreground">· {r.country}</span>
                              )}
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {r.attempts} attempts · last {fmtRelative(r.last)}
                                {r.emails.length ? ` · tried ${r.emails.join(", ")}` : ""}
                              </span>
                            </span>
                            {data.blockedIps &&
                              (blocked ? (
                                <Pill tone="bad">Blocked</Pill>
                              ) : (
                                r.ip !== "unknown" &&
                                r.ip !== data.me.currentIp && (
                                  <button
                                    type="button"
                                    className={secondaryButton}
                                    onClick={() =>
                                      saveBlocked(
                                        [...(data.blockedIps ?? []), r.ip],
                                        `${r.ip} blocked.`,
                                      )
                                    }
                                  >
                                    <Ban className="h-3.5 w-3.5" /> Block
                                  </button>
                                )
                              ))}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>
              )}
              {data.blockedIps && (
                <BlockList ips={data.blockedIps} onSave={saveBlocked} myIp={data.me.currentIp} />
              )}
            </div>
          )}
        </>
      )}

      {can("audit.view") && <AuditLog />}

      {signingOut && (
        <Modal
          title="Sign out other devices"
          onClose={() => setSigningOut(false)}
          footer={
            <>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setSigningOut(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={async () => {
                  try {
                    await api("/api/admin/security", {
                      method: "POST",
                      json: { action: "sign-out-everywhere" },
                    });
                    toast.success("Every other device has been signed out.");
                    setSigningOut(false);
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Couldn't sign out other devices.",
                    );
                  }
                }}
              >
                Sign them out
              </button>
            </>
          }
        >
          <p className="text-sm">
            Phones, tablets and other browsers signed in to your account will be signed out. You
            stay signed in here.
          </p>
        </Modal>
      )}
    </div>
  );
}

function BlockList({
  ips,
  onSave,
  myIp,
}: {
  ips: string[];
  onSave: (ips: string[], msg: string) => Promise<boolean>;
  myIp: string;
}) {
  const [value, setValue] = useState("");
  return (
    <Panel
      title="Blocked networks (IP addresses)"
      description="Blocked IPs can't sign in, use the admin panel, or appear in site activity."
    >
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const ip = value.trim();
          if (!ip) return;
          if (await onSave([...ips, ip], `${ip} blocked.`)) setValue("");
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 103.20.1.1"
          aria-label="IP address to block"
          className={`${inputClass} font-mono`}
        />
        <button type="submit" className={primaryButton} disabled={!value.trim()}>
          <Ban className="h-4 w-4" /> Block
        </button>
      </form>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Your own IP ({myIp}) can't be blocked.
      </p>
      {ips.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No blocked IPs.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border text-xs">
          {ips.map((ip) => (
            <li key={ip} className="flex items-center justify-between py-1.5">
              <span className="font-mono">{ip}</span>
              <button
                type="button"
                className={iconButton}
                aria-label={`Unblock ${ip}`}
                onClick={() =>
                  onSave(
                    ips.filter((x) => x !== ip),
                    `${ip} unblocked.`,
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

const AREAS: [string, string][] = [
  ["", "Everything"],
  ["order", "Orders"],
  ["invoice", "Invoices"],
  ["stock", "Stock"],
  ["team", "Team"],
  ["role", "Roles"],
  ["customer", "Customers"],
  ["review", "Reviews"],
  ["expense", "Expenses"],
  ["payments", "Payments"],
  ["settings", "Settings"],
  ["activity", "Activity data"],
  ["security", "Security"],
];

function AuditLog() {
  const [range, setRange] = useState<RangeValue>({ key: "30d" });
  const [area, setArea] = useState("");
  const [actor, setActor] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  useEffect(() => setPage(1), [range, area, actor, q]);
  const { data, error, reload } = useAdminData<{
    items: {
      _id: string;
      actorName: string;
      actorRole: string;
      action: string;
      summary: string;
      ip?: string;
      createdAt: string;
    }[];
    total: number;
    totalPages: number;
    actors: { id: string; name: string; count: number }[];
  }>(`/api/admin/audit${qs({ ...rangeQuery(range), area, actor, q, page })}`);

  return (
    <Panel
      title="Team audit log"
      description="Who changed what, when and from where. Kept for 12 months."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <RangePicker
          value={range}
          onChange={setRange}
          options={["today", "7d", "30d", "90d", "year", "custom"]}
        />
        <select
          aria-label="Area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className={`${inputClass} h-9 w-auto`}
        >
          {AREAS.map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          aria-label="Team member"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          className={`${inputClass} h-9 w-auto`}
        >
          <option value="">Everyone</option>
          {data?.actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.count})
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search changes"
          aria-label="Search audit log"
          className={`${inputClass} h-9 max-w-xs`}
        />
      </div>
      {error && <ErrorNotice message={error} onRetry={reload} />}
      {!data && !error && <Skeleton className="h-48" />}
      {data && data.items.length === 0 && (
        <EmptyState icon={History} title="No changes recorded for these filters." />
      )}
      {data && data.items.length > 0 && (
        <ul className="divide-y divide-border text-xs">
          {data.items.map((e) => (
            <li
              key={e._id}
              className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-foreground">{e.summary}</span>
                <span className="text-[11px] text-muted-foreground">
                  {e.actorName} ({e.actorRole.replace("_", " ")}) ·{" "}
                  <span className="font-mono">{e.ip ?? "—"}</span> · {e.action}
                </span>
              </span>
              <span
                className="shrink-0 tabular-nums text-muted-foreground"
                title={fmtDateTime(e.createdAt)}
              >
                {fmtRelative(e.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          onPage={setPage}
          label="changes"
        />
      )}
    </Panel>
  );
}
