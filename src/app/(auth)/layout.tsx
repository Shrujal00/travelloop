import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      <aside className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[var(--travel-charcoal)] px-10 py-12 text-stone-100 md:max-w-md md:py-16 lg:max-w-lg">
        <div
          className="pointer-events-none absolute -right-8 top-24 h-16 w-[120%] -rotate-1 bg-[var(--travel-accent)]/90 opacity-90 blur-[1px]"
          aria-hidden
        />
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <span className="font-[family-name:var(--font-travel-display)] text-4xl text-white md:text-5xl">
              Traveloop
            </span>
          </Link>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-stone-300">
            Personalized travel planning made easy. Plan multi-city trips,
            budgets, and timelines in one place.
          </p>
        </div>
        <ul className="relative z-10 mt-10 hidden space-y-3 text-sm text-stone-400 md:block">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[var(--travel-teal)]" aria-hidden>
              ✓
            </span>
            Stops, dates, and shared itineraries
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[var(--travel-teal)]" aria-hidden>
              ✓
            </span>
            Budget estimates and visual timelines
          </li>
        </ul>
      </aside>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
