"use client";

import { copySharedTrip } from "@/lib/trips/share-actions";
import Link from "next/link";
import { useState } from "react";

export function PublicTripToolbar({
  slug,
  signedIn,
  shareUrl,
}: {
  slug: string;
  signedIn: boolean;
  shareUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  }

  async function shareNative() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Trip itinerary · Traveloop",
          url: shareUrl,
        });
      } catch {
        /* dismissed */
      }
    } else {
      await copyLink();
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={() => void shareNative()}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
        >
          Share…
        </button>
      </div>
      {copied ? (
        <span className="text-xs font-medium text-teal-700" role="status">
          Copied.
        </span>
      ) : null}
      {signedIn ? (
        <form action={copySharedTrip} className="sm:ml-auto">
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            className="rounded-lg bg-[var(--travel-accent)] px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97]"
          >
            Copy to my trips
          </button>
        </form>
      ) : (
        <Link
          href={`/login?next=/p/${encodeURIComponent(slug)}`}
          className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 sm:ml-auto"
        >
          Sign in to copy
        </Link>
      )}
    </div>
  );
}
