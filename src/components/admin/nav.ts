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
  Plug,
  Settings,
  Megaphone,
  BadgeCheck,
  Palette,
  type LucideIcon,
} from "lucide-react";
import type { AdminTab } from "./types";

export type NavItem = {
  tab: AdminTab;
  label: string;
  icon: LucideIcon;
  /** One line shown under the page title in the header */
  description: string;
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
      },
      {
        tab: "orders",
        label: "Orders",
        icon: ShoppingBag,
        description: "Confirm, pack and dispatch orders",
      },
      {
        tab: "returns",
        label: "Returns",
        icon: RotateCcw,
        description: "Exchanges and refund requests",
      },
      {
        tab: "customers",
        label: "Customers",
        icon: Users,
        description: "Accounts, roles and order history",
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
      },
      {
        tab: "brands",
        label: "Brands",
        icon: BadgeCheck,
        description: "Brands, logos and brand pages",
      },
      {
        tab: "categories",
        label: "Categories",
        icon: Layers,
        description: "How products are grouped in the shop",
      },
      { tab: "inventory", label: "Stock", icon: Boxes, description: "Stock levels by warehouse" },
      { tab: "media", label: "Media", icon: ImageIcon, description: "Images used across the shop" },
      {
        tab: "reviews_abandoned",
        label: "Reviews & carts",
        icon: MessageSquare,
        description: "Product reviews and carts left behind",
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
      },
      {
        tab: "ai_studio",
        label: "AI writer",
        icon: Sparkles,
        description: "Draft product copy and SEO text",
      },
      {
        tab: "cms_blog",
        label: "Pages & SEO",
        icon: FileText,
        description: "Blog posts and search appearance",
      },
      {
        tab: "vendors",
        label: "Vendors",
        icon: Store,
        description: "Sellers, their selling rules and product reviews",
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
        description: "Revenue and top products",
      },
      {
        tab: "finance",
        label: "Finance",
        icon: Wallet,
        description: "Profit, expenses and exports",
      },
      {
        tab: "couriers_payments",
        label: "Delivery & payments",
        icon: Truck,
        description: "Couriers, bKash, Nagad and COD",
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
      },
      {
        tab: "security_rbac",
        label: "Team & security",
        icon: Shield,
        description: "Staff access, passwords and activity",
      },
      {
        tab: "api_health",
        label: "Integrations",
        icon: Plug,
        description: "Connected services and system status",
      },
      {
        tab: "settings",
        label: "Settings",
        icon: Settings,
        description: "Store description and delivery charges",
      },
    ],
  },
];

const NAV_BY_TAB = new Map(ADMIN_NAV.flatMap((g) => g.items).map((item) => [item.tab, item]));

export function getNavItem(tab: AdminTab): NavItem {
  return NAV_BY_TAB.get(tab) ?? ADMIN_NAV[0].items[0];
}
