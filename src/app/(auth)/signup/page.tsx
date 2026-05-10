"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const nextErrors: Record<string, string> = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!emailOk(email)) nextErrors.email = "Enter a valid email.";
    if (!password) nextErrors.password = "Password is required.";
    else if (password.length < 6)
      nextErrors.password = "Use at least 6 characters.";
    if (password !== confirm) nextErrors.confirm = "Passwords do not match.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }
    setSent(true);
    router.refresh();
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-md shadow-stone-200/60 ring-1 ring-black/[0.03]">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          We sent a confirmation link to <strong>{email}</strong>. Open it to
          finish setting up your account, then{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
          >
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-md shadow-stone-200/60 ring-1 ring-black/[0.03]">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
        Start planning trips with Traveloop.
      </p>
      <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-600">
        <span className="font-semibold text-stone-800">This build:</span>{" "}
        email + password only (like a trimmed wireframe). No phone, social
        sign-in, or profile fields yet.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        {submitError ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-stone-700"
          >
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/35"
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-stone-700"
          >
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/35"
          />
          {fieldErrors.password ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="signup-confirm"
            className="block text-sm font-medium text-stone-700"
          >
            Confirm password
          </label>
          <input
            id="signup-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/35"
          />
          {fieldErrors.confirm ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.confirm}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-[var(--travel-accent)] px-4 py-3 text-base font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
