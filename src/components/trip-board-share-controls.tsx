"use client";

import {
  disablePublicTripSharing,
  enablePublicTripSharing,
  regeneratePublicTripSlug,
} from "@/lib/trips/share-actions";
import Link from "next/link";
import { useState } from "react";

function previewPathFromShareUrl(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    const i = url.indexOf("/p/");
    return i >= 0 ? url.slice(i) : "/trips";
  }
}

/** Compact share controls for the `/trips` dashboard cards (always returns to `/trips` after actions). */
export function TripBoardShareControls({
  tripId,
  isPublic,
  shareUrl,
}: {
  tripId: string;
  isPublic: boolean;
  shareUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="border-t border-stone-100 bg-teal-50/40 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-teal-900/80">Share plan</p>
        {isPublic ? (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-950">
            Live link
          </span>
        ) : (
          <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
            Private
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-stone-600">
        Guests see stops &amp; activities only — not budget or packing.
      </p>

      {!isPublic ? (
        <form action={enablePublicTripSharing} className="mt-2">
          <input type="hidden" name="trip_id" value={tripId} />
          <input type="hidden" name="share_return" value="dashboard" />
          <button
            type="submit"
            className="rounded-lg bg-[var(--travel-accent)] px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-sm hover:brightness-[0.97]"
          >
            Make plan public
          </button>
        </form>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs font-semibold text-teal-950 hover:bg-teal-50/80"
          >
            Copy link
          </button>
          {shareUrl ? (
            <Link
              href={previewPathFromShareUrl(shareUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs font-semibold text-teal-950 hover:bg-teal-50/80"
            >
              Preview
            </Link>
          ) : null}
          <form action={regeneratePublicTripSlug} className="inline">
            <input type="hidden" name="trip_id" value={tripId} />
            <input type="hidden" name="share_return" value="dashboard" />
            <button
              type="submit"
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              New link
            </button>
          </form>
          <form action={disablePublicTripSharing} className="inline">
            <input type="hidden" name="trip_id" value={tripId} />
            <input type="hidden" name="share_return" value="dashboard" />
            <button
              type="submit"
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-900 hover:bg-red-100"
            >
              Stop sharing
            </button>
          </form>
          {copied ? (
            <span className="text-[11px] font-medium text-teal-800" role="status">
              Copied
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
