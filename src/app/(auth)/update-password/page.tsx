"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const next: Record<string, string> = {};
    if (!password) next.password = "Password is required.";
    else if (password.length < 6)
      next.password = "Use at least 6 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setFieldErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-md shadow-stone-200/60 ring-1 ring-black/[0.03]">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Set a new password
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
        Choose a strong password for your Traveloop account.
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
            htmlFor="new-password"
            className="block text-sm font-medium text-stone-700"
          >
            New password
          </label>
          <input
            id="new-password"
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
            htmlFor="new-password-confirm"
            className="block text-sm font-medium text-stone-700"
          >
            Confirm password
          </label>
          <input
            id="new-password-confirm"
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
          {loading ? "Updating…" : "Update password"}
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
