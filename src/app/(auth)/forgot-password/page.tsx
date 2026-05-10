"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }
    if (!emailOk(email)) {
      setFieldError("Enter a valid email.");
      return;
    }
    setFieldError(null);

    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
      }
    );
    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          If an account exists for <strong>{email}</strong>, we sent a reset
          link. Follow it to choose a new password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Reset password
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        We&apos;ll email you a link to set a new password.
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
            htmlFor="forgot-email"
            className="block text-sm font-medium text-stone-700"
          >
            Email
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 shadow-sm outline-none ring-[var(--travel-accent)] transition focus:border-[var(--travel-accent)] focus:ring-2"
          />
          {fieldError ? (
            <p className="mt-1 text-sm text-red-600">{fieldError}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-[var(--travel-accent)] px-4 py-3 text-base font-semibold text-stone-900 shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone-600">
        <Link
          href="/login"
          className="font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
