"use client";

import React, { useState } from "react";
import { CheckCircle2, Cpu, Database, Plug, XCircle } from "lucide-react";
import { toast } from "sonner";

import { api, primaryButton } from "./catalog/ui";
import {
  ErrorNotice,
  fmtNumber,
  fmtRelative,
  PageHeader,
  Panel,
  Skeleton,
  StatTile,
  useAdminData,
} from "./shared";

type DbStatus = {
  state: string;
  connected: boolean;
  database?: string;
  host?: string;
  pingMs?: number;
  serverVersion?: string;
  error?: string;
  checkedAt: string;
};
type Collection = {
  name: string;
  documents: number;
  sizeBytes: number | null;
  storageBytes: number | null;
  indexBytes: number | null;
};
type Data = {
  database: DbStatus;
  collections: Collection[];
  services: { name: string; ok: boolean; detail: string }[];
  runtime: {
    node: string;
    environment: string;
    uptimeSeconds: number;
    memoryMb: number;
    heapMb: number;
    platform: string;
  };
};

const bytes = (n: number | null) =>
  n == null
    ? "—"
    : n < 1048576
      ? `${(n / 1024).toFixed(1)} KB`
      : n < 1073741824
        ? `${(n / 1048576).toFixed(1)} MB`
        : `${(n / 1073741824).toFixed(2)} GB`;

const uptime = (s: number) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

/** Database connection, collection sizes and which services are configured. */
export function ApiWebhooksHealthModule() {
  const { data, error, reload, setData } = useAdminData<Data>("/api/admin/system");
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    setConnecting(true);
    try {
      const r = await api<Pick<Data, "database" | "collections">>("/api/admin/system", {
        method: "POST",
        json: { action: "connect" },
      });
      setData((d) => (d ? { ...d, ...r } : d));
      if (r.database.connected)
        toast.success(`Connected to MongoDB — ${r.database.pingMs} ms round trip.`);
      else toast.error(r.database.error ?? "Couldn't connect.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't connect.");
    } finally {
      setConnecting(false);
    }
  };

  if (error && !data) return <ErrorNotice message={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  const db = data.database;
  const totalDocs = data.collections.reduce((s, c) => s + c.documents, 0);
  const totalStorage = data.collections.reduce(
    (s, c) => s + (c.storageBytes ?? 0) + (c.indexBytes ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="System & database"
        description="Live status of the MongoDB connection and the services the shop depends on."
        actions={
          <button type="button" className={primaryButton} onClick={connect} disabled={connecting}>
            <Plug className={`h-4 w-4 ${connecting ? "animate-pulse" : ""}`} />
            {connecting ? "Connecting…" : db.connected ? "Test connection" : "Connect to database"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Database"
          value={db.connected ? "Connected" : "Offline"}
          hint={db.connected ? `${db.pingMs} ms · checked ${fmtRelative(db.checkedAt)}` : db.error}
        />
        <StatTile
          label="Records stored"
          value={fmtNumber(totalDocs)}
          hint={`${data.collections.length} collections`}
        />
        <StatTile label="Storage used" value={bytes(totalStorage || null)} hint="data + indexes" />
        <StatTile
          label="Server up for"
          value={uptime(data.runtime.uptimeSeconds)}
          hint={`${data.runtime.memoryMb} MB memory · Node ${data.runtime.node}`}
        />
      </div>

      <Panel
        title="Connection"
        description="Credentials stay on the server; only the host name is shown."
      >
        <dl className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["State", db.state],
            ["Database name", db.database ?? "—"],
            ["Host", db.host ?? "—"],
            ["MongoDB version", db.serverVersion ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-secondary/50 p-2.5">
              <dt className="text-[11px] text-muted-foreground">{k}</dt>
              <dd className="truncate font-mono font-medium" title={v}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Panel title="Collections" description="Every collection in the database">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Collection</th>
                  <th className="px-3 py-2 text-right font-medium">Records</th>
                  <th className="px-3 py-2 text-right font-medium">Data</th>
                  <th className="py-2 pl-3 text-right font-medium">Indexes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.collections.map((c) => (
                  <tr key={c.name}>
                    <td className="py-1.5 pr-3 font-mono">
                      <Database
                        className="mr-1.5 inline h-3 w-3 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {c.name}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {fmtNumber(c.documents)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{bytes(c.storageBytes)}</td>
                    <td className="py-1.5 pl-3 text-right tabular-nums">{bytes(c.indexBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel
            title="Services"
            description="Whether each integration's keys are set on the server"
          >
            <ul className="space-y-2 text-xs">
              {data.services.map((s) => (
                <li key={s.name} className="flex items-start gap-2">
                  {s.ok ? (
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-label="Set up"
                    />
                  ) : (
                    <XCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-label="Not set up"
                    />
                  )}
                  <span>
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {s.ok ? "Configured" : `Not configured · ${s.detail}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Server">
            <dl className="space-y-1.5 text-xs">
              {[
                ["Environment", data.runtime.environment],
                ["Node.js", data.runtime.node],
                ["Platform", data.runtime.platform],
                ["Memory", `${data.runtime.memoryMb} MB (heap ${data.runtime.heapMb} MB)`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Cpu className="h-3 w-3" aria-hidden="true" /> {k}
                  </dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
