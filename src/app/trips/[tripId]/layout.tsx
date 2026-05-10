import { getVerifiedEmail } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TripSegmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const email = await getVerifiedEmail();
  if (!email) {
    redirect("/login?next=" + encodeURIComponent(`/trips/${tripId}`));
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/"
              className="[font-family:var(--font-travel-display)] shrink-0 text-2xl text-[var(--travel-charcoal)]"
            >
              Traveloop
            </Link>
            <Link
              href="/trips"
              className="truncate text-sm font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              ← All trips
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-stone-600 sm:inline">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
