import type { UserRole } from "@/types";

/** Where a signed-in user's dashboard is, if their role has one (used for "Dashboard" buttons). */
export function dashboardFor(role: UserRole | undefined | null) {
  if (role === "super_admin" || role === "admin" || role === "staff") {
    return { href: "/admin", label: "Admin dashboard" };
  }
  if (role === "vendor") return { href: "/vendor", label: "Seller dashboard" };
  return null;
}
