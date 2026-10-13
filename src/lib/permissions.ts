import type { UserRole } from "@/types";

/**
 * Permission catalogue shared by the server (API guards) and the admin UI (which tabs and
 * buttons to show). The server is the source of truth — the UI only hides what would fail.
 *
 *  - super_admin and admin always have every permission.
 *  - moderators (role "staff") get the permissions of their role: a shared role, a set made just
 *    for them, or the editable default "Moderator" role.
 *  - `adminOnly` (sensitive) permissions — secrets, money settings, deleting data, managing the
 *    team — can only be given to a moderator by a super admin.
 */

export type PermissionGroup =
  "Store" | "Sales" | "Catalogue" | "Customers" | "Growth" | "Money" | "Insights" | "Setup";

type PermissionDef = {
  label: string;
  group: PermissionGroup;
  description: string;
  /** Sensitive: only a super admin can give it to a moderator */
  adminOnly?: boolean;
  /** Part of the built-in "Staff" role until an admin edits it */
  staffDefault?: boolean;
};

export const PERMISSIONS = {
  "dashboard.view": {
    label: "Overview",
    group: "Store",
    description: "See the overview page and what needs attention",
    staffDefault: true,
  },
  "analytics.view": {
    label: "Sales reports",
    group: "Sales",
    description: "Revenue, top products and sales by region",
    staffDefault: true,
  },
  "orders.view": {
    label: "View orders",
    group: "Sales",
    description: "Open orders and customer delivery details",
    staffDefault: true,
  },
  "orders.manage": {
    label: "Update orders",
    group: "Sales",
    description: "Change order status, courier and tracking",
    staffDefault: true,
  },
  "returns.manage": {
    label: "Returns & refunds",
    group: "Sales",
    description: "Mark orders returned and refunds paid",
    staffDefault: true,
  },
  "invoices.view": {
    label: "View invoices",
    group: "Sales",
    description: "Open and print invoices",
    staffDefault: true,
  },
  "invoices.manage": {
    label: "Create invoices",
    group: "Sales",
    description: "Create, edit, record payments and void invoices",
    staffDefault: true,
  },
  "invoices.design": {
    label: "Design invoice page",
    group: "Sales",
    description: "Change the invoice layout, colours, logo and wording",
  },
  "catalog.view": {
    label: "View catalogue",
    group: "Catalogue",
    description: "See products, brands, categories and stock",
    staffDefault: true,
  },
  "catalog.manage": {
    label: "Edit products",
    group: "Catalogue",
    description: "Add, edit, publish and delete products",
    staffDefault: true,
  },
  "catalog.structure": {
    label: "Brands & categories",
    group: "Catalogue",
    description: "Create, edit and reorder brands and categories",
  },
  "inventory.manage": {
    label: "Adjust stock",
    group: "Catalogue",
    description: "Change stock counts",
    staffDefault: true,
  },
  "media.view": {
    label: "Media library",
    group: "Catalogue",
    description: "Browse images used across the shop",
    staffDefault: true,
  },
  "reviews.manage": {
    label: "Reviews & carts",
    group: "Customers",
    description: "Moderate reviews and follow up abandoned carts",
    staffDefault: true,
  },
  "customers.view": {
    label: "View customers",
    group: "Customers",
    description: "Customer accounts, order history and spend",
    staffDefault: true,
  },
  "customers.manage": {
    label: "Manage customers",
    group: "Customers",
    description: "Suspend or re-activate customer accounts",
  },
  "marketing.manage": {
    label: "Promotions",
    group: "Growth",
    description: "Create and switch off coupon codes",
  },
  "content.manage": {
    label: "Content & SEO",
    group: "Growth",
    description: "AI writer, blog and search appearance",
    staffDefault: true,
  },
  "vendors.view": {
    label: "Vendor products",
    group: "Growth",
    description: "See vendors and review their products",
    staffDefault: true,
  },
  "vendors.manage": {
    label: "Manage vendors",
    group: "Growth",
    description: "Approve, suspend and change vendor selling rules",
    adminOnly: true,
  },
  "finance.view": {
    label: "Finance reports",
    group: "Money",
    description: "Profit and loss, expenses and exports",
  },
  "finance.manage": {
    label: "Record expenses",
    group: "Money",
    description: "Add, edit and delete expenses",
  },
  "payments.view": {
    label: "Delivery & payments",
    group: "Money",
    description: "Payment and courier breakdowns, transaction lookup",
    staffDefault: true,
  },
  "payments.manage": {
    label: "Payment settings",
    group: "Money",
    description: "Switch payment methods and couriers on or off",
    adminOnly: true,
  },
  "activity.view": {
    label: "Site activity",
    group: "Insights",
    description: "Page views, visitor sessions, carts and traces",
  },
  "activity.manage": {
    label: "Activity data & database",
    group: "Insights",
    description: "Delete activity data and change how long it is kept",
    adminOnly: true,
  },
  "audit.view": {
    label: "Team audit log",
    group: "Insights",
    description: "See what each team member changed",
  },
  "system.view": {
    label: "System health",
    group: "Insights",
    description: "Database connection, storage and service status",
  },
  "storefront.manage": {
    label: "Website design",
    group: "Setup",
    description: "Logo, homepage sections, footer and contact details",
  },
  "settings.manage": {
    label: "Store settings",
    group: "Setup",
    description: "Store description and delivery charges",
    adminOnly: true,
  },
  "roles.manage": {
    label: "Team & roles",
    group: "Setup",
    description: "Create roles and change who has access",
    adminOnly: true,
  },
} as const satisfies Record<string, PermissionDef>;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  "Store",
  "Sales",
  "Catalogue",
  "Customers",
  "Growth",
  "Money",
  "Insights",
  "Setup",
];

export const STAFF_GRANTABLE: Permission[] = ALL_PERMISSIONS.filter(
  (p) => !(PERMISSIONS[p] as PermissionDef).adminOnly,
);

export const DEFAULT_STAFF_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => (PERMISSIONS[p] as PermissionDef).staffDefault,
);

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && value in PERMISSIONS;
}

export function isAdminOnly(permission: Permission): boolean {
  return Boolean((PERMISSIONS[permission] as PermissionDef).adminOnly);
}

/** Keeps only known permissions (in catalogue order); sensitive ones only when allowed. */
export function sanitizePermissions(values: unknown, allowSensitive = false): Permission[] {
  if (!Array.isArray(values)) return [];
  const set = new Set<Permission>();
  for (const value of values) {
    if (isPermission(value) && (allowSensitive || !isAdminOnly(value))) set.add(value);
  }
  return ALL_PERMISSIONS.filter((p) => set.has(p));
}

/** Non-sensitive permissions only (what an admin may hand out). */
export function sanitizeStaffPermissions(values: unknown): Permission[] {
  return sanitizePermissions(values, false);
}

/**
 * The permissions to save when someone edits a role. A super admin may set anything; an admin
 * can change the ordinary permissions but sensitive ones a super admin granted are kept as-is.
 */
export function permissionsAfterEdit(
  requested: unknown,
  previous: unknown,
  editorIsSuperAdmin: boolean,
): Permission[] {
  if (editorIsSuperAdmin) return sanitizePermissions(requested, true);
  const kept = sanitizePermissions(previous, true).filter(isAdminOnly);
  return sanitizePermissions([...sanitizeStaffPermissions(requested), ...kept], true);
}

export function roleHasFullAccess(role: UserRole | undefined): boolean {
  return role === "super_admin" || role === "admin";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  staff: "Moderator",
  customer: "Customer",
  vendor: "Vendor",
};
