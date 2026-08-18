"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Receipt,
  PieChart,
  Calendar,
  X,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import type { ExpenseItem } from "./types";

interface FinancialReportsModuleProps {
  totalRevenue: number;
}

export function FinancialReportsModule({ totalRevenue }: FinancialReportsModuleProps) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: "exp_1",
      category: "marketing_ads",
      title: "Meta (Facebook/Instagram) Eid Campaign Ads",
      amount: 45000,
      date: "15 Aug 2026",
      paidVia: "Card",
      notes: "High conversion ad set targeted at Dhaka and Chattogram",
    },
    {
      id: "exp_2",
      category: "packaging",
      title: "Custom Luxury Jewelry Pouches & Foil Embossed Gift Boxes",
      amount: 28000,
      date: "10 Aug 2026",
      paidVia: "Bank Transfer",
      notes: "5,000 units batch order from Chawkbazar printing press",
    },
    {
      id: "exp_3",
      category: "logistics_overhead",
      title: "Steadfast & Pathao Hub Prepaid Deposit",
      amount: 15000,
      date: "08 Aug 2026",
      paidVia: "bKash",
    },
  ]);

  const [newExpenseTitle, setNewExpenseTitle] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(5000);
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseItem["category"]>("marketing_ads");
  const [newExpensePayment, setNewExpensePayment] = useState<ExpenseItem["paidVia"]>("bKash");

  // Comprehensive Bangladeshi P&L Breakdown
  const cogs = Math.round(totalRevenue * 0.42); // 42% cost of product
  const courierFees = Math.round(totalRevenue * 0.05); // 5% shipping cost
  const gatewayFees = Math.round(totalRevenue * 0.018); // ~1.8% bKash/SSL average
  const vatTax = Math.round(totalRevenue * 0.05); // 5% NBR VAT
  const totalRecordedExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - cogs - courierFees - gatewayFees - vatTax - totalRecordedExpenses;
  const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 28;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseTitle.trim()) return;

    const newExp: ExpenseItem = {
      id: `exp_${Date.now()}`,
      title: newExpenseTitle,
      amount: newExpenseAmount,
      category: newExpenseCategory,
      paidVia: newExpensePayment,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    };

    setExpenses([newExp, ...expenses]);
    toast.success(`Expense of ৳${newExpenseAmount.toLocaleString()} logged!`);
    setNewExpenseTitle("");
  };

  const handleExportCsv = (type: string) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Category,Description,Amount (BDT),Date,Paid Via\n" +
      expenses.map((e) => `"${e.category}","${e.title}",${e.amount},"${e.date}","${e.paidVia}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shajgoj_${type}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${type.toUpperCase()} CSV report!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="font-serif text-2xl font-bold">Financial Dashboard & P&L Statement</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Gross revenue, COGS, Bangladeshi VAT, courier fees, operating expenses & net profit
          </p>
        </div>

        {/* 1-Click Export Center */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCsv("financial_pnl")}
            className="px-3.5 py-2 rounded-2xl border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* P&L Statement Card */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-lg">Profit & Loss (P&L) Summary</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
            <span className="text-muted-foreground font-bold">Gross Revenue</span>
            <p className="text-2xl font-serif font-bold text-foreground mt-1">৳{totalRevenue.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-600 font-semibold">100% of sales</span>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
            <span className="text-muted-foreground font-bold">Cost of Goods (COGS)</span>
            <p className="text-2xl font-serif font-bold text-rose-600 mt-1">-৳{cogs.toLocaleString()}</p>
            <span className="text-[10px] text-muted-foreground">42% production cost</span>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
            <span className="text-muted-foreground font-bold">Logistics & Gateway Fees</span>
            <p className="text-2xl font-serif font-bold text-amber-600 mt-1">-৳{(courierFees + gatewayFees).toLocaleString()}</p>
            <span className="text-[10px] text-muted-foreground">Couriers + bKash 1.5%</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Net Profit ({netMarginPercent}%)</span>
            <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ৳{netProfit.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">After all overhead & VAT</span>
          </div>
        </div>
      </div>

      {/* Expense Logger & Table */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add Expense Form */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4 text-xs">
          <h3 className="font-serif font-bold text-lg">Log Store Expense</h3>
          <form onSubmit={handleAddExpense} className="space-y-3">
            <div>
              <label className="block font-semibold mb-1">Expense Title</label>
              <input
                type="text"
                placeholder="e.g. Meta Ads, Luxury packaging"
                value={newExpenseTitle}
                onChange={(e) => setNewExpenseTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Category</label>
              <select
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
              >
                <option value="marketing_ads">Marketing & Social Ads</option>
                <option value="packaging">Packaging & Branding Pouches</option>
                <option value="logistics_overhead">Logistics & Hub Rent</option>
                <option value="salaries">Store Staff Salaries</option>
                <option value="software_cloud">Software & Cloud Infra</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1">Amount (৳)</label>
                <input
                  type="number"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background font-bold focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Paid Via</label>
                <select
                  value={newExpensePayment}
                  onChange={(e) => setNewExpensePayment(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                >
                  <option value="bKash">bKash</option>
                  <option value="Bank Transfer">Bank</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Logged Operating Expenses</h3>
            <span className="text-xs text-muted-foreground font-semibold">
              Total: ৳{totalRecordedExpenses.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2.5">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/40 border border-border text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">{exp.title}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">
                    {exp.category.replace("_", " ")} · {exp.date} · Paid via {exp.paidVia}
                  </div>
                </div>
                <div className="font-bold text-rose-600">
                  -৳{exp.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
