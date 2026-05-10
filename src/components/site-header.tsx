import { signOut } from "@/lib/auth/actions";
import Image from "next/image";
import Link from "next/link";

function initials(nameOrEmail: string): string {
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  return base
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SiteHeader({
  email,
  avatarUrl,
  displayName,
  variant = "light",
}: {
  email: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  /** `dark` for charcoal bars over marketing hero */
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";
  const chip =
    dark
      ? "rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-stone-100 backdrop-blur-md transition hover:border-[var(--travel-accent)]/60 hover:bg-white/15"
      : "rounded-full border border-stone-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur-md transition hover:border-[var(--travel-accent)]/70 hover:bg-white";

  const avatarRing = dark ? "ring-2 ring-white/25" : "ring-2 ring-stone-300/80";

  const greet =
    displayName?.trim() ||
    (email ? email.split("@")[0] : null);

  return (
    <header
      className={`sticky top-0 z-40 border-b px-4 py-3 sm:px-6 ${
        dark
          ? "border-white/10 bg-[var(--travel-charcoal)]/85 text-stone-100 backdrop-blur-xl"
          : "border-stone-200/70 bg-[color-mix(in_oklab,var(--travel-paper)_88%,white)] backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link
          href="/"
          className="group flex items-center gap-2 outline-none transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span
            className={`[font-family:var(--font-travel-display)] text-2xl tracking-tight sm:text-[1.65rem] ${
              dark ? "text-[var(--travel-accent)] drop-shadow-sm" : "text-[var(--travel-charcoal)]"
            }`}
          >
            Traveloop
          </span>
          <span className="hidden rounded-full bg-[var(--travel-accent)]/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-900 opacity-0 transition-all duration-300 group-hover:opacity-100 sm:inline">
            Beta
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          {email ? (
            <>
              <Link href="/trips" className={`hidden sm:inline-flex ${chip}`}>
                Trips
              </Link>
              <Link href="/community" className={`hidden md:inline-flex ${chip}`}>
                Community
              </Link>
              <Link href="/settings" className={`hidden lg:inline-flex ${chip}`}>
                Settings
              </Link>
              <Link
                href="/profile"
                title={email}
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${avatarRing} shadow-md transition duration-300 hover:ring-[var(--travel-accent)]`}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill className="object-cover" sizes="40px" unoptimized />
                ) : (
                  <span
                    className={`flex h-full w-full items-center justify-center text-xs font-bold ${
                      dark ? "bg-[var(--travel-accent)]/90 text-stone-900" : "bg-[var(--travel-accent)]/65 text-stone-900"
                    }`}
                  >
                    {initials(greet ?? email)}
                  </span>
                )}
              </Link>
              <form action={signOut} className="hidden sm:block">
                <button type="submit" className={`${chip} cursor-pointer`}>
                  Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={`${chip}`}>
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[var(--travel-accent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-900 shadow-lg shadow-amber-900/15 transition hover:brightness-105 active:scale-[0.98]"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
