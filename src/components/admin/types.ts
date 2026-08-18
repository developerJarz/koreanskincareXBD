import type { UserRole } from "@/types";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  isActive: boolean;
  walletBalance: number;
  rewardPoints: number;
  createdAt: string | null;
  lastLoginAt: string | null;
};

export type AdminTab =
  | "overview"
  | "analytics"
  | "orders"
  | "products"
  | "categories"
  | "inventory"
  | "customers"
  | "vendors"
  | "returns"
  | "couriers_payments"
  | "marketing"
  | "ai_studio"
  | "finance"
  | "cms_blog"
  | "reviews_abandoned"
  | "media"
  | "security_rbac"
  | "api_health"
  | "settings";

export type BDSeasonalTheme = "standard" | "ramadan" | "eid" | "boishakh";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: "order" | "inventory" | "refund" | "security" | "system";
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
};

export type Warehouse = {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  manager: string;
  phone: string;
  totalSkus: number;
  capacityUtilization: number; // percentage
  status: "active" | "maintenance";
};

export type Vendor = {
  id: string;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  division: string;
  commissionRate: number; // percentage
  walletBalance: number;
  totalSales: number;
  productsCount: number;
  rating: number;
  status: "active" | "pending" | "suspended";
  joinedDate: string;
};

export type ReturnRequest = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  variant?: string;
  reason: "size_issue" | "damaged_transit" | "not_as_described" | "changed_mind";
  refundMethod: "bkash" | "nagad" | "wallet" | "exchange";
  refundAmount: number;
  status: "pending" | "approved" | "picked_up" | "refunded" | "rejected";
  courierTracking?: string;
  requestedAt: string;
};

export type AbandonedCart = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  abandonedAt: string;
  recoveryStatus: "uncontacted" | "sms_sent" | "whatsapp_sent" | "recovered";
};

export type ActivityLog = {
  id: string;
  user: string;
  role: UserRole;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  status: "success" | "warning" | "error";
};

export type ExpenseItem = {
  id: string;
  category: "marketing_ads" | "packaging" | "salaries" | "logistics_overhead" | "software_cloud" | "other";
  title: string;
  amount: number;
  date: string;
  paidVia: "bKash" | "Bank Transfer" | "Cash" | "Card";
  notes?: string;
};

export type SmsTemplate = {
  id: string;
  title: string;
  trigger: "order_placed" | "shipped" | "delivered" | "abandoned_cart" | "eid_promo";
  body: string;
  isActive: boolean;
};
