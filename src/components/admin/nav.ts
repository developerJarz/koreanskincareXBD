import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Package,
  Layers,
  Boxes,
  Users,
  Store,
  RotateCcw,
  Truck,
  Sparkles,
  Wallet,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Shield,
  Database,
  Settings,
  Megaphone,
  BadgeCheck,
  Palette,
  Activity,
  ReceiptText,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";
import type { AdminTab } from "./types";

export type NavItem = {
  tab: AdminTab;
  label: string;
  icon: LucideIcon;
  /** One line shown under the page title in the header */
  description: string;
  /** Needed to see the tab; null = every team member */
  permission: Permission | null;
};

export type NavGroup = { title: string; items: NavItem[] };

// Grouped by how often the team uses them: day-to-day work first, setup last
export const ADMIN_NAV: NavGroup[] = [
  {
    title: "Daily",
    items: [
      {
        tab: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        description: "What needs attention today",
        permission: "dashboard.view",
      },
      {
        tab: "orders",
        label: "Orders",
        icon: ShoppingBag,
        description: "Confirm, pack and dispatch orders",
        permission: "orders.view",
      },
      {
        tab: "invoices",
        label: "Invoices",
        icon: ReceiptText,
        description: "Create, print and track payment of invoices",
        permission: "invoices.view",
      },
      {
        tab: "returns",
        label: "Returns",
        icon: RotateCcw,
        description: "Returned orders and refunds",
        permission: "returns.manage",
      },
      {
        tab: "customers",
        label: "Customers",
        icon: Users,
        description: "Accounts, spend and order history",
        permission: "customers.view",
      },
    ],
  },
  {
    title: "Catalogue",
    items: [
      {
        tab: "products",
        label: "Products",
        icon: Package,
        description: "Add, edit and publish products",
        permission: "catalog.view",
      },
      {
        tab: "brands",
        label: "Brands",
        icon: BadgeCheck,
        description: "Brands, logos and brand pages",
        permission: "catalog.view",
      },
      {
        tab: "categories",
        label: "Categories",
        icon: Layers,
        description: "How products are grouped in the shop",
        permission: "catalog.view",
      },
      {
        tab: "inventory",
        label: "Stock",
        icon: Boxes,
        description: "Stock levels, value and adjustments",
        permission: "catalog.view",
      },
      {
        tab: "media",
        label: "Media",
        icon: ImageIcon,
        description: "Images used across the shop",
        permission: "media.view",
      },
      {
        tab: "reviews_abandoned",
        label: "Reviews & carts",
        icon: MessageSquare,
        description: "Product reviews, abandoned carts and wishlists",
        permission: "reviews.manage",
      },
    ],
  },
  {
    title: "Growth",
    items: [
      {
        tab: "marketing",
        label: "Promotions",
        icon: Megaphone,
        description: "Coupons, seasonal campaigns and SMS",
        permission: "marketing.manage",
      },
      {
        tab: "ai_studio",
        label: "AI writer",
        icon: Sparkles,
        description: "Draft product copy and SEO text",
        permission: "content.manage",
      },
      {
        tab: "cms_blog",
        label: "Pages & SEO",
        icon: FileText,
        description: "Blog posts and search appearance",
        permission: "content.manage",
      },
      {
        tab: "vendors",
        label: "Vendors",
        icon: Store,
        description: "Sellers, their selling rules and product reviews",
        permission: "vendors.view",
      },
    ],
  },
  {
    title: "Money",
    items: [
      {
        tab: "analytics",
        label: "Sales",
        icon: BarChart3,
        description: "Revenue, profit, regions and top products",
        permission: "analytics.view",
      },
      {
        tab: "finance",
        label: "Finance",
        icon: Wallet,
        description: "Profit & loss, expenses and exports",
        permission: "finance.view",
      },
      {
        tab: "couriers_payments",
        label: "Delivery & payments",
        icon: Truck,
        description: "Payment methods, couriers and cash on delivery",
        permission: "payments.view",
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        tab: "activity",
        label: "Site activity",
        icon: Activity,
        description: "Visitors, page views, carts and visit traces",
        permission: "activity.view",
      },
      {
        tab: "api_health",
        label: "System & database",
        icon: Database,
        description: "Database connection, storage and services",
        permission: "system.view",
      },
    ],
  },
  {
    title: "Setup",
    items: [
      {
        tab: "storefront",
        label: "Website design",
        icon: Palette,
        description: "Logo, homepage, footer and contact details",
        permission: null,
      },
      {
        tab: "roles",
        label: "Team & roles",
        icon: UserCog,
        description: "Who has access and what each role can do",
        permission: "roles.manage",
      },
      {
        tab: "security_rbac",
        label: "Security",
        icon: Shield,
        description: "Your password, sign-ins, audit log and blocked IPs",
        permission: null,
      },
      {
        tab: "settings",
        label: "Settings",
        icon: Settings,
        description: "Store description and delivery charges",
        permission: "settings.manage",
      },
    ],
  },
];

const NAV_BY_TAB = new Map(ADMIN_NAV.flatMap((g) => g.items).map((item) => [item.tab, item]));

export function getNavItem(tab: AdminTab): NavItem {
  return NAV_BY_TAB.get(tab) ?? ADMIN_NAV[0].items[0];
}

export function canOpenTab(tab: AdminTab, permissions: readonly Permission[]): boolean {
  const item = NAV_BY_TAB.get(tab);
  return Boolean(item && (item.permission === null || permissions.includes(item.permission)));
}

/** The navigation trimmed to what this team member may open. */
export function navFor(permissions: readonly Permission[]): NavGroup[] {
  return ADMIN_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.permission === null || permissions.includes(i.permission)),
  })).filter((g) => g.items.length > 0);
}
