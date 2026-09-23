"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";
import { SiteLogoLink } from "@/components/Logo";

type RouteParams = { slug: string };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
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

  return (
    <section className="container-x py-16 lg:py-24 max-w-md">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="mb-4">
          <SiteLogoLink variant="header" />
        </div>
        <p className="text-xs tracking-[0.25em] uppercase text-primary font-bold">
          Access Your Account
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl mt-2">Welcome Back</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sign in to manage orders, wishlist, or store operations
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm"
      >
        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">
            Email Address
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="name@example.com"
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
            type="password"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••"
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
    <section className="container-x py-16 lg:py-24 max-w-md">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="mb-4">
          <SiteLogoLink variant="header" />
        </div>
        <p className="text-xs tracking-[0.25em] uppercase text-primary font-bold">
          Join KoreanSkincare.bd
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl mt-2">Create Account</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Enjoy exclusive member discounts & reward points
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm"
      >
        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">Full Name</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Nusrat Jahan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">
            Email Address
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">
            Create Password
          </label>
          <input
            type="password"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••"
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
    <section className="container-x py-16 lg:py-24 max-w-md">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="mb-4">
          <SiteLogoLink variant="header" />
        </div>
        <p className="text-xs tracking-[0.25em] uppercase text-primary font-bold">
          Account Security
        </p>
        <h1 className="font-serif text-4xl mt-2">Reset Password</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-medium">
            Email Address
          </label>
          <input
            type="email"
            required
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
