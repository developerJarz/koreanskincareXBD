"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/types";

interface RequireAuthOptions {
  roles?: UserRole[];
  redirectTo?: string;
}

export function useRequireAuth(options: RequireAuthOptions = {}) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, setUser, logout } = useAuthStore();
  const { roles, redirectTo = "/auth/login" } = options;
  const rolesKey = roles?.join(",") ?? "";
  const [sessionChecked, setSessionChecked] = useState(false);

  // The stored user is only a UI hint — the server session decides. Until it has answered,
  // never redirect: an empty or stale browser store must not bounce a signed-in user to login.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) setUser(await res.json());
        else if (res.status === 401) logout();
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSessionChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, logout]);

  useEffect(() => {
    if (!sessionChecked || isLoading) return;

    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }

    if (rolesKey && !rolesKey.split(",").includes(user.role)) {
      router.push("/");
    }
  }, [sessionChecked, isAuthenticated, isLoading, user, rolesKey, router, redirectTo]);

  return { user, isAuthenticated, isLoading: isLoading || !sessionChecked };
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
