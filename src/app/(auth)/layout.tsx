import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      <aside className="relative flex flex-col gap-0 overflow-hidden bg-[var(--travel-charcoal)] px-8 py-10 text-stone-100 sm:px-10 sm:py-12 md:max-w-md md:min-h-screen md:shrink-0 md:py-14 lg:max-w-lg">
        {/* subtle top edge */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-500/30 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-8 md:gap-10">
          <header>
            <Link href="/" className="group inline-block outline-none">
              <span className="relative inline-block">
                {/* brush-style highlight — sized to text, no overflow crop */}
                <span
                  className="pointer-events-none absolute -inset-x-1 -bottom-0.5 top-[52%] -z-0 rounded-sm bg-[var(--travel-accent)]/92 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
                  style={{ transform: "skewX(-6deg)" }}
                  aria-hidden
                />
                <span className="relative z-10 block font-[family-name:var(--font-travel-display)] text-4xl leading-tight tracking-tight text-white drop-shadow-sm md:text-[2.75rem]">
                  Traveloop
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-stone-200 md:text-lg">
              Personalized travel planning made easy. Plan multi-city trips,
              budgets, and timelines in one place.
            </p>
          </header>

          <ul className="space-y-3.5 border-t border-stone-500/35 pt-8 text-sm leading-snug text-stone-200 md:text-[0.9375rem]">
            <li className="flex gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--travel-teal)]/20 text-sm font-bold text-[var(--travel-teal)]"
                aria-hidden
              >
                ✓
              </span>
              <span>Stops, dates, and shared itineraries</span>
            </li>
            <li className="flex gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--travel-teal)]/20 text-sm font-bold text-[var(--travel-teal)]"
                aria-hidden
              >
                ✓
              </span>
              <span>Budget estimates and visual timelines</span>
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
