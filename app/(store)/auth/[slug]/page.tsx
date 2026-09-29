"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";
import { SiteLogoLink } from "@/components/Logo";
import { dashboardFor } from "@/lib/dashboard";
import type { AuthUser } from "@/types";

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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  // Already signed in? Ask the server (not browser storage) so an expired session never shows here
  const [signedInAs, setSignedInAs] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((me: AuthUser | null) => {
        if (cancelled) return;
        setSignedInAs(me);
        if (me) setUser(me);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setUser]);

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

      // Keep the button busy until the next page has loaded — resetting it here made the
      // form look idle while the dashboard was still being prepared on the server
      setIsRedirecting(true);
      const isStaff = data.role === "admin" || data.role === "staff" || data.role === "super_admin";
      router.replace(isStaff ? "/admin" : data.role === "vendor" ? "/vendor" : "/account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
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

      {signedInAs && (
        <div className="mb-6 rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center space-y-4">
          <p className="text-sm">
            You&apos;re signed in as <strong>{signedInAs.name}</strong>
            <span className="block text-xs text-muted-foreground mt-0.5">{signedInAs.email}</span>
          </p>
          {(() => {
            const dashboard = dashboardFor(signedInAs.role);
            return (
              <Link
                href={dashboard?.href ?? "/account"}
                className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition shadow-md shadow-primary/20"
              >
                {dashboard ? `Open ${dashboard.label.toLowerCase()}` : "Go to my account"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            );
          })()}
          <button
            type="button"
            onClick={() => {
              logout();
              setSignedInAs(null);
            }}
            className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
          >
            Sign in with a different account
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        hidden={Boolean(signedInAs)}
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
          {isRedirecting ? "Opening your account…" : isSubmitting ? "Signing in…" : "Sign in"}
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

const fieldClass =
  "w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
const primaryButton =
  "w-full bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-70 shadow-md shadow-primary/20";

/** Seconds left before another code can be requested (servers enforce 60s too). */
function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/** One field for the 6-digit code; `autocomplete="one-time-code"` lets phones fill it from the email. */
function CodeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="otp-code" className="text-xs text-muted-foreground block mb-1 font-medium">
        6-digit code
      </label>
      <input
        id="otp-code"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        autoFocus
        className={`${fieldClass} text-center text-2xl tracking-[0.5em] font-semibold tabular-nums`}
        placeholder="••••••"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />
    </div>
  );
}

function AuthHeading({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <div className="text-center mb-8 flex flex-col items-center">
      <div className="mb-4">
        <SiteLogoLink variant="header" />
      </div>
      <h1 className="font-serif text-4xl lg:text-5xl mt-2">{title}</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">{subtitle}</p>
    </div>
  );
}

function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [step, setStep] = useState<"details" | "code">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useCountdown();

  const sendCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { ok, data } = await postJson("/api/auth/register", { name, email, password });
      if (!ok) {
        if (data.retryAfter) setCooldown(data.retryAfter);
        throw new Error(data.error || "Couldn't start sign-up");
      }
      setStep("code");
      setCode("");
      setCooldown(60);
      toast.success(`We sent a code to ${data.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't start sign-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    const { ok, data } = await postJson("/api/auth/register/resend", { email });
    if (!ok) {
      if (data.retryAfter) setCooldown(data.retryAfter);
      return toast.error(data.error || "Couldn't send a new code");
    }
    setCooldown(60);
    toast.success("A new code is on its way");
  };

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { ok, data } = await postJson("/api/auth/register/verify", { email, code });
      if (!ok) throw new Error(data.error || "Couldn't verify the code");
      setUser(data);
      toast.success("Your account is ready. Welcome!");
      router.replace("/account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't verify the code");
      setIsSubmitting(false);
    }
  };

  if (step === "code") {
    return (
      <section className="container-x py-16 lg:py-24 max-w-md">
        <AuthHeading
          title="Check your email"
          subtitle={
            <>
              Enter the 6-digit code we sent to <strong className="text-foreground">{email}</strong>
              . It expires in 10 minutes.
            </>
          }
        />
        <form
          onSubmit={verify}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm"
        >
          <CodeField value={code} onChange={setCode} />
          <button disabled={isSubmitting || code.length !== 6} className={primaryButton}>
            {isSubmitting ? "Creating your account…" : "Verify and create account"}
          </button>
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setStep("details")}
              className="text-primary hover:underline"
            >
              Change email
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Can&apos;t find it? Check your spam or promotions folder.
          </p>
        </form>
      </section>
    );
  }

  return (
    <section className="container-x py-16 lg:py-24 max-w-md">
      <AuthHeading
        title="Create account"
        subtitle="Member discounts and reward points. We'll email you a code to confirm your address."
      />

      <form
        onSubmit={sendCode}
        className="space-y-4 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm"
      >
        <div>
          <label
            htmlFor="reg-name"
            className="text-xs text-muted-foreground block mb-1 font-medium"
          >
            Full name
          </label>
          <input
            id="reg-name"
            type="text"
            required
            className={fieldClass}
            placeholder="Nusrat Jahan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="text-xs text-muted-foreground block mb-1 font-medium"
          >
            Email address
          </label>
          <input
            id="reg-email"
            type="email"
            required
            className={fieldClass}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="text-xs text-muted-foreground block mb-1 font-medium"
          >
            Create password
          </label>
          <input
            id="reg-password"
            type="password"
            required
            minLength={10}
            className={fieldClass}
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            aria-describedby="reg-password-hint"
          />
          <p id="reg-password-hint" className="mt-1 text-xs text-muted-foreground">
            At least 10 characters, using 3 of: lowercase, uppercase, number, symbol.
          </p>
        </div>

        <button disabled={isSubmitting} className={primaryButton}>
          {isSubmitting ? "Sending code…" : "Continue"}
        </button>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </section>
  );
}

function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useCountdown();

  const requestCode = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setIsSubmitting(true);
    try {
      const { ok, data } = await postJson("/api/auth/forgot-password", { email });
      if (!ok) throw new Error(data.error || "Couldn't send the code");
      setStep("reset");
      setCooldown(60);
      toast.success(data.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send the code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("The two passwords don't match");
      return;
    }
    setIsSubmitting(true);
    try {
      const { ok, data } = await postJson("/api/auth/reset-password", { email, code, newPassword });
      if (!ok) throw new Error(data.error || "Couldn't reset your password");
      toast.success(data.message);
      router.replace("/auth/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't reset your password");
      setIsSubmitting(false);
    }
  };

  if (step === "reset") {
    return (
      <section className="container-x py-16 lg:py-24 max-w-md">
        <AuthHeading
          title="Set a new password"
          subtitle={
            <>
              If <strong className="text-foreground">{email}</strong> has an account, we sent it a
              6-digit code. It expires in 10 minutes.
            </>
          }
        />
        <form
          onSubmit={reset}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm"
        >
          <CodeField value={code} onChange={setCode} />
          <div>
            <label
              htmlFor="new-password"
              className="text-xs text-muted-foreground block mb-1 font-medium"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={10}
              className={fieldClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              aria-describedby="new-password-hint"
            />
            <p id="new-password-hint" className="mt-1 text-xs text-muted-foreground">
              At least 10 characters, using 3 of: lowercase, uppercase, number, symbol.
            </p>
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="text-xs text-muted-foreground block mb-1 font-medium"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              className={fieldClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button disabled={isSubmitting || code.length !== 6} className={primaryButton}>
            {isSubmitting ? "Saving…" : "Change password"}
          </button>
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-primary hover:underline"
            >
              Use a different email
            </button>
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={cooldown > 0 || isSubmitting}
              className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="container-x py-16 lg:py-24 max-w-md">
      <AuthHeading
        title="Reset password"
        subtitle="Enter the email you signed up with and we'll send you a 6-digit code."
      />
      <form
        onSubmit={requestCode}
        className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="forgot-email"
            className="text-xs text-muted-foreground block mb-1 font-medium"
          >
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            className={fieldClass}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <button disabled={isSubmitting} className={primaryButton}>
          {isSubmitting ? "Sending…" : "Send code"}
        </button>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </section>
  );
}
