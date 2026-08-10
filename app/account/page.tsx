"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Shield,
  Award,
  Wallet,
  LogOut,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";
import { useRequireAuth } from "@/hooks/use-require-auth";

type CustomerTab = "overview" | "orders" | "profile";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();
  useRequireAuth({ redirectTo: "/auth/login" });

  const [activeTab, setActiveTab] = useState<CustomerTab>("overview");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "01711223344");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      if (user.phone) setProfilePhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      if (!user?.id) {
        setLoadingOrders(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUserOrders(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch user orders:", err);
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    }

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    router.push("/auth/login");
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile information updated!");
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20 py-10 lg:py-16">
      <div className="container-x">
        {/* User Header Card */}
        <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary font-serif font-bold text-2xl flex items-center justify-center border-2 border-primary/30 shrink-0">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="font-serif text-2xl lg:text-3xl font-bold">{user?.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              <span className="inline-block mt-2 text-[10px] uppercase tracking-widest bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
                {user?.role === "customer" ? "Valued Customer" : user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-full border border-border text-xs font-medium text-destructive hover:bg-destructive/10 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="space-y-2">
            {[
              { id: "overview", label: "Dashboard Overview", icon: User },
              { id: "orders", label: "My Orders", icon: ShoppingBag },
              { id: "profile", label: "Profile Settings", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as CustomerTab)}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-medium transition flex items-center gap-3 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                      : "bg-card hover:bg-accent text-foreground border border-border"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Tab Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-up">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Orders Placed</p>
                    <p className="font-serif text-3xl font-bold mt-2">{userOrders.length}</p>
                  </div>
                  <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Wallet Balance</p>
                    <p className="font-serif text-3xl font-bold mt-2 text-primary">৳0</p>
                  </div>
                  <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Reward Points</p>
                    <p className="font-serif text-3xl font-bold mt-2 text-amber-600">150 pts</p>
                  </div>
                </div>

                <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl">Recent Orders</h2>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {userOrders.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
                      <Link
                        href="/shop"
                        className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-medium"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userOrders.slice(0, 3).map((order) => (
                        <div key={order._id} className="p-4 rounded-2xl border border-border flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm font-bold">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {order.items?.length || 1} items | Total: ৳{order.total?.toLocaleString()}
                            </p>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-6 animate-fade-up">
                <h2 className="font-serif text-2xl">Order History</h2>

                {userOrders.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">No order history available.</p>
                    <Link
                      href="/shop"
                      className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-medium"
                    >
                      Explore Collection
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <div key={order._id} className="p-5 rounded-2xl border border-border space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div>
                            <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
                            <span className="text-xs text-muted-foreground ml-3">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                            {order.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <p className="text-muted-foreground">Payment Method: <strong className="text-foreground">{order.paymentMethod}</strong></p>
                            <p className="text-muted-foreground">Shipping: {order.shippingAddress?.area}, {order.shippingAddress?.district}</p>
                          </div>
                          <p className="font-serif font-bold text-base text-primary">
                            ৳{order.total?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm space-y-6 animate-fade-up">
                <h2 className="font-serif text-2xl">Profile Settings</h2>

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Phone Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={profileEmail}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-xs font-medium hover:opacity-90 transition"
                  >
                    Save Profile Changes
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
