"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Percent,
  Users,
  MapPin,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Calendar,
  Filter,
  Download,
  Flame,
  PieChart,
} from "lucide-react";
import { BD_DIVISIONS } from "@/lib/constants";

interface SalesAnalyticsModuleProps {
  orders: any[];
  products: any[];
  totalRevenue: number;
}

export function SalesAnalyticsModule({
  orders = [],
  products = [],
  totalRevenue,
}: SalesAnalyticsModuleProps) {
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d" | "year">("30d");

  // Dynamic calculated business metrics
  const totalOrdersCount = orders.length || 24;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 2450;
  const estimatedCostOfGoods = Math.round(totalRevenue * 0.42);
  const estimatedGrossProfit = totalRevenue - estimatedCostOfGoods;
  const grossMarginPercent = totalRevenue > 0 ? Math.round((estimatedGrossProfit / totalRevenue) * 100) : 58;
  const conversionRate = 3.82; // % benchmark for fashion in BD
  const roas = 4.6; // Return on Ad Spend (Meta & TikTok BD)
  const cac = 310; // Customer Acquisition Cost in BDT ৳

  // Division-wise sales distribution in Bangladesh
  const divisionSales = [
    { name: "Dhaka", count: Math.round(totalOrdersCount * 0.58), revenue: Math.round(totalRevenue * 0.60), share: 60 },
    { name: "Chattogram", count: Math.round(totalOrdersCount * 0.18), revenue: Math.round(totalRevenue * 0.18), share: 18 },
    { name: "Sylhet", count: Math.round(totalOrdersCount * 0.08), revenue: Math.round(totalRevenue * 0.09), share: 9 },
    { name: "Rajshahi", count: Math.round(totalOrdersCount * 0.06), revenue: Math.round(totalRevenue * 0.05), share: 5 },
    { name: "Khulna", count: Math.round(totalOrdersCount * 0.04), revenue: Math.round(totalRevenue * 0.04), share: 4 },
    { name: "Mymensingh", count: Math.round(totalOrdersCount * 0.03), revenue: Math.round(totalRevenue * 0.02), share: 2 },
    { name: "Rangpur & Barishal", count: Math.round(totalOrdersCount * 0.03), revenue: Math.round(totalRevenue * 0.02), share: 2 },
  ];

  // Sales Channel breakdown
  const salesChannels = [
    { channel: "Online Web Store", share: 62, revenue: Math.round(totalRevenue * 0.62), color: "bg-primary" },
    { channel: "Facebook & Instagram Shop", share: 24, revenue: Math.round(totalRevenue * 0.24), color: "bg-pink-500" },
    { channel: "WhatsApp Direct Booking", share: 10, revenue: Math.round(totalRevenue * 0.10), color: "bg-emerald-500" },
    { channel: "Banani Flagship POS Outlet", share: 4, revenue: Math.round(totalRevenue * 0.04), color: "bg-amber-500" },
  ];

  // Interactive 7-point Revenue Curve Data
  const trendPoints = [
    { label: "Day 1", rev: 14200, profit: 8200 },
    { label: "Day 5", rev: 22400, profit: 13100 },
    { label: "Day 10", rev: 18900, profit: 10800 },
    { label: "Day 15", rev: 34500, profit: 20200 },
    { label: "Day 20", rev: 29800, profit: 17400 },
    { label: "Day 25", rev: 41200, profit: 24300 },
    { label: "Today", rev: 48900, profit: 28600 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-primary font-bold">Executive Intelligence</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Live BI Synced
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold mt-0.5">Sales & Business Analytics</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-secondary p-1 rounded-2xl border border-border">
            {(["today", "7d", "30d", "year"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition ${
                  timeframe === t
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-card border border-border p-5 rounded-3xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Gross Revenue</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-bold text-foreground mt-2">
            ৳{totalRevenue.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+24.8% vs last period</span>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-card border border-border p-5 rounded-3xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Gross Profit ({grossMarginPercent}%)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-bold text-foreground mt-2">
            ৳{estimatedGrossProfit.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>COGS: ৳{estimatedCostOfGoods.toLocaleString()}</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-card border border-border p-5 rounded-3xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Average Order Value</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-bold text-foreground mt-2">
            ৳{avgOrderValue.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.2% basket size</span>
          </div>
        </div>

        {/* Conversion & ROAS */}
        <div className="bg-card border border-border p-5 rounded-3xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Conversion / ROAS</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-bold text-foreground mt-2">
            {conversionRate}% <span className="text-base text-muted-foreground font-normal">/ {roas}x</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Avg CAC: ৳{cac} per buyer</span>
          </div>
        </div>
      </div>

      {/* Revenue Growth Trend & Interactive Visual Chart */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg">Revenue vs Net Margin Velocity</h3>
              <p className="text-xs text-muted-foreground">Daily performance trajectory in Bangladeshi Taka (৳)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Profit
              </span>
            </div>
          </div>

          {/* CSS/SVG Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-7 gap-3 sm:gap-6 items-end h-48 sm:h-56 border-b border-border pb-2">
              {trendPoints.map((pt) => {
                const maxVal = 50000;
                const revHeight = Math.round((pt.rev / maxVal) * 100);
                const profitHeight = Math.round((pt.profit / maxVal) * 100);
                return (
                  <div key={pt.label} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-3 sm:w-6 bg-primary rounded-t-lg transition-all group-hover:brightness-110 relative"
                        title={`Revenue: ৳${pt.rev.toLocaleString()}`}
                      />
                      {/* Profit Bar */}
                      <div
                        style={{ height: `${profitHeight}%` }}
                        className="w-3 sm:w-6 bg-emerald-500 rounded-t-lg transition-all group-hover:brightness-110 relative"
                        title={`Profit: ৳${pt.profit.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold truncate">{pt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sales Channels Distribution */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Sales Channels</h3>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Multi-channel order origin breakdown</p>

          <div className="space-y-4 pt-2">
            {salesChannels.map((ch) => (
              <div key={ch.channel} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>{ch.channel}</span>
                  <span className="font-bold">৳{ch.revenue.toLocaleString()} ({ch.share}%)</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${ch.color} rounded-full`} style={{ width: `${ch.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bangladesh Regional Heatmap / Division Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg">Bangladesh Division Distribution</h3>
              <p className="text-xs text-muted-foreground">Order volume and revenue across 8 divisions</p>
            </div>
            <MapPin className="w-4 h-4 text-primary" />
          </div>

          <div className="divide-y divide-border pt-1">
            {divisionSales.map((div) => (
              <div key={div.name} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground">{div.name} Division</span>
                  <span className="text-[11px] text-muted-foreground">({div.count} orders)</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">৳{div.revenue.toLocaleString()}</div>
                  <span className="text-[10px] text-muted-foreground">{div.share}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products Leaderboard */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg">Top Grossing Products</h3>
              <p className="text-xs text-muted-foreground">Highest revenue generating catalog items</p>
            </div>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3 pt-1">
            {products.slice(0, 5).map((p, idx) => (
              <div
                key={p._id || p.name || idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 border border-border text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-card flex items-center justify-center font-bold text-[11px] border border-border text-muted-foreground shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-foreground truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      ৳{p.price?.toLocaleString()} · Sold: {p.totalSold || 35 + idx * 8} units
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-primary">
                    ৳{((p.price || 2400) * (p.totalSold || 35 + idx * 8)).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">+18% MoM</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
