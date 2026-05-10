import { REGIONAL_PICKS } from "@/lib/landing/regional-picks";
import Link from "next/link";

export function MarketingHome() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[var(--travel-charcoal)] px-4 pb-20 pt-16 text-stone-100 sm:px-6 sm:pb-28 sm:pt-24">
        <div
          className="travel-hero-mesh pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
        />
        <div
          className="travel-noise pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="travel-animate-in travel-delay-1 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--travel-accent)]">
              Travel planning · reframed
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Plans that breathe{" "}
              <span className="relative inline-block">
                <span className="relative z-10 [font-family:var(--font-travel-display)] text-[var(--travel-accent)]">
                  curiosity
                </span>
                <span
                  className="absolute -bottom-1 left-0 right-0 z-0 h-3 skew-x-[-8deg] rounded-sm bg-[var(--travel-accent)]/35"
                  aria-hidden
                />
              </span>
              , not spreadsheets.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
              Multi-city loops, honest budgets, and itineraries you’ll actually open on the plane.
            </p>
          </div>

          <div className="travel-animate-in travel-delay-2 mt-12 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[var(--travel-accent)] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-stone-900 shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
            >
              Start planning free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-[var(--travel-accent)]/80 hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>

          <div className="travel-animate-in travel-delay-3 mt-16 overflow-hidden rounded-3xl border border-white/10 bg-black/25 shadow-2xl shadow-black/40 backdrop-blur-md">
            <div className="relative aspect-[21/9] min-h-[140px] w-full sm:min-h-[200px]">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600/30 via-stone-900/20 to-amber-500/25" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="rounded-full border border-white/15 bg-black/30 px-6 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
                  Banner mood · your next loop awaits
                </p>
              </div>
              <div className="travel-float absolute bottom-6 left-6 hidden rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-stone-200 backdrop-blur-md sm:block">
                Kyoto ↔ Lisbon ↔ Vancouver — stitched without chaos.
              </div>
            </div>
          </div>

          <div className="travel-animate-in travel-delay-4 mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--travel-accent)]">
                  Top regional selections
                </h2>
                <p className="mt-2 max-w-md text-sm text-stone-400">
                  Starter sparks — tap through once you’re inside to wire real stops.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden">
              {REGIONAL_PICKS.map((r, i) => (
                <article
                  key={r.city}
                  style={{ animationDelay: `${120 + i * 70}ms` }}
                  className={`travel-card-lift travel-animate-in relative flex w-[min(100%,11rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 shadow-xl transition sm:w-44`}
                >
                  <div className={`relative aspect-square bg-gradient-to-br ${r.hue}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                      {r.tag}
                    </span>
                  </div>
                  <div className="space-y-1 bg-[color-mix(in_oklab,var(--travel-charcoal)_94%,black)] p-3">
                    <p className="font-semibold text-white">{r.city}</p>
                    <p className="text-[11px] text-stone-400">{r.country}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-[var(--travel-paper)] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="travel-animate-in travel-delay-2 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
              Why travellers sketch loops here
            </h2>
            <ul className="space-y-4 text-stone-600">
              <li className="flex gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--travel-accent)]/35 text-sm font-bold text-stone-900">
                  1
                </span>
                <span>
                  <strong className="text-stone-800">Stops first.</strong> Cities anchor days — budgets and packing fold in
                  naturally.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--travel-accent)]/35 text-sm font-bold text-stone-900">
                  2
                </span>
                <span>
                  <strong className="text-stone-800">Share safely.</strong> Public links show the itinerary slice guests need —
                  not your entire vault.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--travel-accent)]/35 text-sm font-bold text-stone-900">
                  3
                </span>
                <span>
                  <strong className="text-stone-800">Community spark.</strong> Borrow vibes, then diverge — your loop stays
                  yours.
                </span>
              </li>
            </ul>
          </div>
          <div className="travel-animate-in travel-delay-3 rounded-3xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-900/5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Coming aboard</p>
            <p className="mt-4 text-lg font-medium text-[var(--travel-charcoal)]">
              “We stopped juggling five tabs. Traveloop is the first board that feels like a trip, not a task.”
            </p>
            <p className="mt-4 text-sm text-stone-500">— Hackathon crew, 2026</p>
          </div>
        </div>
      </section>

      <Link
        href="/signup"
        className="travel-fab fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[var(--travel-accent)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-stone-900 shadow-2xl outline-none ring-stone-900/10 transition hover:-translate-y-1 hover:brightness-105 focus-visible:ring-4 active:translate-y-0"
      >
        <span className="text-lg leading-none">+</span>
        Plan a trip
      </Link>
    </>
  );
}
