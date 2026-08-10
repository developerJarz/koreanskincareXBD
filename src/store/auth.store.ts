import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  isAdmin: () => boolean;
  isStaff: () => boolean;
  isCustomer: () => boolean;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      isAdmin: () => {
        const role = get().user?.role;
        return role === "super_admin" || role === "admin";
      },

      isStaff: () => {
        const role = get().user?.role;
        return role === "super_admin" || role === "admin" || role === "staff";
      },

      isCustomer: () => get().user?.role === "customer",

      hasRole: (roles) => {
        const role = get().user?.role;
        return role ? roles.includes(role) : false;
      },
    }),
    {
      name: "noors-auth",
      storage: createJSONStorage(() => {
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
