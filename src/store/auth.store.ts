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

      logout: () => {
        // Clears the HttpOnly session cookie on the server
        if (typeof window !== "undefined") {
          fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

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
      name: "koreanskincare-auth",
      // Only persist who is signed in; "loading" must never be restored from storage,
      // otherwise first-time visitors stay stuck on a loading screen
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
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
