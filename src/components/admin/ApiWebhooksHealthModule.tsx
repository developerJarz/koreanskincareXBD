"use client";

import React, { useState } from "react";
import {
  Activity,
  Key,
  Webhook,
  Database,
  Download,
  RefreshCw,
  CheckCircle,
  Plus,
  Trash2,
  Send,
  Cpu,
  Server,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export function ApiWebhooksHealthModule() {
  const [apiKeys, setApiKeys] = useState([
    {
      id: "key_1",
      name: "Mobile App POS Integration",
      prefix: "shj_live_8910a",
      created: "10 Aug 2026",
      status: "active",
      scope: "read:orders, write:orders",
    },
    {
      id: "key_2",
      name: "Steadfast Auto Dispatch Sync",
      prefix: "shj_live_7712b",
      created: "05 Aug 2026",
      status: "active",
      scope: "read:inventory, write:shipments",
    },
  ]);

  const [webhooks, setWebhooks] = useState([
    {
      id: "whk_1",
      url: "https://api.steadfast.com.bd/v1/shajgoj-callback",
      event: "order.created",
      status: "active",
      lastTrigger: "12 mins ago (HTTP 200 OK)",
    },
    {
      id: "whk_2",
      url: "https://greenweb.com.bd/sms-trigger",
      event: "order.shipped",
      status: "active",
      lastTrigger: "1 hour ago (HTTP 200 OK)",
    },
  ]);

  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleTestWebhook = (url: string) => {
    toast.loading(`Dispatching test payload to ${url}...`);
    setTimeout(() => {
      toast.dismiss();
      toast.success("Webhook test payload accepted with HTTP 200 OK!");
    }, 800);
  };

  const handleGenerateBackup = () => {
    setIsBackingUp(true);
    toast.loading("Generating full MongoDB database JSON snapshot...");
    setTimeout(() => {
      setIsBackingUp(false);
      toast.dismiss();

      // Trigger dummy download
      const backupData = {
        store: "Shajgoj.bd",
        version: "2.4-enterprise",
        timestamp: new Date().toISOString(),
        status: "complete_snapshot",
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shajgoj_db_backup_${Date.now()}.json`;
      a.click();
      toast.success("Database backup downloaded successfully!");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h2 className="font-serif text-2xl font-bold">API, Webhooks & System Health</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Developer REST APIs, real-time webhooks, MongoDB latency & automated backup engine
          </p>
        </div>

        <button
          onClick={handleGenerateBackup}
          disabled={isBackingUp}
          className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Create DB Backup Snapshot</span>
        </button>
      </div>

      {/* System Health Diagnostics */}
      <div className="grid md:grid-cols-4 gap-4 text-xs">
        <div className="bg-card border border-border p-4 rounded-3xl shadow-xs space-y-1">
          <span className="text-muted-foreground font-bold uppercase text-[10px]">
            MongoDB Atlas Status
          </span>
          <div className="flex items-center gap-2 text-foreground font-bold text-base mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected (24ms)</span>
          </div>
          <span className="text-[10px] text-emerald-600">Dhaka Edge Cluster</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-3xl shadow-xs space-y-1">
          <span className="text-muted-foreground font-bold uppercase text-[10px]">
            Server Memory
          </span>
          <p className="font-serif font-bold text-2xl mt-1 text-foreground">184 MB / 1 GB</p>
          <span className="text-[10px] text-muted-foreground">Node.js Next 15 Serverless</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-3xl shadow-xs space-y-1">
          <span className="text-muted-foreground font-bold uppercase text-[10px]">
            API Health Uptime
          </span>
          <p className="font-serif font-bold text-2xl mt-1 text-emerald-600">99.98%</p>
          <span className="text-[10px] text-muted-foreground">Zero downtime past 30 days</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-3xl shadow-xs space-y-1">
          <span className="text-muted-foreground font-bold uppercase text-[10px]">
            Route Cache Hit Rate
          </span>
          <p className="font-serif font-bold text-2xl mt-1 text-primary">94.2%</p>
          <span className="text-[10px] text-emerald-600">Instant storefront rendering</span>
        </div>
      </div>

      {/* REST API Keys Management */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg">REST API Keys</h3>
          <button
            onClick={() => toast.success("New production API Key generated!")}
            className="px-3 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-bold transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Key</span>
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {apiKeys.map((k) => (
            <div
              key={k.id}
              className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold text-foreground">{k.name}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  Key: {k.prefix}•••••••••••• · Scopes: {k.scope}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 self-start sm:self-auto">
                {k.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Webhooks */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg">Event Webhooks</h3>
          <span className="text-muted-foreground">Auto-triggered on order lifecycle events</span>
        </div>

        <div className="space-y-2.5">
          {webhooks.map((w) => (
            <div
              key={w.id}
              className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="font-mono font-bold text-primary">{w.event}</div>
                <div className="text-[11px] text-foreground mt-0.5">{w.url}</div>
                <div className="text-[10px] text-muted-foreground">{w.lastTrigger}</div>
              </div>
              <button
                onClick={() => handleTestWebhook(w.url)}
                className="px-3 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Send className="w-3 h-3" />
                <span>Test Ping</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
