import { createTripNote, deleteTripNote, updateTripNote } from "@/lib/trips/notes-actions";
import { createClient } from "@/lib/supabase/server";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import Link from "next/link";
import { notFound } from "next/navigation";

const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

function decodeErr(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

type StopOpt = { id: string; city_name: string; sort_order: number };

export default async function TripNotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tripId } = await params;
  const { error: errRaw } = await searchParams;
  const errorMessage = decodeErr(errRaw);

  if (!isUuidTripParam(tripId)) notFound();

  const supabase = await createClient();
  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .select("id, title, place")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip || tripErr) notFound();

  const row = trip as { id: string; title: string; place: string | null };
  const label = row.place?.trim() || row.title;

  const { data: stopsRaw } = await supabase
    .from("trip_stops")
    .select("id, city_name, sort_order")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  const stops = (stopsRaw ?? []) as StopOpt[];

  const { data: notesRaw, error: notesErr } = await supabase
    .from("trip_notes")
    .select("id, body, note_date, trip_stop_id, created_at, updated_at")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  const notes = notesRaw ?? [];
  const notesFailed = Boolean(notesErr);

  function stopLabel(stopId: string | null): string {
    if (!stopId) return "Whole trip";
    const s = stops.find((x) => x.id === stopId);
    return s?.city_name ?? "Stop";
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 pb-16">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">Journal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Trip notes
      </h1>
      <p className="mt-2 text-sm text-stone-600">{label}</p>

      <div className="mt-6">
        <Link
          href={`/trips/${tripId}`}
          className="text-sm font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          ← Trip overview
        </Link>
      </div>

      {notesFailed ? (
        <p
          className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          Trip notes are not available yet. Run{" "}
          <code className="rounded bg-amber-100/80 px-1">supabase/migrations/20260521000000_trip_notes.sql</code>{" "}
          (see README), then refresh.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!notesFailed ? (
        <>
          <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">New note</h2>
            <form action={createTripNote} className="mt-4 space-y-4">
              <input type="hidden" name="trip_id" value={tripId} />
              <div>
                <label className="text-xs font-medium text-stone-600" htmlFor="new-body">
                  Entry
                </label>
                <textarea
                  id="new-body"
                  name="body"
                  required
                  rows={4}
                  maxLength={10000}
                  placeholder="Ideas, reservations, reminders…"
                  className={fieldClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-medium text-stone-600">
                  Related stop
                  <select name="trip_stop_id" defaultValue="" className={fieldClass}>
                    <option value="">Whole trip</option>
                    {stops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.city_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-stone-600">
                  Date tag (optional)
                  <input name="note_date" type="date" className={fieldClass} />
                </label>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[var(--travel-accent)] px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:brightness-[0.97]"
              >
                Add note
              </button>
            </form>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">All entries</h2>
            {notes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-600">
                No notes yet — jot something above.
              </p>
            ) : (
              <ul className="space-y-6">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.note_date ? (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5">{n.note_date}</span>
                      ) : null}
                      <span className="rounded-full bg-[var(--travel-accent)]/25 px-2 py-0.5 text-stone-800">
                        {stopLabel(typeof n.trip_stop_id === "string" ? n.trip_stop_id : null)}
                      </span>
                    </div>
                    <form action={updateTripNote} className="mt-4 space-y-3">
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="note_id" value={n.id} />
                      <textarea
                        name="body"
                        required
                        rows={4}
                        maxLength={10000}
                        defaultValue={n.body}
                        className={fieldClass}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-medium text-stone-600">
                          Related stop
                          <select
                            name="trip_stop_id"
                            defaultValue={(n.trip_stop_id as string | null) ?? ""}
                            className={fieldClass}
                          >
                            <option value="">Whole trip</option>
                            {stops.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.city_name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-stone-600">
                          Date tag
                          <input
                            name="note_date"
                            type="date"
                            defaultValue={(n.note_date as string | null)?.slice(0, 10) ?? ""}
                            className={fieldClass}
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-800"
                        >
                          Save changes
                        </button>
                      </div>
                    </form>
                    <form action={deleteTripNote} className="mt-3 inline-block">
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="note_id" value={n.id} />
                      <button
                        type="submit"
                        className="text-sm font-semibold text-red-700 underline-offset-4 hover:underline"
                      >
                        Delete note
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
