import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItemStore {
  productId: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  variant?: {
    sku: string;
    color?: string;
    size?: string;
  };
  category: string;
  slug: string;
}

interface CartState {
  items: CartItemStore[];
  couponCode: string | null;
  couponDiscount: number;

  // Actions
  addItem: (item: CartItemStore) => void;
  removeItem: (productId: string, variantSku?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  setCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,

      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.productId === item.productId && i.variant?.sku === item.variant?.sku,
        );

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId && i.variant?.sku === item.variant?.sku
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },

      removeItem: (productId, variantSku) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.variant?.sku === variantSku),
          ),
        });
      },

      updateQuantity: (productId, quantity, variantSku) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantSku);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.variant?.sku === variantSku ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => {
        set({ items: [], couponCode: null, couponDiscount: 0 });
      },

      setCoupon: (code, discount) => {
        set({ couponCode: code, couponDiscount: discount });
      },

      removeCoupon: () => {
        set({ couponCode: null, couponDiscount: 0 });
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().couponDiscount;
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: "koreanskincare-cart",
      storage: createJSONStorage(() => {
        // Safe localStorage access for SSR
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    },
  ),
);
