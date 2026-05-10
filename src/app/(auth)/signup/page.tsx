"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

    const fn = firstName.trim();
    const ln = lastName.trim();

    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const meta: Record<string, string> = {};
    if (fn) meta.first_name = fn;
    if (ln) meta.last_name = ln;

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        ...(Object.keys(meta).length > 0 ? { data: meta } : {}),
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

  const inputClass =
    "mt-1.5 w-full rounded-lg border-2 border-stone-800/15 bg-white px-3 py-2.5 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/30";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-md shadow-stone-200/60 ring-1 ring-black/[0.03] sm:p-8">
      <h1 className="text-center text-2xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Register
      </h1>
      <p className="mt-1 text-center text-sm text-stone-600">
        Create your Traveloop account
      </p>

      <form onSubmit={onSubmit} className="mt-8" noValidate>
        {submitError ? (
          <p
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col items-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-stone-300 bg-stone-50 text-center text-xs font-medium text-stone-500"
            aria-hidden
          >
            Photo
          </div>
          <span className="sr-only">Profile photo is not required yet</span>
        </div>

        <div className="mt-8 rounded-2xl border-2 border-stone-800/12 bg-stone-50/40 p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="signup-first"
                className="block text-sm font-medium text-stone-700"
              >
                First name
              </label>
              <input
                id="signup-first"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="signup-last"
                className="block text-sm font-medium text-stone-700"
              >
                Last name
              </label>
              <input
                id="signup-last"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-stone-700"
            >
              Email address
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
                className={inputClass}
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
                className={inputClass}
              />
              {fieldErrors.confirm ? (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirm}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full max-w-xs items-center justify-center rounded-xl border-2 border-stone-800/20 bg-[var(--travel-accent)] px-8 py-3 text-base font-semibold text-stone-900 shadow-[3px_3px_0_0_rgb(41,37,36)] transition hover:brightness-[0.98] active:translate-x-px active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-sm"
          >
            {loading ? "Registering…" : "Register"}
          </button>
        </div>
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
