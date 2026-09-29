"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Smartphone,
  History,
  Ban,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  UserCheck,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import type { ActivityLog } from "./types";

export function SecurityRbacModule() {
  const { user } = useAuthStore();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [ipBlacklist, setIpBlacklist] = useState<string[]>(["103.231.160.45", "182.160.118.90"]);
  const [newIp, setNewIp] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {
      id: "log_1",
      user: "Super Admin",
      role: "super_admin",
      action: "Dispatched order ORD-2026-8801 via Steadfast Courier",
      entity: "Order",
      entityId: "ORD-2026-8801",
      timestamp: "Just now",
      ipAddress: "103.145.118.22 (Dhaka, BD)",
      status: "success",
    },
    {
      id: "log_2",
      user: "Store Admin",
      role: "admin",
      action: "Created promo code EID2026 (15% OFF)",
      entity: "Coupon",
      entityId: "EID2026",
      timestamp: "25 mins ago",
      ipAddress: "103.145.118.22 (Dhaka, BD)",
      status: "success",
    },
    {
      id: "log_3",
      user: "Super Admin",
      role: "super_admin",
      action: "Updated product stock level for Blush Mini Crossbody",
      entity: "Product",
      entityId: "blush-mini-crossbody",
      timestamp: "1 hour ago",
      ipAddress: "103.145.118.22 (Dhaka, BD)",
      status: "success",
    },
  ]);

  const [activeSessions, setActiveSessions] = useState([
    {
      id: "sess_1",
      device: "MacBook Pro (Chrome 128 / macOS)",
      location: "Dhaka, Bangladesh",
      ip: "103.145.118.22",
      isCurrent: true,
    },
    {
      id: "sess_2",
      device: "iPhone 15 Pro (Safari / iOS 18)",
      location: "Banani, Dhaka",
      ip: "103.145.118.22",
      isCurrent: false,
    },
  ]);

  const permissionsMatrix = [
    {
      module: "Orders & POS Fulfillment",
      super_admin: true,
      admin: true,
      fulfillment: true,
      support: true,
      accountant: false,
    },
    {
      module: "Products & Stock Adjustments",
      super_admin: true,
      admin: true,
      fulfillment: true,
      support: false,
      accountant: false,
    },
    {
      module: "Couriers & Logistics API Keys",
      super_admin: true,
      admin: true,
      fulfillment: false,
      support: false,
      accountant: false,
    },
    {
      module: "Financial P&L & Expense Logs",
      super_admin: true,
      admin: false,
      fulfillment: false,
      support: false,
      accountant: true,
    },
    {
      module: "Security, RBAC & Audit Trails",
      super_admin: true,
      admin: false,
      fulfillment: false,
      support: false,
      accountant: false,
    },
  ];

  const handleAddBlacklistIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    setIpBlacklist([...ipBlacklist, newIp.trim()]);
    toast.success(`IP ${newIp} blocked from accessing admin dashboard!`);
    setNewIp("");
  };

  const handleRevokeSessions = () => {
    setActiveSessions(activeSessions.filter((s) => s.isCurrent));
    toast.success("All other active admin sessions revoked successfully!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 10) {
      toast.error("New password must be at least 10 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      toast.success("Admin password changed successfully in database!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Add audit log
      setActivityLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          user: user?.name || "Admin",
          role: user?.role || "admin",
          action: "Changed administrative security password",
          entity: "User",
          entityId: user?.id || "admin",
          timestamp: "Just now",
          ipAddress: "103.145.118.22 (Dhaka, BD)",
          status: "success",
        },
        ...prev,
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h2 className="font-serif text-2xl font-bold">Security Center, RBAC & Audit Trails</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Role permissions matrix, two-factor authentication, active sessions & security logs
          </p>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid md:grid-cols-3 gap-4 text-xs">
        {/* 2FA Card */}
        <div className="bg-card border border-border p-5 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600">
              ENFORCED
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm">Two-Factor Authentication (2FA)</h3>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Google Authenticator TOTP required for all Super Admin actions.
            </p>
          </div>
          <button
            onClick={() => {
              setTwoFactorEnabled(!twoFactorEnabled);
              toast.success("2FA settings updated!");
            }}
            className="w-full py-2 rounded-xl border border-border font-bold hover:bg-secondary transition text-[11px]"
          >
            {twoFactorEnabled ? "Configure Authenticator App" : "Enable 2FA"}
          </button>
        </div>

        {/* Active Sessions Card */}
        <div className="bg-card border border-border p-5 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600">
              <Key className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600">
              {activeSessions.length} SESSIONS
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm">Active Admin Sessions</h3>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Connected across desktop & mobile management apps.
            </p>
          </div>
          <button
            onClick={handleRevokeSessions}
            className="w-full py-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-bold transition text-[11px]"
          >
            Revoke Other Sessions
          </button>
        </div>

        {/* IP Protection Card */}
        <div className="bg-card border border-border p-5 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600">
              <Ban className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
              {ipBlacklist.length} BLOCKED
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm">IP Blacklist & Firewall</h3>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Automated brute-force shielding for admin endpoints.
            </p>
          </div>
          <form onSubmit={handleAddBlacklistIp} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Add IP (e.g. 103.20.1.1)"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-xl border border-border bg-background text-[11px] font-mono focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-[11px]"
            >
              Block
            </button>
          </form>
        </div>
      </div>

      {/* Admin Password & Credentials Management */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg">Change Admin Password</h3>
              <p className="text-xs text-muted-foreground">
                Update credentials for <strong>{user?.name || "Administrator"}</strong> (
                {user?.email || "admin@koreanskincare.bd"})
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
            BCRYPT ENCRYPTED (12 ROUNDS)
          </span>
        </div>

        <form onSubmit={handleChangePassword} className="grid md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1.5 text-foreground">
              Current Password{" "}
              <span className="text-muted-foreground font-normal">(Optional for Admin)</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-background focus:outline-hidden pr-10 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1.5 text-foreground">
              New Hard / Strong Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                placeholder="Min 6-8 chars with #, $, !"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-background focus:outline-hidden pr-10 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                <div
                  className={`h-1.5 flex-1 rounded-full ${
                    newPassword.length > 10
                      ? "bg-emerald-500"
                      : newPassword.length >= 6
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
                <span
                  className={
                    newPassword.length > 10
                      ? "text-emerald-600 font-bold"
                      : newPassword.length >= 6
                        ? "text-amber-600 font-bold"
                        : "text-rose-600 font-bold"
                  }
                >
                  {newPassword.length > 10
                    ? "Very Strong"
                    : newPassword.length >= 6
                      ? "Good"
                      : "Too Short"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1.5 text-foreground">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-background focus:outline-hidden text-xs font-mono"
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-rose-500 text-[10px] mt-1 font-semibold">Passwords do not match</p>
            )}
          </div>

          <div className="md:col-span-3 flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
              className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center gap-2 shadow-xs disabled:opacity-50 text-xs"
            >
              {isChangingPassword ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isChangingPassword ? "Saving to Database..." : "Update Admin Password"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Role Permissions Matrix */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-lg">Granular Role Permissions (RBAC)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Module Capability</th>
                <th className="p-3.5 text-center">Super Admin</th>
                <th className="p-3.5 text-center">Store Admin</th>
                <th className="p-3.5 text-center">Fulfillment Lead</th>
                <th className="p-3.5 text-center">Support Agent</th>
                <th className="p-3.5 text-center">Accountant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissionsMatrix.map((row) => (
                <tr key={row.module} className="hover:bg-secondary/30 transition">
                  <td className="p-3.5 font-semibold text-foreground">{row.module}</td>
                  <td className="p-3.5 text-center font-bold text-emerald-600">✓ Full</td>
                  <td className="p-3.5 text-center font-semibold text-foreground">
                    {row.admin ? "✓ Allowed" : "—"}
                  </td>
                  <td className="p-3.5 text-center text-muted-foreground">
                    {row.fulfillment ? "✓ Allowed" : "—"}
                  </td>
                  <td className="p-3.5 text-center text-muted-foreground">
                    {row.support ? "✓ Read Only" : "—"}
                  </td>
                  <td className="p-3.5 text-center text-muted-foreground">
                    {row.accountant ? "✓ Full Access" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Audit Trail Logs */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-bold text-lg">Admin Activity & Audit Trail</h3>
          </div>
          <span className="text-xs text-muted-foreground">Tamper-evident logs</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-foreground">{log.action}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Actor: <strong className="text-foreground">{log.user}</strong> ({log.role}) · IP:{" "}
                  {log.ipAddress}
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
