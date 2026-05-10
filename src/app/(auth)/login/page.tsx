import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm">
      <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
      <div className="mt-8 h-10 w-full animate-pulse rounded bg-stone-100" />
      <div className="mt-4 h-10 w-full animate-pulse rounded bg-stone-100" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
