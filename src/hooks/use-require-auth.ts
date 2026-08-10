"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/types";

interface RequireAuthOptions {
  roles?: UserRole[];
  redirectTo?: string;
}

export function useRequireAuth(options: RequireAuthOptions = {}) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const { roles, redirectTo = "/auth/login" } = options;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }

    if (roles && !roles.includes(user.role)) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, user, roles, router, redirectTo]);

  return { user, isAuthenticated, isLoading };
}

export function useRequireStaff() {
  return useRequireAuth({
    roles: ["super_admin", "admin", "staff"],
  });
}

export function useRequireCustomer() {
  return useRequireAuth({
    roles: ["customer", "super_admin", "admin", "staff"],
  });
}
