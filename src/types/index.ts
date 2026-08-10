// ─── User Types ───
export type UserRole = "super_admin" | "admin" | "staff" | "customer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  emailVerified: boolean;
}

export interface IUser {
  _id?: any;
  name: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  provider: "credentials" | "google" | "facebook";
  providerId?: string;
  addresses?: any[];
  walletBalance: number;
  rewardPoints: number;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Address Types ───
export interface IAddress {
  _id?: any;
  user: any;
  label: string;
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  streetAddress: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Product Types ───
export interface IProductVariant {
  sku: string;
  barcode?: string;
  color?: string;
  colorHex?: string;
  size?: string;
  material?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  isActive: boolean;
}

export interface IProduct {
  _id?: any;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: any;
  subcategory?: string;
  brand?: any;
  collections: string[];
  tags: string[];
  images: string[];
  variants: IProductVariant[];
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  colors: string[];
  sizes: string[];
  materials: string[];
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  avgRating: number;
  totalReviews: number;
  totalSold: number;
  viewCount: number;
  relatedProducts?: any[];
  frequentlyBoughtWith?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Category Types ───
export interface ICategory {
  _id?: any;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: any;
  children?: any[];
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Brand Types ───
export interface IBrand {
  _id?: any;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  productCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Order Types ───
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

export interface IOrderItem {
  product: any;
  productName: string;
  productImage: string;
  variant?: {
    sku?: string;
    color?: string;
    size?: string;
  };
  price: number;
  quantity: number;
  total: number;
}

export interface IOrder {
  _id?: any;
  orderNumber?: string;
  user?: any;
  guestEmail?: string;
  guestPhone?: string;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentTransactionId?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    area: string;
    streetAddress: string;
    postalCode?: string;
  };
  billingAddress?: IOrder["shippingAddress"];
  deliveryNotes?: string;
  shippingMethod?: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  invoiceUrl?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Cart Types ───
export interface ICartItem {
  product: any;
  variant?: {
    sku?: string;
    color?: string;
    size?: string;
  };
  quantity: number;
  price: number;
  addedAt?: Date;
}

export interface ICart {
  _id?: any;
  user?: any;
  sessionId?: string;
  items: ICartItem[];
  couponCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
}

// ─── Wishlist Types ───
export interface IWishlistItem {
  product: any;
  addedAt?: Date;
}

export interface IWishlist {
  _id?: any;
  user: any;
  items: IWishlistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Review Types ───
export interface IReview {
  _id?: any;
  product: any;
  user: any;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  videos?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  helpfulBy?: any[];
  reply?: {
    message?: string;
    repliedBy?: any;
    repliedAt?: Date;
  };
  status: "pending" | "approved" | "rejected";
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Coupon Types ───
export type CouponType = "percentage" | "fixed" | "free_shipping" | "first_order" | "buy_x_get_y";

export interface ICoupon {
  _id?: any;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  applicableProducts?: any[];
  applicableCategories?: any[];
  excludedProducts?: any[];
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  isAutoApply: boolean;
  isActive: boolean;
  startsAt: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Blog Types ───
export interface IBlog {
  _id?: any;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  author: any;
  authorName: string;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  viewCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Notification Types ───
export type NotificationType =
  "order_update" | "new_offer" | "low_stock" | "wishlist_alert" | "admin" | "system";

export interface INotification {
  _id?: any;
  user: any;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt?: Date;
}

// ─── Homepage Section Types ───
export type HomepageSectionType =
  | "hero"
  | "features"
  | "categories"
  | "products"
  | "banner"
  | "testimonials"
  | "newsletter"
  | "blog"
  | "custom";

export interface IHomepageSection {
  _id?: any;
  type: HomepageSectionType;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Banner Types ───
export interface IBanner {
  _id?: any;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  buttonText?: string;
  position: "hero" | "sidebar" | "inline" | "popup";
  sortOrder: number;
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Settings Types ───
export interface ISiteSettings {
  _id?: any;
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImage?: string;
    googleAnalyticsId?: string;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCost: number;
    insideDhakaCost: number;
    outsideDhakaCost: number;
  };
  paymentGateways: {
    name: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }[];
  courierServices: {
    name: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Payment Types ───
export interface IPayment {
  _id?: any;
  order: any;
  gateway: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: "initiated" | "success" | "failed" | "refunded";
  gatewayResponse?: Record<string, unknown>;
  refundAmount?: number;
  refundedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Analytics Types ───
export interface IAnalyticsEvent {
  _id?: any;
  type: "page_view" | "product_view" | "add_to_cart" | "purchase" | "search";
  user?: any;
  sessionId: string;
  data: Record<string, unknown>;
  createdAt?: Date;
}
