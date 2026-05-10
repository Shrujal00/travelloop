"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(
    preError === "auth_callback"
      ? "Something went wrong confirming your email. Try signing in again."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const nextErrors: typeof fieldErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!emailOk(email)) nextErrors.email = "Enter a valid email.";
    if (!password) nextErrors.password = "Password is required.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }
    router.push(safeNextPath(searchParams.get("next")));
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Sign in to manage your travel plans.
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
            htmlFor="login-email"
            className="block text-sm font-medium text-stone-700"
          >
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 shadow-sm outline-none ring-[var(--travel-accent)] transition focus:border-[var(--travel-accent)] focus:ring-2"
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-stone-700"
          >
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 shadow-sm outline-none ring-[var(--travel-accent)] transition focus:border-[var(--travel-accent)] focus:ring-2"
          />
          {fieldErrors.password ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-[var(--travel-accent)] px-4 py-3 text-base font-semibold text-stone-900 shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone-600">
        New to Traveloop?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
