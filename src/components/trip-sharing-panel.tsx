"use client";

import {
  disablePublicTripSharing,
  enablePublicTripSharing,
  regeneratePublicTripSlug,
} from "@/lib/trips/share-actions";
import { useState } from "react";

export function TripSharingPanel({
  tripId,
  isPublic,
  shareUrl,
  shareReturn = "trip",
}: {
  tripId: string;
  isPublic: boolean;
  shareUrl: string | null;
  /** `dashboard` posts hidden `share_return` so server actions redirect back to `/trips`. */
  shareReturn?: "trip" | "dashboard";
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  }

  async function shareNative() {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Trip itinerary · Traveloop",
          url: shareUrl,
        });
      } catch {
        /* user dismissed */
      }
    } else {
      await copyLink();
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
        Share itinerary
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        Anyone with the link can view this schedule (stops and activities only — not budget, packing, or
        expenses). You can turn sharing off anytime; rotating the link invalidates the old URL.
      </p>

      {!isPublic ? (
        <form action={enablePublicTripSharing} className="mt-4">
          <input type="hidden" name="trip_id" value={tripId} />
          {shareReturn === "dashboard" ? (
            <input type="hidden" name="share_return" value="dashboard" />
          ) : null}
          <button
            type="submit"
            className="rounded-lg bg-[var(--travel-accent)] px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97]"
          >
            Create share link
          </button>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              Copy link
            </button>
            <button
              type="button"
              onClick={() => void shareNative()}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              Share…
            </button>
          </div>
          {copied ? (
            <p className="text-xs font-medium text-teal-700" role="status">
              Link copied to clipboard.
            </p>
          ) : null}
          {shareUrl ? (
            <p className="break-all rounded-lg bg-stone-50 px-3 py-2 font-mono text-xs text-stone-600">
              {shareUrl}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
            <form action={regeneratePublicTripSlug}>
              <input type="hidden" name="trip_id" value={tripId} />
              {shareReturn === "dashboard" ? (
                <input type="hidden" name="share_return" value="dashboard" />
              ) : null}
              <button
                type="submit"
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                Rotate link
              </button>
            </form>
            <form action={disablePublicTripSharing}>
              <input type="hidden" name="trip_id" value={tripId} />
              {shareReturn === "dashboard" ? (
                <input type="hidden" name="share_return" value="dashboard" />
              ) : null}
              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900 transition hover:bg-red-100"
              >
                Stop sharing
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
