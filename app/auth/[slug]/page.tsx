"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, UserCheck, KeyRound, Check } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";

type RouteParams = { slug: string };

const DEMO_USERS = [
  {
    email: "superadmin@noors.bd",
    name: "Super Admin",
    role: "super_admin" as const,
    pass: "admin123",
    label: "Super Admin",
    badge: "Full Access",
    color: "border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  {
    email: "admin@noors.bd",
    name: "Noors Admin",
    role: "admin" as const,
    pass: "admin123",
    label: "Store Admin",
    badge: "Catalog & Settings",
    color: "border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary",
  },
  {
    email: "staff@noors.bd",
    name: "Store Staff",
    role: "staff" as const,
    pass: "staff123",
    label: "Staff Moderator",
    badge: "Order Processing",
    color: "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    email: "customer@noors.bd",
    name: "Nusrat Jahan",
    role: "customer" as const,
    pass: "customer123",
    label: "Demo Customer",
    badge: "Shopping & Checkout",
    color: "border-border bg-secondary hover:bg-secondary/80 text-foreground",
  },
];

export default function AuthPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = use(params);
  const decodedSlug = decodeURIComponent(slug);

  if (decodedSlug === "login") return <LoginPage />;
  if (decodedSlug === "register") return <RegisterPage />;
  if (decodedSlug === "forgot-password") return <ForgotPasswordPage />;

  return (
    <section className="container-x py-20 text-center">
      <h1 className="font-serif text-4xl">Page Not Found</h1>
      <Link
        href="/auth/login"
        className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium"
      >
        Go to Login <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}

function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setIsSubmitting(true);
    try {
      const cleanEmail = targetEmail.trim().toLowerCase();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: targetPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      setUser(data);
      toast.success(`Welcome back, ${data.name}!`);

      if (data.role === "admin" || data.role === "staff" || data.role === "super_admin") {
        router.push("/admin");
        return;
      }

      router.push("/account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    performLogin(email, password);
  };

  const handleQuickDemoLogin = (demo: (typeof DEMO_USERS)[number]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    performLogin(demo.email, demo.pass);
  };

  return (
    <section className="container-x py-14 lg:py-20 max-w-lg">
      <div className="text-center mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary font-bold">Access Your Account</p>
        <h1 className="font-serif text-4xl lg:text-5xl mt-2">Welcome Back</h1>
        <p className="text-xs text-muted-foreground mt-1">Sign in to manage orders, wishlist, or store operations</p>
      </div>

      {/* Quick 1-Click Role Login for instant testing */}
      <div className="mb-6 p-5 rounded-3xl border border-border bg-card shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-primary" /> Instant 1-Click Role Logins:
          </span>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
            One Click Test
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => handleQuickDemoLogin(demo)}
              disabled={isSubmitting}
              className={`p-3 rounded-2xl border text-left transition-all ${demo.color} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs">{demo.label}</span>
                <Sparkles className="w-3 h-3 opacity-70" />
              </div>
              <span className="text-[10px] opacity-80 mt-1 font-mono">{demo.email}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Standard Login Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm"
      >
        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">Email Address</label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="admin@noors.bd"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground font-medium">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-70 shadow-md shadow-primary/20"
        >
          {isSubmitting ? "Signing in…" : "Sign In to Account"}
        </button>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-primary font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </form>
    </section>
  );
}

function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (!name.trim() || !email.trim() || !password.trim()) {
        throw new Error("Please fill in all fields.");
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setUser(data);
      toast.success("Account created successfully!");
      router.push("/account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container-x py-14 lg:py-20 max-w-lg">
      <div className="text-center mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary font-bold">Join Noors.bd</p>
        <h1 className="font-serif text-4xl lg:text-5xl mt-2">Create Account</h1>
        <p className="text-xs text-muted-foreground mt-1">Enjoy exclusive member discounts & reward points</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm"
      >
        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">Full Name</label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Nusrat Jahan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">Email Address</label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">Create Password</label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-70 shadow-md shadow-primary/20"
        >
          {isSubmitting ? "Creating account…" : "Complete Registration"}
        </button>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </form>
    </section>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitted(true);
    toast.success("Password reset instructions sent to your email!");
  };

  return (
    <section className="container-x py-14 lg:py-20 max-w-md">
      <div className="text-center mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary font-bold">Account Security</p>
        <h1 className="font-serif text-4xl mt-2">Reset Password</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">Email Address</label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition">
          {submitted ? "Resend Reset Link" : "Send Reset Link"}
        </button>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          <Link href="/auth/login" className="text-primary hover:underline">
            Return to Login
          </Link>
        </div>
      </form>
    </section>
  );
}
