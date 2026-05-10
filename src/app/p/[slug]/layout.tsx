import Link from "next/link";

export default function PublicTripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/"
            className="[font-family:var(--font-travel-display)] text-xl text-[var(--travel-charcoal)]"
          >
            Traveloop
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/login"
              className="text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[var(--travel-accent)] px-3 py-1.5 font-semibold text-stone-900 hover:brightness-95"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
