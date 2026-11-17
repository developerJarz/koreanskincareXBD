import type { IOrderLocation, OrderStatus } from "@/types";

export type AdminOrder = {
  _id: string;
  orderNumber: string;
  user?: { _id: string; name: string; email: string } | null;
  guestEmail?: string;
  guestPhone?: string;
  items: {
    product: string;
    productName: string;
    productImage?: string;
    variant?: { sku?: string; color?: string; size?: string };
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  shippingCost: number;
  tax?: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  paymentStatus: string;
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
  orderLocation?: Omit<IOrderLocation, "capturedAt"> & { capturedAt: string };
  deliveryNotes?: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
};
