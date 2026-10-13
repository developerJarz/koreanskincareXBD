"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  ALL_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  isAdminOnly,
  PERMISSION_GROUPS,
  PERMISSIONS,
  ROLE_LABELS,
  type Permission,
} from "@/lib/permissions";
import type { UserRole } from "@/types";
import {
  api,
  ApiError,
  Field,
  iconButton,
  inputClass,
  Modal,
  primaryButton,
  secondaryButton,
  textareaClass,
} from "./catalog/ui";
import {
  EmptyState,
  ErrorNotice,
  fmtRelative,
  PageHeader,
  Panel,
  Pill,
  Segmented,
  Skeleton,
  useAccess,
  useAdminData,
} from "./shared";

type Role = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  permissions: Permission[];
  isSystem: boolean;
  personalFor?: string;
  members: number;
};

type Member = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customRole: { id: string; name: string; color: string; personal: boolean } | null;
  roleName: string;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  lastAction: { summary: string; at: string } | null;
};

type TeamData = { members: Member[]; viewerId: string; viewerRole: UserRole };

const ROLE_RANK: Record<string, number> = {
  customer: 0,
  vendor: 0,
  staff: 1,
  admin: 2,
  super_admin: 3,
};
const COLORS = [
  "#8b5cf6",
  "#2a78d6",
  "#1baf7a",
  "#d97706",
  "#e34948",
  "#e87ba4",
  "#0f766e",
  "#6b7280",
];

export function RolesModule() {
  const [tab, setTab] = useState<"team" | "roles" | "matrix">("team");
  const [adding, setAdding] = useState<"admin" | "moderator" | null>(null);
  const roles = useAdminData<Role[]>("/api/admin/roles");
  const team = useAdminData<TeamData>("/api/admin/team");
  const isSuper = team.data?.viewerRole === "super_admin";

  const reloadAll = () => {
    roles.reload();
    team.reload();
  };
  const sharedRoles = roles.data?.filter((r) => !r.personalFor) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team & roles"
        description="Add admins and moderators, and choose exactly what each moderator can see and change. Changes apply on their next click."
        actions={
          <>
            {isSuper && (
              <button type="button" className={secondaryButton} onClick={() => setAdding("admin")}>
                <UserCog className="h-4 w-4" /> Add admin
              </button>
            )}
            <button type="button" className={primaryButton} onClick={() => setAdding("moderator")}>
              <UserPlus className="h-4 w-4" /> Add moderator
            </button>
          </>
        }
      />
      <Segmented
        label="Team sections"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "team",
            label: `Team members${team.data ? ` (${team.data.members.length})` : ""}`,
          },
          { value: "roles", label: `Roles${roles.data ? ` (${sharedRoles.length + 2})` : ""}` },
          { value: "matrix", label: "Who can do what" },
        ]}
      />
      {(roles.error || team.error) && (
        <ErrorNotice message={(roles.error || team.error)!} onRetry={reloadAll} />
      )}
      {tab === "team" &&
        (team.data && roles.data ? (
          <TeamTable data={team.data} roles={sharedRoles} onChanged={reloadAll} />
        ) : (
          !team.error && <Skeleton className="h-80" />
        ))}
      {tab === "roles" &&
        (roles.data ? (
          <RoleList roles={roles.data} isSuper={isSuper} onChanged={reloadAll} />
        ) : (
          !roles.error && <Skeleton className="h-80" />
        ))}
      {tab === "matrix" &&
        (roles.data ? <Matrix roles={roles.data} /> : <Skeleton className="h-80" />)}

      {adding && roles.data && (
        <AddMember
          kind={adding}
          roles={sharedRoles}
          isSuper={isSuper}
          onClose={() => setAdding(null)}
          onAdded={reloadAll}
        />
      )}
    </div>
  );
}

// ─── Permission picker (shared by add, edit and role editor) ───

function impliedBy(p: Permission): Permission[] {
  if (p === "orders.manage" || p === "returns.manage") return ["orders.view"];
  if (p === "invoices.manage" || p === "invoices.design") return ["invoices.view"];
  if (p.startsWith("catalog.") || p === "inventory.manage") return ["catalog.view"];
  if (p === "customers.manage") return ["customers.view"];
  if (p === "finance.manage") return ["finance.view"];
  if (p === "activity.manage") return ["activity.view"];
  if (p === "payments.manage") return ["payments.view"];
  if (p === "vendors.manage") return ["vendors.view"];
  return [];
}

function PermissionPicker({
  value,
  onChange,
  allowSensitive,
}: {
  value: Set<Permission>;
  onChange: (next: Set<Permission>) => void;
  /** Only a super admin may give sensitive permissions to a moderator */
  allowSensitive: boolean;
}) {
  const toggle = (p: Permission) => {
    const next = new Set(value);
    if (next.has(p)) next.delete(p);
    else {
      next.add(p);
      impliedBy(p).forEach((x) => next.add(x));
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">
          {value.size} of {ALL_PERMISSIONS.length} selected
        </span>
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onChange(new Set(DEFAULT_STAFF_PERMISSIONS))}
        >
          Start from moderator defaults
        </button>
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() =>
            onChange(new Set(ALL_PERMISSIONS.filter((p) => allowSensitive || !isAdminOnly(p))))
          }
        >
          Select all
        </button>
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onChange(new Set())}
        >
          Clear
        </button>
      </div>
      {PERMISSION_GROUPS.map((group) => {
        const list = ALL_PERMISSIONS.filter((p) => PERMISSIONS[p].group === group);
        const grantable = list.filter((p) => allowSensitive || !isAdminOnly(p));
        const allOn = grantable.length > 0 && grantable.every((p) => value.has(p));
        return (
          <fieldset key={group} className="rounded-xl border border-border p-3">
            <legend className="flex items-center gap-3 px-1 text-xs font-semibold">
              {group}
              {grantable.length > 0 && (
                <button
                  type="button"
                  className="text-[11px] font-medium text-primary hover:underline"
                  onClick={() => {
                    const next = new Set(value);
                    grantable.forEach((p) => (allOn ? next.delete(p) : next.add(p)));
                    onChange(next);
                  }}
                >
                  {allOn ? "Clear" : "Select all"}
                </button>
              )}
            </legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {list.map((p) => {
                const sensitive = isAdminOnly(p);
                const locked = sensitive && !allowSensitive;
                return (
                  <label
                    key={p}
                    className={`flex items-start gap-2.5 rounded-lg p-2 text-xs ${
                      locked ? "opacity-55" : "cursor-pointer hover:bg-secondary/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={value.has(p)}
                      disabled={locked}
                      onChange={() => toggle(p)}
                    />
                    <span>
                      <span className="block font-medium text-foreground">
                        {PERMISSIONS[p].label}{" "}
                        {sensitive && (
                          <span className="font-normal text-amber-700 dark:text-amber-400">
                            · sensitive{locked ? " (super admin only)" : ""}
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {PERMISSIONS[p].description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

type PermissionMode = "default" | "role" | "custom";

/** Where a moderator's permissions come from: defaults, a shared role, or chosen for them. */
function ModeratorPermissions({
  mode,
  setMode,
  roleId,
  setRoleId,
  perms,
  setPerms,
  roles,
  isSuper,
}: {
  mode: PermissionMode;
  setMode: (m: PermissionMode) => void;
  roleId: string;
  setRoleId: (id: string) => void;
  perms: Set<Permission>;
  setPerms: (p: Set<Permission>) => void;
  roles: Role[];
  isSuper: boolean;
}) {
  const defaultRole = roles.find((r) => r.isSystem);
  const shared = roles.filter((r) => !r.isSystem);
  const option = (value: PermissionMode, title: string, hint: string, disabled = false) => (
    <label
      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs ${
        mode === value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        type="radio"
        name="perm-mode"
        className="mt-0.5"
        checked={mode === value}
        onChange={() => setMode(value)}
        disabled={disabled}
      />
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="block text-muted-foreground">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-foreground">Permissions</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {option("custom", "Choose for this person", "Tick exactly what they can do")}
        {option(
          "role",
          "Use a saved role",
          shared.length
            ? `${shared.length} saved role${shared.length === 1 ? "" : "s"}`
            : "No saved roles yet",
          shared.length === 0,
        )}
        {option(
          "default",
          "Moderator defaults",
          `${defaultRole?.permissions.length ?? DEFAULT_STAFF_PERMISSIONS.length} everyday permissions`,
        )}
      </div>
      {mode === "role" && (
        <select
          aria-label="Saved role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className={inputClass}
        >
          <option value="">Choose a role…</option>
          {shared.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name} — {r.permissions.length} permissions
            </option>
          ))}
        </select>
      )}
      {mode === "custom" && (
        <PermissionPicker value={perms} onChange={setPerms} allowSensitive={isSuper} />
      )}
      {mode === "default" && defaultRole && (
        <div className="flex flex-wrap gap-1">
          {defaultRole.permissions.map((p) => (
            <Pill key={p}>{PERMISSIONS[p].label}</Pill>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add admin / moderator ───

function AddMember({
  kind,
  roles,
  isSuper,
  onClose,
  onAdded,
}: {
  kind: "admin" | "moderator";
  roles: Role[];
  isSuper: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminLevel, setAdminLevel] = useState<"admin" | "super_admin">("admin");
  const [mode, setMode] = useState<PermissionMode>("custom");
  const [roleId, setRoleId] = useState("");
  const [perms, setPerms] = useState<Set<Permission>>(new Set(DEFAULT_STAFF_PERMISSIONS));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [result, setResult] = useState<{
    name: string;
    email: string;
    password?: string;
    created: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === "moderator" && mode === "role" && !roleId) {
      setError({ message: "Choose a saved role, or pick another option." });
      return;
    }
    if (kind === "moderator" && mode === "custom" && perms.size === 0) {
      setError({ message: "Tick at least one permission." });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await api<{ member: Member; temporaryPassword?: string; created: boolean }>(
        "/api/admin/team",
        {
          method: "POST",
          json: {
            email,
            name,
            password: password || undefined,
            role: kind === "admin" ? adminLevel : "staff",
            permissionMode: mode,
            customRoleId: mode === "role" ? roleId : null,
            permissions: mode === "custom" ? [...perms] : undefined,
          },
        },
      );
      onAdded();
      toast.success(
        `${r.member.name} is now ${kind === "admin" ? ROLE_LABELS[adminLevel].toLowerCase() : "a moderator"}.`,
      );
      setResult({
        name: r.member.name,
        email: r.member.email,
        password: r.temporaryPassword,
        created: r.created,
      });
    } catch (err) {
      const field = err instanceof ApiError ? Object.keys(err.fields ?? {})[0] : undefined;
      setError({ message: err instanceof Error ? err.message : "Couldn't add them.", field });
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <Modal
        title={kind === "admin" ? "Admin added" : "Moderator added"}
        onClose={onClose}
        footer={
          <button type="button" className={primaryButton} onClick={onClose}>
            Done
          </button>
        }
      >
        <p className="text-sm">
          <strong>{result.name}</strong> ({result.email}){" "}
          {result.created ? "has a new account and" : ""} can now sign in at{" "}
          <span className="font-mono">/auth/login</span> and open the admin panel.
        </p>
        {result.password ? (
          <>
            <p className="text-sm">
              Give them this temporary password. It is shown only once — ask them to change it after
              signing in.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-3">
              <code className="flex-1 select-all font-mono text-sm">{result.password}</code>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  navigator.clipboard.writeText(result.password!);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{" "}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {result.created
              ? "They sign in with the password you set."
              : "They keep using their existing password."}
          </p>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      wide
      title={kind === "admin" ? "Add admin" : "Add moderator"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-member" className={primaryButton} disabled={saving}>
            {saving ? "Adding…" : kind === "admin" ? "Add admin" : "Add moderator"}
          </button>
        </>
      }
    >
      <form id="add-member" onSubmit={submit} className="space-y-4">
        <p className="text-xs text-muted-foreground">
          If the email already has a customer account it is upgraded. Otherwise a new account is
          created.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" htmlFor="m-email">
            <input
              id="m-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              aria-invalid={error?.field === "email"}
              autoFocus
            />
          </Field>
          <Field label="Full name" htmlFor="m-name" hint="Needed for a new account">
            <input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              aria-invalid={error?.field === "name"}
            />
          </Field>
        </div>
        <Field
          label="Password (new accounts)"
          htmlFor="m-pass"
          hint="Leave empty to generate a strong one. At least 10 characters with 3 of: lowercase, uppercase, number, symbol."
        >
          <div className="relative">
            <input
              id="m-pass"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-9 font-mono`}
              aria-invalid={error?.field === "password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {kind === "admin" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium">Access level</p>
            {(
              [
                [
                  "admin",
                  "Admin",
                  "Every page and setting. Can manage moderators, but not other admins.",
                ],
                ["super_admin", "Super admin", "Everything, including adding and removing admins."],
              ] as const
            ).map(([value, title, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs ${
                  adminLevel === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/40"
                }`}
              >
                <input
                  type="radio"
                  name="admin-level"
                  className="mt-0.5"
                  checked={adminLevel === value}
                  onChange={() => setAdminLevel(value)}
                />
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-muted-foreground">{hint}</span>
                </span>
              </label>
            ))}
            <p className="text-[11px] text-muted-foreground">
              Need an admin with limited access? Add a moderator and choose their permissions
              instead.
            </p>
          </div>
        ) : (
          <ModeratorPermissions
            mode={mode}
            setMode={setMode}
            roleId={roleId}
            setRoleId={setRoleId}
            perms={perms}
            setPerms={setPerms}
            roles={roles}
            isSuper={isSuper}
          />
        )}
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}

// ─── Edit an existing member's access ───

function EditAccess({
  member,
  roles,
  isSuper,
  onClose,
  onSaved,
}: {
  member: Member;
  roles: Role[];
  isSuper: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [level, setLevel] = useState<UserRole>(member.role);
  const initialMode: PermissionMode = member.customRole?.personal
    ? "custom"
    : member.customRole
      ? "role"
      : "default";
  const [mode, setMode] = useState<PermissionMode>(initialMode);
  const [roleId, setRoleId] = useState(
    member.customRole && !member.customRole.personal ? member.customRole.id : "",
  );
  const [perms, setPerms] = useState<Set<Permission>>(new Set(member.permissions));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const levels: UserRole[] = isSuper ? ["super_admin", "admin", "staff"] : ["staff"];

  const save = async () => {
    if (level === "staff" && mode === "role" && !roleId) return setError("Choose a saved role.");
    if (level === "staff" && mode === "custom" && perms.size === 0)
      return setError("Tick at least one permission.");
    setSaving(true);
    setError(null);
    try {
      await api("/api/admin/team", {
        method: "PATCH",
        json: {
          userId: member.id,
          role: level,
          permissionMode: mode,
          customRoleId: mode === "role" ? roleId : null,
          permissions: mode === "custom" ? [...perms] : undefined,
        },
      });
      toast.success(`Access updated for ${member.name}.`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={`Access for ${member.name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryButton} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save access"}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-xs font-medium">Access level</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {levels.map((l) => (
            <label
              key={l}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs ${
                level === l ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
              }`}
            >
              <input type="radio" name="level" checked={level === l} onChange={() => setLevel(l)} />
              <span className="font-semibold">{ROLE_LABELS[l]}</span>
            </label>
          ))}
        </div>
        {level !== member.role && (
          <p className="text-[11px] text-muted-foreground">
            Changing the access level signs them out so it applies straight away.
          </p>
        )}
      </div>
      {level === "staff" ? (
        <ModeratorPermissions
          mode={mode}
          setMode={setMode}
          roleId={roleId}
          setRoleId={setRoleId}
          perms={perms}
          setPerms={setPerms}
          roles={roles}
          isSuper={isSuper}
        />
      ) : (
        <p className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          {ROLE_LABELS[level]}s have every permission.
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}

// ─── Team members ───

function TeamTable({
  data,
  roles,
  onChanged,
}: {
  data: TeamData;
  roles: Role[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [confirm, setConfirm] = useState<{ member: Member; action: "remove" | "signout" } | null>(
    null,
  );
  const isSuper = data.viewerRole === "super_admin";

  const canEdit = (m: Member) =>
    m.id !== data.viewerId && (isSuper || ROLE_RANK[m.role] < ROLE_RANK[data.viewerRole]);

  const patch = async (m: Member, body: Record<string, unknown>, message: string) => {
    setBusy(m.id);
    try {
      await api("/api/admin/team", { method: "PATCH", json: { userId: m.id, ...body } });
      toast.success(message);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title="People with admin access"
      description="Admins have every permission. Moderators get only the permissions chosen for them."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium">Person</th>
              <th className="px-3 py-2 font-medium">Access</th>
              <th className="px-3 py-2 font-medium">Permissions</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Last seen</th>
              <th className="py-2 pl-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.members.map((m) => {
              const editable = canEdit(m);
              return (
                <tr key={m.id} className="align-top">
                  <td className="py-3 pr-3">
                    <span className="block font-medium text-foreground">
                      {m.name}{" "}
                      {m.id === data.viewerId && (
                        <span className="text-muted-foreground">(you)</span>
                      )}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{m.email}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Pill
                      tone={
                        m.role === "super_admin"
                          ? "accent"
                          : m.role === "admin"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {ROLE_LABELS[m.role]}
                    </Pill>
                  </td>
                  <td className="px-3 py-3">
                    {m.role === "staff" ? (
                      <span>{m.customRole?.personal ? "Chosen for them" : m.roleName}</span>
                    ) : (
                      <span className="text-muted-foreground">Everything</span>
                    )}
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {m.permissions.length} of {ALL_PERMISSIONS.length}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {m.isActive ? (
                      <Pill tone="good">Active</Pill>
                    ) : (
                      <Pill tone="bad">Suspended</Pill>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {m.lastLoginAt ? `Signed in ${fmtRelative(m.lastLoginAt)}` : "Never signed in"}
                    {m.lastAction && (
                      <span
                        className="mt-0.5 block max-w-[16rem] truncate text-[11px]"
                        title={m.lastAction.summary}
                      >
                        {m.lastAction.summary} · {fmtRelative(m.lastAction.at)}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-3 text-right">
                    {editable && (
                      <>
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => setEditing(m)}
                          disabled={busy === m.id}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" /> Edit access
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          title={m.isActive ? "Suspend" : "Re-activate"}
                          aria-label={m.isActive ? `Suspend ${m.name}` : `Re-activate ${m.name}`}
                          onClick={() =>
                            patch(
                              m,
                              { isActive: !m.isActive },
                              m.isActive ? `${m.name} suspended.` : `${m.name} re-activated.`,
                            )
                          }
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          title="Sign out everywhere"
                          aria-label={`Sign ${m.name} out everywhere`}
                          onClick={() => setConfirm({ member: m, action: "signout" })}
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={`${iconButton} text-destructive`}
                          title="Remove from team"
                          aria-label={`Remove ${m.name} from the team`}
                          onClick={() => setConfirm({ member: m, action: "remove" })}
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditAccess
          member={editing}
          roles={roles}
          isSuper={isSuper}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
      {confirm && (
        <Modal
          title={confirm.action === "remove" ? "Remove from team" : "Sign out everywhere"}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={async () => {
                  const { member, action } = confirm;
                  setConfirm(null);
                  await patch(
                    member,
                    action === "remove" ? { role: "customer" } : { signOut: true },
                    action === "remove"
                      ? `${member.name} no longer has admin access.`
                      : `${member.name} was signed out everywhere.`,
                  );
                }}
              >
                {confirm.action === "remove" ? "Remove access" : "Sign out"}
              </button>
            </>
          }
        >
          <p className="text-sm">
            {confirm.action === "remove"
              ? `${confirm.member.name} becomes a regular customer account and loses access to the admin panel immediately.`
              : `${confirm.member.name} will be signed out on every device and must sign in again.`}
          </p>
        </Modal>
      )}
    </Panel>
  );
}

// ─── Roles ───

function RoleList({
  roles,
  isSuper,
  onChanged,
}: {
  roles: Role[];
  isSuper: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Role | "new" | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const shared = roles.filter((r) => !r.personalFor);
  const personal = roles.filter((r) => r.personalFor);

  const remove = async () => {
    if (!deleting) return;
    try {
      const r = await api<{ movedMembers: number }>(`/api/admin/roles/${deleting._id}`, {
        method: "DELETE",
      });
      toast.success(
        `Role deleted${r.movedMembers ? ` — ${r.movedMembers} moved to moderator defaults` : ""}.`,
      );
      setDeleting(null);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete.");
    }
  };

  const builtIn = [
    {
      name: "Super admin",
      description: "Everything, including adding and removing admins.",
      color: "#be185d",
    },
    {
      name: "Admin",
      description: "Everything except changing super admins and other admins.",
      color: "#2a78d6",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Saved roles let you give several moderators the same permissions and change them in one
          place.
        </p>
        <button type="button" className={primaryButton} onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> New role
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {builtIn.map((r) => (
          <div key={r.name} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: r.color }}
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">{r.name}</h3>
              <Pill>Built in</Pill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              All {ALL_PERMISSIONS.length} permissions
            </p>
          </div>
        ))}
        {shared.map((r) => (
          <RoleCard
            key={r._id}
            role={r}
            onEdit={() => setEditing(r)}
            onDelete={r.isSystem ? undefined : () => setDeleting(r)}
          />
        ))}
      </div>
      {shared.length <= 1 && (
        <EmptyState icon={ShieldCheck} title="Save roles for how your team works">
          For example “Order desk” (orders, invoices and returns) or “Content writer” (products, AI
          writer and SEO).
        </EmptyState>
      )}
      {personal.length > 0 && (
        <Panel
          title="Chosen for one person"
          description="Permission sets made while adding or editing a moderator. Edit them from Team members."
        >
          <ul className="divide-y divide-border text-xs">
            {personal.map((r) => (
              <li key={r._id} className="flex items-center justify-between gap-3 py-2">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">{r.permissions.length} permissions</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {editing && (
        <RoleEditor
          role={editing === "new" ? null : editing}
          isSuper={isSuper}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
      {deleting && (
        <Modal
          title="Delete role"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button type="button" className={primaryButton} onClick={remove}>
                Delete role
              </button>
            </>
          }
        >
          <p className="text-sm">
            Delete “{deleting.name}”?{" "}
            {deleting.members
              ? `Its ${deleting.members} members will get the moderator default permissions.`
              : ""}
          </p>
        </Modal>
      )}
    </div>
  );
}

function RoleCard({
  role: r,
  onEdit,
  onDelete,
}: {
  role: Role;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: r.color }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold">{r.name}</h3>
          {r.isSystem && <Pill>Default for moderators</Pill>}
        </div>
        <div className="flex">
          <button
            type="button"
            className={iconButton}
            aria-label={`Edit ${r.name}`}
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </button>
          {onDelete && (
            <button
              type="button"
              className={`${iconButton} text-destructive`}
              aria-label={`Delete ${r.name}`}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {r.description && <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>}
      <div className="mt-3 flex flex-wrap gap-1">
        {r.permissions.slice(0, 6).map((p) => (
          <Pill key={p}>{PERMISSIONS[p].label}</Pill>
        ))}
        {r.permissions.length > 6 && <Pill>+{r.permissions.length - 6} more</Pill>}
      </div>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Users className="h-3 w-3" /> {r.members} {r.members === 1 ? "member" : "members"} ·{" "}
        {r.permissions.length} permissions
      </p>
    </div>
  );
}

function RoleEditor({
  role,
  isSuper,
  onClose,
  onSaved,
}: {
  role: Role | null;
  isSuper: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [color, setColor] = useState(role?.color ?? COLORS[0]);
  const [perms, setPerms] = useState<Set<Permission>>(
    new Set(role?.permissions ?? DEFAULT_STAFF_PERMISSIONS),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = { name, description, color, permissions: [...perms] };
      if (role) await api(`/api/admin/roles/${role._id}`, { method: "PUT", json: body });
      else await api("/api/admin/roles", { method: "POST", json: body });
      toast.success(role ? "Role saved." : "Role created.");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={role ? `Edit “${role.name}”` : "New role"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            onClick={save}
            disabled={saving || !name.trim() || perms.size === 0}
          >
            {saving ? "Saving…" : "Save role"}
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Role name" htmlFor="r-name">
          <input
            id="r-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Order desk"
            className={inputClass}
          />
        </Field>
        <Field label="Colour">
          <div className="flex h-10 items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-card ${color === c ? "ring-2 ring-foreground" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
      </div>
      <Field label="Description" htmlFor="r-desc">
        <textarea
          id="r-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={textareaClass}
        />
      </Field>
      <PermissionPicker value={perms} onChange={setPerms} allowSensitive={isSuper} />
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}

// ─── Matrix ───

function Matrix({ roles }: { roles: Role[] }) {
  const columns = useMemo(
    () => [
      { key: "super", name: "Super admin", perms: new Set<Permission>(ALL_PERMISSIONS) },
      { key: "admin", name: "Admin", perms: new Set<Permission>(ALL_PERMISSIONS) },
      ...roles.map((r) => ({ key: r._id, name: r.name, perms: new Set(r.permissions) })),
    ],
    [roles],
  );
  return (
    <Panel title="Who can do what" description="Every permission and the roles that have it">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium">Permission</th>
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-2 py-2 text-center font-medium">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => (
              <React.Fragment key={group}>
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="pb-1 pt-3 text-[11px] font-semibold text-muted-foreground"
                  >
                    {group}
                  </td>
                </tr>
                {ALL_PERMISSIONS.filter((p) => PERMISSIONS[p].group === group).map((p) => (
                  <tr key={p} className="border-t border-border">
                    <td className="py-1.5 pr-3">
                      <span className="text-foreground">{PERMISSIONS[p].label}</span>
                      {isAdminOnly(p) && (
                        <span className="ml-1 text-[11px] text-amber-700 dark:text-amber-400">
                          (sensitive)
                        </span>
                      )}
                    </td>
                    {columns.map((c) => (
                      <td key={c.key} className="px-2 py-1.5 text-center">
                        {c.perms.has(p) ? (
                          <Check
                            className="mx-auto h-4 w-4 text-emerald-600"
                            aria-label="Allowed"
                          />
                        ) : (
                          <span className="text-muted-foreground/50" aria-label="Not allowed">
                            —
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
